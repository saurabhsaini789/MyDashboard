"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ExpenseRecord, ExpenseItem, ExpenseCategory, Asset, PaymentMethod } from '@/types/finance';
import { PANTRY_CATEGORIES, GROCERY_ITEM_CATEGORIES } from '@/lib/constants';
import { getPrefixedKey } from '@/lib/keys';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { setSyncedItem } from '@/lib/storage';
import { validateLocalData } from '@/lib/security';
import { calculateAssetBalance, updateAssetFromExpense } from '@/lib/finances';
import { Modal } from '../ui/Modal';
import { FormSection } from '../ui/FormSection';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

interface PantryEntryModalProps {
  isOpen: boolean;
  date: string | null;
  recordsOnDate: ExpenseRecord[];
  onClose: () => void;
  onUpdateRecords: (records: ExpenseRecord[]) => void;
  allRecords: ExpenseRecord[];
  initialRecord?: ExpenseRecord | null;
  initialTab?: 'list' | 'form';
}


export function PantryEntryModal({ isOpen, date, recordsOnDate, onClose, onUpdateRecords, allRecords, initialRecord, initialTab }: PantryEntryModalProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'form'>(initialTab || (initialRecord ? 'form' : 'list'));
  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(initialRecord || null);
  const [internalDate, setInternalDate] = useState(date || new Date().toISOString().split('T')[0]);
  const [vendor, setVendor] = useState('');
  const [paidFromId, setPaidFromId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [sgst, setSgst] = useState('');
  const [cgst, setCgst] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Grocery');
  const assets = useStorageSubscription<Asset[]>(SYNC_KEYS.FINANCES_ASSETS, []);

  const uniqueVendors = useMemo(() => {
    const vendors = new Set<string>();
    allRecords.forEach(r => { if (r.vendor) vendors.add(r.vendor); });
    return Array.from(vendors);
  }, [allRecords]);

  useEffect(() => {
    if (initialRecord) {
      startEdit(initialRecord);
    } else if (initialTab === 'form' || recordsOnDate.length === 0) {
      setActiveTab('form');
      resetForm();
    } else {
      setActiveTab('list');
    }
  }, [recordsOnDate, initialRecord]);

  const resetForm = () => {
    setEditingRecord(null); setVendor(''); setPaidFromId(''); setNotes(''); setItems([]); setSgst(''); setCgst(''); setCategory('Grocery');
  };

  const startEdit = (record: ExpenseRecord) => {
    setEditingRecord(record); setVendor(record.vendor || ''); setPaidFromId(record.assetId || ''); setNotes(record.notes || ''); setSgst(record.sgst?.toString() || ''); setCgst(record.cgst?.toString() || ''); setCategory(record.category || 'Grocery');
    if (record.items) setItems(record.items); else setItems([]);
    setActiveTab('form');
  };

  const handleAddItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), name: '', category: category === 'Grocery' ? GROCERY_ITEM_CATEGORIES[0] : category, type: 'need', quantity: '1', unitPrice: 0, totalPrice: 0, brand: '', notes: '', color: '', size: '', person: '', quality: '', itemType: '', consumptionDays: 0 }]);
  };

  const updateItem = (id: string, field: keyof ExpenseItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'unitPrice' || field === 'quantity') {
          const q = parseFloat(updated.quantity) || 1;
          updated.totalPrice = updated.unitPrice * q; 
        }
        return updated;
      }
      return item;
    }));
  };

  const totalAmount = useMemo(() => {
    const itemsTotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const taxTotal = (parseFloat(sgst) || 0) + (parseFloat(cgst) || 0);
    return itemsTotal + taxTotal;
  }, [items, sgst, cgst]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    const newRecord: ExpenseRecord = {
      id: editingRecord ? editingRecord.id : Math.random().toString(36).substr(2, 9),
      entryType: 'Bill', category: category,
      vendor, paymentMethod: 'Debit Card', assetId: paidFromId || undefined,
      type: items[0]?.type || 'need', notes: notes, sgst: parseFloat(sgst) || undefined, cgst: parseFloat(cgst) || undefined,
      date: internalDate, amount: totalAmount, subcategory: vendor || items[0]?.name || 'Expense',
      paidToType: 'other', items: items
    };

    updateAssetFromExpense(newRecord.id, newRecord.assetId, newRecord.amount, newRecord.date, !!editingRecord);
    
    let updated;
    if (editingRecord) {
      updated = allRecords.map(r => r.id === editingRecord.id ? newRecord : r);
    } else {
      updated = [newRecord, ...allRecords];
    }
    
    onUpdateRecords(updated);
    onClose();
  };

  const deleteRecord = (id: string) => {
    updateAssetFromExpense(id, undefined, 0, '', true);
    onUpdateRecords(allRecords.filter(r => r.id !== id));
    onClose();
  };

  if (!isOpen) return null;

  const modalTitle = (
    <div className="flex items-center gap-3">
      <input type="date" value={internalDate} onChange={e => setInternalDate(e.target.value)} className="bg-transparent outline-none cursor-pointer text-zinc-900 dark:text-white font-bold uppercase text-lg"/>
      <span className="w-1.5 h-1.5 rounded-full bg-teal-500"/>
      <span className="text-zinc-400 font-bold text-[10px] uppercase">{editingRecord ? 'Edit Entry' : 'New Entry'}</span>
    </div>
  );

  const headerControls = (
    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full">
      <button type="button" onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-full text-[10px] uppercase font-bold transition-all ${activeTab === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>Records</button>
      <button type="button" onClick={() => setActiveTab('form')} className={`px-4 py-2 rounded-full text-[10px] uppercase font-bold transition-all ${activeTab === 'form' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>Create</button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} headerControls={headerControls} maxWidth="max-w-3xl" onSubmit={activeTab === 'form' ? handleSubmit : undefined} submitText="Finalize Bill">
      <div className="flex-1">
        {activeTab === 'list' ? (
          <div className="space-y-4">
            {recordsOnDate.length === 0 ? <div className="py-20 text-center font-bold text-zinc-300 uppercase">No records</div> : (
              recordsOnDate.map(record => (
                <div key={record.id} onClick={() => startEdit(record)} className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-teal-500 dark:hover:border-teal-500 transition-all cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col"><span className="font-bold text-lg">{record.vendor || record.subcategory}</span><span className="text-[10px] font-bold text-zinc-400 uppercase">{record.category}</span></div>
                    <span className="text-xl font-bold">${record.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <FormSection title="Basic Details" accentColor="teal">
              <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-4 py-3 rounded-2xl text-sm font-bold w-full outline-none uppercase text-zinc-500">
                {PANTRY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="relative">
                <input type="text" list="vendor-options" required value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Shop / Vendor Name" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-4 py-3 rounded-2xl text-sm font-bold w-full outline-none"/>
                <datalist id="vendor-options">
                  {uniqueVendors.map(v => <option key={v} value={v}/>)}
                </datalist>
              </div>
              <select value={paidFromId} onChange={e => setPaidFromId(e.target.value)} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-4 py-3 rounded-2xl text-sm font-bold w-full outline-none">
                <option value="">No Account (Manual)</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name} (${calculateAssetBalance(a).toLocaleString()})</option>)}
              </select>
            </FormSection>
            <div className="space-y-4">
              <div className="flex justify-between items-center"><h3 className="text-[10px] font-bold uppercase text-teal-600">Itemized Bill</h3></div>
              {items.map((item, index) => (
                <div key={item.id} className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-4 relative">
                  <div className="absolute -top-2 -right-2 bg-zinc-800 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer hover:bg-rose-500" onClick={() => setItems(items.filter(i => i.id !== item.id))}>✕</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input placeholder="Item Name" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold outline-none md:col-span-1"/>
                    <select value={item.category} onChange={e => updateItem(item.id, 'category', e.target.value)} className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold outline-none uppercase text-zinc-500">
                      {category === 'Grocery' ? (
                        GROCERY_ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                      ) : (
                        <option value={category}>{category}</option>
                      )}
                    </select>
                    <select value={item.type} onChange={e => updateItem(item.id, 'type', e.target.value as 'need'|'want')} className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold outline-none uppercase text-zinc-500">
                      <option value="need">Need</option>
                      <option value="want">Want</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-zinc-400 uppercase font-bold w-8">Qty</span>
                       <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold outline-none w-full"/>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-zinc-400 uppercase font-bold w-8">Price</span>
                       <input type="number" placeholder="Unit Price" value={item.unitPrice || ''} onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold outline-none w-full"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-zinc-400 uppercase font-bold w-12">Weight</span>
                       <div className="flex w-full gap-2">
                         <input 
                           type="number" 
                           placeholder="Value" 
                           value={parseFloat(item.size || '') || ''} 
                           onChange={e => {
                             const unit = (item.size || '').replace(/[\d.\s]/g, '') || 'unit';
                             updateItem(item.id, 'size', `${e.target.value}${unit}`);
                           }} 
                           className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold outline-none w-full"
                         />
                         <select 
                           value={(item.size || '').replace(/[\d.\s]/g, '') || 'unit'} 
                           onChange={e => {
                             const val = parseFloat(item.size || '') || '';
                             updateItem(item.id, 'size', `${val}${e.target.value}`);
                           }} 
                           className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold outline-none w-24 uppercase text-zinc-500"
                         >
                           {['kg', 'g', 'L', 'ml', 'unit', 'pack', 'dozen', 'box', 'bottle', 'lb', 'oz'].map(u => <option key={u} value={u}>{u}</option>)}
                         </select>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-zinc-400 uppercase font-bold w-12">Cons.</span>
                       <input 
                         type="number" 
                         placeholder="Days/Unit" 
                         value={item.consumptionDays || ''} 
                         onChange={e => updateItem(item.id, 'consumptionDays', parseInt(e.target.value) || 0)}
                         className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold outline-none w-full"
                       />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-center pt-2">
                <button type="button" onClick={handleAddItem} className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 w-full py-3 rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700 border-dashed">+ Add Another Item</button>
              </div>
            </div>
            <div className="flex justify-between items-center pt-8 border-t border-zinc-50 dark:border-zinc-800">
              <div className="flex flex-col"><span className="text-[10px] font-bold text-zinc-400 uppercase">Total Bill</span><span className="text-4xl font-bold text-teal-600">${totalAmount.toLocaleString()}</span></div>
              {editingRecord && <button type="button" onClick={()=>deleteRecord(editingRecord.id)} className="text-[10px] font-bold text-rose-500 uppercase">Delete Record</button>}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
