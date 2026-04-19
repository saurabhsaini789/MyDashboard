"use client";

import React, { useState, useEffect } from "react";
import { useStorageSubscription } from "@/hooks/useStorageSubscription";
import { SYNC_KEYS } from "@/lib/sync-keys";

export type TimeFilter = '1 Day' | '7 Days' | '1 Month' | '6 Months' | '1 Year' | 'Custom Month';

interface GoalsSummaryProps {
  filter: TimeFilter;
  selectedMonth: number;
  selectedYear: number;
}

export function GoalsSummary({ filter, selectedMonth, selectedYear }: GoalsSummaryProps) {
  const projects = useStorageSubscription<any[]>(SYNC_KEYS.GOALS_PROJECTS, []);
  
  const [projectsCount, setProjectsCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [overdueTasksCount, setOverdueTasksCount] = useState(0);
  const [nearDeadlineProjectsCount, setNearDeadlineProjectsCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const calculateStats = () => {
      let pCount = 0;
      let tCount = 0;
      let activeP = 0;
      let totalT = 0;
      let overdueT = 0;
      let nearDeadlineP = 0;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);

      const isMatch = (item: any) => {
        if (!item.isCompleted && item.status !== 'completed') return false;
        
        if (filter === 'Custom Month') {
          const date = item.completedAt ? new Date(item.completedAt) : (item.dueDate ? new Date(item.dueDate + 'T12:00:00') : null);
          if (!date) return false;
          return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        } else {
          let daysToLookBack = 30;
          if (filter === '1 Day') daysToLookBack = 1;
          if (filter === '7 Days') daysToLookBack = 7;
          if (filter === '1 Month') daysToLookBack = 30;
          if (filter === '6 Months') daysToLookBack = 180;
          if (filter === '1 Year') daysToLookBack = 365;

          const date = item.completedAt ? new Date(item.completedAt) : (item.dueDate ? new Date(item.dueDate + 'T12:00:00') : null);
          if (!date) return true; 
          
          const diffTime = today.getTime() - date.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays < daysToLookBack;
        }
      };

      if (Array.isArray(projects)) {
        projects.forEach((p: any) => {
          if (isMatch(p)) pCount++;

          if (!p.isCompleted && p.status !== 'completed') {
            activeP++;
            if (p.dueDate) {
              const pDate = new Date(p.dueDate + 'T00:00:00');
              pDate.setHours(0, 0, 0, 0);
              if (pDate < today) {
                if (p.tasks && Array.isArray(p.tasks)) {
                  p.tasks.forEach((t: any) => {
                    if (!t.isCompleted) overdueT++;
                  });
                }
              }
              if (pDate >= today && pDate <= sevenDaysFromNow) {
                nearDeadlineP++;
              }
            }
          }

          if (p.tasks && Array.isArray(p.tasks)) {
            p.tasks.forEach((t: any) => {
              totalT++;
              if (isMatch(t)) tCount++;
            });
          }
        });
      }
      setProjectsCount(pCount);
      setTasksCount(tCount);
      setActiveProjectsCount(activeP);
      setTotalTasksCount(totalT);
      setOverdueTasksCount(overdueT);
      setNearDeadlineProjectsCount(nearDeadlineP);
    };

    calculateStats();
    setIsLoaded(true);
  }, [filter, selectedMonth, selectedYear, projects]);

  if (!isLoaded) return <div className="animate-pulse h-40 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800/50"></div>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 flex-1">
      {/* Active Projects Card */}
      <div className="bg-white dark:bg-zinc-900/60 border border-teal-100 dark:border-teal-900/50 border-l-4 rounded-xl p-4 flex flex-col justify-center items-center text-center transition-all shadow-sm hover:shadow-md sm:hover:-translate-y-0.5">
        <span className="text-2xl md:text-3xl font-bold text-teal-600 dark:text-teal-400 mb-1">{activeProjectsCount}</span>
        <span className="text-[10px] font-semibold uppercase text-teal-700/70 dark:text-teal-500/80 leading-tight">Active Projects</span>
      </div>

      {/* Total Tasks Card */}
      <div className="bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 border-l-4 rounded-xl p-4 flex flex-col justify-center items-center text-center transition-all shadow-sm hover:shadow-md sm:hover:-translate-y-0.5">
        <span className="text-2xl md:text-3xl font-bold text-zinc-600 dark:text-zinc-400 mb-1">{totalTasksCount}</span>
        <span className="text-[10px] font-semibold uppercase text-zinc-500/70 dark:text-zinc-400/80 leading-tight">Total Tasks</span>
      </div>

      {/* Overdue Tasks Card */}
      <div className="bg-white dark:bg-zinc-900/60 border border-rose-100 dark:border-rose-900/50 border-l-4 rounded-xl p-4 flex flex-col justify-center items-center text-center transition-all shadow-sm hover:shadow-md sm:hover:-translate-y-0.5">
        <span className="text-2xl md:text-3xl font-bold text-rose-600 dark:text-rose-400 mb-1">{overdueTasksCount}</span>
        <span className="text-[10px] font-semibold uppercase text-rose-700/70 dark:text-rose-500/80 leading-tight">Overdue Tasks</span>
      </div>

      {/* Near Deadline Card */}
      <div className="bg-white dark:bg-zinc-900/60 border border-amber-100 dark:border-amber-900/50 border-l-4 rounded-xl p-4 flex flex-col justify-center items-center text-center transition-all shadow-sm hover:shadow-md sm:hover:-translate-y-0.5">
        <span className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">{nearDeadlineProjectsCount}</span>
        <span className="text-[10px] font-semibold uppercase text-amber-700/70 dark:text-amber-500/80 leading-tight">Due 7 Days</span>
      </div>

      {/* Projects Completed Card */}
      <div className="bg-white dark:bg-zinc-900/60 border border-emerald-100/50 dark:border-emerald-900/50 border-l-4 rounded-xl p-4 flex flex-col justify-center items-center text-center transition-all shadow-sm hover:shadow-md sm:hover:-translate-y-0.5">
        <span className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{projectsCount}</span>
        <span className="text-[10px] font-semibold uppercase text-emerald-700/70 dark:text-emerald-500/80 leading-tight">Completed Projects</span>
      </div>
      
      {/* Tasks Completed Card */}
      <div className="bg-white dark:bg-zinc-900/60 border border-sky-100 dark:border-sky-900/50 border-l-4 rounded-xl p-4 flex flex-col justify-center items-center text-center transition-all shadow-sm hover:shadow-md sm:hover:-translate-y-0.5">
        <span className="text-2xl md:text-3xl font-bold text-sky-600 dark:text-sky-400 mb-1">{tasksCount}</span>
        <span className="text-[10px] font-semibold uppercase text-sky-700/70 dark:text-sky-500/80 leading-tight">Completed Tasks</span>
      </div>
    </div>
  );
}
