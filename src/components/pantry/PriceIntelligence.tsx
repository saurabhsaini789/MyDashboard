"use client";

import React, { useMemo, useState } from 'react';
import { ExpenseRecord } from '@/types/finance';
import { Modal } from '../ui/Modal';
import { SectionTitle } from '../ui/Text';
import { Sparkles, AlertTriangle, Lightbulb, LayoutGrid, List } from 'lucide-react';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';
import { setSyncedItem } from '@/lib/storage';

interface PriceIntelligenceProps {
  records: ExpenseRecord[];
}

interface PriceInstance {
  price: number;
  date: string;
  vendor: string;
  brand?: string;
  size?: string;
}

interface ItemStats {
  name: string;
  history: PriceInstance[];
  averagePrice: number;
  lowestPrice: PriceInstance;
  lastPurchase: PriceInstance;
  priceTrend: number;
  smartInsights: any[];
}

export function PriceIntelligence({ records }: PriceIntelligenceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeItemStats, setActiveItemStats] = useState<ItemStats | null>(null);
  const viewMode = useStorageSubscription<'grid' | 'table'>(SYNC_KEYS.PANTRY_INVENTORY_VIEW, 'grid'); // Reuse view key or specific one

  const toggleViewMode = (mode: 'grid' | 'table') => setSyncedItem(SYNC_KEYS.PANTRY_INVENTORY_VIEW, mode);

  const itemStats: ItemStats[] = useMemo(() => {
    const map: Record<string, { name: string; history: PriceInstance[] }> = {};

    records.forEach(record => {
      const isApplicable = record.category === 'Grocery' || (record.items && record.items.length > 0);
      if (!isApplicable) return;
      const vendor = record.vendor || 'Unknown Store';

      if (record.items && record.items.length > 0) {
        record.items.forEach(item => {
          const name = item.name.trim(); if (!name) return;
          const qty = parseFloat(item.quantity) || 1;
          const price = item.totalPrice > 0 ? (item.totalPrice / qty) : item.unitPrice;
          if (price <= 0 || isNaN(price)) return;
          const key = name.toLowerCase(); if (!map[key]) map[key] = { name, history: [] };
          map[key].history.push({ price, date: record.date, vendor, brand: item.brand, size: item.size });
        });
      } else {
        const name = (record.subcategory || record.category).trim(); if (!name) return;
        const qty = parseFloat(record.quantity || '1') || 1;
        const price = record.amount / qty;
        if (price <= 0 || isNaN(price)) return;
        const key = name.toLowerCase(); if (!map[key]) map[key] = { name, history: [] };
        map[key].history.push({ price, date: record.date, vendor, brand: record.brand, size: record.size });
      }
    });

    return Object.values(map).map(group => {
      group.history.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const avg = group.history.reduce((a,b) => a+b.price, 0) / group.history.length;
      const last = group.history[group.history.length-1];
      const low = group.history.reduce((p,c) => c.price < p.price ? c : p);
      return { ...group, averagePrice: avg, lowestPrice: low, lastPurchase: last, priceTrend: ((last.price-avg)/avg)*100, smartInsights: [] as any[] };
    }).sort((a,b) => Math.abs(b.priceTrend) - Math.abs(a.priceTrend));
  }, [records]);

  const filteredStats = itemStats.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 font-bold uppercase">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div><SectionTitle>Price Intelligence</SectionTitle><p className="text-[10px] text-zinc-400">Smart tracking of commodity price cycles.</p></div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button onClick={() => toggleViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode==='grid'?'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white':'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}><LayoutGrid size={16}/></button>
            <button onClick={() => toggleViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode==='table'?'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white':'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}><List size={16}/></button>
          </div>
          <input type="text" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-xl text-xs font-bold outline-none border border-zinc-100 dark:border-zinc-700 w-48"/>
        </div>
      </div>

      <div className="max-h-[500px] md:max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredStats.map(stat => (
              <div key={stat.name} onClick={() => setActiveItemStats(stat)} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm cursor-pointer hover:border-teal-500 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-bold truncate max-w-[120px] group-hover:text-teal-500 transition-colors">{stat.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black ${stat.priceTrend > 0 ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' : 'bg-teal-50 text-teal-600 dark:bg-teal-500/10'}`}>
                    {stat.priceTrend > 0 ? '+' : ''}{stat.priceTrend.toFixed(1)}%
                  </span>
                </div>
                <div className="text-3xl font-black mb-1 tracking-tighter">${stat.lastPurchase.price.toLocaleString()}</div>
                <div className="text-[10px] text-zinc-400 truncate font-medium">at {stat.lastPurchase.vendor}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Item</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Last Price</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Trend</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Avg Price</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Vendor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.map(stat => (
                    <tr 
                      key={stat.name} 
                      onClick={() => setActiveItemStats(stat)}
                      className="border-t border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 font-black group-hover:text-teal-500 transition-colors">{stat.name}</td>
                      <td className="px-6 py-4 font-black text-right tracking-tighter">${stat.lastPurchase.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded font-black text-[10px] ${stat.priceTrend > 0 ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' : 'bg-teal-50 text-teal-600 dark:bg-teal-500/10'}`}>
                          {stat.priceTrend > 0 ? '+' : ''}{stat.priceTrend.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-zinc-400">${stat.averagePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-right text-zinc-400 font-bold truncate max-w-[150px]">{stat.lastPurchase.vendor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {activeItemStats && (
        <Modal isOpen={!!activeItemStats} onClose={()=>setActiveItemStats(null)} title={activeItemStats.name}>
          <div className="p-4 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl text-center border border-zinc-100 dark:border-zinc-800"><span className="text-[10px] text-zinc-400 block mb-1">LOWEST</span><span className="font-bold text-teal-600">${activeItemStats.lowestPrice.price.toLocaleString()}</span></div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl text-center border border-zinc-100 dark:border-zinc-800"><span className="text-[10px] text-zinc-400 block mb-1">AVERAGE</span><span className="font-bold">${activeItemStats.averagePrice.toLocaleString()}</span></div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl text-center border border-zinc-100 dark:border-zinc-800"><span className="text-[10px] text-zinc-400 block mb-1">LOGS</span><span className="font-bold">{activeItemStats.history.length}</span></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
