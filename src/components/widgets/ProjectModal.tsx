"use client";

import React, { useState, useEffect, useMemo } from 'react';

export type Task = {
 id: string;
 title: string;
 isCompleted: boolean;
 completedAt?: string; // ISO date string
 dueDate?: string; // YYYY-MM-DD
};

// Tasks with a due date come first (earliest first); undated tasks keep their
// original relative order and are listed after all dated tasks.
export const sortTasksByDueDate = (tasks: Task[]): Task[] => {
 return [...tasks].sort((a, b) => {
  if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return 0;
 });
};

export type ProjectPriority = 'critical' | 'important' | 'normal';

export type Project = {
 id: string;
 bucketId: string;
 title: string;
 startDate?: string; // YYYY-MM-DD
 dueDate: string; // YYYY-MM-DD
 priority?: ProjectPriority;
 isImportant?: boolean; // legacy field, kept so existing stored projects still resolve a priority
 waitingOn?: string;
 status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
 createdAt: string; // ISO date string
 isCompleted?: boolean;
 completedAt?: string; // ISO date string
 tasks: Task[];
};

export const PRIORITY_RANK: Record<ProjectPriority, number> = { critical: 0, important: 1, normal: 2 };

export const getProjectPriority = (p: { priority?: ProjectPriority; isImportant?: boolean }): ProjectPriority => {
 if (p.priority) return p.priority;
 return p.isImportant ? 'important' : 'normal';
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

 // Tertiary Sort: Priority (Critical > Important > Normal)
 const rA = PRIORITY_RANK[getProjectPriority(a)];
 const rB = PRIORITY_RANK[getProjectPriority(b)];
 if (rA !== rB) return rA - rB;

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
 priority: getProjectPriority(project),
 waitingOn: project.waitingOn || '',
 status: project.status || 'not-started'
 });
 
 const [newTaskTitle, setNewTaskTitle] = useState('');
 const [newTaskDueDate, setNewTaskDueDate] = useState('');
 const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
 const [editingTaskTitle, setEditingTaskTitle] = useState('');
 const [editingTaskDueDate, setEditingTaskDueDate] = useState('');

 const sortedTasks = useMemo(() => sortTasksByDueDate(project.tasks || []), [project.tasks]);

 const startEditingTask = (task: Task) => {
   setEditingTaskId(task.id);
   setEditingTaskTitle(task.title);
   setEditingTaskDueDate(task.dueDate || '');
 };

 const saveEditedTask = (taskId: string) => {
   if (!editingTaskTitle.trim()) return;
   const updatedTasks = project.tasks.map(t =>
     t.id === taskId ? { ...t, title: editingTaskTitle.trim(), dueDate: editingTaskDueDate || undefined } : t
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
 const newTask: Task = { id: crypto.randomUUID(), title: newTaskTitle.trim(), isCompleted: false, dueDate: newTaskDueDate || undefined };
 onUpdateProject({ ...project, tasks: [...project.tasks, newTask] });
 setNewTaskTitle('');
 setNewTaskDueDate('');
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
 priority: formData.priority,
 waitingOn: formData.waitingOn.trim() || undefined,
 status: formData.status as any,
 // If status changed to completed, mark isCompleted
 isCompleted: formData.status === 'completed' ? true : project.isCompleted,
 completedAt: formData.status === 'completed' && !project.completedAt ? new Date().toISOString() : project.completedAt
 });
 setIsEditing(false);
 if (mode === 'create') onClose();
 };

  const priority = getProjectPriorityInfo(project);
  const projectPriority = getProjectPriority(project);

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
            priority: getProjectPriority(project),
            waitingOn: project.waitingOn || '',
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
 name: 'priority', label: 'Priority', type: 'select',
 options: [
 { value: 'critical', label: 'Critical' },
 { value: 'important', label: 'Important' },
 { value: 'normal', label: 'Normal' }
 ]
 },
 { name: 'waitingOn', label: 'Waiting On', type: 'text', fullWidth: true, placeholder: 'e.g. Client feedback, approval, another task…' }
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
    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest leading-none">Priority</span>
    <div className="flex items-center gap-1.5">
      {projectPriority === 'critical' && (
        <>
          <svg className="text-rose-500 shrink-0" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          <span className="text-[13px] font-bold text-rose-500">Critical</span>
        </>
      )}
      {projectPriority === 'important' && (
        <>
          <svg className="text-amber-500 shrink-0" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          <span className="text-[13px] font-bold text-amber-500">Important</span>
        </>
      )}
      {projectPriority === 'normal' && (
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

  {project.waitingOn && (
    <div className="col-span-2 flex flex-col gap-1.5 border-t border-zinc-100 dark:border-zinc-800/50 pt-3 mt-1">
      <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest leading-none">Waiting On</span>
      <div className="flex items-center gap-1.5 text-[13px] font-bold text-amber-600 dark:text-amber-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        <span className="break-words">{project.waitingOn}</span>
      </div>
    </div>
  )}
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
   <div className="space-y-2">
   {sortedTasks.map((task, index) => (
     <TaskRow
       key={task.id}
       task={task}
       index={index}
       onToggle={handleToggleTask}
       onDelete={handleDeleteTask}
       onEditStart={startEditingTask}
       isEditing={editingTaskId === task.id}
       editTitle={editingTaskTitle}
       setEditTitle={setEditingTaskTitle}
       editDueDate={editingTaskDueDate}
       setEditDueDate={setEditingTaskDueDate}
       onEditSave={saveEditedTask}
       onEditCancel={() => setEditingTaskId(null)}
     />
   ))}
   </div>
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
 <input
 type="date"
 value={newTaskDueDate}
 onChange={(e) => setNewTaskDueDate(e.target.value)}
 title="Due date (optional)"
 className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-2 text-sm text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
 />
 <button onClick={handleCreateTask} disabled={!newTaskTitle} type="button" className="px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-semibold disabled:opacity-50">Add</button>
 </div>
 </div>
 </div>
 )}
 </Modal>
 );
}

function TaskRow({
  task,
  index,
  onToggle,
  onDelete,
  onEditStart,
  isEditing,
  editTitle,
  setEditTitle,
  editDueDate,
  setEditDueDate,
  onEditSave,
  onEditCancel
}: any) {
  const dueBadge = getDueDateBadge(task.dueDate, task.isCompleted);

  return (
    <div
      className="group flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 gap-2 shadow-sm"
    >
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
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            title="Due date (optional)"
            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            <span className={`font-medium text-sm flex items-center gap-2 ${task.isCompleted ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
              <span className="text-zinc-400 shrink-0">{index + 1}.</span>
              <span className="break-words">{task.title}</span>
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            {dueBadge && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${dueBadge.classes}`}>
                {dueBadge.label}
              </span>
            )}
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

function getDueDateBadge(dueDate: string | undefined, isCompleted: boolean) {
  if (!dueDate) return null;

  const due = new Date(dueDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  let classes = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400';
  if (!isCompleted) {
    if (diffDays < 0) classes = 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400';
    else if (diffDays <= 2) classes = 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400';
  }

  return { label, classes };
}
