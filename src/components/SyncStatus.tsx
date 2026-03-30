"use client";
import React from 'react';
import { useSync } from '@/hooks/useSync';

export function SyncStatus() {
  const { syncStatus } = useSync();

  if (syncStatus === 'unauthenticated') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Local Only</span>
      </div>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Syncing</span>
      </div>
    );
  }

  if (syncStatus === 'error') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30">
        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
        <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Sync Error</span>
      </div>
    );
  }

  // Idle / Connected
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Cloud Synced</span>
    </div>
  );
}
