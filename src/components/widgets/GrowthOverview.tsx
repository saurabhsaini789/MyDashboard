"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- subscribes to loosely-typed stores from many pages */

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { TrendingUp, Target, Wallet, HeartPulse, FolderKanban, Calendar, BookOpen, Users, Rocket, Sparkles } from 'lucide-react';
import { migrateLegacyJournalDays } from '@/lib/journal-log';
import { calculateCategoryScores, getOverallGrowthScore, getGrowthTrendData, ScoreRange, ScoreFilter } from '@/lib/growth-score';
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

const EMPTY: any[] = [];

const ICONS: Record<string, React.ReactNode> = {
  Habits: <Target size={16} />,
  Projects: <FolderKanban size={16} />,
  Money: <Wallet size={16} />,
  Health: <HeartPulse size={16} />,
  Reading: <BookOpen size={16} />,
  Content: <Rocket size={16} />,
  Relationships: <Users size={16} />,
  Mindfulness: <Sparkles size={16} />,
};

export function GrowthOverview() {
  const [filter, setFilter] = useState<ScoreFilter>({ 
    range: 'Custom',
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  // Authoritative Subscriptions
  const habits = useStorageSubscription<any[]>(SYNC_KEYS.HABITS, EMPTY);
  const projects = useStorageSubscription<any[]>(SYNC_KEYS.GOALS_PROJECTS, EMPTY);
  const income = useStorageSubscription<any[]>(SYNC_KEYS.FINANCES_INCOME, EMPTY);
  const expenses = useStorageSubscription<any[]>(SYNC_KEYS.FINANCES_EXPENSES, EMPTY);
  const channels = useStorageSubscription<any[]>(SYNC_KEYS.FINANCES_BUSINESS, EMPTY);
  const journals = useStorageSubscription<string[]>(SYNC_KEYS.JOURNAL_LOGS, EMPTY);
  const books = useStorageSubscription<any[]>(SYNC_KEYS.BOOKS_LIBRARY, EMPTY);
  const bookGoal = useStorageSubscription<number | string>(SYNC_KEYS.BOOKS_GOAL, 24);
  const contacts = useStorageSubscription<any[]>(SYNC_KEYS.CONTACTS, EMPTY);
  // Inventory Subscriptions
  const med = useStorageSubscription<any[]>(SYNC_KEYS.HEALTH_MEDICINE, EMPTY);
  const travel = useStorageSubscription<any[]>(SYNC_KEYS.HEALTH_TRAVEL_KIT, EMPTY);
  const aidHome = useStorageSubscription<any[]>(SYNC_KEYS.HEALTH_FIRST_AID_HOME, EMPTY);
  const aidMobile = useStorageSubscription<any[]>(SYNC_KEYS.HEALTH_FIRST_AID_MOBILE, EMPTY);
  const supplements = useStorageSubscription<any[]>(SYNC_KEYS.HEALTH_SUPPLEMENTS, EMPTY);

  // Journal days used to be saved under an unsynced key; move them over once.
  useEffect(() => { migrateLegacyJournalDays(); }, []);

  // Consolidate dependencies for pure calculation
  const growthData = useMemo(() => ({
    habits,
    projects,
    income,
    expenses,
    channels,
    journals,
    books,
    bookGoal: Number(bookGoal) || 24,
    contacts,
    inventory: { med, travel, aidHome, aidMobile, supplements },
  }), [habits, projects, income, expenses, channels, journals, books, bookGoal, contacts, med, travel, aidHome, aidMobile, supplements]);

  const scores = useMemo(() => calculateCategoryScores(growthData, filter), [growthData, filter]);
  const overallScore = useMemo(() => getOverallGrowthScore(scores), [scores]);
  const trendData = useMemo(() => getGrowthTrendData(growthData, filter), [growthData, filter]);
  const scoredCount = scores.filter(s => s.score !== null).length;
  // Radar needs numbers; pillars without data sit at 0 and are labelled as such.
  const radarData = useMemo(() => scores.map(s => ({ name: s.score === null ? `${s.name} (no data)` : s.name, score: s.score ?? 0 })), [scores]);

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
              <Text variant="metric" className="text-3xl leading-none text-teal-600 dark:text-teal-400">{overallScore ?? '—'}</Text>
              <Text variant="label" className="text-zinc-400">/ 100</Text>
            </div>
            <Text variant="label" className="text-[10px] text-zinc-400 mt-1">
              {scoredCount} of {scores.length} areas with data
            </Text>
          </div>
          <div className={`p-2 rounded-xl scale-110 ${(overallScore ?? 0) > 70 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
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
            <GrowthRadarChart data={radarData} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {scores.map((s, i) => (
          <Link
            key={s.name}
            href={s.fullPath}
            title={s.detail}
            className={`group flex flex-col p-4 bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 hover:border-teal-500/30 transition-all ${s.score === null ? 'opacity-60' : ''}`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: s.score === null ? '#a1a1aa' : s.color }}
              >
                {ICONS[s.name]}
              </div>
              <Text variant="bodySmall" className="font-bold text-zinc-900 dark:text-zinc-100">{s.score === null ? 'No data' : `${s.score}%`}</Text>
            </div>
            <Text variant="label" className="text-[10px] uppercase font-bold text-zinc-500 group-hover:text-teal-600 transition-colors tracking-tight">{s.name}</Text>
            <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
               <div
                className="h-full transition-all duration-1000 ease-out"
                style={{ width: `${s.score ?? 0}%`, backgroundColor: s.color }}
               />
            </div>
            <Text variant="label" className="text-[11px] text-zinc-400 mt-2 leading-snug line-clamp-2">{s.detail}</Text>
          </Link>
        ))}
      </div>
    </div>
  );
}
