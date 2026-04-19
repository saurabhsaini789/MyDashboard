"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Habits } from '@/components/widgets/Habits';
import { HabitsOverview, type TimeFilter } from '@/components/widgets/HabitsOverview';
import { PageTitle, SectionTitle, Text, Description } from '@/components/ui/Text';
import { HabitDetailPanel } from '@/components/widgets/HabitDetailPanel';
import { TrendingUp, TrendingDown, Star, Target, Zap } from 'lucide-react';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

export default function HabitsPage() {
  const [filter, setFilter] = useState<TimeFilter>('Custom Month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedHabit, setSelectedHabit] = useState<any>(null);

  const habits = useStorageSubscription<any[]>(SYNC_KEYS.HABITS, []);

  const summaryStats = useMemo(() => {
    if (!habits || !Array.isArray(habits) || habits.length === 0) {
      return { successRate: 0, trend: null, perfectDays: null, totalLogged: 0 };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let done = 0, missed = 0, pDays = 0;

    if (filter === 'Custom Month') {
      const mKey = `${selectedYear}-${selectedMonth}`;
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const activeHabits = habits.filter(h => !h.monthScope || h.monthScope.includes(mKey));
      
      for (let d = 1; d <= daysInMonth; d++) {
        const dateOfRecord = new Date(selectedYear, selectedMonth, d);
        if (dateOfRecord > today) continue;
        
        let dDone = 0;
        activeHabits.forEach(h => {
          const s = h.records?.[mKey]?.[d - 1];
          if (s === 'done') { done++; dDone++; }
          else if (s === 'missed') { missed++; }
        });

        if (activeHabits.length > 0 && dDone === activeHabits.length) pDays++;
      }

      // Trend
      const lastMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
      const lastMKey = `${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth()}`;
      const lastDaysInMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0).getDate();
      let lDone = 0, lMissed = 0;
      habits.forEach(h => {
        if (!h.monthScope || h.monthScope.includes(lastMKey)) {
          for (let d = 0; d < lastDaysInMonth; d++) {
            const s = h.records?.[lastMKey]?.[d];
            if (s === 'done') lDone++;
            else if (s === 'missed') lMissed++;
          }
        }
      });
      const lRate = (lDone + lMissed) > 0 ? (lDone / (lDone + lMissed)) * 100 : null;
      const curTotal = done + missed;
      const curRate = curTotal > 0 ? (done / curTotal) * 100 : 0;
      
      return {
        successRate: Math.round(curRate),
        trend: lRate !== null ? Math.round(curRate - lRate) : null,
        perfectDays: pDays,
        totalLogged: curTotal
      };
    } else {
      let daysToLookBack = 30;
      if (filter === '1 Day') daysToLookBack = 1;
      else if (filter === '7 Days') daysToLookBack = 7;
      else if (filter === '1 Month') daysToLookBack = 30;
      else if (filter === '6 Months') daysToLookBack = 180;
      else if (filter === '1 Year') daysToLookBack = 365;

      for (let i = 0; i < daysToLookBack; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const mKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}`;
        const dIdx = checkDate.getDate() - 1;

        habits.forEach(h => {
          if (!h.monthScope || h.monthScope.includes(mKey)) {
            const s = h.records?.[mKey]?.[dIdx];
            if (s === 'done') done++;
            else if (s === 'missed') missed++;
          }
        });
      }

      const curTotal = done + missed;
      return {
        successRate: curTotal > 0 ? Math.round((done / curTotal) * 100) : 0,
        trend: null,
        perfectDays: null,
        totalLogged: curTotal
      };
    }
  }, [habits, filter, selectedMonth, selectedYear]);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 md:p-8 xl:p-12 transition-colors duration-200">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col items-start">
            <PageTitle>Habits Tracker</PageTitle>
            <Description>Track your daily progress</Description>
          </div>
        </header>

        <section className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-stretch">
              <div className="flex-1 min-w-[200px] p-6 flex flex-col justify-center border-r border-zinc-100 dark:border-zinc-800/50 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity"><Target size={120} /></div>
                <div className="flex items-center gap-2 mb-1"><Target size={14} className="text-teal-500" /><Text variant="label" className="text-zinc-500">Current Success</Text></div>
                <div className="flex items-baseline gap-3">
                  <Text variant="display" className="text-4xl text-teal-600 dark:text-teal-400 font-bold">{summaryStats.successRate}%</Text>
                  {summaryStats.trend !== null && (
                    <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${summaryStats.trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {summaryStats.trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(summaryStats.trend)}%
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-[1.5] flex flex-wrap">
                <div className="flex-1 min-w-[150px] p-6 flex flex-col justify-center border-r border-zinc-100 dark:border-zinc-800/50">
                  <div className="flex items-center gap-2 mb-1"><Star size={14} className="text-amber-500" /><Text variant="label" className="text-zinc-500">Consistency</Text></div>
                  <Text variant="title" className="text-zinc-900 dark:text-zinc-100 font-bold">{summaryStats.perfectDays !== null ? `${summaryStats.perfectDays} Perfect Days` : 'Steady Effort'}</Text>
                </div>
                <div className="flex-1 min-w-[150px] p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1"><Zap size={14} className="text-rose-500" /><Text variant="label" className="text-zinc-500">Observation</Text></div>
                  <Text variant="body" className="font-bold">{summaryStats.successRate >= 80 ? 'Legendary 🔥' : summaryStats.successRate >= 50 ? 'Gaining Momentum 📈' : 'Keep Pushing 🎯'}</Text>
                </div>
              </div>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800/60">
              <div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: `${summaryStats.successRate}%` }} />
            </div>
          </div>
        </section>
        
        <section className="w-full relative fade-in mb-14">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <SectionTitle className="mb-0">Habits Overview</SectionTitle>
            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
              {filter === 'Custom Month' && (
                <div className="flex gap-2 flex-1 sm:flex-none">
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="appearance-none bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold rounded-xl px-3 py-2 border border-zinc-200">
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m.slice(0,3)}</option>)}
                  </select>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="appearance-none bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold rounded-xl px-3 py-2 border border-zinc-200">
                    {[2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
              <select value={filter} onChange={(e) => setFilter(e.target.value as TimeFilter)} className="appearance-none bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold rounded-xl px-3 py-2 border border-zinc-200">
                <option value="1 Day">1 Day</option>
                <option value="7 Days">7 Days</option>
                <option value="1 Month">1 Month</option>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
                <option value="Custom Month">Current Month</option>
              </select>
            </div>
          </div>
          <HabitsOverview filter={filter} selectedMonth={selectedMonth} selectedYear={selectedYear} />
        </section>

        <section className="w-full relative fade-in">
          <Habits onHabitSelect={setSelectedHabit} />
        </section>

        <HabitDetailPanel habit={selectedHabit} onClose={() => setSelectedHabit(null)} />
      </div>
    </main>
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
