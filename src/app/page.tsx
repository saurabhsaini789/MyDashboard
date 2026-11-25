"use client";
import React from 'react';
import { Quotes } from '@/components/widgets/Quotes';
import { TasksCalendar } from '@/components/widgets/TasksCalendar';
import { GrowthOverview } from '@/components/widgets/GrowthOverview';
import { OneNoteJournal } from '@/components/widgets/OneNoteJournal';
import { PulseDashboard } from '@/components/widgets/PulseDashboard';
import { PulseDataDependencies } from '@/lib/pulse-logic';

export default function Home() {
  const pulseInitialData: PulseDataDependencies = {
    medicine: [],
    travelKit: [],
    aidHome: [],
    aidMobile: [],
    supplements: [],
    projects: [],
    habits: [],
    channels: [],
    income: [],
    expenses: [],
    journals: [],
    pantryPlan: [],
    contacts: [],
  };

  return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 font-sans p-4 md:p-8 xl:p-12">
            <div className="mx-auto w-full max-w-7xl">

                {/* Page header, System Pulse, Priority and Strategic Focus */}
                <PulseDashboard initialData={pulseInitialData} />

                {/* Sub-sections (Remaining as Client Components for incremental migration) */}
                <section className="w-full fade-in mb-14" style={{ animationDelay: '50ms' }}>
                    <GrowthOverview />
                </section>

                <section className="w-full fade-in mb-14">
                    <div className="w-full">
                        <Quotes />
                    </div>
                </section>

                <section className="w-full fade-in mb-14" style={{ animationDelay: '100ms' }}>
                    <TasksCalendar />
                </section>

                <section id="journal" className="w-full fade-in pb-12 scroll-mt-8" style={{ animationDelay: '200ms' }}>
                    <div className="w-full">
                        <OneNoteJournal />
                    </div>
                </section>

            </div>
        </main>
    );
}
