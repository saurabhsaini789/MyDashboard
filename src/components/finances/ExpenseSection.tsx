"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { setSyncedItem } from '@/lib/storage';
import { ExpenseMetrics } from './ExpenseMetrics';
import { MultiSelectDropdown } from '../ui/MultiSelectDropdown';
import { MONTHS, YEARS } from '@/lib/constants';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { ExpenseRecord, ExpenseCategory, ExpenseType } from '@/types/finance';
import { Text, SectionTitle } from '../ui/Text';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

const CATEGORIES: ExpenseCategory[] = ['rent', 'EMI', 'Insurance', 'food', 'travel', 'shopping', 'investment', 'savings', 'Other'];
const TYPES: ExpenseType[] = ['need', 'want', 'investment'];

export function ExpenseSection() {
  const records = useStorageSubscription<ExpenseRecord[]>(SYNC_KEYS.FINANCES_EXPENSES, []);
  const assets = useStorageSubscription<any[]>(SYNC_KEYS.FINANCES_ASSETS, []);
  const savingsGoals = useStorageSubscription<any[]>(SYNC_KEYS.FINANCES_SAVINGS_TARGETS, []);
  const liabilities = useStorageSubscription<any[]>(SYNC_KEYS.FINANCES_LIABILITIES, []);
  const emergencyFund = useStorageSubscription<any | null>(SYNC_KEYS.FINANCES_EMERGENCY_FUND, null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter states
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    category: 'food' as ExpenseCategory,
    subcategory: '',
    amount: '',
    date: '',
    type: 'need' as ExpenseType,
    assetId: '',
    paidToType: 'other' as ExpenseRecord['paidToType'],
    paidToId: '',
    paidToName: '',
    liabilityPaymentType: 'Regular EMI' as ExpenseRecord['liabilityPaymentType'],
    entryType: 'Quick' as ExpenseRecord['entryType'],
    paymentMethod: 'UPI / Wallet' as ExpenseRecord['paymentMethod'],
    notes: ''
  });

  useEffect(() => {
    setSelectedMonths([new Date().getMonth()]);
    setSelectedYears([new Date().getFullYear()]);
    setFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
  }, []);

  const updateRecords = (newRecords: ExpenseRecord[]) => {
    setSyncedItem(SYNC_KEYS.FINANCES_EXPENSES, JSON.stringify(newRecords));
  };

  const updateRecipientContribution = (expenseId: string, paidToType: string, paidToId: string | undefined, amount: number, date: string, isDelete = false, liabilityPaymentType: 'Regular EMI' | 'Prepayment' = 'Regular EMI') => {
    // 1. Savings Goals
    if (paidToType === 'savings' || !paidToType) {
      const updated = savingsGoals.map((g: any) => {
        let changed = false;
        const filtered = (g.contributions || []).filter((c: any) => c.id !== `expense-${expenseId}`);
        if (filtered.length !== (g.contributions || []).length) changed = true;
        
        let next = filtered;
        if (!isDelete && paidToType === 'savings' && g.id === paidToId) {
          next = [{ id: `expense-${expenseId}`, date, amount }, ...filtered];
          changed = true;
        }
        return changed ? { ...g, contributions: next } : g;
      });
      setSyncedItem(SYNC_KEYS.FINANCES_SAVINGS_TARGETS, JSON.stringify(updated));
    }

    // 2. Emergency Fund
    if (paidToType === 'emergency' || !paidToType) {
      if (emergencyFund) {
        let changed = false;
        const filtered = (emergencyFund.contributions || []).filter((c: any) => c.id !== `expense-${expenseId}`);
        if (filtered.length !== (emergencyFund.contributions || []).length) changed = true;
        
        let next = filtered;
        if (!isDelete && paidToType === 'emergency') {
          next = [{ id: `expense-${expenseId}`, date, amount }, ...filtered];
          changed = true;
        }
        if (changed) setSyncedItem(SYNC_KEYS.FINANCES_EMERGENCY_FUND, JSON.stringify({ ...emergencyFund, contributions: next }));
      }
    }

    // 3. Asset Recipient
    if (paidToType === 'asset' || !paidToType) {
      const updated = assets.map((a: any) => {
        let changed = false;
        const filtered = (a.contributions || []).filter((c: any) => c.id !== `expense-recip-${expenseId}`);
        if (filtered.length !== (a.contributions || []).length) changed = true;
        
        let next = filtered;
        if (!isDelete && paidToType === 'asset' && a.id === paidToId) {
          next = [{ id: `expense-recip-${expenseId}`, date, amount }, ...filtered];
          changed = true;
        }
        return changed ? { ...a, contributions: next, lastUpdated: new Date().toISOString().split('T')[0] } : a;
      });
      setSyncedItem(SYNC_KEYS.FINANCES_ASSETS, JSON.stringify(updated));
    }

    // 4. Liability Repayment
    if (paidToType === 'liability' || !paidToType) {
      const updated = liabilities.map((l: any) => {
        let changed = false;
        
        // Remove old
        const oldLog = (l.paymentLogs || []).find((log: any) => log.id === `expense-${expenseId}`);
        let balance = l.remainingBalance;
        let logs = (l.paymentLogs || []).filter((log: any) => log.id !== `expense-${expenseId}`);
        
        if (oldLog) {
          balance += oldLog.amount;
          changed = true;
        }
        
        // Add new
        if (!isDelete && paidToType === 'liability' && l.id === paidToId) {
          balance = Math.max(0, balance - amount);
          logs = [{ id: `expense-${expenseId}`, date, amount, type: liabilityPaymentType }, ...logs];
          changed = true;
        }
        
        return changed ? { ...l, remainingBalance: balance, paymentLogs: logs, lastUpdated: new Date().toISOString().split('T')[0] } : l;
      });
      setSyncedItem(SYNC_KEYS.FINANCES_LIABILITIES, JSON.stringify(updated));
    }
  };

  const updateAssetContribution = (expenseId: string, assetId: string | undefined, amount: number, date: string, isDelete = false) => {
    const updated = assets.map((a: any) => {
      let changed = false;
      const filtered = (a.contributions || []).filter((c: any) => c.id !== `expense-${expenseId}`);
      if (filtered.length !== (a.contributions || []).length) changed = true;
      
      let next = filtered;
      if (!isDelete && a.id === assetId) {
        next = [{ id: `expense-${expenseId}`, date, amount: -amount }, ...filtered];
        changed = true;
      }
      return changed ? { ...a, contributions: next, lastUpdated: new Date().toISOString().split('T')[0] } : a;
    });
    setSyncedItem(SYNC_KEYS.FINANCES_ASSETS, JSON.stringify(updated));
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      category: 'food', 
      subcategory: '', 
      amount: '', 
      date: new Date().toISOString().split('T')[0],
      type: 'need', 
      assetId: '', 
      paidToType: 'other', 
      paidToId: '', 
      paidToName: '',
      liabilityPaymentType: 'Regular EMI', 
      entryType: 'Quick', 
      paymentMethod: 'UPI / Wallet', 
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: ExpenseRecord) => {
    setEditingRecord(record);
    setFormData({
      category: record.category, subcategory: record.subcategory, amount: record.amount.toString(),
      date: record.date, type: record.type, assetId: record.assetId || '',
      paidToType: record.paidToType || 'other', paidToId: record.paidToId || '', paidToName: record.paidToName || '',
      liabilityPaymentType: record.liabilityPaymentType || 'Regular EMI',
      entryType: record.entryType || 'Quick', paymentMethod: record.paymentMethod || 'UPI / Wallet', notes: record.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) return;

    const newRecord: ExpenseRecord = {
      id: editingRecord ? editingRecord.id : Math.random().toString(36).substr(2, 9),
      category: formData.category, subcategory: formData.subcategory, amount,
      date: formData.date, type: formData.type, assetId: formData.assetId || undefined,
      paidToType: formData.paidToType, paidToId: formData.paidToId || undefined,
      paidToName: formData.paidToName || undefined,
      liabilityPaymentType: formData.paidToType === 'liability' ? formData.liabilityPaymentType : undefined,
      entryType: formData.entryType, paymentMethod: formData.paymentMethod, notes: formData.notes || undefined
    };

    updateAssetContribution(newRecord.id, newRecord.assetId, newRecord.amount, newRecord.date);
    updateRecipientContribution(newRecord.id, newRecord.paidToType, newRecord.paidToId, newRecord.amount, newRecord.date, false, newRecord.liabilityPaymentType);

    if (editingRecord) {
      updateRecords(records.map(r => r.id === editingRecord.id ? newRecord : r));
    } else {
      updateRecords([newRecord, ...records]);
    }
    setIsModalOpen(false);
  };

  const deleteRecord = (id: string) => {
    updateAssetContribution(id, undefined, 0, '', true);
    updateRecipientContribution(id, '', undefined, 0, '', true);
    updateRecords(records.filter(r => r.id !== id));
    if (editingRecord?.id === id) setIsModalOpen(false);
  };

  const filteredRecords = records.filter(r => {
    const d = new Date(r.date);
    return selectedMonths.includes(d.getMonth()) && selectedYears.includes(d.getFullYear());
  });

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
          <SectionTitle>Expenses</SectionTitle>
          <button className="p-1.5 rounded-xl hover:bg-zinc-100 transition-colors">
            {isCollapsed ? <ChevronRight className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-3">
            <MultiSelectDropdown label="Month" options={MONTHS} selected={selectedMonths} onChange={setSelectedMonths} />
            <MultiSelectDropdown label="Year" options={YEARS} selected={selectedYears} onChange={setSelectedYears} />
          </div>
          <button onClick={openAddModal} className="bg-rose-600 text-white text-xs px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl h-[54px] font-semibold">
            Add Expense
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        {!isCollapsed && <ExpenseMetrics records={records} selectedMonths={selectedMonths} selectedYears={selectedYears} />}
        <div className="bg-white dark:bg-zinc-900/60 border border-l-4 border-rose-100 rounded-2xl p-2 overflow-hidden shadow-sm pt-8">
          <div className="flex items-center justify-between px-8 mb-8">
            <Text variant="label" as="span">Detailed Records</Text>
          </div>
          <div className="overflow-x-auto px-4 text-xs font-semibold">
            <table className="w-full text-left border-collapse">
              <thead className="dark:bg-zinc-800/50">
                <tr className="border-b dark:border-zinc-800">
                  <th className="px-4 py-4 uppercase">Date</th>
                  <th className="px-4 py-4 uppercase">Category</th>
                  <th className="px-4 py-4 uppercase">Type</th>
                  <th className="px-4 py-4 uppercase text-right">Amount</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => (
                  <tr key={r.id} className="border-b dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-sm">
                    <td className="px-4 py-5 text-zinc-400">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-4 py-5 font-bold text-zinc-900 dark:text-zinc-100">{r.category} <span className="text-xs text-zinc-400 font-normal">({r.subcategory})</span></td>
                    <td className="px-4 py-5"><span className="px-2 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-lg">{r.type}</span></td>
                    <td className="px-4 py-5 text-right font-bold text-zinc-900 dark:text-zinc-100">${r.amount.toLocaleString()}</td>
                    <td className="px-4 py-5 text-right"><button onClick={() => openEditModal(r)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingRecord ? 'Edit Expense' : 'Add Expense'} 
        onSubmit={handleSubmit}
        accentColor="rose"
        submitText={editingRecord ? 'Update Record' : 'Save Expense'}
      >
        <DynamicForm 
          accentColor="rose"
          sections={[
            { id: 'b', title: 'Transaction Details', fields: [
              { name: 'category', label: 'Category', type: 'select', options: CATEGORIES.map(c=>({label:c,value:c})) },
              { name: 'amount', label: 'Amount', type: 'number', required: true },
              { name: 'date', label: 'Date', type: 'date', required: true }
            ]},
            { id: 'p', title: 'Funding & Destination', fields: [
              { name: 'assetId', label: 'Paid From', type: 'select', options: [
                { label: 'None', value: '' },
                ...assets.filter(a=>a.type==='Bank Balance'||a.type==='Cash').map(a=>({label:a.name,value:a.id}))
              ]},
              { name: 'paidToCombined', label: 'Paid To', type: 'select', options: [
                { label: 'Other', value: 'other' },
                { label: 'Emergency Fund', value: 'emergency' },
                ...savingsGoals.map(g=>({label:`Goal: ${g.name}`,value:`savings:${g.id}`})),
                ...assets.map(a=>({label:`Asset: ${a.name}`,value:`asset:${a.id}`})),
                ...liabilities.map(l=>({label:`Liability: ${l.name}`,value:`liability:${l.id}`}))
              ]}
            ]}
          ]}
          formData={{ ...formData, paidToCombined: formData.paidToId ? `${formData.paidToType}:${formData.paidToId}` : formData.paidToType }}
          onChange={(n, v) => setFormData(p => {
             let u = { ...p, [n]: v };
             if (n === 'paidToCombined') u = v.includes(':') ? { ...u, paidToType: v.split(':')[0], paidToId: v.split(':')[1] } : { ...u, paidToType: v, paidToId: '' };
             return u;
          })}
        />
        {editingRecord && (
          <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button 
              type="button"
              onClick={() => deleteRecord(editingRecord.id)} 
              className="text-xs font-bold text-rose-500 uppercase hover:text-rose-700 transition-colors"
            >
              Delete Record
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
