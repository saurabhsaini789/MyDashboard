"use client";
import React, { useState, useEffect } from 'react';
import { Quotes } from '@/components/widgets/Quotes';
import { GoalsSummary } from '@/components/widgets/GoalsSummary';
import { TasksCalendar } from '@/components/widgets/TasksCalendar';
import { HabitsOverview } from '@/components/widgets/HabitsOverview';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 font-sans p-4 md:p-8 xl:p-12">
      <div className="mx-auto w-full max-w-7xl flex flex-col gap-12 pt-4">
        

        {/* Page Title */}
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white text-center uppercase tracking-widest fade-in">
          Remember Your Why
        </h2>

        {/* Top Section: Goals Summary and Quotes */}
        <section className="w-full flex flex-col lg:flex-row gap-6 fade-in">
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="h-full"> 
              <GoalsSummary />
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex flex-col">
            <Quotes />
          </div>
        </section>

        {/* Middle Section: Full Width Calendar */}
        <section className="w-full fade-in" style={{ animationDelay: '100ms' }}>
          <TasksCalendar />
        </section>

        {/* Bottom Section */}
        <section className="w-full fade-in pb-12" style={{ animationDelay: '200ms' }}>
          <HabitsOverview />
        </section>
        
      </div>
    </main>
  );
}
