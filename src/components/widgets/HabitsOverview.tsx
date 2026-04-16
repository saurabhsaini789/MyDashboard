"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getPrefixedKey } from "@/lib/keys";
import { Text, SectionTitle } from "@/components/ui/Text";
import { Flame, Trophy, AlertTriangle } from 'lucide-react';

export type TimeFilter = '1 Day' | '7 Days' | '1 Month' | '6 Months' | '1 Year' | 'Custom Month';

interface HabitsOverviewProps {
  filter: TimeFilter;
  selectedMonth: number;
  selectedYear: number;
}

interface HabitInsight {
 name: string;
 value: number | string;
 percentage?: number;
}

export function HabitsOverview({ filter, selectedMonth, selectedYear }: HabitsOverviewProps) {
  const [completed, setCompleted] = useState(0);
  const [missed, setMissed] = useState(0);
 const [bestStreak, setBestStreak] = useState<HabitInsight | null>(null);
 const [topHabits, setTopHabits] = useState<HabitInsight[]>([]);
 const [bottomHabits, setBottomHabits] = useState<HabitInsight[]>([]);
 const [isLoaded, setIsLoaded] = useState(false);

 useEffect(() => {
 const loadData = () => {
 const saved = localStorage.getItem(getPrefixedKey('os_habits'));
 if (saved) {
 try {
 const parsed = JSON.parse(saved);
 let cCount = 0;
 let mCount = 0;
 
 const now = new Date();
 const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

 if (Array.isArray(parsed)) {
 const habitStats: { name: string; done: number; total: number; streak: number; recentMisses: number }[] = [];
 
 parsed.forEach((h: any) => {
 let hDone = 0;
 let hMissed = 0;
 let hRecentMisses = 0;
 
 // 0. Check if habit is active for the current filter/selected month
 const isHabitActive = (mKey: string) => {
 if (!h.monthScope || h.monthScope.length === 0) return true;
 return h.monthScope.includes(mKey);
 };

 // 1. Calculate stats for the selected filter
 if (h.records) {
 if (filter === 'Custom Month') {
 const key = `${selectedYear}-${selectedMonth}`;
 if (isHabitActive(key)) {
 const days = h.records[key];
 if (Array.isArray(days)) {
 days.forEach(status => {
 if (status === 'done') {
 cCount++;
 hDone++;
 }
 if (status === 'missed') {
 mCount++;
 hMissed++;
 }
 });
 }
 }
 } else {
 let daysToLookBack = 30;
 if (filter === '1 Day') daysToLookBack = 1;
 if (filter === '7 Days') daysToLookBack = 7;
 if (filter === '1 Month') daysToLookBack = 30;
 if (filter === '6 Months') daysToLookBack = 180;
 if (filter === '1 Year') daysToLookBack = 365;

 Object.keys(h.records).forEach((monthKey) => {
 if (!isHabitActive(monthKey)) return;

 const [year, month] = monthKey.split('-').map(Number);
 const days = h.records[monthKey];
 if (Array.isArray(days)) {
 days.forEach((dayStatus, dayIndex) => {
 const dateOfRecord = new Date(year, month, dayIndex + 1);
 const diffTime = today.getTime() - dateOfRecord.getTime();
 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
 
 if (diffDays >= 0 && diffDays < daysToLookBack) {
 if (dayStatus === 'done') {
 cCount++;
 hDone++;
 }
 if (dayStatus === 'missed') {
 mCount++;
 hMissed++;
 }
 }
 
 // Track missed in last 7 days regardless of filter for Bottom 3 logic
 if (diffDays >= 0 && diffDays < 7 && dayStatus === 'missed') {
 hRecentMisses++;
 }
 });
 }
 });
 }
 }

 // Only add to stats if it has some records OR is active in the current custom month
 if (hDone > 0 || hMissed > 0 || hRecentMisses > 0 || (filter === 'Custom Month' && isHabitActive(`${selectedYear}-${selectedMonth}`))) {
 habitStats.push({
 name: h.name,
 done: hDone,
 total: hDone + hMissed,
 streak: 0, // Will calculate below
 recentMisses: hRecentMisses
 });
 }
 });

 // 2. Calculate Current Streak (Longest active streak)
 habitStats.forEach(stat => {
 const h = parsed.find((p: any) => p.name === stat.name);
 if (!h) return;

 let currentStreak = 0;
 let streakBroken = false;
 let streakDate = new Date(today);
 
 const todayKey = `${today.getFullYear()}-${today.getMonth()}`;
 const todayIndex = today.getDate() - 1;
 const todayStatus = h.records?.[todayKey]?.[todayIndex];
 
 if (todayStatus !== 'done' && todayStatus !== 'missed') {
 streakDate.setDate(streakDate.getDate() - 1);
 }

 while (!streakBroken) {
 const sKey = `${streakDate.getFullYear()}-${streakDate.getMonth()}`;
 const sIndex = streakDate.getDate() - 1;
 
 // Check if habit was active then
 const wasActive = !h.monthScope || h.monthScope.length === 0 || h.monthScope.includes(sKey);
 
 if (!wasActive) {
 streakBroken = true;
 break;
 }

 const sStatus = h.records?.[sKey]?.[sIndex];
 if (sStatus === 'done') {
 currentStreak++;
 streakDate.setDate(streakDate.getDate() - 1);
 } else if (sStatus === 'missed') {
 streakBroken = true;
 } else {
 streakBroken = true;
 }
 if (currentStreak > 1000) break;
 }
 stat.streak = currentStreak;
 });

 // Derive Top/Bottom Insights
 const sortedByRate = [...habitStats]
 .filter(s => s.total > 0)
 .sort((a, b) => (b.done / b.total) - (a.done / a.total));

 setTopHabits(sortedByRate.slice(0, 3).map(s => ({
 name: s.name,
 value: `${Math.round((s.done / s.total) * 100)}%`,
 percentage: (s.done / s.total) * 100
 })));

 // Bottom 3: lowest rate OR most missed in last 7 days
 // Primary sort: Lowest rate, Secondary sort: most missed in last 7 days
 const sortedByNeedsAttention = [...habitStats]
 .filter(s => s.total > 0 || s.recentMisses > 0)
 .sort((a, b) => {
 const rateA = a.total > 0 ? a.done / a.total : 0;
 const rateB = b.total > 0 ? b.done / b.total : 0;
 if (rateA !== rateB) return rateA - rateB;
 return b.recentMisses - a.recentMisses;
 });

 setBottomHabits(sortedByNeedsAttention.slice(0, 3).map(s => ({
 name: s.name,
 value: s.total > 0 ? `${Math.round((s.done / s.total) * 100)}%` : 'Missed',
 percentage: s.total > 0 ? (s.done / s.total) * 100 : 0
 })));

 const streakWinner = [...habitStats].sort((a, b) => b.streak - a.streak)[0];
 if (streakWinner && streakWinner.streak > 0) {
 setBestStreak({
 name: streakWinner.name,
 value: streakWinner.streak
 });
 } else {
 setBestStreak(null);
 }
 }
 setCompleted(cCount);
 setMissed(mCount);
 } catch (e) { console.error("Habit Stats Error:", e); }
 }
 };

 loadData();
 setIsLoaded(true);

 const handleStorage = (e: StorageEvent) => {
 if (e.key === getPrefixedKey('os_habits')) loadData();
 };
 
 const handleLocal = (e: any) => {
 if (e.detail && e.detail.key === 'os_habits') loadData();
 };

 window.addEventListener('storage', handleStorage);
 window.addEventListener('local-storage-change', handleLocal);
 
 return () => {
 window.removeEventListener('storage', handleStorage);
 window.removeEventListener('local-storage-change', handleLocal);
 };
 }, [filter, selectedMonth, selectedYear]);

 if (!isLoaded) return <div className="animate-pulse h-40 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800/50"></div>;

  const total = completed + missed;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

 return (
 <div className="flex-1 flex flex-col gap-8">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
    <div className="bg-white dark:bg-zinc-900/60 border border-emerald-100 dark:border-emerald-900/50 border-l-4 rounded-xl p-4 flex flex-col justify-center items-center text-center transition-all shadow-sm hover:shadow-md sm:hover:-translate-y-0.5">
      <Text variant="display" as="span" className="text-emerald-600 dark:text-emerald-400 mb-1">{completed}</Text>
      <Text variant="label" className="text-emerald-700/60 dark:text-emerald-500/70">Completed</Text>
    </div>

    <div className="bg-white dark:bg-zinc-900/60 border border-teal-100 dark:border-teal-900/50 border-l-4 rounded-xl p-4 flex flex-col justify-center items-center text-center transition-all shadow-sm hover:shadow-md sm:hover:-translate-y-0.5">
      <Text variant="display" as="span" className="text-4xl mb-1 text-teal-600 dark:text-teal-400">{successRate}%</Text>
      <Text variant="label" className="text-teal-700/60 dark:text-teal-500/70">Success Rate</Text>
    </div>

    <div className="bg-white dark:bg-zinc-900/60 border border-rose-100 dark:border-rose-900/50 border-l-4 rounded-xl p-4 flex flex-col justify-center items-center text-center transition-all shadow-sm hover:shadow-md sm:hover:-translate-y-0.5">
      <Text variant="display" as="span" className="text-rose-600 dark:text-rose-400 mb-1">{missed}</Text>
      <Text variant="label" className="text-rose-700/60 dark:text-rose-500/70">Missed</Text>
    </div>
  </div>


 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Best Streak */}
  <div className="bg-white dark:bg-zinc-900/60 border border-orange-100 dark:border-orange-900/50 border-l-4 rounded-xl p-5 flex flex-col gap-4 transition-all shadow-sm hover:shadow-md sm:hover:-translate-y-0.5">
    <div className="flex items-center gap-2 mb-1">
      <Flame className="w-5 h-5 text-orange-500" />
      <Text variant="label" as="h3" className="text-orange-800 dark:text-orange-400">Best streak</Text>
    </div>
    {bestStreak ? (
      <div className="flex flex-col">
        <Text variant="metric" as="span" className="text-orange-600 dark:text-orange-400">{bestStreak.value} Days</Text>
        <Text variant="bodySmall" muted as="span" className="truncate">{bestStreak.name}</Text>
      </div>
    ) : (
      <Text variant="bodySmall" muted as="span" className="italic">No active streaks</Text>
    )}
  </div>


  {/* Top 3 Habits */}
  <div className="bg-white dark:bg-zinc-900/60 border border-blue-100 dark:border-blue-900/50 border-l-4 rounded-xl p-5 flex flex-col gap-4 transition-all shadow-sm hover:shadow-md sm:hover:-translate-y-0.5">
    <div className="flex items-center gap-2 mb-1">
      <Trophy className="w-5 h-5 text-blue-500" />
      <Text variant="label" as="h3" className="text-blue-800 dark:text-blue-400">Top consistent</Text>
    </div>
    <div className="flex flex-col gap-3">
      {topHabits.length > 0 ? topHabits.map((h, i) => (
        <div key={i} className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
          <Text variant="body" as="span" className="font-semibold text-blue-900 dark:text-blue-200 truncate pr-2">{h.name}</Text>
          <Text variant="body" as="span" className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{h.value}</Text>
        </div>
      )) : (
        <Text variant="bodySmall" muted as="span" className="italic">No data yet</Text>
      )}
    </div>
  </div>


  {/* Needs Attention */}
  <div className="bg-white dark:bg-zinc-900/60 border border-red-100 dark:border-red-900/50 border-l-4 rounded-xl p-5 flex flex-col gap-4 transition-all shadow-sm hover:shadow-md sm:hover:-translate-y-0.5">
    <div className="flex items-center gap-2 mb-1">
      <AlertTriangle className="w-5 h-5 text-red-500" />
      <Text variant="label" as="h3" className="text-red-800 dark:text-red-400">Needs attention</Text>
    </div>
    <div className="flex flex-col gap-3">
      {bottomHabits.length > 0 ? bottomHabits.map((h, i) => (
        <div key={i} className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
          <Text variant="body" as="span" className="font-semibold text-red-900 dark:text-red-200 truncate pr-2">{h.name}</Text>
          <Text variant="body" as="span" className="font-semibold text-red-600 dark:text-red-400 tabular-nums">{h.value}</Text>
        </div>
      )) : (
        <Text variant="bodySmall" muted as="span" className="italic">Doing great!</Text>
      )}
    </div>
  </div>

 </div>
 </div>
  );
}
