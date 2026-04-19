import React from 'react';
import { PageTitle, Description } from '@/components/ui/Text';

export default function Loading() {
    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 font-sans p-4 md:p-8 xl:p-12">
            <div className="mx-auto w-full max-w-7xl">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col items-start">
                        <PageTitle>Today Actions</PageTitle>
                        <Description>Command center for your system's health and daily momentum.</Description>
                    </div>
                </header>

                {/* Pulse Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-14">
                    <div className="lg:col-span-3 h-64 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl animate-pulse" />
                    <div className="lg:col-span-6 h-64 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl animate-pulse" />
                    <div className="lg:col-span-3 h-64 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl animate-pulse" />
                </div>

                {/* Growth Overview Skeleton */}
                <div className="w-full h-96 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl animate-pulse mb-14" />
            </div>
        </main>
    );
}
