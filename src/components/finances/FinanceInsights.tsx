"use client";

import React from 'react';
import { SectionTitle } from '../ui/Text';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';
import { ExpenseRecord } from '@/types/finance';

interface InsightItem {
 text: string;
 trend?: string;
}

interface InsightSection {
 category: string;
 icon: React.ReactNode;
 color: string;
 bgColor: string;
 borderColor: string;
 items: InsightItem[];
}

export function FinanceInsights() {
 const records = useStorageSubscription<ExpenseRecord[]>(SYNC_KEYS.FINANCES_EXPENSES, []);

 const insights = React.useMemo(() => {
 const now = new Date();
 const currentMonth = now.getMonth();
 const currentYear = now.getFullYear();

 const startOfThisWeek = new Date(now);
 startOfThisWeek.setDate(now.getDate() - now.getDay());
 startOfThisWeek.setHours(0, 0, 0, 0);

 // Spending Behavior logic
 const diningRecords = records.filter(r => r.category === 'Dining');
 const thisWeekDining = diningRecords.filter(r => new Date(r.date) >= startOfThisWeek).reduce((acc, r) => acc + r.amount, 0);
 const avgWeeklyDining = diningRecords.length > 0 ? (diningRecords.reduce((acc, r) => acc + r.amount, 0) / (records.length / 7 || 1)) : 0;

 const clothingRecords = records.filter(r => r.category === 'Clothing');
 const thisMonthClothing = clothingRecords.filter(r => {
 if (!r.date) return false;
 const [rYear, rMonth] = r.date.split('-');
 return parseInt(rMonth) - 1 === currentMonth && parseInt(rYear) === currentYear;
 }).reduce((acc, r) => acc + r.amount, 0);

 const sections: InsightSection[] = [];

 // Spending Behavior
 const behaviorItems: InsightItem[] = [];
 if (thisWeekDining > avgWeeklyDining * 1.3 && avgWeeklyDining > 0) {
 behaviorItems.push({ text: "“You spent significantly more on eating out this week than your average”" });
 }
 if (thisMonthClothing > 0) {
 behaviorItems.push({ text: `“Clothing spend tracked at $${thisMonthClothing.toFixed(0)} this month”` });
 }
 
 if (behaviorItems.length > 0) {
 sections.push({
 category: "Spending Behavior",
 icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
 color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-500/10", borderColor: "border-blue-100 dark:border-blue-500/20",
 items: behaviorItems
 });
 }

 return sections;
 }, [records]);

 if (!insights || insights.length === 0) {
 return null;
 }

 return (
 <div className="flex flex-col gap-6 animate-in fade-in duration-700 delay-500">
 <div className="flex flex-col gap-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-lg">
 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
 </svg>
 </div>
 <div className="flex flex-col">
 <SectionTitle>Finance Insights</SectionTitle>
 <p className="text-xs text-zinc-500 uppercase font-semibold">AI-Powered Spending Intelligence</p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {insights.map((section, idx) => (
 <div 
 key={idx} 
 className={`group relative p-6 bg-white dark:bg-zinc-900 border ${section.borderColor} rounded-2xl shadow-sm transition-all duration-300 flex flex-col gap-5`}
 >
 {/* Header */}
 <div className="flex items-center gap-3">
 <div className={`p-2.5 rounded-xl ${section.bgColor} ${section.color}`}>
 {section.icon}
 </div>
 <h3 className="font-semibold text-sm uppercase text-zinc-800 dark:text-zinc-200">
 {section.category}
 </h3>
 </div>

 {/* Content Items */}
 <div className="flex flex-col gap-4">
 {section.items.map((item, iIdx) => (
 <div key={iIdx} className="flex items-start gap-3 group/item">
 <span className="mt-1 text-xs shrink-0 select-none text-zinc-500 group-hover/item:text-zinc-700 dark:group-hover/item:text-zinc-300 transition-colors">
 •
 </span>
 <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed group-hover/item:text-zinc-900 dark:group-hover/item:text-zinc-100 transition-colors">
 {item.text}
 </p>
 </div>
 ))}
 </div>

 {/* Subtle Gradient Decor */}
 <div className={`absolute bottom-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none ${section.bgColor}`} />
 </div>
 ))}
 </div>
 </div>
 );
}
