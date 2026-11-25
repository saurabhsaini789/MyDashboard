"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- projects are loosely-typed synced JSON */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, ListPlus, Plus, X } from 'lucide-react';
import type { SystemPulseData } from '@/lib/pulse-logic';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';
import { localDateStr } from '@/lib/content-system';
import { REASON_LABEL, setPlanned, suggestions, todaysPlan, toggleDone, type PlanTask, type Suggestion, type SuggestReason } from '@/lib/today-plan';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EMPTY: any[] = [];

function daysFrom(today: string, date?: string): number | null {
  if (!date) return null;
  const a = new Date(today + 'T00:00:00').getTime();
  const b = new Date(date.slice(0, 10) + 'T00:00:00').getTime();
  return isNaN(b) ? null : Math.round((b - a) / 86400000);
}

/** "Due today" / "Due in 3 days" / "4 days overdue". */
function dueNote(today: string, due?: string): { text: string; overdue: boolean } | null {
  const d = daysFrom(today, due);
  if (d === null) return null;
  if (d < 0) return { text: `${-d} day${d === -1 ? '' : 's'} overdue`, overdue: true };
  if (d === 0) return { text: 'Due today', overdue: false };
  if (d === 1) return { text: 'Due tomorrow', overdue: false };
  return { text: `Due in ${d} days`, overdue: false };
}

function whenLabel(diff: number, date: string): string {
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  const d = new Date(date + 'T00:00:00');
  return diff < 7 ? DOW[d.getDay()] : `${d.getDate()} ${MON[d.getMonth()]}`;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{children}</div>
);

function PlanRow({ task, today, projects }: { task: PlanTask; today: string; projects: any[] }) {
  const due = task.isCompleted ? null : dueNote(today, task.dueDate);
  return (
    <li className="group flex items-start gap-3 py-3 first:pt-0">
      <button
        type="button"
        onClick={() => toggleDone(projects, task.projectId, task.taskId)}
        aria-label={task.isCompleted ? 'Mark as not done' : 'Mark as done'}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${task.isCompleted ? 'border-teal-500 bg-teal-500 text-white' : 'border-zinc-300 hover:border-teal-500 dark:border-zinc-600'}`}
      >
        {task.isCompleted && <Check size={12} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-base leading-snug ${task.isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-100'}`}>{task.title}</p>
        <p className="mt-0.5 text-xs text-zinc-400">
          {task.projectTitle}
          {due && <> · <span className={due.overdue ? 'text-rose-600 dark:text-rose-400' : ''}>{due.text}</span></>}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setPlanned(projects, task.projectId, task.taskId, false)}
        title="Remove from today"
        className="mt-0.5 shrink-0 rounded-md p-1 text-zinc-300 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100 dark:hover:bg-zinc-800"
      >
        <X size={14} />
      </button>
    </li>
  );
}

function Picker({ projects, today, onClose }: { projects: any[]; today: string; onClose: () => void }) {
  const [expanded, setExpanded] = useState<Set<SuggestReason>>(new Set());
  const toggleGroup = (r: SuggestReason) => setExpanded(prev => { const n = new Set(prev); if (n.has(r)) n.delete(r); else n.add(r); return n; });
  const plan = todaysPlan(projects, today);
  const list = suggestions(projects, today);
  const groups = new Map<SuggestReason, Suggestion[]>();
  list.forEach(s => groups.set(s.reason, [...(groups.get(s.reason) || []), s]));
  const openCount = plan.filter(t => !t.isCompleted).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-zinc-100 px-7 py-5 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-semibold">Plan my day</h3>
            <p className="mt-0.5 text-sm text-zinc-500">
              Pick 3–5 tasks to focus on today.{' '}
              <span className={openCount > 5 ? 'text-amber-600 dark:text-amber-400' : ''}>{openCount} picked</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">Done</button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-7 py-5">
          {plan.length > 0 && (
            <section className="mb-6">
              <Label>On today&apos;s plan</Label>
              <ul className="mt-2 space-y-1">
                {plan.map(t => (
                  <PickRow key={t.taskId} task={t} added projects={projects} today={today} />
                ))}
              </ul>
            </section>
          )}

          {list.length === 0 && <p className="py-6 text-center text-sm text-zinc-500">No open tasks. Add tasks to a project on the Goals page.</p>}

          {[...groups.entries()].map(([reason, items]) => {
            // "Other" starts hidden; every other group shows its first 6.
            const open = expanded.has(reason);
            const limit = reason === 'other' ? 0 : 6;
            const shown = open ? items : items.slice(0, limit);
            return (
              <section key={reason} className="mb-6 last:mb-0">
                <div className="flex items-baseline justify-between">
                  <Label>{REASON_LABEL[reason]} · {items.length}</Label>
                  {items.length > limit && (
                    <button type="button" onClick={() => toggleGroup(reason)} className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                      {open ? 'Show less' : `Show all ${items.length}`}
                    </button>
                  )}
                </div>
                {shown.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {shown.map(t => <PickRow key={t.taskId} task={t} added={false} projects={projects} today={today} />)}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PickRow({ task, added, projects, today }: { task: PlanTask; added: boolean; projects: any[]; today: string }) {
  const due = task.isCompleted ? null : dueNote(today, task.dueDate);
  return (
    <li>
      <button
        type="button"
        onClick={() => setPlanned(projects, task.projectId, task.taskId, !added)}
        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${added ? 'bg-teal-50 dark:bg-teal-500/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'}`}
      >
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${added ? 'bg-teal-500 text-white' : 'border border-zinc-300 text-zinc-400 dark:border-zinc-600'}`}>
          {added ? <Check size={12} strokeWidth={3} /> : <Plus size={12} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm leading-snug ${task.isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-100'}`}>{task.title}</span>
          <span className="mt-0.5 block text-xs text-zinc-400">
            {task.projectTitle}
            {due && <> · <span className={due.overdue ? 'text-rose-600 dark:text-rose-400' : ''}>{due.text}</span></>}
          </span>
        </span>
      </button>
    </li>
  );
}

export function StrategicFocus({ pulse }: { pulse: Pick<SystemPulseData, 'upcomingMilestones'> }) {
  const projects = useStorageSubscription<any[]>(SYNC_KEYS.GOALS_PROJECTS, EMPTY);
  const [picking, setPicking] = useState(false);
  const today = localDateStr();
  const now = new Date(today + 'T00:00:00');
  const plan = todaysPlan(projects, today);
  const done = plan.filter(t => t.isCompleted).length;
  const carried = suggestions(projects, today).filter(s => s.reason === 'carried').length;

  return (
    <div className="lg:col-span-8 h-full rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 flex flex-col min-w-0">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Today &amp; ahead</h2>
        <Link href="/goals" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400">
          Goals <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-8 md:grid-cols-[1.25fr_1fr] md:gap-10">
        {/* Today's plan */}
        <section className="flex min-w-0 flex-col">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Label>
              {DAY_FULL[now.getDay()]} {now.getDate()} {MONTH_FULL[now.getMonth()]}
              {plan.length > 0 && <span className="ml-2 normal-case tracking-normal text-zinc-500">· {done} of {plan.length} done</span>}
            </Label>
            {plan.length > 0 && (
              <button type="button" onClick={() => setPicking(true)} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400">
                <ListPlus size={14} /> Edit plan
              </button>
            )}
          </div>

          {plan.length > 0 && (
            <div className="mb-4 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full rounded-full bg-teal-500 transition-all duration-700" style={{ width: `${(done / plan.length) * 100}%` }} />
            </div>
          )}

          {plan.length > 0 ? (
            <ul className="custom-scrollbar max-h-[320px] divide-y divide-zinc-100 overflow-y-auto pr-1 dark:divide-zinc-800">
              {plan.map(t => <PlanRow key={t.taskId} task={t} today={today} projects={projects} />)}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-start justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 p-6 dark:border-zinc-800">
              <p className="text-base text-zinc-800 dark:text-zinc-100">What will you get done today?</p>
              <p className="text-sm text-zinc-500">
                Pick 3–5 tasks to focus on.
                {carried > 0 && <> {carried} task{carried === 1 ? '' : 's'} left over from an earlier plan.</>}
              </p>
              <button type="button" onClick={() => setPicking(true)} className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700">
                <ListPlus size={15} /> Plan my day
              </button>
            </div>
          )}
        </section>

        {/* Coming up */}
        <section className="min-w-0 md:border-l md:border-zinc-100 md:pl-10 dark:md:border-zinc-800">
          <div className="mb-3"><Label>Coming up · next 30 days</Label></div>
          {pulse.upcomingMilestones.length ? (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {pulse.upcomingMilestones.map(ms => (
                <li key={ms.id} className="flex gap-4 py-3 first:pt-0">
                  <span className={`w-[4.5rem] shrink-0 pt-0.5 text-xs font-semibold ${ms.diff === 0 ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-500'}`}>
                    {whenLabel(ms.diff, ms.dueDate)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
                      {ms.kind === 'start' && <span className="mr-1.5 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">Starts</span>}
                      {ms.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">{ms.kind === 'project' ? `Project · ${ms.bucket}` : ms.parent}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Nothing due or starting in the next 30 days.</p>
          )}
        </section>
      </div>

      {picking && <Picker projects={projects} today={today} onClose={() => setPicking(false)} />}
    </div>
  );
}
