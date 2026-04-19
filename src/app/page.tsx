import React from 'react';
import { Quotes } from '@/components/widgets/Quotes';
import { TasksCalendar } from '@/components/widgets/TasksCalendar';
import { GrowthOverview } from '@/components/widgets/GrowthOverview';
import { OneNoteJournal } from '@/components/widgets/OneNoteJournal';
import { PageTitle, Text, Description } from '@/components/ui/Text';
import { SYNC_KEYS } from '@/lib/sync-keys';
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
    habits: []
  };

  return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 font-sans p-4 md:p-8 xl:p-12">
            <div className="mx-auto w-full max-w-7xl">

                {/* Page Header */}
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col items-start">
                        <PageTitle>
                            Today Actions
                        </PageTitle>
                        <Description>Command center for your system's health and daily momentum.</Description>
                    </div>
                </header>

                {/* Unified System Status Dashboard (Server-Fetched + Client-Hydrated) */}
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

                <section className="w-full fade-in pb-12" style={{ animationDelay: '200ms' }}>
                    <div className="w-full">
                        <OneNoteJournal />
                    </div>
                </section>

            </div>
        </main>
    );
}

