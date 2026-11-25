/* eslint-disable @typescript-eslint/no-explicit-any -- scores read loosely-typed JSON from several stores */
import { localDateStr } from './content-system';

/**
 * Life Growth Index
 *
 * Eight pillars, each scored 0-100 for a period, or `null` when there is no
 * data to judge (a null pillar is left out of the overall score instead of
 * counting as zero). Every pillar is scored against the period's own dates,
 * so the trend chart's weeks/months each get their own score.
 */

export interface CategoryScore {
  name: string;
  /** 0-100, or null when there's nothing to score in this period. */
  score: number | null;
  /** One-line plain-English explanation of the number. */
  detail: string;
  color: string;
  fullPath: string;
}

export interface GrowthDataDependencies {
  habits: any[];
  projects: any[];
  income: any[];
  expenses: any[];
  inventory: Record<string, any[]>;
  channels: any[];
  journals: string[];
  books?: any[];
  bookGoal?: number;
  contacts?: any[];
}

export type ScoreRange = '7D' | '1M' | '6M' | '1Y' | 'Custom';

export interface ScoreFilter {
  range: ScoreRange;
  month?: number;
  year?: number;
}

/** Inclusive date window, as YYYY-MM-DD strings. */
export interface Period { start: string; end: string }

// Habit names that also count toward Health or Mindfulness.
const HEALTH_HABIT = /\b(gym|workout|exercise|run|running|walk|walking|steps|yoga|stretch|sleep|water|swim|cycle|cycling|sport|diet|protein|meal|fruit|vegetable|no sugar|fast)/i;
const MINDFUL_HABIT = /\b(meditat|journal|gratitude|pray|prayer|breath|mindful|reflect)/i;

const PROJECT_TASKS_PER_WEEK = 3;

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const avg = (vals: (number | null)[]) => {
  const v = vals.filter((x): x is number => x !== null && !isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const day = (s?: string) => (s ? String(s).slice(0, 10) : '');
const inPeriod = (s: string | undefined, p: Period) => { const d = day(s); return !!d && d >= p.start && d <= p.end; };
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return localDateStr(d); };
const daysIn = (p: Period) => Math.round((parse(p.end).getTime() - parse(p.start).getTime()) / 86400000) + 1;

/** The period a filter covers. A period never extends past today. */
export function periodFor(filter: ScoreFilter): Period {
  const today = localDateStr();
  if (filter.range === 'Custom') {
    const now = new Date();
    const y = filter.year ?? now.getFullYear();
    const m = filter.month ?? now.getMonth();
    const start = localDateStr(new Date(y, m, 1));
    const end = localDateStr(new Date(y, m + 1, 0));
    return { start, end: end > today ? today : end };
  }
  const days = filter.range === '7D' ? 7 : filter.range === '1M' ? 30 : filter.range === '6M' ? 182 : 365;
  return { start: addDays(today, -(days - 1)), end: today };
}

/** Habit completion: done ÷ (done + missed) over marked days in the period. Skips don't count. */
function habitRate(habits: any[], p: Period, filterName?: RegExp): { rate: number | null; done: number; marked: number } {
  let done = 0, marked = 0;
  for (const h of habits || []) {
    if (filterName && !filterName.test(String(h.name || ''))) continue;
    for (let d = p.start; d <= p.end; d = addDays(d, 1)) {
      const dt = parse(d);
      const monthKey = `${dt.getFullYear()}-${dt.getMonth()}`;
      if (h.monthScope?.length && !h.monthScope.includes(monthKey)) continue;
      const status = h.records?.[monthKey]?.[dt.getDate() - 1];
      if (!status || status === 'skip') continue;
      marked++;
      if (status === 'done') done++;
    }
  }
  return { rate: marked ? (done / marked) * 100 : null, done, marked };
}

export function scoreForPeriod(data: GrowthDataDependencies, p: Period): CategoryScore[] {
  // A period entirely in the future has nothing to score yet.
  if (p.end < p.start) p = { start: p.start, end: p.start };
  const today = localDateStr();
  if (p.start > today) {
    return scoreForPeriod({ habits: [], projects: [], income: [], expenses: [], inventory: {}, channels: [], journals: [] }, { start: today, end: today })
      .map(c => ({ ...c, score: null, detail: 'This period hasn\'t started yet' }));
  }
  const isCurrent = p.end >= today;
  const days = daysIn(p);

  // 1. Habits
  const habits = habitRate(data.habits, p);

  // 2. Projects: items due in the period that got done; if nothing was due, tasks finished vs a weekly target.
  let projectsScore: number | null = null;
  let projectsDetail = 'No projects yet';
  const projects = (data.projects || []).filter((x: any) => x);
  if (projects.length) {
    let due = 0, dueDone = 0, finished = 0;
    for (const pr of projects) {
      const prDone = pr.isCompleted || pr.status === 'completed';
      if (inPeriod(pr.dueDate, p)) { due++; if (prDone) dueDone++; }
      if (prDone && inPeriod(pr.completedAt, p)) finished++;
      for (const t of pr.tasks || []) {
        if (inPeriod(t.dueDate, p)) { due++; if (t.isCompleted) dueDone++; }
        if (t.isCompleted && inPeriod(t.completedAt, p)) finished++;
      }
    }
    if (due > 0) {
      projectsScore = (dueDone / due) * 100;
      projectsDetail = `${dueDone} of ${due} due items done`;
    } else {
      const target = Math.max(1, Math.round((days / 7) * PROJECT_TASKS_PER_WEEK));
      projectsScore = clamp((finished / target) * 100);
      projectsDetail = `${finished} items finished · target ${target}`;
    }
  }

  // 3. Money: savings rate (40% saved = 100) and share of spending on needs/investments.
  const inc = (data.income || []).filter((r: any) => inPeriod(r.date, p)).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
  const expRows = (data.expenses || []).filter((r: any) => inPeriod(r.date, p));
  const exp = expRows.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
  const needs = expRows.reduce((s: number, r: any) => {
    if (Array.isArray(r.items) && r.items.length) {
      return s + r.items.reduce((x: number, it: any) => x + (it.type === 'need' || it.type === 'investment' ? Number(it.totalPrice) || 0 : 0), 0);
    }
    return s + (r.type === 'need' || r.type === 'investment' ? Number(r.amount) || 0 : 0);
  }, 0);
  const savings = inc > 0 ? clamp(((inc - exp) / inc / 0.4) * 100) : null;
  const needShare = exp > 0 ? clamp((needs / exp) * 100) : null;
  const moneyScore = savings !== null && needShare !== null ? savings * 0.7 + needShare * 0.3 : savings ?? needShare;
  const moneyDetail = inc > 0
    ? `Saved ${Math.round(((inc - exp) / inc) * 100)}% of income${needShare !== null ? ` · ${Math.round(needShare)}% of spend on needs` : ''}`
    : exp > 0 ? `No income logged · ${Math.round(needShare || 0)}% of spend on needs` : 'No income or expenses logged';

  // 4. Health: medicine/first-aid kits in date and stocked (today), plus health habits in the period.
  let kitTotal = 0, kitOk = 0;
  for (const items of Object.values(data.inventory || {})) {
    for (const it of Array.isArray(items) ? items : []) {
      kitTotal++;
      const expired = it.expiryDate && day(it.expiryDate) < today;
      const empty = Number(it.quantity) === 0;
      if (!expired && !empty) kitOk++;
    }
  }
  const kit = kitTotal ? (kitOk / kitTotal) * 100 : null;
  const healthHabits = habitRate(data.habits, p, HEALTH_HABIT);
  const healthScore = healthHabits.rate !== null && kit !== null ? healthHabits.rate * 0.7 + kit * 0.3 : healthHabits.rate ?? kit;
  const healthDetail = [
    healthHabits.marked ? `${healthHabits.done}/${healthHabits.marked} health-habit days` : null,
    kitTotal ? `${kitOk}/${kitTotal} kit items ready` : null,
  ].filter(Boolean).join(' · ') || 'No health habits or kit items';

  // 5. Content: active posting schedules that aren't overdue (current state; history isn't stored).
  let schedTotal = 0, schedOk = 0;
  for (const c of data.channels || []) {
    if (c.status !== 'Active') continue;
    for (const s of c.schedules || []) {
      if (!s.nextPostDueDate) continue;
      schedTotal++;
      if (day(s.nextPostDueDate) >= today) schedOk++;
    }
  }
  const contentScore = schedTotal ? (schedOk / schedTotal) * 100 : null;
  const contentDetail = schedTotal ? `${schedOk} of ${schedTotal} schedules on track today` : 'No active schedules';

  // 6. Mindfulness: journaled days, plus mindful habits (meditation, gratitude…).
  const journalDays = new Set((data.journals || []).map(day).filter(d => d >= p.start && d <= p.end)).size;
  const journalRate = (data.journals || []).length ? clamp((journalDays / days) * 100) : null;
  const mindfulHabits = habitRate(data.habits, p, MINDFUL_HABIT);
  const mindfulScore = avg([journalRate, mindfulHabits.rate]);
  const mindfulDetail = [
    journalRate !== null ? `Journaled ${journalDays} of ${days} days` : null,
    mindfulHabits.marked ? `${mindfulHabits.done}/${mindfulHabits.marked} mindful-habit days` : null,
  ].filter(Boolean).join(' · ') || 'No journal entries or mindful habits';

  // 7. Reading: books finished vs the yearly goal's pace for this period, plus a book in progress.
  let readingScore: number | null = null;
  let readingDetail = 'No books in your library';
  const books = data.books || [];
  if (books.length) {
    const goal = Math.max(1, Number(data.bookGoal) || 24);
    const finished = books.filter((b: any) => b.status === 'done' && inPeriod(b.finishedOn, p)).length;
    const readingNow = isCurrent && books.some((b: any) => b.status === 'reading');
    const expected = Math.max(0.5, (goal * days) / 365);
    readingScore = clamp(((finished + (readingNow ? 0.5 : 0)) / expected) * 100);
    readingDetail = `${finished} finished · pace ${expected < 1 ? expected.toFixed(1) : Math.round(expected)} for a ${goal}-book year${readingNow ? ' · reading now' : ''}`;
  }

  // 8. Relationships: follow-ups that aren't overdue, plus people you actually contacted in the period.
  let relScore: number | null = null;
  let relDetail = 'No follow-ups set in Contacts';
  const withFollowUp = (data.contacts || []).filter((c: any) => c.nextFollowUpDate);
  if (withFollowUp.length) {
    const asOf = isCurrent ? today : p.end;
    const notOverdue = withFollowUp.filter((c: any) => day(c.nextFollowUpDate) >= asOf || inPeriod(c.lastContactDate, p)).length;
    const touched = (data.contacts || []).filter((c: any) => inPeriod(c.lastContactDate, p)).length;
    relScore = (notOverdue / withFollowUp.length) * 100;
    relDetail = `${notOverdue} of ${withFollowUp.length} follow-ups on track · ${touched} contacted`;
  }

  return [
    { name: 'Habits', score: habits.rate, detail: habits.marked ? `${habits.done} of ${habits.marked} habit days done` : 'No habit days marked', color: '#10b981', fullPath: '/habits' },
    { name: 'Projects', score: projectsScore, detail: projectsDetail, color: '#3b82f6', fullPath: '/goals' },
    { name: 'Money', score: moneyScore, detail: moneyDetail, color: '#6366f1', fullPath: '/finances' },
    { name: 'Health', score: healthScore, detail: healthDetail, color: '#ec4899', fullPath: '/health-system' },
    { name: 'Reading', score: readingScore, detail: readingDetail, color: '#f97316', fullPath: '/books' },
    { name: 'Content', score: contentScore, detail: contentDetail, color: '#8b5cf6', fullPath: '/content-system' },
    { name: 'Relationships', score: relScore, detail: relDetail, color: '#f59e0b', fullPath: '/contacts' },
    { name: 'Mindfulness', score: mindfulScore, detail: mindfulDetail, color: '#06b6d4', fullPath: '/' },
  ].map(c => ({ ...c, score: c.score === null ? null : Math.round(c.score) }));
}

export function calculateCategoryScores(data: GrowthDataDependencies, filter: ScoreFilter = { range: '7D' }): CategoryScore[] {
  return scoreForPeriod(data, periodFor(filter));
}

/** Average of the pillars that have data. Returns null when none do. */
export function getOverallGrowthScore(categories: CategoryScore[]): number | null {
  const v = avg(categories.map(c => c.score));
  return v === null ? null : Math.round(v);
}

/** One point per day (7D), week (1M / a month) or month (6M / 1Y), each scored on its own dates. */
export function getGrowthTrendData(data: GrowthDataDependencies, filter: ScoreFilter) {
  const p = periodFor(filter);
  const points: { name: string; start: string; end: string }[] = [];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (filter.range === '7D') {
    for (let d = p.start; d <= p.end; d = addDays(d, 1)) points.push({ name: DOW[parse(d).getDay()], start: d, end: d });
  } else if (filter.range === '1M' || filter.range === 'Custom') {
    // For a month, weeks run 1-7, 8-14, 15-21, 22-end; for the last 30 days, four 7-8 day blocks.
    const monthEnd = filter.range === 'Custom' ? localDateStr(new Date(parse(p.start).getFullYear(), parse(p.start).getMonth() + 1, 0)) : p.end;
    let s = p.start;
    for (let w = 1; w <= 4 && s <= p.end; w++) {
      const e = w === 4 ? monthEnd : addDays(s, 6);
      points.push({ name: `W${w}`, start: s, end: e > p.end ? p.end : e });
      s = addDays(e, 1);
    }
  } else {
    const months = filter.range === '6M' ? 6 : 12;
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const first = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
      const end = localDateStr(last) > p.end ? p.end : localDateStr(last);
      points.push({ name: MON[first.getMonth()], start: localDateStr(first), end });
    }
  }

  return points.map(pt => ({ name: pt.name, score: getOverallGrowthScore(scoreForPeriod(data, pt)) }));
}
