"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CalendarClock, FolderKanban, ListChecks, Target } from 'lucide-react';
import type { SystemPulseData } from '@/lib/pulse-logic';

const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dueText(days: number | null): { text: string; cls: string } | null {
  if (days === null) return null;
  if (days < 0) return { text: `${-days} day${days === -1 ? '' : 's'} overdue`, cls: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' };
  if (days === 0) return { text: 'Due today', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' };
  return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' };
}

function Ring({ pct }: { pct: number }) {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <div className="relative h-[76px] w-[76px] shrink-0">
      <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" strokeWidth="7" className="stroke-zinc-100 dark:stroke-zinc-800" />
        <circle cx="38" cy="38" r={r} fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-teal-500 transition-all duration-1000"
          strokeDasharray={`${(c * pct) / 100} ${c}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-black tabular-nums text-zinc-900 dark:text-white">{pct}%</span>
    </div>
  );
}

export function StrategicFocus({ pulse }: { pulse: Pick<SystemPulseData, 'activeMilestone' | 'alsoInProgress' | 'upcomingMilestones'> }) {
  const a = pulse.activeMilestone;
  const due = a ? dueText(a.daysLeft) : null;
  const nextDue = a?.nextTask ? dueText(a.nextTask.daysLeft) : null;

  return (
    <div className="lg:col-span-5 h-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col min-w-0">
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Strategic Focus</span>
        <Link href="/goals" className="group inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 dark:text-teal-400">
          Roadmap <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-6 sm:grid-cols-[1fr_1.1fr]">
        {/* Now */}
        <div className="flex min-w-0 flex-col sm:border-r sm:border-zinc-100 sm:pr-6 dark:sm:border-zinc-800">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Now working on</span>
          </div>

          {a ? (
            <>
              <div className="flex items-start gap-4">
                <Ring pct={a.progress} />
                <div className="min-w-0">
                  <div className="line-clamp-2 text-lg font-bold leading-tight text-zinc-900 dark:text-white">{a.title}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">{a.bucket}</span>
                    {due && <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${due.cls}`}>{due.text}</span>}
                  </div>
                  <div className="mt-1.5 text-[11px] text-zinc-400">{a.tasksDone} of {a.tasksTotal} tasks done</div>
                </div>
              </div>

              {a.nextTask && (
                <div className="mt-4 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400"><ArrowRight size={11} /> Next task</div>
                  <div className="mt-1 line-clamp-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{a.nextTask.title}</div>
                  {nextDue && <span className={`mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${nextDue.cls}`}>{nextDue.text}</span>}
                </div>
              )}

              {pulse.alsoInProgress.length > 0 && (
                <div className="mt-auto pt-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Also in progress</div>
                  <div className="space-y-1.5">
                    {pulse.alsoInProgress.map(p => (
                      <div key={p.id} className="flex items-center gap-2 text-xs">
                        <span className="min-w-0 flex-1 truncate font-medium text-zinc-600 dark:text-zinc-300">{p.title}</span>
                        <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <span className="block h-full rounded-full bg-zinc-400" style={{ width: `${p.progress}%` }} />
                        </span>
                        <span className="w-8 shrink-0 text-right tabular-nums text-zinc-400">{p.progress}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-6 text-center text-zinc-400">
              <Target size={28} className="mb-2" />
              <span className="text-xs">Set a project to In progress to focus on it here</span>
            </div>
          )}
        </div>

        {/* Horizon */}
        <div className="flex min-w-0 flex-col">
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock size={12} className="text-zinc-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Next 30 days</span>
          </div>
          {pulse.upcomingMilestones.length ? (
            <div className="space-y-2">
              {pulse.upcomingMilestones.map((ms, idx) => {
                const d = new Date(ms.dueDate + 'T00:00:00');
                return (
                  <div key={ms.id} className={`flex items-center gap-3 rounded-2xl border p-2.5 ${idx === 0 ? 'border-teal-200 bg-teal-50/50 dark:border-teal-500/30 dark:bg-teal-500/5' : 'border-zinc-100 dark:border-zinc-800'}`}>
                    <div className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl ${idx === 0 ? 'bg-teal-500 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                      <span className="text-base font-black leading-none tabular-nums">{d.getDate()}</span>
                      <span className="text-[9px] font-bold uppercase">{MONTH[d.getMonth()]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100" title={ms.title}>{ms.title}</div>
                      <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-zinc-400">
                        {ms.kind === 'task' ? <ListChecks size={11} /> : <FolderKanban size={11} />}
                        <span className="truncate">{ms.kind === 'task' ? `Task · ${ms.parent}` : `Project · ${ms.bucket}`}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold ${idx === 0 ? 'bg-white text-teal-700 dark:bg-zinc-900 dark:text-teal-300' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>{ms.daysDesc}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-6 text-center text-zinc-400">
              <CalendarClock size={28} className="mb-2" />
              <span className="text-xs">Nothing due in the next 30 days</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
