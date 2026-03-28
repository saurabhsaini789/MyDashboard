"use client";

import React, { useState, useEffect } from 'react';

import { ProjectModal, type Project, type Task } from './ProjectModal';

const BUCKETS = [
  'Health', 'Income', 'Career',
  'Wealth', 'Family', 'Lifestyle',
  'Learning', 'Admin', 'Mental'
];

export function Goals() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form states for creating a new project
  const [creatingForBucket, setCreatingForBucket] = useState<string | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDate, setNewProjectDate] = useState('');
  const [newProjectImportant, setNewProjectImportant] = useState(false);

  // Form state for creating a new task
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('goals_projects');
    let loadedProjects: Project[] = [];
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        loadedProjects = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // ignore
      }
    }

    // Auto-seed data from image if not already seeded
    if (typeof window !== 'undefined' && !localStorage.getItem('goals_seeded_v2')) {
      const SEED_PROJECTS: Project[] = [
        { id: crypto.randomUUID(), bucketId: 'Health', title: 'Get Family Medical Insurance', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'NEXT STEP - Gather details.', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Health', title: 'Get Term Insurance', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'NEXT STEP - Gather details.', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Health', title: 'New Vaccines', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'NEXT STEP - Plan when to get which one...', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Health', title: 'Dental Checkup - October', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Complete dental treatment and full health checkups for you and Neha.', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Health', title: 'Understand Local Hospitals', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Explore Yamuna Nagar - the hospitals', isCompleted: false }, { id: crypto.randomUUID(), title: 'Connect with Saurabh Pal...', isCompleted: false }] },

        { id: crypto.randomUUID(), bucketId: 'Income', title: 'Website Creation', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Prepare digital templates for school, bookshop, and coaching businesses...', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Income', title: 'ID Freelancing', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Develop freelance outreach scripts and global client proposals...', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Income', title: 'Teaching', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Begin teaching job and start building tuition leads...', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Income', title: 'Bookshop Expansion', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Research and shortlist 10-15 large printing presses in Delhi, Haryana, an...', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Income', title: 'Performance & Learning Academy', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Create structured tuition curriculum and batch plans...', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Income', title: 'Parlor and Tailoring', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Finalize Neha\'s beauty and tailoring services, pricing, and branding...', isCompleted: false }] },

        { id: crypto.randomUUID(), bucketId: 'Career', title: 'Freelancing Packages', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'NEXT STEP - Finalize 2-3 global freelance service packages...', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Career', title: 'Portfolio Case Studies Update', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Build strong case studies on your premium consulting portfolio...', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Career', title: 'Leads Management', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Start collecting emails and leads from LinkedIn and your content channels.', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Career', title: 'Skill Development', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'NEXT STEP - Read E-Learning Magazines...', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Career', title: 'Portfolio Testimonials', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Amelia Loving - Requested once', isCompleted: false }, { id: crypto.randomUUID(), title: 'John Lewinski - Not active...', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Career', title: 'Networking', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Build relationships with teachers and administrators on LinkedIn and...', isCompleted: false }] },

        { id: crypto.randomUUID(), bucketId: 'Wealth', title: 'Savings Target - SEPT END', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Save aggressively and cut unnecessary expenses to reach ₹6-6.5 lakh by...', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Wealth', title: 'Emergency Fund', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Prepare a 12-month budget and emergency fund strategy.', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Wealth', title: 'Expenses', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Identify essential purchases and avoid unnecessary spending.', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Wealth', title: 'UNDERSTANDING', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'YouTube - Labor Law Academy', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Wealth', title: 'Zerodha Account', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Open account', isCompleted: false }] }
      ];
      loadedProjects = [...loadedProjects, ...SEED_PROJECTS];
      localStorage.setItem('goals_seeded_v2', 'true');
      localStorage.setItem('goals_projects', JSON.stringify(loadedProjects));
    }

    // Auto-seed data from second image
    if (typeof window !== 'undefined' && !localStorage.getItem('goals_seeded_v3')) {
      const SEED_PROJECTS_PT2: Project[] = [
        { id: crypto.randomUUID(), bucketId: 'Family', title: 'Children Planning', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Start child planning and medical consultation.', isCompleted: false }] },

        { id: crypto.randomUUID(), bucketId: 'Lifestyle', title: 'Home & Work Setup', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Clean, declutter, and set up home and work environment.', isCompleted: false }] },

        { id: crypto.randomUUID(), bucketId: 'Learning', title: 'Understand', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'NRE vs Ordinary Bank Account', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Learning', title: 'CHECK', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Mobile application - National Digital Library of India', isCompleted: false }] },

        { id: crypto.randomUUID(), bucketId: 'Admin', title: 'Transaction Details', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'List all the transactions - Everything sent to India', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Admin', title: 'India Move', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Plan travel, relocation, and initial setup in India.', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Admin', title: 'FCA Address update', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Update address in FCA data.', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Admin', title: 'iCloud Backup (Photos + Docume...)', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Backup everything to new Seagate hard drive.', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Admin', title: 'Organization', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Organize contacts, digital files, and systems for a smooth transition.', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Admin', title: 'Freedom', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Call freedom to get cheapest plan...', isCompleted: false }] },

        { id: crypto.randomUUID(), bucketId: 'Mental', title: 'Forgive Others', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Understand this properly - Forgive your parents...', isCompleted: false }] },
        { id: crypto.randomUUID(), bucketId: 'Mental', title: 'My Habits', dueDate: '', isImportant: false, isCompleted: false, tasks: [{ id: crypto.randomUUID(), title: 'Culmination of parents habits and values.', isCompleted: false }] }
      ];
      loadedProjects = [...loadedProjects, ...SEED_PROJECTS_PT2];
      localStorage.setItem('goals_seeded_v3', 'true');
      localStorage.setItem('goals_projects', JSON.stringify(loadedProjects));
    }

    setProjects(loadedProjects);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('goals_projects', JSON.stringify(projects));

      if (selectedProject) {
        const updated = projects.find(p => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
        else setSelectedProject(null);
      }
    }
  }, [projects, isLoaded]);

  // --- Priority Logic ---
  const getPriorityInfo = (project: Project) => {
    if (project.isCompleted) {
      return {
        isImportant: false, isUrgent: false, isCompleted: true,
        label: 'Completed',
        classes: 'bg-teal-50 dark:bg-teal-500/5 text-teal-700 dark:text-teal-500 border border-teal-200/50 dark:border-teal-900/50 opacity-80'
      };
    }

    if (!project.dueDate) {
      return {
        isImportant: project.isImportant, isUrgent: false, isCompleted: false,
        label: project.isImportant ? 'Important' : 'Backlog',
        classes: project.isImportant
          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-sm shadow-amber-500/5'
          : 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-500/20 shadow-sm shadow-zinc-500/5'
      };
    }

    const due = new Date(project.dueDate + 'T00:00:00');
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isUrgent = diffDays <= 7;
    const isImportant = project.isImportant;

    if (isImportant && isUrgent) {
      return {
        isImportant, isUrgent, isCompleted: false,
        label: 'Important + Urgent',
        classes: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-sm shadow-rose-500/5'
      };
    } else if (isImportant && !isUrgent) {
      return {
        isImportant, isUrgent, isCompleted: false,
        label: 'Important',
        classes: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-sm shadow-amber-500/5'
      };
    } else if (!isImportant && isUrgent) {
      return {
        isImportant, isUrgent, isCompleted: false,
        label: 'Urgent',
        classes: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 shadow-sm shadow-sky-500/5'
      };
    } else {
      return {
        isImportant, isUrgent, isCompleted: false,
        label: 'Not Urgent',
        classes: 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-500/20 shadow-sm shadow-zinc-500/5'
      };
    }
  };

  // --- Handlers ---
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatingForBucket || !newProjectTitle.trim()) return;

    const newProject: Project = {
      id: crypto.randomUUID(),
      bucketId: creatingForBucket,
      title: newProjectTitle.trim(),
      dueDate: newProjectDate,
      isImportant: newProjectImportant,
      isCompleted: false,
      tasks: [],
    };

    setProjects([...projects, newProject]);
    setCreatingForBucket(null);
    setNewProjectTitle('');
    setNewProjectDate('');
    setNewProjectImportant(false);
  };

  const handleToggleProjectCompletion = (projectId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProjects(projects.map(p =>
      p.id === projectId ? { ...p, isCompleted: !p.isCompleted } : p
    ));
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };


  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId));
    if (selectedProject?.id === projectId) setSelectedProject(null);
  };


  const cancelProjectCreation = () => {
    setCreatingForBucket(null);
    setNewProjectTitle('');
    setNewProjectDate('');
    setNewProjectImportant(false);
  };

  if (!isLoaded) return <div className="animate-pulse h-96 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800/50"></div>;

  return (
    <div className="w-full relative">

      {/* Grid of 9 Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BUCKETS.map(bucket => {
          const bucketProjects = projects
            .filter(p => p.bucketId === bucket && !p.isCompleted)
            .sort((a, b) => {
              const pA = getPriorityInfo(a);
              const pB = getPriorityInfo(b);
              const score = (p: { isCompleted?: boolean; isImportant?: boolean; isUrgent?: boolean }) => {
                if (p.isCompleted) return 5;
                if (p.isImportant && p.isUrgent) return 1;
                if (p.isImportant && !p.isUrgent) return 2;
                if (!p.isImportant && p.isUrgent) return 3;
                return 4;
              };
              return score(pA) - score(pB);
            });

          return (
            <div key={bucket} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col h-[380px] shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500/20 border border-teal-500"></div>
                  {bucket}
                </h3>
                <button
                  onClick={() => setCreatingForBucket(bucket)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                  aria-label={`Add project to ${bucket}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                </button>
              </div>

              {/* Bucket Content */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
                {bucketProjects.length === 0 && creatingForBucket !== bucket && (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 italic mt-auto mb-auto text-center">No projects yet</p>
                )}

                {bucketProjects.map(project => {
                  const priority = getPriorityInfo(project);
                  return (
                    <div
                      key={project.id}
                      onClick={() => {
                        setSelectedProject(project);
                      }}
                      className={`text-left p-4 rounded-xl transition-all sm:hover:-translate-y-0.5 flex-shrink-0 flex flex-col justify-between cursor-pointer group ${priority.classes}`}
                    >
                      <div className="flex justify-between items-start gap-2 w-full">
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          {(() => {
                            const nextTask = project.tasks.find(t => !t.isCompleted);
                            return (
                              <>
                                <h4 className={`font-semibold text-[15px] leading-tight break-words ${project.isCompleted ? 'line-through opacity-60' : ''}`}>
                                  {project.title}
                                </h4>
                                {nextTask && !project.isCompleted && (
                                  <div className="flex items-center gap-1.5 w-full">
                                    <span className="text-[10px] opacity-40 shrink-0">→</span>
                                    <p className="text-[11px] opacity-80 min-w-0 font-medium truncate">
                                      {nextTask.title}
                                    </p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        {project.dueDate && (
                          <div className="flex items-center gap-1.5 py-0.5 px-2 rounded-md bg-white/50 dark:bg-black/20 text-[10px] opacity-90 font-medium shrink-0 mt-0.5 -mr-2 ml-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            {new Date(project.dueDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Inline Form for creating project in this bucket */}
                {creatingForBucket === bucket && (
                  <form onSubmit={handleCreateProject} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Project title..."
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white mb-3 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Due Date</label>
                        <input
                          type="date"
                          value={newProjectDate}
                          onChange={(e) => setNewProjectDate(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Priority</label>
                        <button
                          type="button"
                          onClick={() => setNewProjectImportant(!newProjectImportant)}
                          className={`w-full flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors border ${newProjectImportant
                              ? 'bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={newProjectImportant ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                          Important
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-1">
                      <button type="button" onClick={cancelProjectCreation} className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        Cancel
                      </button>
                      <button type="submit" disabled={!newProjectTitle.trim() || !newProjectDate} className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-black rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50">
                        Create
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completed Projects Section */}
      {(() => {
        const completedProjects = projects.filter(p => p.isCompleted);
        if (completedProjects.length === 0) return null;
        return (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
              <span className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              Completed Projects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {completedProjects.map(project => {
                const priority = getPriorityInfo(project);
                return (
                  <div
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project);
                    }}
                    className={`text-left p-4 rounded-xl transition-all sm:hover:-translate-y-0.5 flex-shrink-0 flex flex-col justify-between cursor-pointer shadow-sm ${priority.classes}`}
                  >
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex items-start justify-between gap-2 text-[10px] uppercase font-bold tracking-wider opacity-60">
                        <span className="mt-1">{project.bucketId}</span>
                        {project.dueDate && (
                          <div className="flex items-center gap-1.5 py-0.5 px-2 rounded-md bg-white/50 dark:bg-black/20 normal-case opacity-90 font-medium shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            {new Date(project.dueDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-[15px] leading-tight line-through opacity-70 w-full">
                        {project.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Detailed View Modal overlay */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
        />
      )}

    </div>
  );
}
