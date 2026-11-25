/* eslint-disable @typescript-eslint/no-explicit-any -- reads loosely-typed JSON from many stores */
import { InventoryStatus } from '@/types/health-system';
import { localDateStr } from './content-system';

export type PriorityTier = 'CRITICAL' | 'DAILY' | 'MAINTENANCE';

/** Which part of the dashboard an action comes from. Drives the source badge. */
export type ActionSource = 'health' | 'content' | 'project' | 'task' | 'contact' | 'habits' | 'pantry' | 'finance' | 'journal';

export interface PulseAction {
  id: string;
  label: string;
  href: string;
  tier: PriorityTier;
  type: string;
  source: ActionSource;
  /** Extra context shown next to the source, e.g. the project a task belongs to. */
  context?: string;
  platform?: string; // optional — set for CONTENT actions
}

/** Short display abbreviation for known platforms */
export const PLATFORM_ABBREV: Record<string, string> = {
  'Instagram':   'IG',
  'YouTube':     'YT',
  'LinkedIn':    'LI',
  'X (Twitter)': 'X',
  'Facebook':    'FB',
  'TikTok':      'TT',
  'Pinterest':   'PIN',
};

export interface PulseDataDependencies {
  medicine: any[];
  travelKit: any[];
  aidHome: any[];
  aidMobile: any[];
  supplements: any[];
  projects: any[];
  habits: any[];
  channels: any[];  // BusinessChannel[]
  income: any[];    // IncomeRecord[]
  expenses: any[];  // ExpenseRecord[]
  journals: string[]; // Journal log dates
  pantryPlan?: any[]; // GroceryPlanItem[]
  contacts?: any[]; // Contact[]
}

export interface SystemPulseData {
  score: number;
  scoreLabel: string;
  actions: PulseAction[];
  activeMilestone: {
    id: string;
    title: string;
    bucket: string;
    progress: number;
    tasksDone: number;
    tasksTotal: number;
    dueDate?: string;
    /** Days until the project's due date (negative = overdue). */
    daysLeft: number | null;
    nextTask: { title: string; dueDate?: string; daysLeft: number | null } | null;
  } | null;
  /** Other in-progress projects, after the active one. */
  alsoInProgress: { id: string; title: string; bucket: string; progress: number }[];
  upcomingMilestones: {
    id: string;
    title: string;
    daysDesc: string;
    bucket: string;
    diff: number;
    kind: 'project' | 'task';
    /** For tasks: the project it belongs to. */
    parent?: string;
    dueDate: string;
  }[];
  stats: {
    healthReadiness: number;
    goalHealth: number;
    habitConsistency: number;
  };
}

/**
 * Pure function to calculate system pulse metrics from raw data.
 * Can be run on server or client.
 */
export function calculateSystemPulse(data: PulseDataDependencies): SystemPulseData {
  const { medicine, travelKit, aidHome, aidMobile, supplements, projects, habits, channels, income, expenses, journals, pantryPlan, contacts } = data;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Local date: toISOString() would give yesterday's date east of UTC (e.g. India before 5:30am).
  const todayStr = localDateStr(today);
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // 1. Health Calculations
  let totalHealthItems = 0;
  let okHealthItems = 0;
  const healthIssues: { type: InventoryStatus; name: string }[] = [];

  [medicine, travelKit, aidHome, aidMobile, supplements].forEach(list => {
    (list || []).forEach((item: any) => {
      totalHealthItems++;
      const name = item.itemName || item.medicineName || item.name || 'Item';
      const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
      if (expiry) expiry.setHours(0, 0, 0, 0);

      if (expiry && expiry < today) healthIssues.push({ type: 'EXPIRED', name });
      else if (item.quantity === 0) healthIssues.push({ type: 'MISSING', name });
      else if (item.quantity < (item.targetQuantity || 1)) healthIssues.push({ type: 'LOW', name });
      else okHealthItems++;
    });
  });

  const healthReadiness = totalHealthItems > 0 ? (okHealthItems / totalHealthItems) * 100 : 100;

  // 2. Goals Calculations
  const activeProjects = (projects || []).filter((p: any) => !p.isCompleted && p.status !== 'completed');
  const overdueProjects: any[] = [];
  const dueTodayProjects: any[] = [];
  const nextMilestones: any[] = [];

  activeProjects.forEach(p => {
    if (p.dueDate) {
      if (p.dueDate < todayStr) overdueProjects.push(p);
      else if (p.dueDate === todayStr) dueTodayProjects.push(p);
      if (p.dueDate >= todayStr) nextMilestones.push(p);
    }
  });

  // Open tasks with due dates, across active projects.
  const overdueTasks: { title: string; project: string }[] = [];
  const dueTodayTasks: { id: string; title: string; project: string }[] = [];
  let datedOpenTasks = 0;
  activeProjects.forEach((p: any) => {
    (p.tasks || []).forEach((t: any) => {
      if (t.isCompleted || !t.dueDate) return;
      datedOpenTasks++;
      if (t.dueDate < todayStr) overdueTasks.push({ title: t.title, project: p.title });
      else if (t.dueDate === todayStr) dueTodayTasks.push({ id: `${p.id}-${t.id}`, title: t.title, project: p.title });
    });
  });

  // Goal health: share of dated projects and dated open tasks that aren't overdue (each half the weight).
  const overdueCount = overdueProjects.length;
  const datedProjects = activeProjects.filter((p: any) => p.dueDate).length;
  const projectOnTime = datedProjects > 0 ? ((datedProjects - overdueCount) / datedProjects) * 100 : null;
  const taskOnTime = datedOpenTasks > 0 ? ((datedOpenTasks - overdueTasks.length) / datedOpenTasks) * 100 : null;
  const goalParts = [projectOnTime, taskOnTime].filter((x): x is number => x !== null);
  const goalHealthOrNull = goalParts.length ? goalParts.reduce((a, b) => a + b, 0) / goalParts.length : null;
  const goalHealth = goalHealthOrNull ?? 100;

  // 3. Habits Calculations
  const mKey = `${today.getFullYear()}-${today.getMonth()}`;
  const dayIdx = today.getDate() - 1;
  const pendingHabitsCount = (habits || []).filter(h =>
    (!h.monthScope || h.monthScope.includes(mKey)) &&
    (h.records?.[mKey]?.[dayIdx] === 'none' || h.records?.[mKey]?.[dayIdx] === undefined)
  ).length;

  let done = 0, totalCount = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const mk = `${d.getFullYear()}-${d.getMonth()}`;
    const di = d.getDate() - 1;
    (habits || []).forEach(h => {
      if (!h.monthScope || h.monthScope.includes(mk)) {
        const s = h.records?.[mk]?.[di];
        if (s === 'done') { done++; totalCount++; }
        else if (s === 'missed') totalCount++;
      }
    });
  }
  const habitRateOrNull = totalCount > 0 ? (done / totalCount) * 100 : null;
  const habitSuccessRate = habitRateOrNull ?? 100;

  // 4. Content System — schedules
  const overdueContentItems: { channelName: string; scheduleType: string; platform: string }[] = [];
  let totalContentSchedules = 0;
  let overdueContentCount = 0;
  (channels || [])
    .filter((c: any) => c.status === 'Active')
    .forEach((c: any) => {
      (c.schedules || []).forEach((s: any) => {
        totalContentSchedules++;
        if (s.nextPostDueDate && s.nextPostDueDate < todayStr) {
          overdueContentCount++;
          overdueContentItems.push({ channelName: c.name, scheduleType: s.type, platform: c.platform || '' });
        }
      });
    });
  const contentOrNull = totalContentSchedules > 0 ? ((totalContentSchedules - overdueContentCount) / totalContentSchedules) * 100 : null;

  // 5. Admin & Hygiene: Finance staleness
  let lastFinanceEntryStr: string | null = null;
  [...(income || []), ...(expenses || [])].forEach((entry: any) => {
    if (entry.date && (!lastFinanceEntryStr || entry.date > lastFinanceEntryStr)) {
      lastFinanceEntryStr = entry.date;
    }
  });

  let financeIsStale = false;
  let financeHygiene = 100;
  if (lastFinanceEntryStr) {
    const lastEntry = new Date(lastFinanceEntryStr + 'T00:00:00');
    const daysSinceLast = Math.floor((today.getTime() - lastEntry.getTime()) / 86400000);
    financeIsStale = daysSinceLast >= 5; // Alert threshold
    if (daysSinceLast > 3) {
       financeHygiene = Math.max(0, 100 - ((daysSinceLast - 3) * 20)); // Drops score after 3 days
    }
  } else {
    financeIsStale = true; // No entries ever → always prompt
    financeHygiene = 0;
  }

  // 6. Admin & Hygiene: Journal staleness
  let journalHygiene = 100;
  let daysSinceJournal = 999;
  if (journals && journals.length > 0) {
      const lastJournalStr = journals.reduce((max, d) => d > max ? d : max, '1970-01-01');
      const lastJ = new Date(lastJournalStr + 'T00:00:00');
      daysSinceJournal = Math.floor((today.getTime() - lastJ.getTime()) / 86400000);
  }
  if (daysSinceJournal > 2) {
      journalHygiene = Math.max(0, 100 - ((daysSinceJournal - 2) * 25)); // Drops score after 2 days
  }
  
  const adminHygiene = (financeHygiene * 0.5) + (journalHygiene * 0.5);

  // 7. Pantry/Grocery Predictive Alerts
  const lowStockItems: {name: string, status: 'Low' | 'Out', daysRemaining: number}[] = [];
  (pantryPlan || []).forEach(item => {
    let latestPurchaseDate: Date | null = null;
    let totalBoughtLast = 0;

    (expenses || []).forEach(record => {
      const recordDate = new Date(record.date);
      const nameMatch = item.name.toLowerCase();
      const isMatch = record.items?.some((i: any) => i.name.toLowerCase().includes(nameMatch)) || (record.subcategory || record.category || '').toLowerCase().includes(nameMatch);

      if (isMatch) {
        if (!latestPurchaseDate || recordDate > latestPurchaseDate) {
          latestPurchaseDate = recordDate;
          if (record.items) {
            const match = record.items.find((i: any) => i.name.toLowerCase().includes(nameMatch));
            totalBoughtLast = parseFloat(match?.quantity || '1') || 1;
          } else {
            totalBoughtLast = parseFloat(record.quantity || '1') || 1;
          }
        }
      }
    });

    let latestManualDate: Date | null = null;
    (item.checkedUnits || []).forEach((u: any) => {
      if (typeof u !== 'string' && u.status === 'bought' && u.date) {
        const d = new Date(u.date);
        if (!latestManualDate || d > (latestManualDate as Date)) latestManualDate = d;
      }
    });

    let effectivePurchaseDate = latestPurchaseDate as Date | null;
    if (latestManualDate && (!effectivePurchaseDate || (latestManualDate as Date) > (effectivePurchaseDate as Date))) {
      effectivePurchaseDate = latestManualDate;
      if (totalBoughtLast === 0) totalBoughtLast = 1; 
    }

    if (effectivePurchaseDate && item.consumptionDays) {
      const diff = (today.getTime() - effectivePurchaseDate.getTime()) / 86400000;
      const totalLifespan = item.consumptionDays * totalBoughtLast;
      const daysRemaining = Math.max(0, totalLifespan - diff);
      if (daysRemaining <= 0) lowStockItems.push({name: item.name, status: 'Out', daysRemaining});
      else if (daysRemaining <= 3) lowStockItems.push({name: item.name, status: 'Low', daysRemaining});
    }
  });

  // 8. Contacts — follow-ups due or overdue
  const overdueFollowUps: any[] = [];
  const dueTodayFollowUps: any[] = [];
  (contacts || []).forEach((c: any) => {
    if (!c.nextFollowUpDate) return;
    if (c.nextFollowUpDate < todayStr) overdueFollowUps.push(c);
    else if (c.nextFollowUpDate === todayStr) dueTodayFollowUps.push(c);
  });

  // --- Pulse Score ---
  // Weights: Habits 30%, Goals 25%, Content 15%, Health 15%, Admin 15%.
  // Areas with no data are left out and the remaining weights rescaled, so an
  // untracked area neither inflates (old default was 100) nor drags the score.
  const parts: [number | null, number][] = [
    [habitRateOrNull, 0.30],
    [goalHealthOrNull, 0.25],
    [contentOrNull, 0.15],
    [totalHealthItems > 0 ? healthReadiness : null, 0.15],
    [adminHygiene, 0.15],
  ];
  const usedWeight = parts.reduce((s, [v, w]) => s + (v === null ? 0 : w), 0);
  const pulseScore = usedWeight > 0 ? Math.round(parts.reduce((s, [v, w]) => s + (v === null ? 0 : v * w), 0) / usedWeight) : 0;

  // --- Build Actions List ---
  const actions: PulseAction[] = [];

  // Health — grouped, CRITICAL (show first expired item + count of rest)
  const criticalHealth = healthIssues.filter(i => i.type === 'EXPIRED' || i.type === 'MISSING');
  if (criticalHealth.length > 0) {
    const extra = criticalHealth.length > 1 ? ` +${criticalHealth.length - 1} more` : '';
    actions.push({
      id: 'health-expired',
      tier: 'CRITICAL',
      type: 'HEALTH',
      source: 'health',
      context: 'Expired or used up',
      label: `Replace ${criticalHealth[0].name}${extra}`,
      href: '/health-system?filter=EXPIRED'
    });
  }

  // Health — running low, grouped, MAINTENANCE
  const lowHealth = healthIssues.filter(i => i.type === 'LOW');
  if (lowHealth.length > 0) {
    actions.push({
      id: 'health-low',
      tier: 'MAINTENANCE',
      type: 'HEALTH',
      source: 'health',
      context: 'Running low',
      label: `Restock ${lowHealth[0].name}${lowHealth.length > 1 ? ` +${lowHealth.length - 1} more` : ''}`,
      href: '/health-system'
    });
  }

  // Content — individual per overdue schedule, CRITICAL (max 5)
  overdueContentItems.slice(0, 5).forEach((item, idx) => {
    actions.push({
      id: `content-overdue-${idx}`,
      tier: 'CRITICAL',
      type: 'CONTENT',
      source: 'content',
      context: item.platform,
      label: `${item.channelName} — ${item.scheduleType} overdue`,
      href: '/content-system',
      platform: item.platform,
    });
  });
  if (overdueContentItems.length > 5) {
    actions.push({
      id: 'content-overdue-more', tier: 'CRITICAL', type: 'CONTENT', source: 'content',
      label: `${overdueContentItems.length - 5} more posting schedules overdue`, href: '/content-system',
    });
  }

  // Goals overdue — individual per project, CRITICAL (max 5)
  overdueProjects.slice(0, 5).forEach(p => {
    actions.push({
      id: `goal-overdue-${p.id}`,
      tier: 'CRITICAL',
      type: 'GOALS',
      source: 'project',
      context: p.bucketId,
      label: `"${p.title}" — overdue`,
      href: '/goals'
    });
  });

  // Tasks overdue — one grouped line, they can number in the hundreds
  if (overdueTasks.length > 0) {
    const projectsAffected = new Set(overdueTasks.map(t => t.project)).size;
    actions.push({
      id: 'tasks-overdue',
      tier: 'CRITICAL',
      type: 'GOALS',
      source: 'task',
      context: `${projectsAffected} project${projectsAffected === 1 ? '' : 's'}`,
      label: overdueTasks.length === 1
        ? `"${overdueTasks[0].title}" — overdue`
        : `${overdueTasks.length} overdue tasks — reschedule or close them`,
      href: '/goals'
    });
  }

  // Goals due today — individual per project, DAILY (max 5)
  dueTodayProjects.slice(0, 5).forEach(p => {
    actions.push({
      id: `goal-today-${p.id}`,
      tier: 'DAILY',
      type: 'GOALS',
      source: 'project',
      context: p.bucketId,
      label: `"${p.title}" — due today`,
      href: '/goals'
    });
  });

  // Tasks due today — individual, DAILY (max 5)
  dueTodayTasks.slice(0, 5).forEach(t => {
    actions.push({
      id: `task-today-${t.id}`,
      tier: 'DAILY',
      type: 'GOALS',
      source: 'task',
      context: t.project,
      label: `${t.title} — due today`,
      href: '/goals'
    });
  });

  // Contacts — overdue follow-ups, individual, CRITICAL (max 5)
  overdueFollowUps.slice(0, 5).forEach((c: any) => {
    actions.push({
      id: `contact-overdue-${c.id}`,
      tier: 'CRITICAL',
      type: 'CONTACTS',
      source: 'contact',
      label: `Follow up with "${c.name}" — overdue`,
      href: '/contacts'
    });
  });

  // Contacts — follow-ups due today, individual, DAILY (max 5)
  dueTodayFollowUps.slice(0, 5).forEach((c: any) => {
    actions.push({
      id: `contact-today-${c.id}`,
      tier: 'DAILY',
      type: 'CONTACTS',
      source: 'contact',
      label: `Follow up with "${c.name}" — due today`,
      href: '/contacts'
    });
  });

  // Habits — grouped, DAILY
  if (pendingHabitsCount > 0) {
    actions.push({
      id: 'habits-today',
      tier: 'DAILY',
      type: 'HABITS',
      source: 'habits',
      label: `${pendingHabitsCount} habit${pendingHabitsCount === 1 ? '' : 's'} still to mark today`,
      href: '/habits'
    });
  }

  // Pantry Low Stock / Expired — CRITICAL / DAILY (max 3)
  lowStockItems.sort((a, b) => a.daysRemaining - b.daysRemaining);
  lowStockItems.slice(0, 3).forEach((item, idx) => {
    actions.push({
      id: `pantry-low-${idx}`,
      tier: item.status === 'Out' ? 'CRITICAL' : 'DAILY',
      type: 'GROCERY',
      source: 'pantry',
      label: `${item.name} is ${item.status === 'Out' ? 'out of stock' : 'running low'}`,
      href: '/pantry'
    });
  });

  // Finance staleness — DAILY normally, CRITICAL on weekends
  if (financeIsStale) {
    const financeTier: PriorityTier = isWeekend ? 'CRITICAL' : 'DAILY';
    const financeLabel = isWeekend
      ? 'Weekend check — review your finances & expenses'
      : 'Review finances — no entries in 5+ days';
    actions.push({
      id: 'finance-stale',
      tier: financeTier,
      type: 'FINANCE',
      source: 'finance',
      label: financeLabel,
      href: '/finances'
    });
  }

  // Journal — nudge after 2 days without an entry, MAINTENANCE
  if (daysSinceJournal > 2) {
    actions.push({
      id: 'journal-stale',
      tier: 'MAINTENANCE',
      type: 'JOURNAL',
      source: 'journal',
      label: daysSinceJournal >= 999 ? 'Write your first journal entry' : `Journal — last entry ${daysSinceJournal} days ago`,
      href: '/#journal'
    });
  }

  const tierRank: Record<PriorityTier, number> = { CRITICAL: 0, DAILY: 1, MAINTENANCE: 2 };
  actions.sort((a, b) => tierRank[a.tier] - tierRank[b.tier]);

  // Horizon: projects and tasks due in the next 30 days, soonest first.
  const horizonLimit = localDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30));
  const horizon: { id: string; title: string; dueDate: string; bucket: string; kind: 'project' | 'task'; parent?: string }[] = [];
  nextMilestones.forEach((p: any) => {
    if (p.dueDate <= horizonLimit) horizon.push({ id: p.id, title: p.title, dueDate: p.dueDate, bucket: p.bucketId || 'Goal', kind: 'project' });
  });
  activeProjects.forEach((p: any) => {
    (p.tasks || []).forEach((t: any) => {
      if (!t.isCompleted && t.dueDate && t.dueDate >= todayStr && t.dueDate <= horizonLimit) {
        horizon.push({ id: `${p.id}-${t.id}`, title: t.title, dueDate: t.dueDate, bucket: p.bucketId || 'Goal', kind: 'task', parent: p.title });
      }
    });
  });
  horizon.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || (a.kind === 'project' ? -1 : 1));
  const pipeline = horizon.slice(0, 4);

  // Active execution: find the top in-progress project
  const inProgress = activeProjects.filter((p: any) => p.status === 'in-progress');
  const priorityRank = (p: any) => {
    const priority = p.priority || (p.isImportant ? 'important' : 'normal');
    return priority === 'critical' ? 0 : priority === 'important' ? 1 : 2;
  };
  inProgress.sort((a, b) => {
    const rA = priorityRank(a);
    const rB = priorityRank(b);
    if (rA !== rB) return rA - rB;
    const dA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const dB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return dA - dB;
  });
  const activeMilestoneProj = inProgress.length > 0 ? inProgress[0] : null;

  const daysUntil = (dateStr?: string): number | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr.slice(0, 10) + 'T00:00:00');
    return isNaN(d.getTime()) ? null : Math.round((d.getTime() - today.getTime()) / 86400000);
  };
  const progressOf = (p: any) => {
    const total = p.tasks?.length || 0;
    const doneCount = p.tasks?.filter((t: any) => t.isCompleted).length || 0;
    return { total, doneCount, pct: total > 0 ? Math.round((doneCount / total) * 100) : 0 };
  };

  let activeMilestoneData: SystemPulseData['activeMilestone'] = null;
  if (activeMilestoneProj) {
    const prog = progressOf(activeMilestoneProj);
    // Next task: the open task with the earliest due date, else the first open task.
    const open = (activeMilestoneProj.tasks || []).filter((t: any) => !t.isCompleted);
    open.sort((a: any, b: any) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
    const next = open[0];
    activeMilestoneData = {
      id: activeMilestoneProj.id,
      title: activeMilestoneProj.title,
      bucket: activeMilestoneProj.bucketId || 'Goal',
      progress: prog.pct,
      tasksDone: prog.doneCount,
      tasksTotal: prog.total,
      dueDate: activeMilestoneProj.dueDate,
      daysLeft: daysUntil(activeMilestoneProj.dueDate),
      nextTask: next ? { title: next.title, dueDate: next.dueDate, daysLeft: daysUntil(next.dueDate) } : null,
    };
  }
  const alsoInProgress = inProgress.slice(1, 4).map((p: any) => ({
    id: p.id, title: p.title, bucket: p.bucketId || 'Goal', progress: progressOf(p).pct,
  }));

  const upcomingMilestonesData = pipeline.map(p => {
    const diff = daysUntil(p.dueDate) ?? 0;
    return {
      id: p.id,
      title: p.title,
      daysDesc: diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff} days`,
      bucket: p.bucket,
      diff,
      kind: p.kind,
      parent: p.parent,
      dueDate: p.dueDate,
    };
  });

  return {
    score: pulseScore,
    scoreLabel: pulseScore >= 90 ? 'Stable' : pulseScore >= 75 ? 'Optimal' : pulseScore >= 50 ? 'Warning' : 'Critical',
    actions,
    activeMilestone: activeMilestoneData,
    alsoInProgress,
    upcomingMilestones: upcomingMilestonesData,
    stats: { healthReadiness, goalHealth, habitConsistency: habitSuccessRate }
  };
}
