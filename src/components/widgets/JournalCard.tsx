"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, NotebookPen } from 'lucide-react';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';
import { localDateStr, addDaysStr } from '@/lib/content-system';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function phaseNow(): string {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'day' : 'evening';
}

/** Journal status for the header: written today or not, streak, and the last 7 days. */
export function JournalCard() {
  const logs = useStorageSubscription<string[]>(SYNC_KEYS.JOURNAL_LOGS, []);
  const days = new Set(Array.isArray(logs) ? logs : []);
  const today = localDateStr();
  const writtenToday = days.has(today);

  // Streak counts back from today, or from yesterday if today isn't written yet.
  let streak = 0;
  let cursor = writtenToday ? today : addDaysStr(today, -1);
  while (days.has(cursor)) { streak++; cursor = addDaysStr(cursor, -1); }

  const last = [...days].sort().pop();
  const sinceLast = last ? Math.round((new Date(today + 'T00:00:00').getTime() - new Date(last + 'T00:00:00').getTime()) / 86400000) : null;

  const week = Array.from({ length: 7 }, (_, i) => addDaysStr(today, i - 6));

  const status = writtenToday
    ? { text: 'Written today', cls: 'text-emerald-600 dark:text-emerald-400' }
    : sinceLast === null
    ? { text: 'No entries yet', cls: 'text-zinc-800 dark:text-zinc-100' }
    : { text: 'Not written today', cls: sinceLast > 2 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400' };

  const sub = sinceLast === null ? 'Start your first entry'
    : sinceLast === 0 ? 'Nice — keep it going'
    : sinceLast === 1 ? 'Last entry yesterday'
    : `Last entry ${sinceLast} days ago`;

  return (
    <div className="flex items-center gap-5 rounded-2xl border border-cyan-200/70 bg-white px-5 py-3 shadow-sm dark:border-cyan-500/20 dark:bg-zinc-900">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300">
        <NotebookPen size={22} />
      </div>

      <div className="flex shrink-0 flex-col gap-0.5 whitespace-nowrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Journal</span>
        <span className={`text-base font-semibold leading-tight ${status.cls}`}>{status.text}</span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          {sub}
          {streak > 1 && <span className="inline-flex items-center gap-0.5 font-semibold text-orange-500"><Flame size={12} />{streak}-day streak</span>}
        </span>
      </div>

      <div className="hidden h-10 w-px bg-zinc-100 dark:bg-zinc-800 sm:block" />

      <div className="hidden items-end gap-1.5 sm:flex" title="Last 7 days">
        {week.map(d => {
          const on = days.has(d);
          const isToday = d === today;
          return (
            <div key={d} className="flex flex-col items-center gap-1">
              <span className={`h-5 w-2.5 rounded-full ${on ? 'bg-cyan-500' : 'bg-zinc-100 dark:bg-zinc-800'} ${isToday ? 'ring-2 ring-cyan-200 ring-offset-1 dark:ring-cyan-500/30 dark:ring-offset-zinc-900' : ''}`} />
              <span className={`text-[9px] font-semibold ${isToday ? 'text-cyan-600 dark:text-cyan-300' : 'text-zinc-400'}`}>{DOW[new Date(d + 'T00:00:00').getDay()]}</span>
            </div>
          );
        })}
      </div>

      {!writtenToday && (
        <Link
          href="/#journal"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-cyan-700"
        >
          Write {phaseNow()} entry <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}
