import { InventoryStatus } from '@/types/health-system';

export type PriorityTier = 'CRITICAL' | 'DAILY' | 'MAINTENANCE';

export interface PulseAction {
  id: string;
  label: string;
  href: string;
  tier: PriorityTier;
  type: string;
}

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
}

export interface SystemPulseData {
  score: number;
  scoreLabel: string;
  actions: PulseAction[];
  milestone: {
    title: string;
    daysDesc: string;
    bucket: string;
  } | null;
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
  const { medicine, travelKit, aidHome, aidMobile, supplements, projects, habits, channels, income, expenses } = data;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
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
  let nextMilestone: any = null;

  activeProjects.forEach(p => {
    if (p.dueDate) {
      if (p.dueDate < todayStr) overdueProjects.push(p);
      else if (p.dueDate === todayStr) dueTodayProjects.push(p);
      if (p.dueDate >= todayStr && (!nextMilestone || p.dueDate < nextMilestone.dueDate)) nextMilestone = p;
    }
  });

  const overdueCount = overdueProjects.length;
  const goalHealth = activeProjects.length > 0 ? ((activeProjects.length - overdueCount) / activeProjects.length) * 100 : 100;

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
  const habitSuccessRate = totalCount > 0 ? (done / totalCount) * 100 : 100;

  // 4. Content System — overdue schedules (strictly past due, not today)
  const overdueContentItems: { channelName: string; scheduleType: string }[] = [];
  (channels || [])
    .filter((c: any) => c.status === 'Active')
    .forEach((c: any) => {
      (c.schedules || []).forEach((s: any) => {
        if (s.nextPostDueDate && s.nextPostDueDate < todayStr) {
          overdueContentItems.push({ channelName: c.name, scheduleType: s.type });
        }
      });
    });

  // 5. Finance staleness — Option A: use last entry date across income + expenses
  let lastFinanceEntryStr: string | null = null;
  [...(income || []), ...(expenses || [])].forEach((entry: any) => {
    if (entry.date && (!lastFinanceEntryStr || entry.date > lastFinanceEntryStr)) {
      lastFinanceEntryStr = entry.date;
    }
  });

  let financeIsStale = false;
  if (lastFinanceEntryStr) {
    const lastEntry = new Date(lastFinanceEntryStr + 'T00:00:00');
    const daysSinceLast = Math.floor((today.getTime() - lastEntry.getTime()) / 86400000);
    financeIsStale = daysSinceLast >= 5;
  } else {
    financeIsStale = true; // No entries ever → always prompt
  }

  // --- Pulse Score ---
  const pulseScore = Math.round((healthReadiness * 0.4) + (goalHealth * 0.35) + (habitSuccessRate * 0.25));

  // --- Build Actions List ---
  const actions: PulseAction[] = [];

  // Health — grouped, CRITICAL (show first expired item + count of rest)
  const criticalHealth = healthIssues.filter(i => i.type === 'EXPIRED');
  if (criticalHealth.length > 0) {
    const extra = criticalHealth.length > 1 ? ` +${criticalHealth.length - 1} more` : '';
    actions.push({
      id: 'health-expired',
      tier: 'CRITICAL',
      type: 'HEALTH',
      label: `Replace ${criticalHealth[0].name}${extra}`,
      href: '/health-system?filter=EXPIRED'
    });
  }

  // Content — individual per overdue schedule, CRITICAL (max 5)
  overdueContentItems.slice(0, 5).forEach((item, idx) => {
    actions.push({
      id: `content-overdue-${idx}`,
      tier: 'CRITICAL',
      type: 'CONTENT',
      label: `${item.channelName} — ${item.scheduleType} overdue`,
      href: '/content-system'
    });
  });

  // Goals overdue — individual per project, CRITICAL (max 5)
  overdueProjects.slice(0, 5).forEach(p => {
    actions.push({
      id: `goal-overdue-${p.id}`,
      tier: 'CRITICAL',
      type: 'GOALS',
      label: `"${p.title}" — overdue`,
      href: '/goals'
    });
  });

  // Goals due today — individual per project, DAILY (max 5)
  dueTodayProjects.slice(0, 5).forEach(p => {
    actions.push({
      id: `goal-today-${p.id}`,
      tier: 'DAILY',
      type: 'GOALS',
      label: `"${p.title}" — due today`,
      href: '/goals'
    });
  });

  // Habits — grouped, DAILY
  if (pendingHabitsCount > 0) {
    actions.push({
      id: 'habits-today',
      tier: 'DAILY',
      type: 'HABITS',
      label: `${pendingHabitsCount} habit(s) pending today`,
      href: '/habits'
    });
  }

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
      label: financeLabel,
      href: '/finances'
    });
  }

  let milestoneData = null;
  if (nextMilestone) {
    const msDate = new Date(nextMilestone.dueDate);
    const diff = Math.ceil((msDate.getTime() - today.getTime()) / 86400000);
    milestoneData = {
      title: nextMilestone.title,
      daysDesc: diff === 0 ? 'Due Today' : `In ${diff} day(s)`,
      bucket: nextMilestone.bucketId || 'Goal'
    };
  }

  return {
    score: pulseScore,
    scoreLabel: pulseScore >= 90 ? 'Stable' : pulseScore >= 75 ? 'Optimal' : pulseScore >= 50 ? 'Warning' : 'Critical',
    actions,
    milestone: milestoneData,
    stats: { healthReadiness, goalHealth, habitConsistency: habitSuccessRate }
  };
}
