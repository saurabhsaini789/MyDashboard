import { InventoryStatus } from '@/types/health-system';

export type PriorityTier = 'CRITICAL' | 'DAILY' | 'MAINTENANCE';

export interface PulseAction {
  id: string;
  label: string;
  href: string;
  tier: PriorityTier;
  type: string;
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
}

export interface SystemPulseData {
  score: number;
  scoreLabel: string;
  actions: PulseAction[];
  activeMilestone: {
    title: string;
    bucket: string;
    progress: number;
  } | null;
  upcomingMilestones: {
    id: string;
    title: string;
    daysDesc: string;
    bucket: string;
    diff: number;
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
  const { medicine, travelKit, aidHome, aidMobile, supplements, projects, habits, channels, income, expenses, journals, pantryPlan } = data;
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
  const nextMilestones: any[] = [];

  activeProjects.forEach(p => {
    if (p.dueDate) {
      if (p.dueDate < todayStr) overdueProjects.push(p);
      else if (p.dueDate === todayStr) dueTodayProjects.push(p);
      if (p.dueDate >= todayStr) nextMilestones.push(p);
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
  const contentReadiness = totalContentSchedules > 0 ? ((totalContentSchedules - overdueContentCount) / totalContentSchedules) * 100 : 100;

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

  // --- Pulse Score ---
  // Weights: Habits 30%, Goals 25%, Content 15%, Health 15%, Admin 15%
  const pulseScore = Math.round((habitSuccessRate * 0.30) + (goalHealth * 0.25) + (contentReadiness * 0.15) + (healthReadiness * 0.15) + (adminHygiene * 0.15));

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
      href: '/content-system',
      platform: item.platform,
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

  // Pantry Low Stock / Expired — CRITICAL / DAILY (max 3)
  lowStockItems.sort((a, b) => a.daysRemaining - b.daysRemaining);
  lowStockItems.slice(0, 3).forEach((item, idx) => {
    actions.push({
      id: `pantry-low-${idx}`,
      tier: item.status === 'Out' ? 'CRITICAL' : 'DAILY',
      type: 'GROCERY',
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
      label: financeLabel,
      href: '/finances'
    });
  }

  // Sort upcoming milestones by due date
  nextMilestones.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const pipeline = nextMilestones.slice(0, 3);

  // Active execution: find the top in-progress project
  const inProgress = activeProjects.filter((p: any) => p.status === 'in-progress');
  inProgress.sort((a, b) => {
    if (a.isImportant && !b.isImportant) return -1;
    if (!a.isImportant && b.isImportant) return 1;
    const dA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const dB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return dA - dB;
  });
  const activeMilestoneProj = inProgress.length > 0 ? inProgress[0] : null;

  let activeMilestoneData = null;
  if (activeMilestoneProj) {
    const totalTasks = activeMilestoneProj.tasks?.length || 0;
    const completedTasks = activeMilestoneProj.tasks?.filter((t: any) => t.isCompleted).length || 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    activeMilestoneData = {
      title: activeMilestoneProj.title,
      bucket: activeMilestoneProj.bucketId || 'Goal',
      progress
    };
  }

  const upcomingMilestonesData = pipeline.map(p => {
    const msDate = new Date(p.dueDate + 'T00:00:00');
    const diff = Math.ceil((msDate.getTime() - today.getTime()) / 86400000);
    return {
      id: p.id,
      title: p.title,
      daysDesc: diff === 0 ? 'Due Today' : `In ${diff} day${diff > 1 ? 's' : ''}`,
      bucket: p.bucketId || 'Goal',
      diff
    };
  });

  return {
    score: pulseScore,
    scoreLabel: pulseScore >= 90 ? 'Stable' : pulseScore >= 75 ? 'Optimal' : pulseScore >= 50 ? 'Warning' : 'Critical',
    actions,
    activeMilestone: activeMilestoneData,
    upcomingMilestones: upcomingMilestonesData,
    stats: { healthReadiness, goalHealth, habitConsistency: habitSuccessRate }
  };
}
