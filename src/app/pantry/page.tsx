"use client";

import React, { useState, useEffect } from 'react';
import { PantryCalendar } from '@/components/pantry/PantryCalendar';
import { GroceryPlan } from '@/components/pantry/GroceryPlan';
import { PriceIntelligence } from '@/components/pantry/PriceIntelligence';
import { InventoryTracker } from '@/components/pantry/InventoryTracker';
import { SmartInsights } from '@/components/pantry/SmartInsights';
import { PantryFilter } from '@/components/pantry/PantryFilter';
import { PantrySummary } from '@/components/pantry/PantrySummary';
import { PantryEntryModal } from '@/components/pantry/PantryEntryModal';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { setSyncedItem } from '@/lib/storage';
import { ExpenseRecord } from '@/types/finance';
import { PageTitle, PageSubtitle, Text, Description } from '@/components/ui/Text';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

export default function PantryPage() {
  const records = useStorageSubscription<ExpenseRecord[]>(SYNC_KEYS.FINANCES_EXPENSES, []);
  const [viewingDate, setViewingDate] = useState<Date | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEffect(() => {
    // Set current date only after mount to avoid hydration mismatch
    setViewingDate(new Date());
  }, []);

  const updateRecords = (newRecords: ExpenseRecord[]) => {
    setSyncedItem(SYNC_KEYS.FINANCES_EXPENSES, JSON.stringify(newRecords));
  };

  // Guard against null viewingDate during hydration
  const currentMonthRecords = !viewingDate ? [] : records.filter(r => {
    if (!r.date) return false;
    const [rYear, rMonth] = r.date.split('-');
    return parseInt(rMonth) - 1 === viewingDate.getMonth() && parseInt(rYear) === viewingDate.getFullYear();
  });

  const categoryTotals = currentMonthRecords.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);

  const { totalNeed, totalWant } = currentMonthRecords.reduce((acc, r) => {
    if (r.items && r.items.length > 0) {
      r.items.forEach(item => {
        if (item.type === 'want') acc.totalWant += item.totalPrice;
        else acc.totalNeed += item.totalPrice;
      });
      const taxTotal = (r.sgst || 0) + (r.cgst || 0);
      if (r.type === 'want') acc.totalWant += taxTotal;
      else acc.totalNeed += taxTotal;
    } else {
      if (r.type === 'want') acc.totalWant += r.amount;
      else acc.totalNeed += r.amount;
    }
    return acc;
  }, { totalNeed: 0, totalWant: 0 });

  return (
    <main className="min-h-screen bg-[#fcfcfc] dark:bg-zinc-950 p-4 md:p-12 relative overflow-hidden font-bold uppercase transition-colors">
      <div className="mx-auto w-full max-w-7xl relative z-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col items-start transition-all">
            <PageTitle>Pantry</PageTitle>
            <Description>Vault Intelligence · Consumption Cycle Tracker</Description>
          </div>
          {viewingDate && (
             <PantryEntryModal isOpen={isQuickAddOpen} date={viewingDate.toISOString().split('T')[0]} recordsOnDate={[]} onClose={() => setIsQuickAddOpen(false)} onUpdateRecords={updateRecords} allRecords={records} />
          )}
        </header>

        {viewingDate && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8">
              <PantrySummary totalTotal={totalNeed + totalWant} totalNeed={totalNeed} totalWant={totalWant} categoryTotals={categoryTotals} extraControls={<PantryFilter viewingDate={viewingDate} onDateChange={setViewingDate} onAddClick={() => setIsQuickAddOpen(true)} />} />
            </div>

            <div className="mb-14"><PantryCalendar records={records} onUpdateRecords={updateRecords} viewingDate={viewingDate} setViewingDate={setViewingDate} /></div>
            <div className="mb-14"><GroceryPlan records={records} viewingDate={viewingDate} onDateChange={setViewingDate} /></div>
            <div className="mb-14"><PriceIntelligence records={records} /></div>
            <div className="mb-14"><InventoryTracker records={records} /></div>
            <div className="mb-14"><SmartInsights records={records} viewingDate={viewingDate} /></div>
          </div>
        )}
      </div>

      <div className="absolute top-0 right-0 -z-0 opacity-10 pointer-events-none">
        <div className="w-[800px] h-[800px] bg-rose-500/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
      </div>
    </main>
  );
}
