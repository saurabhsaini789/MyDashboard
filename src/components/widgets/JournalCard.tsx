"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, NotebookPen } from 'lucide-react';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';
import { localDateStr, addDaysStr } from '@/lib/content-system';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EMPTY: string[] = [];

function phaseNow(): string {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'day' : 'evening';
}

function longestStreak(sorted: string[]): number {
  let best = 0, run = 0, prev = '';
  for (const d of sorted) {
    run = prev && addDaysStr(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

const Stat = ({ value, label, sub }: { value: React.ReactNode; label: string; sub?: string }) => (
  <div className="min-w-0">
    <div className="text-2xl font-bold tabular-nums leading-none text-zinc-900 dark:text-white">{value}</div>
    <div className="mt-1.5 text-xs text-zinc-500">{label}</div>
    {sub && <div className="text-[11px] text-zinc-400">{sub}</div>}
  </div>
);

/** Journal status: today, streaks, and how many days you wrote this month and last month. */
export function JournalCard() {
  const logs = useStorageSubscription<string[]>(SYNC_KEYS.JOURNAL_LOGS, EMPTY);
  const sorted = [...new Set(Array.isArray(logs) ? logs : [])].sort();
  const days = new Set(sorted);
  const today = localDateStr();
  const writtenToday = days.has(today);

  // Current streak counts back from today, or from yesterday if today isn't written yet.
  let streak = 0;
  let cursor = writtenToday ? today : addDaysStr(today, -1);
  while (days.has(cursor)) { streak++; cursor = addDaysStr(cursor, -1); }
  const best = longestStreak(sorted);

  const last = sorted[sorted.length - 1];
  const sinceLast = last ? Math.round((new Date(today + 'T00:00:00').getTime() - new Date(last + 'T00:00:00').getTime()) / 86400000) : null;

  // This month and last month.
  const [y, m, dToday] = today.split('-').map(Number);
  const thisKey = today.slice(0, 7);
  const prevDate = new Date(y, m - 2, 1);
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevDays = new Date(y, m - 1, 0).getDate();
  const thisCount = sorted.filter(d => d.startsWith(thisKey)).length;
  const prevCount = sorted.filter(d => d.startsWith(prevKey)).length;
  const daysInMonth = new Date(y, m, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => `${thisKey}-${String(i + 1).padStart(2, '0')}`);

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
    <div className="flex flex-col gap-4 rounded-3xl border border-cyan-200/70 bg-white px-5 py-5 shadow-sm sm:px-7 dark:border-cyan-500/20 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-4 sm:h-14 sm:flex-nowrap">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300">
          <NotebookPen size={22} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Journal</span>
          <span className={`text-lg font-semibold leading-tight ${status.cls}`}>{status.text}</span>
          <span className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
            {sub}
            {streak > 1 && <span className="inline-flex items-center gap-0.5 font-semibold text-orange-500"><Flame size={12} />{streak}-day streak</span>}
          </span>
        </div>
        {!writtenToday && (
          <Link
            href="/#journal"
            className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-cyan-600 sm:w-auto px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan-700"
          >
            Write {phaseNow()} entry <ArrowRight size={14} />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 border-t sm:grid-cols-4 border-zinc-100 pt-4 dark:border-zinc-800">
        <Stat value={<>{thisCount}<span className="text-sm font-medium text-zinc-400"> / {dToday}</span></>} label={MONTHS[m - 1]} sub="days written so far" />
        <Stat value={<>{prevCount}<span className="text-sm font-medium text-zinc-400"> / {prevDays}</span></>} label={MONTHS[prevDate.getMonth()]} sub="days written" />
        <Stat value={streak} label="Current streak" sub={streak === 1 ? 'day' : 'days'} />
        <Stat value={best} label="Best streak" sub={best === 1 ? 'day' : 'days'} />
      </div>

      {/* This month, one bar per day */}
      <div className="flex items-end gap-[3px]" title={`${MONTHS[m - 1]}: ${thisCount} days written`}>
        {monthDays.map((d, i) => {
          const on = days.has(d);
          const isToday = d === today;
          const future = i + 1 > dToday;
          return (
            <span
              key={d}
              title={d}
              className={`h-4 flex-1 rounded-sm ${on ? 'bg-cyan-500' : future ? 'bg-zinc-50 dark:bg-zinc-800/40' : 'bg-zinc-100 dark:bg-zinc-800'} ${isToday ? 'ring-2 ring-cyan-300 ring-offset-1 dark:ring-cyan-500/40 dark:ring-offset-zinc-900' : ''}`}
            />
          );
        })}
      </div>
    </div>
  );
}
