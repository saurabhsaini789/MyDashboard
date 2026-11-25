/* eslint-disable @typescript-eslint/no-explicit-any -- projects are loosely-typed synced JSON */
import { setSyncedItem } from './storage';
import { getPrefixedKey } from './keys';
import { SYNC_KEYS } from './sync-keys';
import { localDateStr } from './content-system';

export interface PlanTask {
  projectId: string;
  projectTitle: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
  startDate?: string;
  plannedFor?: string;
}

export type SuggestReason = 'carried' | 'overdue' | 'due-today' | 'started' | 'due-soon' | 'in-progress' | 'other';

export interface Suggestion extends PlanTask {
  reason: SuggestReason;
}

export const REASON_LABEL: Record<SuggestReason, string> = {
  'carried': 'From an earlier plan',
  'overdue': 'Overdue',
  'due-today': 'Due today',
  'started': 'Start date reached',
  'due-soon': 'Due this week',
  'in-progress': 'Project in progress',
  'other': 'Other open tasks',
};

const REASON_RANK: SuggestReason[] = ['carried', 'overdue', 'due-today', 'started', 'due-soon', 'in-progress', 'other'];

function isActive(p: any): boolean {
  return !p.isCompleted && p.status !== 'completed';
}

function flatten(projects: any[]): (PlanTask & { projectStatus?: string })[] {
  const out: (PlanTask & { projectStatus?: string })[] = [];
  (projects || []).forEach(p => {
    if (!isActive(p)) return;
    (p.tasks || []).forEach((t: any) => {
      out.push({
        projectId: p.id, projectTitle: p.title, projectStatus: p.status,
        taskId: t.id, title: t.title, isCompleted: !!t.isCompleted,
        dueDate: t.dueDate, startDate: t.startDate, plannedFor: t.plannedFor,
      });
    });
  });
  return out;
}

const addDays = (date: string, n: number) => {
  const [y, m, d] = date.split('-').map(Number);
  return localDateStr(new Date(y, m - 1, d + n));
};

/** Tasks on today's plan, open ones first, in the order they were added. */
export function todaysPlan(projects: any[], today = localDateStr()): PlanTask[] {
  const planned = flatten(projects).filter(t => t.plannedFor === today);
  return [...planned.filter(t => !t.isCompleted), ...planned.filter(t => t.isCompleted)];
}

/** Open tasks not on today's plan, ranked by why you might pick them. */
export function suggestions(projects: any[], today = localDateStr()): Suggestion[] {
  const weekOut = addDays(today, 7);
  const ranked = flatten(projects)
    .filter(t => !t.isCompleted && t.plannedFor !== today)
    .map(t => {
      let reason: SuggestReason = 'other';
      if (t.plannedFor && t.plannedFor < today) reason = 'carried';
      else if (t.dueDate && t.dueDate < today) reason = 'overdue';
      else if (t.dueDate === today) reason = 'due-today';
      else if (t.startDate && t.startDate <= today) reason = 'started';
      else if (t.dueDate && t.dueDate <= weekOut) reason = 'due-soon';
      else if (t.projectStatus === 'in-progress' && !(t.startDate && t.startDate > today)) reason = 'in-progress';
      // Tasks that can't start yet stay out unless a deadline pulls them in.
      if (reason === 'other' && t.startDate && t.startDate > today) return null;
      return { ...t, reason } as Suggestion;
    })
    .filter((t): t is Suggestion => t !== null);
  return ranked.sort((a, b) =>
    REASON_RANK.indexOf(a.reason) - REASON_RANK.indexOf(b.reason)
    || (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
}

/** Latest projects from storage, so quick successive clicks never write over each other. */
function freshProjects(fallback: any[]): any[] {
  try {
    const raw = localStorage.getItem(getPrefixedKey(SYNC_KEYS.GOALS_PROJECTS));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const data = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'd' in parsed ? parsed.d : parsed;
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

function updateTask(projects: any[], projectId: string, taskId: string, patch: (t: any) => any): void {
  const next = freshProjects(projects).map(p => p.id !== projectId ? p : {
    ...p,
    tasks: (p.tasks || []).map((t: any) => t.id === taskId ? patch(t) : t),
  });
  setSyncedItem(SYNC_KEYS.GOALS_PROJECTS, JSON.stringify(next));
}

export function setPlanned(projects: any[], projectId: string, taskId: string, planned: boolean): void {
  updateTask(projects, projectId, taskId, t => ({ ...t, plannedFor: planned ? localDateStr() : undefined }));
}

export function toggleDone(projects: any[], projectId: string, taskId: string): void {
  updateTask(projects, projectId, taskId, t => ({
    ...t,
    isCompleted: !t.isCompleted,
    completedAt: !t.isCompleted ? new Date().toISOString() : undefined,
  }));
}
