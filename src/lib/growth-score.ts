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
  wardrobe: any[];
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

  // 2. Projects Score
  let projectsScore = 0;
  const projects = data.projects;
  if (Array.isArray(projects) && projects.length > 0) {
    let totalHistorical = 0;
    let completedHistorical = 0;

    projects.forEach((p: any) => {
      if ((p.isCompleted || p.status === 'completed') && p.completedAt && isDateInRange(p.completedAt, filter)) {
         completedHistorical++;
         totalHistorical++;
      } else if (!p.isCompleted && p.status !== 'completed' && p.createdAt && isDateInRange(p.createdAt, filter)) {
         totalHistorical++;
      }

      if (p.tasks && Array.isArray(p.tasks)) {
        p.tasks.forEach((t: any) => {
          if (t.isCompleted && t.completedAt && isDateInRange(t.completedAt, filter)) {
            completedHistorical++;
            totalHistorical++;
          } else if (!t.isCompleted && t.createdAt && isDateInRange(t.createdAt, filter)) {
            totalHistorical++;
          }
        });
      }
    });
    projectsScore = totalHistorical > 0 ? (completedHistorical / totalHistorical) * 100 : 0;
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
    financeScore = normalize(savingsRate, 0, 0.2);
  }

  if (totalExpenses > 0) {
      const filteredExpenses = expenseData.filter((r: any) => isDateInRange(r.date, filter));
      const needs = filteredExpenses.filter((r: any) => r.type === 'need' || r.type === 'investment').reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      expensesScore = (needs / totalExpenses) * 100;
  }

  // 4. Inventory
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

  let wardrobeScore = 0;
  const wardrobeItems = data.wardrobe || [];
  if (Array.isArray(wardrobeItems) && wardrobeItems.length > 0) {
    const activeCount = wardrobeItems.filter((i: any) => i.status === 'Active').length;
    wardrobeScore = (activeCount / wardrobeItems.length) * 100;
  }
  
  if (medTotal === 0 && wardrobeScore === 0) {
      inventoryScore = 0;
  } else if (medTotal === 0) {
      inventoryScore = wardrobeScore;
  } else {
      const medScore = ((medTotal - medIssues) / medTotal) * 100;
      inventoryScore = (medScore + wardrobeScore) / 2;
  }

  return [
    { name: 'Habits', score: Math.round(habitsScore), color: '#10b981', fullPath: '/habits' },
    { name: 'Projects', score: Math.round(projectsScore), color: '#3b82f6', fullPath: '/goals' },
    { name: 'Finance', score: Math.round(financeScore), color: '#6366f1', fullPath: '/finances' },
    { name: 'Expenses', score: Math.round(expensesScore), color: '#f59e0b', fullPath: '/finances' },
    { name: 'Inventory', score: Math.round(inventoryScore), color: '#ec4899', fullPath: '/health-system' },
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
