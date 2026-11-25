"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { SystemPulseData } from '@/lib/pulse-logic';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "due in 36 days" / "4 days overdue" / "due today", with a tone. */
function dueText(days: number | null): { text: string; overdue: boolean } | null {
  if (days === null) return null;
  if (days < 0) return { text: `${-days} day${days === -1 ? '' : 's'} overdue`, overdue: true };
  if (days === 0) return { text: 'due today', overdue: false };
  return { text: `due in ${days} day${days === 1 ? '' : 's'}`, overdue: false };
}

function whenLabel(diff: number, dueDate: string): string {
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  const d = new Date(dueDate + 'T00:00:00');
  return diff < 7 ? DOW[d.getDay()] : `${d.getDate()} ${MON[d.getMonth()]}`;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{children}</div>
);

export function StrategicFocus({ pulse }: { pulse: Pick<SystemPulseData, 'activeMilestone' | 'alsoInProgress' | 'upcomingMilestones'> }) {
  const a = pulse.activeMilestone;
  const due = a ? dueText(a.daysLeft) : null;
  const nextDue = a?.nextTask ? dueText(a.nextTask.daysLeft) : null;

  return (
    <div className="lg:col-span-7 h-full rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 flex flex-col min-w-0">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Strategic focus</h2>
        <Link href="/goals" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400">
          Roadmap <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
        {/* Now */}
        <section className="min-w-0">
          <Label>Now working on</Label>
          {a ? (
            <>
              <h3 className="text-xl font-semibold leading-snug text-zinc-900 dark:text-white">{a.title}</h3>
              <p className="mt-2 text-sm text-zinc-500">
                {a.bucket}
                {due && <> · <span className={due.overdue ? 'text-rose-600 dark:text-rose-400' : ''}>{due.text}</span></>}
                {' · '}{a.tasksDone} of {a.tasksTotal} tasks
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-teal-500 transition-all duration-1000" style={{ width: `${a.progress}%` }} />
              </div>

              {a.nextTask && (
                <div className="mt-6">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Next task</div>
                  <p className="mt-1.5 text-base leading-snug text-zinc-800 dark:text-zinc-100">{a.nextTask.title}</p>
                  {nextDue && (
                    <p className={`mt-1 text-sm ${nextDue.overdue ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500'}`}>
                      {nextDue.text.charAt(0).toUpperCase() + nextDue.text.slice(1)}
                    </p>
                  )}
                </div>
              )}

              {pulse.alsoInProgress.length > 0 && (
                <Link href="/goals" className="mt-6 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                  Also in progress: {pulse.alsoInProgress.map(p => p.title).join(', ')}
                </Link>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500">Nothing in progress. Set a project to In progress on the Goals page to focus on it here.</p>
          )}
        </section>

        {/* Coming up */}
        <section className="min-w-0 md:border-l md:border-zinc-100 md:pl-10 dark:md:border-zinc-800">
          <Label>Coming up · next 30 days</Label>
          {pulse.upcomingMilestones.length ? (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {pulse.upcomingMilestones.map(ms => (
                <li key={ms.id} className="flex gap-4 py-3 first:pt-0">
                  <span className={`w-[4.5rem] shrink-0 pt-0.5 text-xs font-semibold ${ms.diff === 0 ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-500'}`}>
                    {whenLabel(ms.diff, ms.dueDate)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">{ms.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{ms.kind === 'task' ? ms.parent : `Project · ${ms.bucket}`}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Nothing due in the next 30 days.</p>
          )}
        </section>
      </div>
    </div>
  );
}
