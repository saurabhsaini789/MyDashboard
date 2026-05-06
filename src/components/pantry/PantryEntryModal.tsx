"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ExpenseRecord, ExpenseItem, ExpenseCategory, Asset, PaymentMethod } from '@/types/finance';
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

const CATEGORIES: ExpenseCategory[] = ['Grocery', 'Clothing', 'Transport', 'Dining', 'Bills', 'Other'];

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
  const assets = useStorageSubscription<Asset[]>(SYNC_KEYS.FINANCES_ASSETS, []);

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
    setEditingRecord(null); setVendor(''); setPaidFromId(''); setNotes(''); setItems([]); setSgst(''); setCgst('');
  };

  const startEdit = (record: ExpenseRecord) => {
    setEditingRecord(record); setVendor(record.vendor || ''); setPaidFromId(record.assetId || ''); setNotes(record.notes || ''); setSgst(record.sgst?.toString() || ''); setCgst(record.cgst?.toString() || '');
    if (record.items) setItems(record.items); else setItems([]);
    setActiveTab('form');
  };

  const handleAddItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), name: '', category: 'Grocery', type: 'need', quantity: '', unitPrice: 0, totalPrice: 0, brand: '', notes: '', color: '', size: '', person: '', quality: '', itemType: '' }]);
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
      entryType: 'Bill', category: (items[0]?.category as ExpenseCategory) || 'Grocery',
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
              <input type="text" required value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Shop / Vendor Name" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-4 py-3 rounded-2xl text-sm font-bold w-full outline-none"/>
              <select value={paidFromId} onChange={e => setPaidFromId(e.target.value)} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-4 py-3 rounded-2xl text-sm font-bold w-full outline-none">
                <option value="">No Account (Manual)</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name} (${calculateAssetBalance(a).toLocaleString()})</option>)}
              </select>
            </FormSection>
            <div className="space-y-4">
              <div className="flex justify-between items-center"><h3 className="text-[10px] font-bold uppercase text-teal-600">Itemized Bill</h3><button type="button" onClick={handleAddItem} className="text-[10px] font-bold text-zinc-400 uppercase border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 px-3 py-1 rounded-full transition-colors">+ ADD ITEM</button></div>
              {items.map(item => (
                <div key={item.id} className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Item Name" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold outline-none"/>
                    <input type="number" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))} className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold outline-none"/>
                  </div>
                </div>
              ))}
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
