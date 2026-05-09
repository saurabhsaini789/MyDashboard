"use client";

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, Target, CreditCard, ShoppingBag, Package, Calendar } from 'lucide-react';
import { calculateCategoryScores, getOverallGrowthScore, getGrowthTrendData, CategoryScore, ScoreRange, ScoreFilter } from '@/lib/growth-score';
import { SectionTitle, Text, Description } from '../ui/Text';
import { MultiSelectDropdown } from '../ui/MultiSelectDropdown';
import { MONTHS, YEARS } from '@/lib/constants';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';
import { SYNC_KEYS } from '@/lib/sync-keys';

const GrowthTrendChart = dynamic(() => import('./charts/GrowthTrendChart'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-50 dark:bg-zinc-800/50 animate-pulse rounded-xl" />
});

const GrowthRadarChart = dynamic(() => import('./charts/GrowthRadarChart'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 animate-pulse rounded-xl" />
});

export function GrowthOverview() {
  const [filter, setFilter] = useState<ScoreFilter>({ 
    range: 'Custom',
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  // Authoritative Subscriptions
  const habits = useStorageSubscription(SYNC_KEYS.HABITS, []);
  const projects = useStorageSubscription(SYNC_KEYS.GOALS_PROJECTS, []);
  const income = useStorageSubscription(SYNC_KEYS.FINANCES_INCOME, []);
  const expenses = useStorageSubscription(SYNC_KEYS.FINANCES_EXPENSES, []);
  const channels = useStorageSubscription(SYNC_KEYS.FINANCES_BUSINESS, []);
  const journals = useStorageSubscription(SYNC_KEYS.JOURNAL_LOGS, []);
  // Inventory Subscriptions
  const med = useStorageSubscription(SYNC_KEYS.HEALTH_MEDICINE, []);
  const travel = useStorageSubscription(SYNC_KEYS.HEALTH_TRAVEL_KIT, []);
  const aidHome = useStorageSubscription(SYNC_KEYS.HEALTH_FIRST_AID_HOME, []);
  const aidMobile = useStorageSubscription(SYNC_KEYS.HEALTH_FIRST_AID_MOBILE, []);
  const supplements = useStorageSubscription(SYNC_KEYS.HEALTH_SUPPLEMENTS, []);

  // Consolidate dependencies for pure calculation
  const growthData = useMemo(() => ({
    habits,
    projects,
    income,
    expenses,
    channels,
    journals,
    inventory: {
      HEALTH_MEDICINE: med,
      HEALTH_TRAVEL_KIT: travel,
      HEALTH_FIRST_AID_HOME: aidHome,
      HEALTH_FIRST_AID_MOBILE: aidMobile,
      HEALTH_SUPPLEMENTS: supplements
    }
  }), [habits, projects, income, expenses, channels, journals, med, travel, aidHome, aidMobile, supplements]);

  const scores = useMemo(() => calculateCategoryScores(growthData, filter), [growthData, filter]);
  const overallScore = useMemo(() => getOverallGrowthScore(scores), [scores]);
  const trendData = useMemo(() => getGrowthTrendData(growthData, filter), [growthData, filter]);

  const ranges: { label: string; value: ScoreRange }[] = [
    { label: '7D', value: '7D' },
    { label: '1M', value: '1M' },
    { label: '6M', value: '6M' },
    { label: '1Y', value: '1Y' },
    { label: 'Custom', value: 'Custom' }
  ];

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
        <div className="flex flex-col gap-1">
          <SectionTitle className="mb-0">Life Growth Index</SectionTitle>
          <Description>A composite metric reflecting your progress across habits, projects, finances, and systems.</Description>
          
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/50 dark:border-zinc-700/30">
              {ranges.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setFilter({ ...filter, range: r.value })}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    filter.range === r.value 
                      ? 'bg-white dark:bg-zinc-700 text-teal-600 dark:text-teal-400 shadow-sm shadow-zinc-200/50 dark:shadow-none' 
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {filter.range === 'Custom' && (
              <div className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2 duration-300">
                <MultiSelectDropdown 
                  label="Month" 
                  options={MONTHS} 
                  selected={filter.month !== undefined ? [filter.month] : [new Date().getMonth()]} 
                  onChange={(val) => setFilter({ ...filter, month: val[val.length - 1] })}
                />
                <MultiSelectDropdown 
                  label="Year" 
                  options={YEARS} 
                  selected={filter.year !== undefined ? [filter.year] : [new Date().getFullYear()]} 
                  onChange={(val) => setFilter({ ...filter, year: val[val.length - 1] })}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm border-l-4 border-l-teal-500 min-w-[200px]">
          <div className="flex flex-col">
            <Text variant="label" className="text-[10px] uppercase tracking-wider mb-0.5">Overall Score</Text>
            <div className="flex items-baseline gap-2">
              <Text variant="metric" className="text-3xl leading-none text-teal-600 dark:text-teal-400">{overallScore}</Text>
              <Text variant="label" className="text-zinc-400">/ 100</Text>
            </div>
          </div>
          <div className={`p-2 rounded-xl scale-110 ${overallScore > 70 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900/60 p-6 md:p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col h-[350px]">
          <div className="flex items-center justify-between mb-6">
             <Text variant="label" className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                <Calendar size={14} className="text-teal-500" />
                Growth Trend
             </Text>
             <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-zinc-400">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <span>{filter.range === 'Custom' ? `${MONTHS[filter.month || 0]} ${filter.year || 2026}` : `${filter.range} PERFORMANCE`}</span>
             </div>
          </div>
          <div className="flex-1 w-full">
            <GrowthTrendChart data={trendData} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/60 p-6 md:p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col h-[350px]">
          <div className="flex items-center justify-between mb-2">
             <Text variant="label" className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Focus Balance</Text>
          </div>
          <div className="flex-1 w-full relative">
            <GrowthRadarChart data={scores} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {scores.map((s, i) => (
          <div 
            key={s.name} 
            className="group flex flex-col p-4 bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 hover:border-teal-500/30 transition-all cursor-default"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: s.color }}
              >
                {s.name === 'Habits' && <Target size={16} />}
                {s.name === 'Projects' && <Package size={16} />}
                {s.name === 'Finance' && <CreditCard size={16} />}
                {s.name === 'Expenses' && <ShoppingBag size={16} />}
                {s.name === 'Health' && <Package size={16} />}
                {s.name === 'Content' && <TrendingUp size={16} />}
                {s.name === 'Mindfulness' && <Target size={16} />}
              </div>
              <Text variant="bodySmall" className="font-bold text-zinc-900 dark:text-zinc-100">{s.score}%</Text>
            </div>
            <Text variant="label" className="text-[10px] uppercase font-bold text-zinc-500 group-hover:text-teal-600 transition-colors tracking-tight">{s.name}</Text>
            <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
               <div 
                className="h-full transition-all duration-1000 ease-out"
                style={{ width: `${s.score}%`, backgroundColor: s.color }}
               />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
