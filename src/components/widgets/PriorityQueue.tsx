"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { FolderKanban, HeartPulse, ListChecks, NotebookPen, Repeat, Rocket, ShieldCheck, ShoppingBasket, Users, Wallet } from 'lucide-react';
import type { ActionSource, PriorityTier, PulseAction } from '@/lib/pulse-logic';
import { PlatformLogo } from '@/components/content-system/PlatformLogo';

const SOURCES: Record<ActionSource, { label: string; icon: React.ReactNode; cls: string }> = {
  health:  { label: 'Health kit', icon: <HeartPulse size={12} />,     cls: 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300' },
  content: { label: 'Content',    icon: <Rocket size={12} />,         cls: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300' },
  project: { label: 'Project',    icon: <FolderKanban size={12} />,   cls: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
  task:    { label: 'Task',       icon: <ListChecks size={12} />,     cls: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
  contact: { label: 'Contact',    icon: <Users size={12} />,          cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  habits:  { label: 'Habits',     icon: <Repeat size={12} />,         cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  pantry:  { label: 'Pantry',     icon: <ShoppingBasket size={12} />, cls: 'bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-300' },
  finance: { label: 'Finance',    icon: <Wallet size={12} />,         cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' },
  journal: { label: 'Journal',    icon: <NotebookPen size={12} />,    cls: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300' },
};

const TIER: Record<PriorityTier, { label: string; bar: string; text: string }> = {
  CRITICAL:    { label: 'Urgent', bar: 'bg-rose-500',  text: 'text-rose-600 dark:text-rose-400' },
  DAILY:       { label: 'Today',  bar: 'bg-teal-500',  text: 'text-teal-600 dark:text-teal-400' },
  MAINTENANCE: { label: 'Later',  bar: 'bg-zinc-300 dark:bg-zinc-600', text: 'text-zinc-500 dark:text-zinc-400' },
};

type Filter = 'ALL' | PriorityTier;

export function PriorityQueue({ actions }: { actions: PulseAction[] }) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const counts: Record<Filter, number> = {
    ALL: actions.length,
    CRITICAL: actions.filter(a => a.tier === 'CRITICAL').length,
    DAILY: actions.filter(a => a.tier === 'DAILY').length,
    MAINTENANCE: actions.filter(a => a.tier === 'MAINTENANCE').length,
  };
  const shown = filter === 'ALL' ? actions : actions.filter(a => a.tier === filter);
  const tabs: [Filter, string][] = [['ALL', 'All'], ['CRITICAL', 'Urgent'], ['DAILY', 'Today'], ['MAINTENANCE', 'Later']];

  return (
    <div className="h-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col min-w-0">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold">Priority</h2>
        <span className="text-xs font-semibold text-zinc-400">{actions.length} items</span>
      </div>

      <div className="flex h-10 gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 mb-4">
        {tabs.filter(([k]) => k === 'ALL' || counts[k] > 0).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            aria-pressed={filter === k}
            className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all ${filter === k ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500'}`}
          >
            {label} <span className="tabular-nums opacity-60">{counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2.5 overflow-y-auto flex-1 min-h-0 max-h-[420px] pr-1.5 custom-scrollbar">
        {shown.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-8 text-zinc-400">
            <ShieldCheck size={36} className="mb-2 text-emerald-400" />
            <span className="text-sm">Nothing needs you right now</span>
          </div>
        ) : (
          shown.map(action => {
            const src = SOURCES[action.source] ?? SOURCES.project;
            const tier = TIER[action.tier];
            return (
              <Link
                key={action.id}
                href={action.href}
                className="group relative flex flex-col gap-1.5 overflow-hidden rounded-2xl border border-transparent bg-zinc-50 py-3 pl-4 pr-3 transition-all hover:border-zinc-200 hover:bg-white dark:bg-zinc-800/30 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <span className={`absolute left-0 top-0 h-full w-1 ${tier.bar}`} />
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${src.cls}`}>
                    {action.source === 'content' && action.platform ? <PlatformLogo platform={action.platform} size={12} /> : src.icon}
                    {src.label}
                  </span>
                  {action.context && <span className="truncate text-[11px] text-zinc-400">{action.context}</span>}
                  <span className={`ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wider ${tier.text}`}>{tier.label}</span>
                </div>
                <span className="text-[15px] font-medium leading-snug text-zinc-900 transition-colors group-hover:text-teal-600 dark:text-zinc-100 dark:group-hover:text-teal-400">
                  {action.label}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
