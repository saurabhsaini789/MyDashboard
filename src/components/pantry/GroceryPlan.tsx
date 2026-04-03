"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GroceryPlanItem, ExpenseRecord } from '@/types/finance';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { getPrefixedKey } from '@/lib/keys';
import { setSyncedItem } from '@/lib/storage';


interface GroceryPlanProps {
  records: ExpenseRecord[];
  viewingDate: Date;
}

const DEFAULT_CATEGORIES = [
  '🥛 Dairy & Refrigerated',
  '🥩 Protein (Meat & Alternatives)',
  '🌾 Grains & Staples',
  '🥕 Vegetables',
  '🍎 Fruits',
  '🧂 Essentials',
  '🧼 Household Items',
  '📦 Other'
];

const MOCK_ITEMS: GroceryPlanItem[] = [
  // Dairy & Refrigerated
  { id: 'h1', name: 'Dishwasher Soap', category: '🧼 Household Items', plannedQuantity: 1, unitSize: 'Pack', frequency: 'Monthly', idealTiming: '', expectedPrice: 8, checkedUnits: [], consumptionDays: 30 }
];

export function GroceryPlan({ records, viewingDate }: GroceryPlanProps) {
  const [items, setItems] = useState<GroceryPlanItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [plannedQuantity, setPlannedQuantity] = useState('');
  const [unitSize, setUnitSize] = useState('');
  const [frequency, setFrequency] = useState<GroceryPlanItem['frequency']>('Weekly');
  const [idealTiming, setIdealTiming] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [consumptionDays, setConsumptionDays] = useState('');
  const [editingItem, setEditingItem] = useState<GroceryPlanItem | null>(null);

  const currentMonthKey = useMemo(() => {
    return `${viewingDate.getFullYear()}-${(viewingDate.getMonth() + 1).toString().padStart(2, '0')}`;
  }, [viewingDate]);

  useEffect(() => {
    const saved = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_GROCERY_PLAN));
    const isMockSeeded = localStorage.getItem('MOCK_SEEDED_V1');
    if (!isMockSeeded) {
      setItems(MOCK_ITEMS);
      setSyncedItem(SYNC_KEYS.FINANCES_GROCERY_PLAN, JSON.stringify(MOCK_ITEMS));
      localStorage.setItem('MOCK_SEEDED_V1', 'true');
    } else if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed);
      } catch (e) {
        setItems(MOCK_ITEMS);
      }
    } else {
      setItems(MOCK_ITEMS);
      setSyncedItem(SYNC_KEYS.FINANCES_GROCERY_PLAN, JSON.stringify(MOCK_ITEMS));
    }
    setIsLoaded(true);
  }, []);

  const saveItems = (newItems: GroceryPlanItem[]) => {
    setItems(newItems);
    setSyncedItem(SYNC_KEYS.FINANCES_GROCERY_PLAN, JSON.stringify(newItems));
  };

  const currentMonthRecords = useMemo(() => {
    const vMonth = viewingDate.getMonth();
    const vYear = viewingDate.getFullYear();

    return records.filter(r => {
      if (!r.date) return false;
      const [rYear, rMonth] = r.date.split('-');
      return parseInt(rMonth) - 1 === vMonth && parseInt(rYear) === vYear && r.category === 'Grocery';
    });
  }, [records, viewingDate]);

  const loggedQuantitiesByName = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthRecords.forEach(record => {
      if (record.items && record.items.length > 0) {
        record.items.forEach(item => {
          const n = item.name.toLowerCase();
          const q = parseFloat(item.quantity) || 1;
          if (!map[n]) map[n] = 0;
          map[n] += q;
        });
      } else {
        const n = (record.subcategory || record.category).toLowerCase();
        const q = parseFloat(record.quantity || '1') || 1;
        if (!map[n]) map[n] = 0;
        map[n] += q;
      }
    });
    return map;
  }, [currentMonthRecords]);

  const { plannedTotalCAD, projectedTotalCAD } = useMemo(() => {
    let planned = 0;
    let projected = 0;
    items.forEach(item => {
      const isSkipped = item.skippedMonths?.includes(currentMonthKey);
      if (isSkipped) return; // Completely ignore skilled items for the month

      const planCost = item.expectedPrice * item.plannedQuantity;
      planned += planCost;

      const loggedQty = loggedQuantitiesByName[item.name.toLowerCase()] || 0;
      if (loggedQty > item.plannedQuantity) {
        projected += item.expectedPrice * loggedQty;
      } else {
        projected += planCost;
      }
    });

    const plannedNames = items.map(i => i.name.toLowerCase());
    currentMonthRecords.forEach(record => {
      if (record.items && record.items.length > 0) {
        record.items.forEach(item => {
          if (!plannedNames.includes(item.name.toLowerCase())) {
            projected += item.totalPrice;
          }
        });
      } else {
        const n = (record.subcategory || record.category).toLowerCase();
        if (!plannedNames.includes(n)) {
          projected += record.amount;
        }
      }
    });

    return { 
      plannedTotalCAD: planned, 
      projectedTotalCAD: projected
    };
  }, [items, currentMonthRecords, loggedQuantitiesByName, currentMonthKey]);

  const handleEdit = (item: GroceryPlanItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category || DEFAULT_CATEGORIES[0]);
    setPlannedQuantity(item.plannedQuantity.toString());
    setUnitSize(item.unitSize);
    setFrequency(item.frequency);
    setIdealTiming(item.idealTiming || '');
    setExpectedPrice(item.expectedPrice.toString());
    setConsumptionDays(item.consumptionDays?.toString() || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(plannedQuantity) || 1;
    
    if (editingItem) {
      const updatedItems = items.map(i => {
        if (i.id === editingItem.id) {
          return {
            ...i,
            name: name.trim(),
            category,
            plannedQuantity: qty,
            unitSize,
            frequency,
            idealTiming,
            expectedPrice: parseFloat(expectedPrice) || 0,
            consumptionDays: parseInt(consumptionDays) || 0,
          };
        }
        return i;
      });
      saveItems(updatedItems);
      setEditingItem(null);
    } else {
      const newItem: GroceryPlanItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        category,
        plannedQuantity: qty,
        unitSize,
        frequency,
        idealTiming,
        expectedPrice: parseFloat(expectedPrice) || 0,
        checkedUnits: new Array(Math.ceil(qty)).fill('pending'),
        consumptionDays: parseInt(consumptionDays) || 0,
        skippedMonths: []
      };
      saveItems([...items, newItem]);
    }
    
    setName('');
    setPlannedQuantity('');
    setUnitSize('');
    setFrequency('Weekly');
    setIdealTiming('');
    setExpectedPrice('');
    setConsumptionDays('');
    setIsFormOpen(false);
  };

  const deleteItem = (id: string) => {
    saveItems(items.filter(i => i.id !== id));
  };

  const toggleCheckboxGrid = (itemId: string, index: number) => {
    const newItems = items.map(i => {
      if (i.id === itemId) {
        const statuses = [...(i.checkedUnits || new Array(Math.ceil(i.plannedQuantity)).fill('pending'))];
        const current = statuses[index] || 'pending';
        
        let next: 'bought' | 'skipped' | 'pending' = 'pending';
        if (current === 'pending') next = 'bought';
        else if (current === 'bought') next = 'skipped';
        else next = 'pending';

        statuses[index] = next;
        return { ...i, checkedUnits: statuses };
      }
      return i;
    });
    saveItems(newItems);
  };

  const toggleSkipMonth = (id: string) => {
    const newItems = items.map(i => {
      if (i.id === id) {
        const skipped = i.skippedMonths || [];
        if (skipped.includes(currentMonthKey)) {
          return { ...i, skippedMonths: skipped.filter(m => m !== currentMonthKey) };
        } else {
          return { ...i, skippedMonths: [...skipped, currentMonthKey] };
        }
      }
      return i;
    });
    saveItems(newItems);
  };

  // Group items by category for the table
  const groupedItems = useMemo(() => {
    const groups: Record<string, GroceryPlanItem[]> = {};
    DEFAULT_CATEGORIES.forEach(c => groups[c] = []);
    items.forEach(item => {
      const cat = item.category || '📦 Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [items]);

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 delay-100">
      
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 md:p-8 bg-zinc-900 dark:bg-zinc-800 rounded-[40px] text-white shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -mr-10 -mt-20 pointer-events-none" />
         
         <div className="flex flex-col gap-2 relative z-10">
            <h2 className="text-2xl font-bold uppercase tracking-[0.2em]">Monthly Grocery Plan</h2>
            <p className="text-sm text-zinc-400 font-medium max-w-sm">Compact table tracking for planned food budget vs actual spending.</p>
         </div>

         <div className="flex gap-4 md:gap-8 relative z-10">
            <div className="flex flex-col items-start md:items-end">
               <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Planned Cost</span>
               <span className="text-2xl md:text-3xl font-bold tracking-tight">
                  ${plannedTotalCAD.toLocaleString('en-CA', { maximumFractionDigits: 0 })}
               </span>
            </div>
            <div className="w-px h-12 bg-zinc-800 hidden md:block" />
            <div className="flex flex-col items-start md:items-end">
               <span className="text-xs uppercase tracking-widest text-teal-500/80 font-bold">Projected</span>
               <span className="text-2xl md:text-3xl font-bold tracking-tight text-teal-400">
                  ${projectedTotalCAD.toLocaleString('en-CA', { maximumFractionDigits: 0 })}
               </span>
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[40px] p-6 lg:p-8 shadow-xl flex flex-col gap-8">
         <div className="flex justify-between items-center">
            <h3 className="uppercase tracking-[0.3em] font-bold text-sm text-zinc-400">Master Grocery List</h3>
            <button 
              onClick={() => {
                if (isFormOpen) {
                  setEditingItem(null);
                  setName('');
                  setPlannedQuantity('');
                  setUnitSize('');
                  setFrequency('Weekly');
                  setIdealTiming('');
                  setExpectedPrice('');
                  setConsumptionDays('');
                }
                setIsFormOpen(!isFormOpen);
              }}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-zinc-600 dark:text-zinc-300 shadow-sm"
            >
              {isFormOpen ? 'Cancel' : '➕ Add Item'}
            </button>
         </div>

         {/* Add/Edit Item Form */}
         {isFormOpen && (
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-4 duration-300">
              <div className="col-span-full">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-2">
                    {editingItem ? 'Edit Grocery Item' : 'Add New Item to Plan'}
                 </h4>
              </div>
              <div className="lg:col-span-2 flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Item Name</label>
                 <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Milk" className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm focus:ring-2 focus:ring-teal-500/20" />
              </div>
              <div className="lg:col-span-1 flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Category</label>
                 <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm appearance-none focus:ring-2 focus:ring-teal-500/20">
                    {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
              
              <div className="lg:col-span-2 flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Unit Expected Price</label>
                 <input required type="number" step="0.01" value={expectedPrice} onChange={e => setExpectedPrice(e.target.value)} placeholder="0.00" className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm focus:ring-2 focus:ring-teal-500/20" />
              </div>

              <div className="lg:col-span-1 flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Total Units (Planned)</label>
                 <input required type="number" min="0" step="0.1" value={plannedQuantity} onChange={e => setPlannedQuantity(e.target.value)} placeholder="e.g. 1.5" className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm focus:ring-2 focus:ring-teal-500/20" />
              </div>

              <div className="lg:col-span-1 flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Unit Size</label>
                 <input type="text" value={unitSize} onChange={e => setUnitSize(e.target.value)} placeholder="e.g. 1kg" className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm focus:ring-2 focus:ring-teal-500/20" />
              </div>

              <div className="lg:col-span-1 flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Consumption (Days)</label>
                 <input type="number" value={consumptionDays} onChange={e => setConsumptionDays(e.target.value)} placeholder="e.g. 7 (for 1 week)" className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm focus:ring-2 focus:ring-teal-500/20" />
              </div>

              <div className="lg:col-span-1 flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Frequency</label>
                 <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm appearance-none focus:ring-2 focus:ring-teal-500/20">
                    <option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Bi-Weekly">Bi-Weekly</option><option value="Monthly">Monthly</option><option value="As Needed">As Needed</option>
                 </select>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Ideal Timing</label>
                 <input type="text" value={idealTiming} onChange={e => setIdealTiming(e.target.value)} placeholder="e.g. Every Sunday" className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm focus:ring-2 focus:ring-teal-500/20" />
              </div>

              <div className="col-span-full flex justify-end mt-1">
                 <button type="submit" className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all">
                    Save Plan Item
                 </button>
              </div>
           </form>
         )}

         {/* Compact Grouped Table */}
         <div className="overflow-x-auto overflow-y-auto max-h-[800px] border border-zinc-100 dark:border-zinc-800 rounded-3xl custom-scrollbar relative">
            <table className="w-full text-left border-collapse min-w-[800px]">
               <thead className="bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-20 shadow-sm border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                     <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Grocery Item</th>
                     <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Freq & Size</th>
                     <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Est. Price ea</th>
                     <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 w-48">Tracker Progress</th>
                     <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Total Est.</th>
                     <th className="p-4"></th>
                  </tr>
               </thead>
               <tbody>
                  {Object.entries(groupedItems).map(([categoryName, catItems]) => {
                     if (catItems.length === 0) return null;
                     return (
                        <React.Fragment key={categoryName}>
                           {/* Category Header Row */}
                           <tr className="bg-zinc-100/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800">
                              <td colSpan={6} className="px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-300">
                                 {categoryName}
                              </td>
                           </tr>
                           
                           {/* Items */}
                           {catItems.map((item) => {
                              const isSkipped = item.skippedMonths?.includes(currentMonthKey);
                              const loggedQty = loggedQuantitiesByName[item.name.toLowerCase()] || 0;
                              const isExceeded = loggedQty > item.plannedQuantity && !isSkipped;
                              
                              const localCost = item.expectedPrice * item.plannedQuantity;
                              
                              const progressPct = Math.min(100, (loggedQty / item.plannedQuantity) * 100);

                              return (
                                 <tr key={item.id} className={`group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/50 transition-all ${isSkipped ? 'opacity-50 grayscale' : isExceeded ? 'bg-rose-50/30 dark:bg-rose-900/10' : ''}`}>
                                    <td className="p-4 max-w-[200px]">
                                       <div className="flex flex-col gap-0.5">
                                          <span className={`font-bold text-sm truncate ${isSkipped ? 'line-through text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}>{item.name}</span>
                                          {item.consumptionDays ? <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium truncate">Consumes in {item.consumptionDays} days</span> : <span className="text-[10px] text-zinc-400 font-medium">No limit</span>}
                                       </div>
                                    </td>
                                    <td className="p-4">
                                       <div className="flex flex-col gap-0.5">
                                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{item.plannedQuantity} × {item.unitSize || '1 Unit'}</span>
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">{item.frequency}</span>
                                       </div>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                       {"$"}{item.expectedPrice.toLocaleString("en-CA")}
                                    </td>
                               <td className="p-4">
                                       {isSkipped ? (
                                          <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg text-zinc-500">Skipped for {viewingDate.toLocaleString('default', { month: 'short' })}</span>
                                       ) : (
                                          <div className="flex flex-wrap gap-1.5 items-center">
                                             <span className={`text-[10px] font-bold w-6 mr-1 ${isExceeded ? 'text-rose-500' : 'text-zinc-400'}`}>
                                                {loggedQty} / {item.plannedQuantity}
                                             </span>
                                             {Array.from({ length: Math.ceil(item.plannedQuantity) }).map((_, i) => {
                                                const autoFilled = loggedQty > i;
                                                const unitStatuses = item.checkedUnits || [];
                                                const status = unitStatuses[i] || 'pending';
                                                
                                                const isBought = status === 'bought' || autoFilled;
                                                const isSkippedUnit = status === 'skipped';

                                                return (
                                                   <button 
                                                      key={i} type="button" 
                                                      onClick={() => toggleCheckboxGrid(item.id, i)}
                                                      className={`w-5 h-5 rounded flex items-center justify-center transition-all 
                                                         ${isBought ? (autoFilled ? 'bg-teal-500 shadow text-white' : 'bg-zinc-800 text-white shadow-sm') : 
                                                           isSkippedUnit ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500 border border-rose-200 dark:border-rose-800' :
                                                           'bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/50 dark:border-zinc-700/50'}`}
                                                   >
                                                      {isBought && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                      {isSkippedUnit && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                                                   </button>
                                                );
                                             })}
                                          </div>
                                       )}
                                    </td>
                                    <td className="p-4 text-right">
                                       <div className="flex flex-col items-end gap-0.5">
                                          <span className={`text-sm font-bold tracking-tight ${isSkipped ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-white'}`}>
                                                 ${localCost.toLocaleString("en-CA", { maximumFractionDigits: 1 })}
                                          </span>
                                       </div>
                                    </td>
                                    <td className="p-4 text-right">
                                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                             onClick={() => handleEdit(item)}
                                             className="p-2 text-zinc-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-all"
                                             title="Edit Item"
                                          >
                                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                          </button>
                                          <button 
                                             onClick={() => toggleSkipMonth(item.id)}
                                             className="p-2 text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-all"
                                             title={isSkipped ? 'Unskip' : 'Skip for this month'}
                                          >
                                             {isSkipped ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> // Undo
                                             ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> // Cross
                                             )}
                                          </button>
                                          <button 
                                             onClick={() => deleteItem(item.id)}
                                             className="p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all"
                                          >
                                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                          </button>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </React.Fragment>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
