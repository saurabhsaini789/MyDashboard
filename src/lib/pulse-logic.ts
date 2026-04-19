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
  const { medicine, travelKit, aidHome, aidMobile, supplements, projects, habits } = data;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

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
  let overdueCount = 0;
  let dueTodayCount = 0;
  let nextMilestone: any = null;

  activeProjects.forEach(p => {
    if (p.dueDate) {
      if (p.dueDate < todayStr) overdueCount++;
      else if (p.dueDate === todayStr) dueTodayCount++;
      if (p.dueDate >= todayStr && (!nextMilestone || p.dueDate < nextMilestone.dueDate)) nextMilestone = p;
    }
  });

  const goalHealth = activeProjects.length > 0 ? ((activeProjects.length - overdueCount) / activeProjects.length) * 100 : 100;

  // 3. Habits Calculations
  const mKey = `${today.getFullYear()}-${today.getMonth()}`;
  const dayIdx = today.getDate() - 1;
  let pendingHabitsCount = (habits || []).filter(h => (!h.monthScope || h.monthScope.includes(mKey)) && (h.records?.[mKey]?.[dayIdx] === 'none' || h.records?.[mKey]?.[dayIdx] === undefined)).length;

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

  const pulseScore = Math.round((healthReadiness * 0.4) + (goalHealth * 0.35) + (habitSuccessRate * 0.25));
  const actions: PulseAction[] = [];
  const criticalHealth = healthIssues.filter(i => i.type === 'EXPIRED');
  if (criticalHealth.length > 0) actions.push({ id: 'health-expired', tier: 'CRITICAL', type: 'HEALTH', label: `Replace ${criticalHealth[0].name}`, href: '/health-system?filter=EXPIRED' });
  if (overdueCount > 0) actions.push({ id: 'goals-overdue', tier: 'CRITICAL', type: 'GOALS', label: `${overdueCount} task(s) overdue`, href: '/goals' });
  if (dueTodayCount > 0) actions.push({ id: 'goals-today', tier: 'DAILY', type: 'GOALS', label: `${dueTodayCount} task(s) due today`, href: '/goals' });
  if (pendingHabitsCount > 0) actions.push({ id: 'habits-today', tier: 'DAILY', type: 'HABITS', label: `${pendingHabitsCount} habit(s) pending`, href: '/habits' });

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
