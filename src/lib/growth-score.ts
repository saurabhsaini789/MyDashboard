import { SYNC_KEYS } from "./sync-keys";
import { validateLocalData } from "./security";

export interface CategoryScore {
  name: string;
  score: number; // 0-100
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
}

export type ScoreRange = '7D' | '1M' | '6M' | '1Y' | 'Custom';

export interface ScoreFilter {
  range: ScoreRange;
  month?: number;
  year?: number;
}

const HEALTH_KEYS = [
  'HEALTH_MEDICINE',
  'HEALTH_TRAVEL_KIT',
  'HEALTH_FIRST_AID_HOME',
  'HEALTH_FIRST_AID_MOBILE',
  'HEALTH_SUPPLEMENTS'
] as const;

/**
 * Normalizes a value to 0-100 range
 */
const normalize = (val: number, min: number, max: number): number => {
  return Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
};

/**
 * Checks if a date string falls within the filter range
 */
const isDateInRange = (dateStr: string, filter: ScoreFilter): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  
  if (filter.range === 'Custom') {
    return d.getMonth() === filter.month && d.getFullYear() === filter.year;
  }

  const diffTime = now.getTime() - d.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (filter.range === '7D') return diffDays <= 7;
  if (filter.range === '1M') return diffDays <= 30;
  if (filter.range === '6M') return diffDays <= 180;
  if (filter.range === '1Y') return diffDays <= 365;
  
  return true;
};

export function calculateCategoryScores(
  data: GrowthDataDependencies,
  filter: ScoreFilter = { range: '7D' }
): CategoryScore[] {
  const now = new Date();

  // 1. Habits Score
  let habitsScore = 0;
  const habits = data.habits;
  if (Array.isArray(habits) && habits.length > 0) {
    let totalPossible = 0;
    let totalDone = 0;
    
    const daysToLookBack = filter.range === '7D' ? 7 : filter.range === '1M' ? 30 : filter.range === '6M' ? 180 : filter.range === '1Y' ? 365 : 31;

    if (filter.range === 'Custom') {
        const year = filter.year || now.getFullYear();
        const month = filter.month || now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthKey = `${year}-${month}`;

        habits.forEach((h: any) => {
            const isActive = !h.monthScope || h.monthScope.length === 0 || h.monthScope.includes(monthKey);
            if (!isActive) return;
            
            for (let day = 0; day < daysInMonth; day++) {
                const status = h.records?.[monthKey]?.[day];
                if (status) {
                    totalPossible++;
                    if (status === 'done') totalDone++;
                    else if (status === 'skip') totalPossible--;
                }
            }
        });
    } else {
        for (let i = 0; i < daysToLookBack; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
            const dayIndex = d.getDate() - 1;
  
            habits.forEach((h: any) => {
              const isActive = !h.monthScope || h.monthScope.length === 0 || h.monthScope.includes(monthKey);
              if (!isActive) return;
  
              const status = h.records?.[monthKey]?.[dayIndex];
              if (status) {
                totalPossible++;
                if (status === 'done') totalDone++;
                else if (status === 'skip') totalPossible--;
              }
            });
        }
    }
    habitsScore = totalPossible > 0 ? (totalDone / totalPossible) * 100 : 0;
  }

  // 2. Projects Score (Tasks vs Projects)
  let projectsScore = 0;
  const projects = data.projects;
  if (Array.isArray(projects) && projects.length > 0) {
    let projHistorical = 0, projCompleted = 0;
    let taskHistorical = 0, taskCompleted = 0;

    projects.forEach((p: any) => {
      if ((p.isCompleted || p.status === 'completed') && p.completedAt && isDateInRange(p.completedAt, filter)) {
         projCompleted++;
         projHistorical++;
      } else if (!p.isCompleted && p.status !== 'completed' && p.createdAt && isDateInRange(p.createdAt, filter)) {
         projHistorical++;
      }

      if (p.tasks && Array.isArray(p.tasks)) {
        p.tasks.forEach((t: any) => {
          if (t.isCompleted && t.completedAt && isDateInRange(t.completedAt, filter)) {
            taskCompleted++;
            taskHistorical++;
          } else if (!t.isCompleted && t.createdAt && isDateInRange(t.createdAt, filter)) {
            taskHistorical++;
          }
        });
      }
    });

    const projRate = projHistorical > 0 ? (projCompleted / projHistorical) : 0;
    const taskRate = taskHistorical > 0 ? (taskCompleted / taskHistorical) : 0;
    
    if (projHistorical === 0 && taskHistorical > 0) projectsScore = taskRate * 100;
    else if (taskHistorical === 0 && projHistorical > 0) projectsScore = projRate * 100;
    else if (projHistorical > 0 && taskHistorical > 0) projectsScore = ((taskRate * 0.3) + (projRate * 0.7)) * 100;
    else projectsScore = 0;
  }

  // 3. Finance & Expenses
  let financeScore = 0;
  let expensesScore = 0;
  const incomeData = data.income || [];
  const expenseData = data.expenses || [];
  
  const totalIncome = (incomeData || []).filter((r: any) => isDateInRange(r.date, filter)).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
  const totalExpenses = (expenseData || []).filter((r: any) => isDateInRange(r.date, filter)).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

  if (totalIncome > 0) {
    const savingsRate = (totalIncome - totalExpenses) / totalIncome;
    financeScore = normalize(savingsRate, 0, 0.4); // 40% savings = 100 score
  }

  if (totalExpenses > 0) {
      const filteredExpenses = expenseData.filter((r: any) => isDateInRange(r.date, filter));
      const needs = filteredExpenses.reduce((sum: number, r: any) => {
        if (r.items && Array.isArray(r.items) && r.items.length > 0) {
           const itemNeeds = r.items.reduce((itemSum: number, item: any) => {
              return itemSum + (item.type === 'need' || item.type === 'investment' ? (item.totalPrice || 0) : 0);
           }, 0);
           return sum + itemNeeds;
        }
        return sum + (r.type === 'need' || r.type === 'investment' ? (r.amount || 0) : 0);
      }, 0);
      expensesScore = (needs / totalExpenses) * 100;
  }

  // 4. Health Readiness
  let inventoryScore = 0;
  let medTotal = 0;
  let medIssues = 0;

  HEALTH_KEYS.forEach(keyName => {
    const key = SYNC_KEYS[keyName as keyof typeof SYNC_KEYS];
    const items = data.inventory[key] || [];
    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        medTotal++;
        const expiry = new Date(item.expiryDate);
        if (expiry < now || item.quantity === 0) medIssues++;
      });
    }
  });

  if (medTotal > 0) {
      inventoryScore = ((medTotal - medIssues) / medTotal) * 100;
  }

  // 5. Content Consistency
  let contentScore = 0;
  const activeChannels = (data.channels || []).filter((c: any) => c.status === 'Active');
  let totalSchedules = 0;
  let overdueSchedules = 0;
  activeChannels.forEach((c: any) => {
      (c.schedules || []).forEach((s: any) => {
          totalSchedules++;
          if (s.nextPostDueDate && new Date(s.nextPostDueDate) < now) {
              overdueSchedules++;
          }
      });
  });
  contentScore = totalSchedules > 0 ? ((totalSchedules - overdueSchedules) / totalSchedules) * 100 : 0;

  // 6. Mindfulness (Journaling)
  let mindfulnessScore = 0;
  const journals = data.journals || [];
  let daysInFrame = filter.range === '7D' ? 7 : filter.range === '1M' ? 30 : filter.range === '6M' ? 180 : filter.range === '1Y' ? 365 : 30; // Custom defaults to 30
  
  let journalDays = 0;
  journals.forEach(d => {
      if (isDateInRange(d, filter)) journalDays++;
  });
  mindfulnessScore = Math.min(100, (journalDays / daysInFrame) * 100);

  return [
    { name: 'Habits', score: Math.round(habitsScore), color: '#10b981', fullPath: '/habits' },
    { name: 'Projects', score: Math.round(projectsScore), color: '#3b82f6', fullPath: '/goals' },
    { name: 'Finance', score: Math.round(financeScore), color: '#6366f1', fullPath: '/finances' },
    { name: 'Expenses', score: Math.round(expensesScore), color: '#f59e0b', fullPath: '/finances' },
    { name: 'Health', score: Math.round(inventoryScore), color: '#ec4899', fullPath: '/health-system' },
    { name: 'Content', score: Math.round(contentScore), color: '#8b5cf6', fullPath: '/content-system' },
    { name: 'Mindfulness', score: Math.round(mindfulnessScore), color: '#06b6d4', fullPath: '/' },
  ];
}

export function getOverallGrowthScore(categories: CategoryScore[]): number {
  if (categories.length === 0) return 0;
  const sum = categories.reduce((acc, c) => acc + c.score, 0);
  return Math.round(sum / categories.length);
}

export function getGrowthTrendData(data: GrowthDataDependencies, filter: ScoreFilter) {
  const trend = [];
  const count = filter.range === '7D' ? 7 : (filter.range === '1M' || filter.range === 'Custom' ? 4 : (filter.range === '6M' ? 6 : 12));

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    if (filter.range === '7D') d.setDate(d.getDate() - i);
    else if (filter.range === '1M' || filter.range === 'Custom') d.setDate(d.getDate() - (i * 7));
    else d.setMonth(d.getMonth() - i);

    const name = filter.range === '7D' ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()] : (filter.range === '6M' || filter.range === '1Y' ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] : `W${count-i}`);
    
    const pointFilter: ScoreFilter = { range: 'Custom', month: d.getMonth(), year: d.getFullYear() };
    const scores = calculateCategoryScores(data, pointFilter);
    const score = getOverallGrowthScore(scores);

    trend.push({ name, score });
  }
  return trend;
}
