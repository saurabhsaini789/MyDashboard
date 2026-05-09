"use client";

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type Task = {
 id: string;
 title: string;
 isCompleted: boolean;
 completedAt?: string; // ISO date string
};

export type Project = {
 id: string;
 bucketId: string;
 title: string;
 startDate?: string; // YYYY-MM-DD
 dueDate: string; // YYYY-MM-DD
 isImportant: boolean;
 status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
 createdAt: string; // ISO date string
 isCompleted?: boolean;
 completedAt?: string; // ISO date string
 tasks: Task[];
};

// Action-Oriented Priority Logic
export const getProjectPriorityInfo = (p: Project) => {
 // 1. Completed
  if (p.isCompleted || p.status === 'completed') {
    return {
      label: 'Completed',
      color: 'teal',
      bg: 'bg-teal-50 dark:bg-teal-500/10',
      text: 'text-teal-700 dark:text-teal-400',
      classes: 'border border-teal-200 dark:border-teal-900/50 opacity-80'
    };
  }

 // 2. On Hold
  if (p.status === 'on-hold') {
    return {
      label: 'On Hold',
      color: 'gray',
      bg: 'bg-zinc-100 dark:bg-zinc-800/50',
      text: 'text-zinc-500 dark:text-zinc-400',
      classes: 'border border-dashed border-zinc-300 dark:border-zinc-700 opacity-80'
    };
  }

 const today = new Date();
 today.setHours(0, 0, 0, 0);

 // Parse dates safely
 const due = p.dueDate ? new Date(p.dueDate + 'T00:00:00') : null;
 if (due) due.setHours(0, 0, 0, 0);
 
 const start = p.startDate ? new Date(p.startDate + 'T00:00:00') : null;
 if (start) start.setHours(0, 0, 0, 0);

 const diffDays = due ? Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
 const isPastStart = start ? today >= start : true;
 
 // Calculate Progress based on tasks
 const totalTasks = p.tasks?.length || 0;
 const completedTasks = p.tasks?.filter(t => t.isCompleted).length || 0;
 const taskProgress = totalTasks > 0 ? completedTasks / totalTasks : (p.status === 'in-progress' ? 0.5 : 0);

 // 3. Off Track (Past due date OR missed start date)
  if ((due && diffDays < 0) || (p.status === 'not-started' && isPastStart)) {
    return {
      label: 'Off Track',
      color: 'red',
      bg: 'bg-red-50 dark:bg-red-500/10',
      text: 'text-red-700 dark:text-red-400',
      classes: 'border border-red-200 dark:border-red-900/50 font-semibold focus-within:ring-red-500'
    };
  }

 // 4. At Risk (Due in <= 7 days but progress is < 25%)
  if (due && diffDays <= 7 && taskProgress < 0.25) {
    return {
      label: 'At Risk',
      color: 'orange',
      bg: 'bg-orange-50 dark:bg-orange-500/10',
      text: 'text-orange-700 dark:text-orange-400',
      classes: 'border border-orange-200 dark:border-orange-900/50 font-semibold'
    };
  }

 // 5. On Track (Everything else)
  return {
    label: 'On Track',
    color: 'green',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    classes: 'border border-emerald-200 dark:border-emerald-900/50 font-medium'
  };
};

// Unified Sorting Logic
export const sortProjects = (projects: Project[]) => {
 return [...projects].sort((a, b) => {
 const pA = getProjectPriorityInfo(a);
 const pB = getProjectPriorityInfo(b);

 const score = (label: string) => {
 switch (label) {
 case 'Off Track': return 1;
 case 'At Risk': return 2;
 case 'On Track': return 3;
 case 'On Hold': return 4;
 case 'Completed': return 5;
 default: return 99;
 }
 };

 const sA = score(pA.label);
 const sB = score(pB.label as string);

 if (sA !== sB) return sA - sB;

 // Secondary Sort: Due Date (Earliest first)
 const dA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
 const dB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
 
 if (dA !== dB) return dA - dB;

 // Tertiary Sort: Importance (True first)
 if (a.isImportant !== b.isImportant) return a.isImportant ? -1 : 1;

 return 0;
 });
};


import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';

interface ProjectModalProps {
 project: Project;
 onClose: () => void;
 onUpdateProject: (updatedProject: Project) => void;
 onDeleteProject: (projectId: string) => void;
 mode?: 'edit' | 'create';
}

export function ProjectModal({ project, onClose, onUpdateProject, onDeleteProject, mode = 'edit' }: ProjectModalProps) {
 const [isEditing, setIsEditing] = useState(mode === 'create');
 
 const [formData, setFormData] = useState({
 title: project.title,
 startDate: project.startDate || new Date().toISOString().split('T')[0],
 dueDate: project.dueDate || '',
 isImportant: project.isImportant,
 status: project.status || 'not-started'
 });
 
 const [newTaskTitle, setNewTaskTitle] = useState('');
 const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
 const [editingTaskTitle, setEditingTaskTitle] = useState('');

 const sensors = useSensors(
   useSensor(PointerSensor, {
     activationConstraint: {
       distance: 5,
     },
   }),
   useSensor(KeyboardSensor, {
     coordinateGetter: sortableKeyboardCoordinates,
   })
 );

 const handleDragEnd = (event: DragEndEvent) => {
   const { active, over } = event;

   if (over && active.id !== over.id) {
     const oldIndex = project.tasks.findIndex((t) => t.id === active.id);
     const newIndex = project.tasks.findIndex((t) => t.id === over.id);
     
     const newTasks = arrayMove(project.tasks, oldIndex, newIndex);
     onUpdateProject({ ...project, tasks: newTasks });
   }
 };

 const startEditingTask = (task: Task) => {
   setEditingTaskId(task.id);
   setEditingTaskTitle(task.title);
 };

 const saveEditedTask = (taskId: string) => {
   if (!editingTaskTitle.trim()) return;
   const updatedTasks = project.tasks.map(t =>
     t.id === taskId ? { ...t, title: editingTaskTitle.trim() } : t
   );
   onUpdateProject({ ...project, tasks: updatedTasks });
   setEditingTaskId(null);
 };

 const handleToggleTask = (taskId: string) => {
 const updatedTasks = project.tasks.map(t =>
 t.id === taskId ? { 
 ...t, 
 isCompleted: !t.isCompleted, 
 completedAt: !t.isCompleted ? new Date().toISOString() : undefined 
 } : t
 );
 onUpdateProject({ ...project, tasks: updatedTasks });
 };

 const handleDeleteTask = (taskId: string) => {
 const updatedTasks = project.tasks.filter(t => t.id !== taskId);
 onUpdateProject({ ...project, tasks: updatedTasks });
 };

 const handleCreateTask = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newTaskTitle.trim()) return;
 const newTask: Task = { id: crypto.randomUUID(), title: newTaskTitle.trim(), isCompleted: false };
 onUpdateProject({ ...project, tasks: [...project.tasks, newTask] });
 setNewTaskTitle('');
 };

  const handleToggleProjectCompletion = () => {
    const isNowCompleted = !project.isCompleted;
    onUpdateProject({ 
      ...project, 
      isCompleted: isNowCompleted, 
      status: isNowCompleted ? 'completed' : 'in-progress',
      completedAt: isNowCompleted ? new Date().toISOString() : undefined 
    });
  };

  const handleStatusChange = (newStatus: Project['status']) => {
    onUpdateProject({ 
      ...project, 
      status: newStatus,
      isCompleted: newStatus === 'completed',
      completedAt: newStatus === 'completed' ? (project.completedAt || new Date().toISOString()) : undefined
    });
  };

  const handleDueDateChange = (newDate: string) => {
    onUpdateProject({ 
      ...project, 
      dueDate: newDate
    });
  };

 const saveEdits = (e: React.FormEvent) => {
 e.preventDefault();
 if (!formData.title.trim()) return;
 onUpdateProject({ 
 ...project, 
 title: formData.title.trim(), 
 startDate: formData.startDate,
 dueDate: formData.dueDate, 
 isImportant: formData.isImportant,
 status: formData.status as any,
 // If status changed to completed, mark isCompleted
 isCompleted: formData.status === 'completed' ? true : project.isCompleted,
 completedAt: formData.status === 'completed' && !project.completedAt ? new Date().toISOString() : project.completedAt
 });
 setIsEditing(false);
 if (mode === 'create') onClose();
 };

  const priority = getProjectPriorityInfo(project);

  const detailActions = !isEditing && (
    <div className="flex gap-2">
      {!project.isCompleted && (
        <button
          onClick={handleToggleProjectCompletion}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          Complete
        </button>
      )}
      <button
        onClick={() => {
          setFormData({
            title: project.title,
            startDate: project.startDate || '',
            dueDate: project.dueDate,
            isImportant: project.isImportant,
            status: project.status || 'not-started'
          });
          setIsEditing(true);
        }}
        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-700"
      >
        Edit
      </button>
      <button
        onClick={() => {
          if (confirm('Are you sure you want to delete this project?')) {
            onDeleteProject(project.id);
          }
        }}
        className="px-4 py-2 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors border border-rose-100 dark:border-rose-900/20"
      >
        Delete
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={isEditing && mode !== 'create' ? () => setIsEditing(false) : onClose}
      title={isEditing ? (mode === 'create' ? 'Create New Project' : 'Edit Project Details') : project.title}
      onSubmit={isEditing ? saveEdits : undefined}
      submitText={mode === 'create' ? 'Create Project' : 'Save Changes'}
      accentColor="blue"
      footerControls={detailActions}
    >
 {isEditing ? (
 <DynamicForm
 sections={[
 {
 id: 'project_details',
 title: '',
 fields: [
 { name: 'title', label: 'Project Title', type: 'text', required: true, fullWidth: true, placeholder: 'Project Title' },
 { name: 'startDate', label: 'Start Date', type: 'date' },
 { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
 {
 name: 'status', label: 'Status', type: 'select',
 options: [
 { value: 'not-started', label: 'Not Started' },
 { value: 'in-progress', label: 'In Progress' },
 { value: 'on-hold', label: 'On Hold' },
 { value: 'completed', label: 'Completed' }
 ]
 },
 {
 name: 'isImportant', label: 'Priority', type: 'select',
 options: [
 { value: true as any, label: 'Important (Star)' },
 { value: false as any, label: 'Normal' }
 ]
 }
 ]
 }
 ]}
 formData={formData}
 accentColor="blue"
 onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
 />
 ) : (
 <div className="flex flex-col gap-6">
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest leading-none">Bucket</span>
    <span className="text-[13px] font-bold text-teal-600 dark:text-teal-400">{project.bucketId}</span>
  </div>
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest leading-none">Status</span>
    <select
      value={project.status}
      onChange={(e) => handleStatusChange(e.target.value as any)}
      className="text-[13px] font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg px-2 py-0.5 -ml-2 w-fit cursor-pointer hover:border-teal-500/50 transition-colors outline-none focus:ring-1 focus:ring-teal-500/30 appearance-none"
    >
      <option value="not-started">Not Started</option>
      <option value="in-progress">In Progress</option>
      <option value="on-hold">On Hold</option>
      <option value="completed">Completed</option>
    </select>
  </div>
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest leading-none">Health</span>
    <span className={`text-[13px] font-bold ${priority.text}`}>{priority.label}</span>
  </div>
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest leading-none">Importance</span>
    <div className="flex items-center gap-1.5">
      {project.isImportant ? (
        <>
          <svg className="text-amber-500 shrink-0" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          <span className="text-[13px] font-bold text-amber-500">High</span>
        </>
      ) : (
        <span className="text-[13px] font-bold text-zinc-400">Normal</span>
      )}
    </div>
  </div>

  <div className="col-span-2 flex flex-col gap-1.5 border-t border-zinc-100 dark:border-zinc-800/50 pt-3 mt-1">
    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest leading-none">Period</span>
    <div className="flex items-center gap-2 text-[13px] font-bold text-zinc-600 dark:text-zinc-400">
      <span>{project.startDate ? new Date(project.startDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No start'}</span>
      <span className="opacity-30">→</span>
      <input
        type="date"
        value={project.dueDate}
        onChange={(e) => handleDueDateChange(e.target.value)}
        className={`bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg px-2 py-0.5 -ml-1 cursor-pointer hover:border-teal-500/50 transition-colors outline-none focus:ring-1 focus:ring-teal-500/30 text-[12px] ${priority.label === 'Off Track' ? 'text-rose-500' : 'text-zinc-800 dark:text-zinc-200'}`}
      />
    </div>
  </div>
 </div>

 <div className="flex flex-col gap-4">
 <h3 className="text-sm font-semibold uppercase text-zinc-400 flex justify-between">
 Tasks
 <span className="text-zinc-500">{project.tasks?.filter(t => t.isCompleted).length || 0} / {project.tasks?.length || 0}</span>
 </h3>

 {!project.tasks || project.tasks.length === 0 ? (
 <div className="text-center py-6 border border-dashed rounded-xl border-zinc-200 dark:border-zinc-800 text-zinc-500">
 No tasks defined.
 </div>
 ) : (
 <DndContext 
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
 >
   <SortableContext 
    items={project.tasks.map(t => t.id)}
    strategy={verticalListSortingStrategy}
   >
     <div className="space-y-2">
     {project.tasks.map((task, index) => (
       <SortableTask
         key={task.id}
         task={task}
         index={index}
         onToggle={handleToggleTask}
         onDelete={handleDeleteTask}
         onEditStart={startEditingTask}
         isEditing={editingTaskId === task.id}
         editTitle={editingTaskTitle}
         setEditTitle={setEditingTaskTitle}
         onEditSave={saveEditedTask}
         onEditCancel={() => setEditingTaskId(null)}
       />
     ))}
     </div>
   </SortableContext>
 </DndContext>
 )}
 
 <div className="flex gap-2">
 <input
 type="text"
 placeholder="New task..."
 value={newTaskTitle}
 onChange={(e) => setNewTaskTitle(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 handleCreateTask(e as any);
 }
 }}
 className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
 />
 <button onClick={handleCreateTask} disabled={!newTaskTitle} type="button" className="px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-semibold disabled:opacity-50">Add</button>
 </div>
 </div>
 </div>
 )}
 </Modal>
 );
}

function SortableTask({ 
  task, 
  index, 
  onToggle, 
  onDelete, 
  onEditStart, 
  isEditing, 
  editTitle, 
  setEditTitle, 
  onEditSave, 
  onEditCancel 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="group flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 gap-2 shadow-sm"
    >
      <div {...attributes} {...listeners} className="cursor-grab text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 -ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      </div>

      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <span className="text-zinc-400 font-medium text-sm">{index + 1}.</span>
          <input 
            type="text" 
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSave(task.id);
              if (e.key === 'Escape') onEditCancel();
            }}
            className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button onClick={() => onEditSave(task.id)} className="text-teal-600 hover:text-teal-700 dark:text-teal-400 p-1.5 bg-teal-50 dark:bg-teal-500/10 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </button>
          <button onClick={onEditCancel} className="text-zinc-500 hover:text-zinc-700 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      ) : (
        <>
          <button onClick={() => onToggle(task.id)} className="flex items-center gap-3 text-left flex-1 min-w-0">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${task.isCompleted ? 'bg-teal-500 border-teal-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}>
              {task.isCompleted && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
            </div>
            <span className={`font-medium text-sm flex items-center gap-2 truncate ${task.isCompleted ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
              <span className="text-zinc-400 shrink-0">{index + 1}.</span> 
              <span className="truncate">{task.title}</span>
            </span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEditStart(task)} className="p-1.5 text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" title="Edit Task">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors" title="Delete Task">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
