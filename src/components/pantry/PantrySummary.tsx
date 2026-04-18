"use client";

import React from 'react';

interface PantrySummaryProps {
  totalTotal: number;
  totalNeed: number;
  totalWant: number;
  categoryTotals: Record<string, number>;
  extraControls?: React.ReactNode;
}

export function PantrySummary({ totalTotal, totalNeed, totalWant, categoryTotals, extraControls }: PantrySummaryProps) {
  const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const needPercent = (totalNeed / Math.max(totalTotal, 1)) * 100;
  const wantPercent = (totalWant / Math.max(totalTotal, 1)) * 100;

  // Standardization
  const amountClassName = "text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums leading-none";
  const labelClassName = "text-[10px] uppercase font-bold tracking-[0.15em] text-zinc-400 dark:text-zinc-500 mb-1.5 block";

  return (
    <div className="flex flex-col gap-4 mb-4">
      {/* Row 1: Spend (1/4) and Bar (3/4) */}
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {/* Monthly Spend Card (1/4 Width) */}
        <div className="w-full lg:w-1/4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center gap-5 min-h-[140px] group hover:border-teal-500/20 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0 group-hover:scale-110 transition-transform">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className={labelClassName}>Monthly Spend Total</span>
            <div className="flex items-baseline gap-1">
              <span className="text-zinc-400 dark:text-zinc-500 text-lg font-medium">$</span>
              <span className={amountClassName}>
                {totalTotal.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">
                .{((totalTotal % 1) * 100).toFixed(0).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Needs vs Wants Card (3/4 Width) */}
        <div className="w-full lg:w-3/4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col justify-center gap-5 min-h-[140px]">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className={labelClassName}>Essential Needs</span>
              <span className={amountClassName}>
                ${totalNeed.toLocaleString('en-CA', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className={labelClassName}>Discretionary Wants</span>
              <span className={amountClassName}>
                ${totalWant.toLocaleString('en-CA', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          
          <div className="relative w-full h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
            <div 
              className="h-full bg-teal-500 dark:bg-teal-400 transition-all duration-1000 ease-out relative" 
              style={{ width: `${needPercent}%` }} 
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
            </div>
            <div 
              className="h-full bg-rose-500 dark:bg-rose-400 transition-all duration-1000 ease-out relative" 
              style={{ width: `${wantPercent}%` }} 
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Category Totals and Extra Controls (Same Row) */}
      {(categories.length > 0 || extraControls) && (
        <div className="flex flex-wrap items-center gap-4 mt-2">
          {categories.map(([cat, total]) => (
            <div 
              key={cat} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 md:p-5 shadow-sm hover:-translate-y-1 transition-all duration-300 min-w-[140px] flex flex-col gap-1"
            >
              <span className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-[0.2em] truncate">
                {cat}
              </span>
              <span className={amountClassName}>
                ${total.toLocaleString('en-CA', { maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
          
          {extraControls && (
            <div className="flex-1 flex justify-end">
              {extraControls}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
