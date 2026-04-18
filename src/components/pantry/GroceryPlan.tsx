"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GroceryPlanItem, ExpenseRecord, ManualCheck } from '@/types/finance';
import { List, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { getPrefixedKey } from '@/lib/keys';
import { setSyncedItem } from '@/lib/storage';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { SectionTitle, Text } from '../ui/Text';

interface GroceryPlanProps {
 records: ExpenseRecord[];
 viewingDate: Date;
 onDateChange: (date: Date) => void;
}

const DEFAULT_CATEGORIES = [
 'Dairy & Refrigerated',
 'Protein (Meat & Alternatives)',
 'Grains & Staples',
 'Vegetables',
 'Fruits',
 'Essentials',
 'Household Items',
 'Other'
];

const MOCK_ITEMS: GroceryPlanItem[] = [
 // Dairy & Refrigerated
 { id: 'h1', name: 'Dishwasher Soap', category: 'Household Items', plannedQuantity: 1, unitSize: 'Pack', frequency: 'Monthly', idealTiming: '', expectedPrice: 8, checkedUnits: [], consumptionDays: 30 }
];

export function GroceryPlan({ records, viewingDate, onDateChange }: GroceryPlanProps) {
 const month = viewingDate.getMonth();
 const year = viewingDate.getFullYear();

 const prevMonth = () => onDateChange(new Date(year, month - 1, 1));
 const nextMonth = () => onDateChange(new Date(year, month + 1, 1));
 const prevYear = () => onDateChange(new Date(year - 1, month, 1));
 const nextYear = () => onDateChange(new Date(year + 1, month, 1));

 const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(viewingDate);

 const [items, setItems] = useState<GroceryPlanItem[]>([]);
 const [isLoaded, setIsLoaded] = useState(false);
 const [isFormOpen, setIsFormOpen] = useState(false);
 const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

 const [formData, setFormData] = useState({
  name: '',
  category: DEFAULT_CATEGORIES[0],
  plannedQuantity: '',
  unitSize: '',
  frequency: 'Weekly',
  idealTiming: '',
  expectedPrice: '',
  consumptionDays: ''
 });
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

 useEffect(() => {
  const savedViewMode = localStorage.getItem('pantry_grocery_view_mode') as 'table' | 'card';
  if (savedViewMode) setViewMode(savedViewMode);
 }, []);

 const toggleViewMode = (mode: 'table' | 'card') => {
  setViewMode(mode);
  localStorage.setItem('pantry_grocery_view_mode', mode);
 };

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

 const activeStockByName = useMemo(() => {
   const map: Record<string, number> = {};
   const viewTime = viewingDate.getTime();

   items.forEach(planItem => {
     const name = planItem.name.toLowerCase();
     const consumption = planItem.consumptionDays || 30;
     let activeQty = 0;

     records.forEach(record => {
       const recordDate = new Date(record.date);
       const recordTime = recordDate.getTime();
       if (recordTime > viewTime) return;

       let qty = 0;
       if (record.items && record.items.length > 0) {
         const match = record.items.find(ri => ri.name.toLowerCase() === name);
         if (match) qty = parseFloat(match.quantity) || 1;
       } else if ((record.subcategory || record.category).toLowerCase() === name) {
         qty = parseFloat(record.quantity || '1') || 1;
       }

       if (qty > 0) {
         const daysPassed = (viewTime - recordTime) / (1000 * 60 * 60 * 24);
         const remainingUnits = Math.max(0, qty - (daysPassed / consumption));
         activeQty += remainingUnits;
       }
     });
     map[name] = activeQty;
   });
   return map;
 }, [items, records, viewingDate]);

 const { plannedTotalCAD, projectedTotalCAD } = useMemo(() => {
  let planned = 0;
  let projected = 0;
  items.forEach(item => {
   const isSkipped = item.skippedMonths?.includes(currentMonthKey);
   if (isSkipped) return;

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
  setFormData({
   name: item.name,
   category: item.category || DEFAULT_CATEGORIES[0],
   plannedQuantity: item.plannedQuantity.toString(),
   unitSize: item.unitSize || '',
   frequency: item.frequency || 'Weekly',
   idealTiming: item.idealTiming || '',
   expectedPrice: item.expectedPrice.toString(),
   consumptionDays: item.consumptionDays?.toString() || ''
  });
  setIsFormOpen(true);
 };

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const qty = parseFloat(formData.plannedQuantity) || 1;
  
  if (editingItem) {
   const updatedItems = items.map(i => {
    if (i.id === editingItem.id) {
     return {
      ...i,
      name: formData.name.trim(),
      category: formData.category,
      plannedQuantity: qty,
      unitSize: formData.unitSize,
      frequency: formData.frequency as any,
      idealTiming: formData.idealTiming,
      expectedPrice: parseFloat(formData.expectedPrice) || 0,
      consumptionDays: parseInt(formData.consumptionDays) || 0,
     };
    }
    return i;
   });
   saveItems(updatedItems);
   setEditingItem(null);
  } else {
   const newItem: GroceryPlanItem = {
    id: Math.random().toString(36).substr(2, 9),
    name: formData.name.trim(),
    category: formData.category,
    plannedQuantity: qty,
    unitSize: formData.unitSize,
    frequency: formData.frequency as any,
    idealTiming: formData.idealTiming,
    expectedPrice: parseFloat(formData.expectedPrice) || 0,
    checkedUnits: new Array(Math.ceil(qty)).fill('pending'),
    consumptionDays: parseInt(formData.consumptionDays) || 0,
    skippedMonths: []
   };
   saveItems([...items, newItem]);
  }
  
  setFormData({
   name: '',
   category: DEFAULT_CATEGORIES[0],
   plannedQuantity: '',
   unitSize: '',
   frequency: 'Weekly',
   idealTiming: '',
   expectedPrice: '',
   consumptionDays: ''
  });
  setIsFormOpen(false);
 };

 const deleteItem = (id: string) => {
  saveItems(items.filter(i => i.id !== id));
 };

 const toggleCheckboxGrid = (itemId: string, index: number) => {
  const newItems = items.map(i => {
   if (i.id === itemId) {
    const statuses = [...(i.checkedUnits || new Array(Math.ceil(i.plannedQuantity)).fill('pending'))];
    const currentVal = statuses[index] || 'pending';
    const currentStatus = typeof currentVal === 'string' ? currentVal : (currentVal as ManualCheck).status;
    
    let nextStatus: 'bought' | 'skipped' | 'pending' = 'pending';
    if (currentStatus === 'pending') nextStatus = 'bought';
    else if (currentStatus === 'bought') nextStatus = 'skipped';
    else nextStatus = 'pending';

    statuses[index] = { 
      status: nextStatus, 
      date: nextStatus === 'bought' ? new Date().toISOString() : undefined 
    };
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

 const groupedItems = useMemo(() => {
  const groups: Record<string, GroceryPlanItem[]> = {};
  DEFAULT_CATEGORIES.forEach(c => groups[c] = []);
  items.forEach(item => {
   const cat = item.category || 'Other';
   const cleanCat = cat.replace(/[\u1000-\uFFFF]+/g, '').trim();
   const finalCat = DEFAULT_CATEGORIES.find(c => c === cleanCat) || cleanCat;
   if (!groups[finalCat]) groups[finalCat] = [];
   groups[finalCat].push(item);
  });
  return groups;
 }, [items]);

 const CardItem = ({ item }: { item: GroceryPlanItem }) => {
  const isSkipped = item.skippedMonths?.includes(currentMonthKey);
  const loggedQty = loggedQuantitiesByName[item.name.toLowerCase()] || 0;
  const isExceeded = loggedQty > item.plannedQuantity && !isSkipped;
  const localCost = item.expectedPrice * item.plannedQuantity;

  return (
   <div 
    key={item.id} 
    className={`p-5 rounded-2xl border transition-all flex flex-col gap-4 shadow-sm ${isSkipped ? 'opacity-50 grayscale bg-zinc-50 dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-800' : isExceeded ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'}`}
   >
    <div className="flex justify-between items-start">
     <div className="flex flex-col gap-1">
      <span className={`text-base font-semibold ${isSkipped ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-white'}`}>
       {item.name}
      </span>
      <div className="flex items-center gap-2">
       <span className="text-xs font-semibold uppercase text-zinc-500">
        {item.plannedQuantity} × {item.unitSize || 'Unit'} • {item.frequency}
       </span>
      </div>
     </div>
     <div className="flex flex-col items-end">
      <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
       ${localCost.toLocaleString("en-CA", { maximumFractionDigits: 1 })}
      </span>
      <span className="text-[11px] font-semibold uppercase text-zinc-400">Total Est.</span>
     </div>
    </div>

    {!isSkipped && (
     <div className="bg-zinc-50/50 dark:bg-zinc-800/20 p-4 rounded-2xl flex flex-col gap-3">
      <div className="flex justify-between items-center">
       <span className="text-xs font-semibold uppercase text-zinc-400">Tracker Progress</span>
       <span className={`text-xs font-semibold ${isExceeded ? 'text-rose-500' : 'text-teal-500'}`}>
        {loggedQty} / {item.plannedQuantity}
       </span>
      </div>
      <div className="flex flex-wrap gap-2">
       {Array.from({ length: Math.ceil(item.plannedQuantity) }).map((_, i) => {
        const activeQty = activeStockByName[item.name.toLowerCase()] || 0;
        const autoFilled = activeQty > i;
        
        const rawStatus = (item.checkedUnits || [])[i] || 'pending';
        let status = typeof rawStatus === 'string' ? rawStatus : rawStatus.status;
        let checkDate = typeof rawStatus === 'string' ? null : rawStatus.date;
        
        // Manual expiration check
        if (status === 'bought' && checkDate && item.consumptionDays) {
         const daysPassed = (viewingDate.getTime() - new Date(checkDate).getTime()) / (1000 * 60 * 60 * 24);
         if (daysPassed >= item.consumptionDays) status = 'pending';
        }

        const isBought = status === 'bought' || autoFilled;
        const isSkippedUnit = status === 'skipped';
        
        return (
         <button 
          key={i} 
          onClick={() => toggleCheckboxGrid(item.id, i)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isBought ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md scale-105' : isSkippedUnit ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-500 border border-rose-200 dark:border-rose-900' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'}`}
         >
          {isBought && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          {isSkippedUnit && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
         </button>
        );
       })}
      </div>
     </div>
    )}

    <div className="flex justify-between items-center pt-2">
     {item.consumptionDays ? (
      <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold uppercase italic">Consumes in {item.consumptionDays} days</span>
     ) : <div />}
     <button 
      onClick={() => handleEdit(item)}
      className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 rounded-xl text-xs font-semibold uppercase text-zinc-600 dark:text-zinc-300 transition-all border border-zinc-200/50 dark:border-zinc-700/50"
     >
      Edit
     </button>
    </div>
   </div>
  );
 };

 if (!isLoaded) return null;

 return (
  <div className="flex flex-col gap-6 animate-in fade-in duration-700 delay-100">
   
   {/* Header & Metrics */}
   <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-6 p-6 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white shadow-sm relative overflow-hidden">
    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 dark:bg-teal-500/10 rounded-full blur-3xl -mr-10 -mt-20 pointer-events-none" />
    
    <div className="flex flex-col gap-1 relative z-10 w-full md:w-auto text-center md:text-left">
     <SectionTitle>Monthly Grocery Plan</SectionTitle>
     <p className="hidden md:block text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-sm">Compact table tracking for planned food budget vs actual spending.</p>
    </div>

    <div className="flex w-full md:w-auto gap-0 md:gap-8 relative z-10">
     <div className="flex-1 flex flex-col items-center md:items-end gap-1 md:gap-0">
      <span className="text-xs uppercase text-zinc-500 dark:text-zinc-500 font-semibold whitespace-nowrap">Planned Cost</span>
      <span className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
       ${plannedTotalCAD.toLocaleString('en-CA', { maximumFractionDigits: 0 })}
      </span>
     </div>
     <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800 md:block hidden mx-4" />
     <div className="flex-1 flex flex-col items-center md:items-end gap-1 md:gap-0">
      <span className="text-xs uppercase text-teal-600 dark:text-teal-500/80 font-semibold">Projected</span>
      <span className="text-2xl md:text-3xl font-bold text-teal-600 dark:text-teal-400">
       ${projectedTotalCAD.toLocaleString('en-CA', { maximumFractionDigits: 0 })}
      </span>
     </div>
    </div>
   </div>

   <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 lg:p-8 shadow-sm flex flex-col gap-8">
    <div className="flex justify-between items-center px-1">
     <h3 className="uppercase font-semibold text-sm text-zinc-400">Master Grocery List</h3>
     <div className="flex items-center gap-3">
      {/* Month Selector */}
      <div className="flex items-center bg-zinc-50 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
       <button 
        onClick={prevMonth} 
        className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400"
        title="Previous Month"
       >
        <ChevronLeft size={14} />
       </button>
       <div className="px-3 py-1 rounded-lg text-zinc-900 dark:text-zinc-100">
        <Text variant="label" as="span" className="font-bold text-[10px] uppercase tracking-wider">
         {monthName}
        </Text>
       </div>
       <button 
        onClick={nextMonth} 
        className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400"
        title="Next Month"
       >
        <ChevronRight size={14} />
       </button>
      </div>

      {/* Year Selector */}
      <div className="flex items-center bg-zinc-50 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
       <button 
        onClick={prevYear} 
        className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400"
        title="Previous Year"
       >
        <ChevronLeft size={14} />
       </button>
       <div className="px-3 py-1 rounded-lg text-zinc-900 dark:text-zinc-100">
        <Text variant="label" as="span" className="font-bold text-[10px] uppercase tracking-wider">
         {year}
        </Text>
       </div>
       <button 
        onClick={nextYear} 
        className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400"
        title="Next Year"
       >
        <ChevronRight size={14} />
       </button>
      </div>

      <div className="flex items-center bg-zinc-50 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
       <button onClick={() => toggleViewMode('table')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}><List size={14} />Table</button>
       <button onClick={() => toggleViewMode('card')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${viewMode === 'card' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}><LayoutGrid size={14} />Cards</button>
      </div>
      <button onClick={() => { if (isFormOpen) { setEditingItem(null); setFormData({ name: '', category: DEFAULT_CATEGORIES[0], plannedQuantity: '', unitSize: '', frequency: 'Weekly', idealTiming: '', expectedPrice: '', consumptionDays: '' }); } setIsFormOpen(!isFormOpen); }} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-semibold uppercase transition-all text-zinc-600 dark:text-zinc-300 shadow-sm">{isFormOpen ? 'Cancel' : '+ Add Item'}</button>
     </div>
    </div>

    {/* Add/Edit Item Modal */}
    <Modal
     isOpen={isFormOpen}
     onClose={() => { setEditingItem(null); setIsFormOpen(false); setFormData({ name: '', category: DEFAULT_CATEGORIES[0], plannedQuantity: '', unitSize: '', frequency: 'Weekly', idealTiming: '', expectedPrice: '', consumptionDays: '' }); }}
     title={editingItem ? 'Edit Grocery Item' : 'Add New Item'}
     onSubmit={handleSubmit}
     submitText={editingItem ? 'Save Changes' : 'Create Item'}
     accentColor="amber"
    >
     <DynamicForm
      sections={[{ id: 'details', title: 'Item Details', fields: [ { name: 'name', label: 'Item Name', type: 'text', required: true, fullWidth: true, placeholder: 'e.g. Milk' }, { name: 'category', label: 'Category', type: 'select', options: DEFAULT_CATEGORIES.map(c => ({ value: c, label: c })) }, { name: 'expectedPrice', label: 'Unit Expected Price ($)', type: 'number', step: '0.01', required: true, placeholder: '0.00' }, { name: 'plannedQuantity', label: 'Total Units (Planned)', type: 'number', step: '0.1', required: true, placeholder: 'e.g. 1.5' }, { name: 'unitSize', label: 'Unit Size', type: 'text', placeholder: 'e.g. 1kg or 4L' }, { name: 'consumptionDays', label: 'Consumption Days (Per Unit)', type: 'number', placeholder: 'How many days 1 unit lasts' }, { name: 'frequency', label: 'Frequency', type: 'select', options: ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'As Needed'].map(f => ({ value: f, label: f })) }, { name: 'idealTiming', label: 'Ideal Timing', type: 'text', placeholder: 'e.g. Every Sunday' } ] }]}
      formData={formData}
      accentColor="amber"
      onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
     />
     {editingItem && (
      <div className="mt-4 flex justify-start w-full">
       <button type="button" onClick={() => { deleteItem(editingItem.id); setIsFormOpen(false); }} className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors">Delete Item</button>
      </div>
     )}
    </Modal>

    {/* Scrollable Content Container */}
    <div className="overflow-y-auto max-h-[500px] md:max-h-[600px] pr-2 -mr-2 custom-scrollbar flex flex-col gap-8">
     {viewMode === 'table' ? (
      <>
       {/* Desktop Table View */}
       <div className="hidden md:block overflow-x-auto border border-zinc-100 dark:border-zinc-800 rounded-2xl relative">
        <table className="w-full text-left border-collapse min-w-[800px]">
         <thead className="bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-20 shadow-sm border-b border-zinc-100 dark:border-zinc-800">
          <tr>
           <th className="p-4 text-xs font-semibold uppercase text-zinc-500">Grocery Item</th>
           <th className="p-4 text-xs font-semibold uppercase text-zinc-500">Freq & Size</th>
           <th className="p-4 text-xs font-semibold uppercase text-zinc-500">Est. Price ea</th>
           <th className="p-4 text-xs font-semibold uppercase text-zinc-500 w-48">Tracker Progress</th>
           <th className="p-4 text-xs font-semibold uppercase text-zinc-500 text-right">Total Est.</th>
           <th className="p-4"></th>
          </tr>
         </thead>
         <tbody>
          {Object.entries(groupedItems).map(([categoryName, catItems]) => {
           if (catItems.length === 0) return null;
           return (
            <React.Fragment key={categoryName}>
             <tr className="bg-zinc-100/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800">
              <td colSpan={6} className="px-5 py-3 text-xs font-semibold uppercase text-zinc-600 dark:text-zinc-300">{categoryName}</td>
             </tr>
             {catItems.map((item) => {
              const isSkipped = item.skippedMonths?.includes(currentMonthKey);
              const loggedQty = loggedQuantitiesByName[item.name.toLowerCase()] || 0;
              const isExceeded = loggedQty > item.plannedQuantity && !isSkipped;
              const localCost = item.expectedPrice * item.plannedQuantity;
              return (
               <tr key={item.id} className={`group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/50 transition-all ${isSkipped ? 'opacity-50 grayscale' : isExceeded ? 'bg-rose-50/30 dark:bg-rose-900/10' : ''}`}>
                <td className="p-4 max-w-[200px]">
                 <div className="flex flex-col gap-0.5">
                  <span className={`font-semibold text-sm truncate ${isSkipped ? 'line-through text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}>{item.name}</span>
                  {item.consumptionDays ? <span className="text-xs text-teal-600 dark:text-teal-400 font-medium truncate">Consumes in {item.consumptionDays} days</span> : <span className="text-xs text-zinc-400 font-medium">No limit</span>}
                 </div>
                </td>
                <td className="p-4">
                 <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{item.plannedQuantity} × {item.unitSize || '1 Unit'}</span>
                  <span className="text-xs uppercase font-semibold text-zinc-400">{item.frequency}</span>
                 </div>
                </td>
                <td className="p-4 text-xs font-semibold text-zinc-600 dark:text-zinc-400">${item.expectedPrice.toLocaleString("en-CA")}</td>
                <td className="p-4">
                 {isSkipped ? (
                  <span className="text-xs font-semibold uppercase bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg text-zinc-500">Skipped</span>
                 ) : (
                  <div className="flex flex-wrap gap-1.5 items-center">
                   <span className={`text-xs font-semibold w-6 mr-1 ${isExceeded ? 'text-rose-500' : 'text-zinc-400'}`}>{Math.round(activeStockByName[item.name.toLowerCase()] || 0)}/{item.plannedQuantity}</span>
                   {Array.from({ length: Math.ceil(item.plannedQuantity) }).map((_, i) => {
                    const activeQty = activeStockByName[item.name.toLowerCase()] || 0;
                    const autoFilled = activeQty > i;
                    
                    const rawStatus = (item.checkedUnits || [])[i] || 'pending';
                    let status = typeof rawStatus === 'string' ? rawStatus : rawStatus.status;
                    let checkDate = typeof rawStatus === 'string' ? null : rawStatus.date;
                    
                    if (status === 'bought' && checkDate && item.consumptionDays) {
                      const daysPassed = (viewingDate.getTime() - new Date(checkDate).getTime()) / (1000 * 60 * 60 * 24);
                      if (daysPassed >= item.consumptionDays) status = 'pending';
                    }

                    const isBought = status === 'bought' || autoFilled;
                    const isSkippedUnit = status === 'skipped';
                    return (
                     <button key={i} type="button" onClick={() => toggleCheckboxGrid(item.id, i)} className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isBought ? (autoFilled ? 'bg-teal-500 shadow text-white' : 'bg-zinc-800 text-white shadow-sm') : isSkippedUnit ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500 border border-rose-200 dark:border-rose-800' : 'bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/50 dark:border-zinc-700/50'}`}>
                      {isBought && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      {isSkippedUnit && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                     </button>
                    );
                   })}
                  </div>
                 )}
                </td>
                <td className="p-4 text-right">
                 <span className={`text-sm font-semibold ${isSkipped ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-white'}`}>${localCost.toLocaleString("en-CA", { maximumFractionDigits: 1 })}</span>
                </td>
                <td className="p-4 text-right">
                 <button onClick={() => handleEdit(item)} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-zinc-900 rounded-xl text-xs font-semibold uppercase transition-all shadow-sm opacity-0 group-hover:opacity-100">Edit</button>
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

       {/* Mobile Cards View (Visible on mobile by default in Table mode) */}
       <div className="md:hidden flex flex-col gap-6">
        {Object.entries(groupedItems).map(([categoryName, catItems]) => {
         if (catItems.length === 0) return null;
         return (
          <div key={categoryName} className="flex flex-col gap-4">
           <div className="flex items-center gap-3 px-2">
            <span className="text-xs font-semibold uppercase text-zinc-400">{categoryName}</span>
            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
           </div>
           <div className="grid gap-4">
            {catItems.map((item) => <CardItem key={item.id} item={item} />)}
           </div>
          </div>
         );
        })}
       </div>
      </>
     ) : (
      /* Card Grid View (Active for all screen sizes) */
      <div className="flex flex-col gap-10">
       {Object.entries(groupedItems).map(([categoryName, catItems]) => {
        if (catItems.length === 0) return null;
        return (
         <div key={categoryName} className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2">
           <span className="text-xs font-semibold uppercase text-zinc-400 tracking-wider font-bold">{categoryName}</span>
           <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {catItems.map((item) => <CardItem key={item.id} item={item} />)}
          </div>
         </div>
        );
       })}
      </div>
     )}
    </div>
   </div>
  </div>
 );
}
