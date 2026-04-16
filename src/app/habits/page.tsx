"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Habits } from '@/components/widgets/Habits';
import { HabitsOverview, type TimeFilter } from '@/components/widgets/HabitsOverview';
import { PageTitle, SectionTitle, Text, Description } from '@/components/ui/Text';

export default function HabitsPage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<TimeFilter>('1 Month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 font-sans p-4 md:p-8 xl:p-12">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col items-start">
            <PageTitle>Habits Tracker</PageTitle>
            <Description>Track your daily progress</Description>
          </div>
        </header>
        
        {/* Overview Section */}
        <section className="w-full relative fade-in mb-14">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <SectionTitle className="mb-0">Habits Overview</SectionTitle>
            
            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
              {filter === 'Custom Month' && (
                <div className="flex gap-2 flex-1 sm:flex-none">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="flex-1 sm:flex-none appearance-none bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold text-zinc-700 dark:text-zinc-300 rounded-xl px-3 py-2 cursor-pointer outline-none border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-rose-500/50 shadow-sm"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>
                        {new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'short' })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="flex-1 sm:flex-none appearance-none bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold text-zinc-700 dark:text-zinc-300 rounded-xl px-3 py-2 cursor-pointer outline-none border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-rose-500/50 shadow-sm"
                  >
                    {Array.from({ length: 5 }, (_, i) => 2026 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as TimeFilter)}
                className="flex-1 sm:flex-none appearance-none bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold text-zinc-700 dark:text-zinc-300 rounded-xl px-3 py-2 cursor-pointer outline-none border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-rose-500/50 shadow-sm"
              >
                <option value="1 Day">1 Day</option>
                <option value="7 Days">7 Days</option>
                <option value="1 Month">1 Month</option>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
                <option value="Custom Month">Custom Month</option>
              </select>
              <Link href="/habits" className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-colors border border-rose-200 dark:border-rose-900/50 whitespace-nowrap">View All</Link>
            </div>
          </div>

          <HabitsOverview 
            filter={filter}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </section>

        <section className="w-full relative fade-in">
          <Habits />
        </section>
      </div>
    </main>
  );
}
