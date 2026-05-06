"use client";

import React, { useState } from 'react';
import { SYNC_KEYS } from '@/lib/sync-keys';
import {
  SupplementItem,
  SUPPLEMENT_CATEGORIES,
  type InventoryStatus,
} from '@/types/health-system';
import { SectionTitle } from '../ui/Text';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

/* ── Helpers ── */
const getStatus = (item: { quantity: number; targetQuantity: number; expiryDate: string }): InventoryStatus => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(item.expiryDate); expiry.setHours(0, 0, 0, 0);
  if (expiry < today) return 'EXPIRED';
  if (item.quantity === 0) return 'MISSING';
  if (item.quantity < item.targetQuantity) return 'LOW';
  return 'OK';
};

const getFrequencyGroup = (freq: string): string => {
  const f = (freq || '').toLowerCase();
  if (f.includes('day') || f.includes('daily') || f.includes('/d')) return 'Daily';
  if (f.includes('week') || f.includes('weekly') || f.includes('/w')) return 'Weekly';
  if (f.includes('month') || f.includes('monthly')) return 'Monthly';
  return 'Other';
};

const FREQ_ORDER = ['Daily', 'Weekly', 'Monthly', 'Other'];

export function SupplementRoutineSection() {
  const items = useStorageSubscription<SupplementItem[]>(SYNC_KEYS.HEALTH_SUPPLEMENTS, []);
  const familyMembers = useStorageSubscription<string[]>(SYNC_KEYS.HEALTH_FAMILY_MEMBERS, []);
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<string>('All');

  const filteredItems = items.filter(item => 
    selectedPerson === 'All' ? true : (item.person === selectedPerson || (!item.person && selectedPerson === 'Shared'))
  );

  const suppStats = {
    ok: filteredItems.filter(i => getStatus(i) === 'OK').length,
    low: filteredItems.filter(i => getStatus(i) === 'LOW').length,
    missing: filteredItems.filter(i => getStatus(i) === 'MISSING').length,
    expired: filteredItems.filter(i => getStatus(i) === 'EXPIRED').length,
  };

  const byFreq = filteredItems.reduce<Record<string, SupplementItem[]>>((acc, item) => {
    const g = getFrequencyGroup(item.frequency);
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const categoryCoverage = SUPPLEMENT_CATEGORIES.map(cat => ({
    cat,
    count: filteredItems.filter(i => i.category === cat).length,
    hasOk: filteredItems.some(i => i.category === cat && getStatus(i) === 'OK'),
  }));

  return (
    <section className="w-full fade-in mb-14">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2 font-bold uppercase">
        <SectionTitle>Supplement Routine</SectionTitle>
        <div className="flex items-center gap-3">
          <select 
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            className="bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 text-[11px] px-3 py-2 rounded-xl border-none cursor-pointer"
          >
            <option value="All">All Routines</option>
            <option value="Shared">Shared</option>
            {familyMembers.map(person => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>
          <button
            onClick={() => setIsExpanded(p => !p)}
            className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-xl transition-all"
          >
            {isExpanded ? <><ChevronUp size={13} /> Collapse</> : <><ChevronDown size={13} /> Expand</>}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="animate-in fade-in duration-300 space-y-8 font-bold">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 shadow-sm">
              <span className="text-[11px] uppercase text-zinc-400 block mb-2 font-bold">Total</span>
              <span className="text-[32px] text-zinc-900 dark:text-zinc-100 tabular-nums">{filteredItems.length}</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 shadow-sm">
              <span className="text-[11px] uppercase text-zinc-400 block mb-2 font-bold">Categories</span>
              <span className="text-[32px] text-zinc-900 dark:text-zinc-100 tabular-nums">{categoryCoverage.filter(c => c.count > 0).length}</span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl px-5 py-4 shadow-sm">
              <span className="text-[11px] uppercase text-emerald-500 dark:text-emerald-400 block mb-2 font-bold">OK</span>
              <span className="text-[32px] text-emerald-600 dark:text-emerald-500 tabular-nums">{suppStats.ok}</span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl px-5 py-4 shadow-sm">
              <span className="text-[11px] uppercase text-amber-500 dark:text-amber-400 block mb-2 font-bold">Action</span>
              <span className="text-[32px] text-amber-600 dark:text-amber-500 tabular-nums">{suppStats.low + suppStats.missing + suppStats.expired}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-[11px] uppercase text-zinc-400 mb-5 font-bold">Frequency Breakdown</h3>
              <div className="space-y-4">
                {FREQ_ORDER.filter(g => byFreq[g]?.length > 0).map(group => (
                  <div key={group}>
                    <div className="flex items-center gap-2 mb-2 text-zinc-500 text-xs uppercase font-bold"><span>{group} Routine</span><span>· {byFreq[group].length}</span></div>
                    {byFreq[group].map(i => (
                      <div key={i.id} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl mb-1.5 border border-transparent dark:border-zinc-800">
                        <div className="flex flex-col"><span className="text-sm font-bold">{i.itemName}</span><span className="text-[10px] text-zinc-400">{i.dose}</span></div>
                        <span className="text-[10px] text-zinc-400">{i.frequency}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-[11px] uppercase text-zinc-400 mb-5 font-bold">Category Coverage</h3>
              <div className="space-y-2">
                {categoryCoverage.map(c => (
                  <div key={c.cat} className={`flex justify-between p-3 rounded-xl border text-xs font-bold transition-all ${c.count === 0 ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 opacity-60' : c.hasOk ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20'}`}>
                    <span>{c.cat}</span>
                    <span className={c.count === 0 ? 'text-zinc-400' : c.hasOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>{c.count === 0 ? 'None' : `${c.count} items`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
