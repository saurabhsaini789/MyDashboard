"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, ExpenseRecord } from '@/types/finance';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { getPrefixedKey } from '@/lib/keys';
import { setSyncedItem } from '@/lib/storage';

interface InventoryTrackerProps {
  records: ExpenseRecord[];
}

const MOCK_INVENTORY: InventoryItem[] = [
  { 
    id: 'inv1', 
    name: 'Milk', 
    unit: 'bottles', 
    monthlyUsage: 12, 
    quantity: 2, 
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
  },
  { 
    id: 'inv2', 
    name: 'Eggs', 
    unit: 'dozen', 
    monthlyUsage: 4, 
    quantity: 1, 
    lastUpdated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
  }
];

export function InventoryTracker({ records }: InventoryTrackerProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [monthlyUsage, setMonthlyUsage] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_INVENTORY));
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        setItems(MOCK_INVENTORY);
      }
    } else {
      setItems(MOCK_INVENTORY);
      setSyncedItem(SYNC_KEYS.FINANCES_INVENTORY, JSON.stringify(MOCK_INVENTORY));
    }
    setIsLoaded(true);
  }, []);

  const saveItems = (newItems: InventoryItem[]) => {
    setItems(newItems);
    setSyncedItem(SYNC_KEYS.FINANCES_INVENTORY, JSON.stringify(newItems));
  };

  const inventoryData = useMemo(() => {
    return items.map(item => {
      const lastUpdateDate = new Date(item.lastUpdated);
      const now = new Date();
      const daysSinceUpdate = (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Calculate consumption
      const consumption = (daysSinceUpdate / 30) * item.monthlyUsage;
      
      // Calculate total bought since last update
      let totalBought = 0;
      records.forEach(record => {
        const recordDate = new Date(record.date);
        if (recordDate >= lastUpdateDate) {
          if (record.items && record.items.length > 0) {
            record.items.forEach(i => {
              if (i.name.toLowerCase() === item.name.toLowerCase()) {
                const q = parseFloat(i.quantity) || 1;
                totalBought += q;
              }
            });
          } else if (record.subcategory?.toLowerCase() === item.name.toLowerCase() || record.category?.toLowerCase() === item.name.toLowerCase()) {
            const q = parseFloat(record.quantity || '1') || 1;
            totalBought += q;
          }
        }
      });

      const currentQuantity = Math.max(0, item.quantity + totalBought - consumption);
      const daysRemaining = item.monthlyUsage > 0 ? (currentQuantity / item.monthlyUsage) * 30 : Infinity;

      return {
        ...item,
        currentQuantity,
        daysRemaining,
        totalBoughtSinceUpdate: totalBought,
        consumptionSinceUpdate: consumption
      };
    });
  }, [items, records]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      unit,
      monthlyUsage: parseFloat(monthlyUsage) || 0,
      quantity: parseFloat(quantity) || 0,
      lastUpdated: new Date().toISOString()
    };
    saveItems([...items, newItem]);
    setName('');
    setUnit('');
    setMonthlyUsage('');
    setQuantity('');
    setIsFormOpen(false);
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity: newQty,
          lastUpdated: new Date().toISOString()
        };
      }
      return item;
    });
    saveItems(newItems);
  };

  const deleteItem = (id: string) => {
    saveItems(items.filter(i => i.id !== id));
  };

  if (!isLoaded) return null;

  const lowStockItems = inventoryData.filter(item => item.daysRemaining <= 3);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 delay-300">
      
      {/* Header & Alerts */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 md:p-8 bg-zinc-900 dark:bg-zinc-800 rounded-[40px] text-white shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl -mr-10 -mt-20 pointer-events-none" />
           
           <div className="flex flex-col gap-2 relative z-10">
              <h2 className="text-2xl font-bold uppercase tracking-[0.2em]">Inventory Tracker</h2>
              <p className="text-sm text-zinc-400 font-medium max-w-sm">Auto-updating stock levels based on purchases and usage patterns.</p>
           </div>

           <div className="flex gap-4 md:gap-8 relative z-10">
              <div className="flex flex-col items-start md:items-end">
                 <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Total Items</span>
                 <span className="text-2xl md:text-3xl font-bold tracking-tight">{items.length}</span>
              </div>
              <div className="w-px h-12 bg-zinc-800 hidden md:block" />
              <div className="flex flex-col items-start md:items-end">
                 <span className="text-xs uppercase tracking-widest text-amber-500/80 font-bold">Low Stock</span>
                 <span className="text-2xl md:text-3xl font-bold tracking-tight text-amber-400">{lowStockItems.length}</span>
              </div>
           </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="flex flex-col gap-2">
            {lowStockItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl animate-in slide-in-from-left-4 duration-500">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  <span className="font-bold">{item.name}</span> will run out in <span className="font-bold">{item.daysRemaining < 1 ? 'less than a day' : `${Math.round(item.daysRemaining)} days`}</span>.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[40px] p-6 lg:p-8 shadow-xl flex flex-col gap-8">
         <div className="flex justify-between items-center">
            <h3 className="uppercase tracking-[0.3em] font-bold text-sm text-zinc-400">Current Stock</h3>
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-zinc-600 dark:text-zinc-300 shadow-sm"
            >
              {isFormOpen ? 'Cancel' : '➕ Add Item'}
            </button>
         </div>

         {/* Add Item Form */}
         {isFormOpen && (
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-zinc-50 dark:bg-zinc-950/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Item Name</label>
                 <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Milk" className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm focus:ring-2 focus:ring-amber-500/20" />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Current Quantity</label>
                 <input required type="number" step="0.1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 2" className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm focus:ring-2 focus:ring-amber-500/20" />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Unit</label>
                 <input required type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. bottles" className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm focus:ring-2 focus:ring-amber-500/20" />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Monthly Usage</label>
                 <input required type="number" step="0.1" value={monthlyUsage} onChange={e => setMonthlyUsage(e.target.value)} placeholder="e.g. 12" className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm focus:ring-2 focus:ring-amber-500/20" />
              </div>
              <div className="col-span-full flex justify-end">
                 <button type="submit" className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all">
                    Track Item
                 </button>
              </div>
           </form>
         )}

         {/* Inventory List */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventoryData.map(item => (
              <div key={item.id} className="group relative p-6 bg-zinc-50 dark:bg-zinc-950/30 rounded-[32px] border border-zinc-100 dark:border-zinc-800 hover:border-amber-500/30 transition-all flex flex-col gap-4">
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>

                <div className="flex flex-col gap-1">
                  <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{item.name}</h4>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Usage: {item.monthlyUsage} {item.unit} / month</p>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Current Stock</span>
                      <span className={`text-2xl font-bold tracking-tight ${item.daysRemaining <= 3 ? 'text-amber-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {item.currentQuantity.toFixed(1)} <span className="text-sm font-medium text-zinc-500 uppercase">{item.unit}</span>
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Lasts</span>
                      <span className={`text-sm font-bold ${item.daysRemaining <= 3 ? 'text-amber-500' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {item.daysRemaining < 1 ? 'Low!' : `${Math.round(item.daysRemaining)} days`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${item.daysRemaining <= 3 ? 'bg-amber-500' : 'bg-teal-500'}`}
                      style={{ width: `${Math.min(100, (item.daysRemaining / 30) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-2">Manual Sync (Override)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      step="0.1" 
                      placeholder="New qty..."
                      className="w-full bg-white dark:bg-zinc-900 py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateQuantity(item.id, parseFloat((e.target as HTMLInputElement).value));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="mt-auto pt-2 flex flex-col gap-1">
                   <p className="text-[9px] text-zinc-400 uppercase font-medium">
                     Bought since {new Date(item.lastUpdated).toLocaleDateString()}: <span className="text-zinc-600 dark:text-zinc-300 font-bold">{item.totalBoughtSinceUpdate} {item.unit}</span>
                   </p>
                </div>
              </div>
            ))}
         </div>

         {items.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 bg-zinc-50 dark:bg-zinc-950/20 rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
             <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
             </div>
             <p className="text-zinc-500 font-medium">No items tracked in inventory yet.</p>
             <button onClick={() => setIsFormOpen(true)} className="mt-4 text-teal-500 font-bold text-sm uppercase tracking-widest hover:text-teal-600 transition-colors">Start Tracking</button>
           </div>
         )}
      </div>
    </div>
  );
}
