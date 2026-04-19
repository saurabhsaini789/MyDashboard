"use client";

import React, { useEffect } from 'react';
import { PageTitle, Description, Text } from '@/components/ui/Text';
import { ShieldAlert, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 font-sans p-4 md:p-8 xl:p-12 flex flex-col items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-3xl border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400">
            <ShieldAlert size={48} />
          </div>
        </div>
        
        <div>
          <PageTitle className="mb-2">System Interruption</PageTitle>
          <Description>We encountered an error while synchronizing your dashboard data.</Description>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl text-left">
          <Text variant="bodySmall" className="font-mono text-zinc-500 dark:text-zinc-400 break-all">
            {error.message || 'An unexpected error occurred.'}
          </Text>
        </div>

        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-zinc-200/50 dark:shadow-none"
        >
          <RotateCcw size={18} />
          Retry Connection
        </button>
      </div>
    </main>
  );
}
