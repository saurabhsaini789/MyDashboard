"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GroceryPlanItem, ExpenseRecord } from '@/types/finance';
import { GROCERY_ITEM_CATEGORIES } from '@/lib/constants';
import { List, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { setSyncedItem } from '@/lib/storage';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { SectionTitle, Text } from '../ui/Text';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

interface GroceryPlanProps {
  records: ExpenseRecord[];
  viewingDate: Date;
  onDateChange: (date: Date) => void;
}


export function GroceryPlan({ records, viewingDate, onDateChange }: GroceryPlanProps) {
  const items = useStorageSubscription<GroceryPlanItem[]>(SYNC_KEYS.FINANCES_GROCERY_PLAN, []);
  const viewMode = useStorageSubscription<'table' | 'card'>(SYNC_KEYS.PANTRY_GROCERY_VIEW_MODE, 'table');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    plannedQuantity: string;
    unitSize: string;
    frequency: string;
    idealTiming: string;
    expectedPrice: string;
    consumptionDays: string;
  }>({
    name: '', category: GROCERY_ITEM_CATEGORIES[0], plannedQuantity: '', unitSize: '', frequency: 'Weekly', idealTiming: '', expectedPrice: '', consumptionDays: ''
  });
  const [editingItem, setEditingItem] = useState<GroceryPlanItem | null>(null);

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(viewingDate);
  const year = viewingDate.getFullYear();
  const currentMonthKey = `${year}-${(viewingDate.getMonth() + 1).toString().padStart(2, '0')}`;

  const toggleViewMode = (mode: 'table' | 'card') => setSyncedItem(SYNC_KEYS.PANTRY_GROCERY_VIEW_MODE, mode);

  const saveItems = (newItems: GroceryPlanItem[]) => setSyncedItem(SYNC_KEYS.FINANCES_GROCERY_PLAN, JSON.stringify(newItems));

  const bestPrices = useMemo(() => {
    const map: Record<string, { vendor: string; price: number }> = {};
    records.forEach(record => {
      const vendor = record.vendor || 'Unknown Store';
      if (record.items && record.items.length > 0) {
        record.items.forEach(item => {
          const name = item.name.trim().toLowerCase(); if (!name) return;
          const qty = parseFloat(item.quantity) || 1;
          const price = item.totalPrice > 0 ? (item.totalPrice / qty) : item.unitPrice;
          if (price <= 0 || isNaN(price)) return;
          if (!map[name] || price < map[name].price) map[name] = { vendor, price };
        });
      } else {
        const name = (record.subcategory || record.category).trim().toLowerCase(); if (!name) return;
        const qty = parseFloat(record.quantity || '1') || 1;
        const price = record.amount / qty;
        if (price <= 0 || isNaN(price)) return;
        if (!map[name] || price < map[name].price) map[name] = { vendor, price };
      }
    });
    return map;
  }, [records]);

  const toggleUnit = (item: GroceryPlanItem, unitIndex: number) => {
    const newUnits = [...(item.checkedUnits || Array(Math.ceil(item.plannedQuantity || 1)).fill('pending'))];
    newUnits[unitIndex] = newUnits[unitIndex] === 'bought' ? 'pending' : 'bought';
    saveItems(items.map(i => i.id === item.id ? { ...i, checkedUnits: newUnits } : i));
  };

  const { plannedTotalCAD, projectedTotalCAD } = useMemo(() => {
    let planned = 0;
    let projected = 0;
    items.forEach(item => {
      if (item.skippedMonths?.includes(currentMonthKey)) return;
      const cost = (item.expectedPrice || 0) * (item.plannedQuantity || 0);
      planned += cost;
      projected += cost; // Simplified projection for component logic
    });
    return { plannedTotalCAD: planned, projectedTotalCAD: projected };
  }, [items, currentMonthKey]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div><SectionTitle>Grocery Plan</SectionTitle><Text variant="label" className="mt-1">Budget and tracking for your monthly essentials</Text></div>
        <div className="flex gap-8">
          <div className="flex flex-col items-end"><span className="text-[10px] font-bold uppercase text-zinc-400">Planned</span><span className="text-3xl font-bold">${plannedTotalCAD.toLocaleString()}</span></div>
          <div className="flex flex-col items-end"><span className="text-[10px] font-bold uppercase text-teal-600">Projected</span><span className="text-3xl font-bold text-teal-600">${projectedTotalCAD.toLocaleString()}</span></div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <button onClick={() => onDateChange(new Date(year, viewingDate.getMonth() - 1, 1))}><ChevronLeft size={16}/></button>
            <span className="text-xs font-bold uppercase w-24 text-center">{monthName} {year}</span>
            <button onClick={() => onDateChange(new Date(year, viewingDate.getMonth() + 1, 1))}><ChevronRight size={16}/></button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button onClick={() => toggleViewMode('table')} className={`p-2 rounded-lg ${viewMode==='table'?'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white':'text-zinc-400'}`}><List size={14}/></button>
              <button onClick={() => toggleViewMode('card')} className={`p-2 rounded-lg ${viewMode==='card'?'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white':'text-zinc-400'}`}><LayoutGrid size={14}/></button>
            </div>
            <button onClick={() => setIsFormOpen(true)} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold">+ ITEM</button>
          </div>
        </div>

        <div className="max-h-[500px] md:max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id} className="p-5 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-50 dark:border-zinc-800 relative group">
                <div className="flex justify-between mb-4">
                  <div className="flex flex-col"><span className="font-bold">{item.name}</span><span className="text-[10px] font-bold text-zinc-400 uppercase">{item.category}</span></div>
                  <div className="text-right"><span className="text-lg font-bold text-teal-600">${((item.expectedPrice||0)*(item.plannedQuantity||0)).toLocaleString()}</span></div>
                </div>
                {bestPrices[item.name.trim().toLowerCase()] && (
                   <div className="mb-4 inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-500/10 rounded border border-amber-100 dark:border-amber-500/20 text-[9px] font-black uppercase text-amber-600 dark:text-amber-400">
                      💡 Buy at {bestPrices[item.name.trim().toLowerCase()].vendor} for ${bestPrices[item.name.trim().toLowerCase()].price.toFixed(2)}
                   </div>
                )}
                
                <div className="flex gap-2 mb-4 flex-wrap">
                   {Array.from({ length: Math.ceil(item.plannedQuantity || 1) }).map((_, idx) => {
                     const isBought = (item.checkedUnits && item.checkedUnits[idx] === 'bought');
                     return (
                       <div key={idx} onClick={(e) => { e.stopPropagation(); toggleUnit(item, idx); }} className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${isBought ? 'bg-teal-500 border-teal-500 text-white' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}>
                         {isBought && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                       </div>
                     );
                   })}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{item.plannedQuantity} {item.unitSize} • {item.consumptionDays ? `${item.consumptionDays} days/unit` : item.frequency}</span>
                  <button onClick={() => { setEditingItem(item); setFormData({ name: item.name, category: item.category || GROCERY_ITEM_CATEGORIES[0], plannedQuantity: String(item.plannedQuantity), unitSize: item.unitSize||'', frequency: item.frequency || 'Weekly', idealTiming: item.idealTiming||'', expectedPrice: String(item.expectedPrice), consumptionDays: String(item.consumptionDays||'') }); setIsFormOpen(true); }} className="text-[10px] font-bold uppercase text-zinc-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">Edit</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-zinc-50 dark:bg-zinc-800 text-[10px] text-zinc-500 font-bold uppercase">
                <tr>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {items.map(item => (
                  <tr key={item.id} onClick={() => { setEditingItem(item); setFormData({ name: item.name, category: item.category || GROCERY_ITEM_CATEGORIES[0], plannedQuantity: String(item.plannedQuantity), unitSize: item.unitSize||'', frequency: item.frequency || 'Weekly', idealTiming: item.idealTiming||'', expectedPrice: String(item.expectedPrice), consumptionDays: String(item.consumptionDays||'') }); setIsFormOpen(true); }} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm">{item.name}</span>
                        {bestPrices[item.name.trim().toLowerCase()] && (
                          <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400">💡 {bestPrices[item.name.trim().toLowerCase()].vendor}: ${bestPrices[item.name.trim().toLowerCase()].price.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-[10px] font-bold text-zinc-400 uppercase">{item.category}</span></td>
                    <td className="px-6 py-4">
                       <div className="flex gap-1.5 flex-wrap">
                         {Array.from({ length: Math.ceil(item.plannedQuantity || 1) }).map((_, idx) => {
                           const isBought = (item.checkedUnits && item.checkedUnits[idx] === 'bought');
                           return (
                             <div key={idx} onClick={(e) => { e.stopPropagation(); toggleUnit(item, idx); }} className={`w-4 h-4 rounded-md border flex items-center justify-center cursor-pointer transition-all ${isBought ? 'bg-teal-500 border-teal-500 text-white' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}>
                               {isBought && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                             </div>
                           );
                         })}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-zinc-500">{item.plannedQuantity} {item.unitSize}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-zinc-500">${(item.expectedPrice || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right"><span className="font-bold text-teal-600">${((item.expectedPrice||0)*(item.plannedQuantity||0)).toLocaleString()}</span></td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[10px] font-bold uppercase text-zinc-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      <Modal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingItem(null); }} title="Grocery Item" onSubmit={handleSubmit}>
        <DynamicForm
          sections={[{ id:'d', fields:[
            { name:'name', label:'Name', type:'text', required:true, fullWidth:true },
            { name:'category', label:'Category', type:'select', options:GROCERY_ITEM_CATEGORIES.map(c=>({label:c,value:c})) },
            { name:'expectedPrice', label:'Price', type:'number', required:true },
            { name:'plannedQuantity', label:'Qty', type:'number', required:true },
            { 
              name:'unitSize', 
              label:'Unit', 
              render: (props) => {
                const val = parseFloat(props.value || '') || '';
                const unit = (props.value || '').replace(/[\d.\s]/g, '') || 'unit';
                return (
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Size" 
                      value={val} 
                      onChange={e => props.onChange(props.name, `${e.target.value}${unit}`)}
                      className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold outline-none w-full"
                    />
                    <select 
                      value={unit} 
                      onChange={e => props.onChange(props.name, `${val}${e.target.value}`)}
                      className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold outline-none w-32 uppercase text-zinc-500"
                    >
                      {['kg', 'g', 'L', 'ml', 'unit', 'pack', 'dozen', 'box', 'bottle', 'lb', 'oz'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                );
              }
            },
            { name:'consumptionDays', label:'Consumption (Days/Unit)', type:'number' }
          ]}]}
          formData={formData}
          onChange={(n,v)=>setFormData(p=>({...p,[n]:v}))}
        />
      </Modal>
    </div>
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(formData.plannedQuantity) || 1;
    const newItem: GroceryPlanItem = {
      id: editingItem ? editingItem.id : Math.random().toString(36).substr(2, 9),
      name: formData.name, category: formData.category, plannedQuantity: qty,
      unitSize: formData.unitSize, frequency: formData.frequency as any, idealTiming: formData.idealTiming,
      expectedPrice: parseFloat(formData.expectedPrice) || 0, consumptionDays: parseInt(formData.consumptionDays) || 0,
      checkedUnits: editingItem ? editingItem.checkedUnits : new Array(Math.ceil(qty)).fill('pending'),
      skippedMonths: editingItem ? editingItem.skippedMonths : []
    };
    const updated = editingItem ? items.map(i => i.id === editingItem.id ? newItem : i) : [newItem, ...items];
    saveItems(updated);
    setIsFormOpen(false);
  }
}
