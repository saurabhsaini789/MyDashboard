"use client";

import React from 'react';
import { Text } from '@/components/ui/Text';

interface PantryFilterProps {
  viewingDate: Date;
  onDateChange: (date: Date) => void;
  onAddClick: () => void;
}

export function PantryFilter({ viewingDate, onDateChange, onAddClick }: PantryFilterProps) {
  const month = viewingDate.getMonth();
  const year = viewingDate.getFullYear();

  const prevMonth = () => onDateChange(new Date(year, month - 1, 1));
  const nextMonth = () => onDateChange(new Date(year, month + 1, 1));

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(viewingDate);

  // We could add dropdowns here, but for now we'll keep them as semantic buttons
  // that can be extended with selection logic later if needed.
  return (
    <div className="flex items-center justify-end gap-3 px-2">
      <div className="flex items-center gap-1 bg-zinc-100/50 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
        <button 
          onClick={prevMonth} 
          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400"
          aria-label="Previous Month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button className="px-3 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2 group">
          <Text variant="label" as="span" className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
            {monthName}
          </Text>
          <svg className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <button 
          onClick={nextMonth} 
          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400"
          aria-label="Next Month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <button className="px-4 py-2 bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors flex items-center gap-2 group">
        <Text variant="label" as="span" className="font-bold text-zinc-900 dark:text-zinc-100 text-xs tracking-wider">
          {year}
        </Text>
        <svg className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <button
        onClick={onAddClick}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-xs uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm ml-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Entry</span>
      </button>
    </div>
  );
}
