"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { setSyncedItem } from '@/lib/storage';
import type { IncomeRecord } from '@/types/finance';
import { IncomeMetrics } from './IncomeMetrics';
import { MultiSelectDropdown } from '../ui/MultiSelectDropdown';
import { MONTHS, YEARS } from '@/lib/constants';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { Text, SectionTitle } from '../ui/Text';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

export type IncomeSource = IncomeRecord['source'];
export type IncomeType = IncomeRecord['type'];

const SOURCES: IncomeSource[] = ['salary', 'bonus', 'freelance', 'business', 'investment', 'Govt Benefits', 'tax refund', 'gift', 'sale', 'refund', 'other'];
const TYPES: IncomeType[] = ['active', 'passive', 'one time'];

export function IncomeSection() {
  const records = useStorageSubscription<IncomeRecord[]>(SYNC_KEYS.FINANCES_INCOME, []);
  const assets = useStorageSubscription<any[]>(SYNC_KEYS.FINANCES_ASSETS, []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IncomeRecord | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter states
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    source: 'salary' as IncomeSource,
    amount: '',
    date: '',
    type: 'active' as IncomeType,
    assetId: '',
    notes: '',
    customSource: ''
  });

  useEffect(() => {
    setSelectedMonths([new Date().getMonth()]);
    setSelectedYears([new Date().getFullYear()]);
    setFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
  }, []);

  const updateRecords = (newRecords: IncomeRecord[]) => {
    setSyncedItem(SYNC_KEYS.FINANCES_INCOME, JSON.stringify(newRecords));
  };

  const updateAssetContribution = (incomeId: string, assetId: string | undefined, amount: number, date: string, isDelete = false) => {
    const updatedAssets = assets.map((asset: any) => {
      let changed = false;
      const initialContribs = asset.contributions || [];
      const filteredContribs = initialContribs.filter((c: any) => c.id !== `income-${incomeId}`);
      
      if (filteredContribs.length !== initialContribs.length) changed = true;
      
      let nextContribs = filteredContribs;
      if (!isDelete && asset.id === assetId) {
        nextContribs = [{
          id: `income-${incomeId}`,
          date: date,
          amount: amount
        }, ...filteredContribs];
        changed = true;
      }

      return changed ? { ...asset, contributions: nextContribs, lastUpdated: new Date().toISOString().split('T')[0] } : asset;
    });

    setSyncedItem(SYNC_KEYS.FINANCES_ASSETS, JSON.stringify(updatedAssets));
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      source: 'salary',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      type: 'active',
      assetId: '',
      notes: '',
      customSource: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: IncomeRecord) => {
    setEditingRecord(record);
    setFormData({
      source: record.source,
      amount: record.amount.toString(),
      date: record.date,
      type: record.type,
      assetId: record.assetId || '',
      notes: record.notes || '',
      customSource: record.customSource || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) return;

    const newRecord: IncomeRecord = {
      id: editingRecord ? editingRecord.id : Math.random().toString(36).substr(2, 9),
      source: formData.source,
      amount,
      date: formData.date,
      type: formData.type,
      assetId: formData.assetId || undefined,
      notes: formData.notes || undefined,
      customSource: formData.source === 'other' ? (formData.customSource || undefined) : undefined
    };

    updateAssetContribution(newRecord.id, newRecord.assetId, newRecord.amount, newRecord.date);

    if (editingRecord) {
      updateRecords(records.map(r => r.id === editingRecord.id ? newRecord : r));
    } else {
      updateRecords([newRecord, ...records]);
    }
    setIsModalOpen(false);
  };

  const deleteRecord = (id: string) => {
    updateAssetContribution(id, undefined, 0, '', true);
    updateRecords(records.filter(r => r.id !== id));
    if (editingRecord?.id === id) setIsModalOpen(false);
  };

  const filteredRecords = records.filter(r => {
    const d = new Date(r.date);
    return selectedMonths.includes(d.getMonth()) && selectedYears.includes(d.getFullYear());
  });

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
          <SectionTitle>Income Streams</SectionTitle>
          <button className="p-1.5 rounded-xl hover:bg-zinc-100 transition-colors">
            {isCollapsed ? <ChevronRight className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-3">
            <MultiSelectDropdown label="Month" options={MONTHS} selected={selectedMonths} onChange={setSelectedMonths} />
            <MultiSelectDropdown label="Year" options={YEARS} selected={selectedYears} onChange={setSelectedYears} />
          </div>
          <button onClick={openAddModal} className="bg-emerald-600 text-white text-xs px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl h-[54px]">
            Add Record
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        {!isCollapsed && <IncomeMetrics records={records} selectedMonths={selectedMonths} selectedYears={selectedYears} />}
        <div className="bg-white dark:bg-zinc-900/60 border border-l-4 border-emerald-100 rounded-2xl p-2 overflow-hidden shadow-sm pt-8">
          <div className="flex items-center justify-between px-8 mb-8">
            <Text variant="label" as="span">Detailed Records</Text>
          </div>
          <div className="overflow-x-auto px-4 text-sm font-medium custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="dark:bg-zinc-800/50 text-[10px] md:text-xs text-zinc-500 uppercase font-bold">
                <tr className="border-b dark:border-zinc-800">
                  <th className="px-4 py-4 whitespace-nowrap">Date</th>
                  <th className="px-4 py-4 whitespace-nowrap">Source</th>
                  <th className="px-4 py-4 whitespace-nowrap">Type</th>
                  <th className="px-4 py-4 whitespace-nowrap text-right">Amount</th>
                  <th className="px-4 py-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm md:text-base">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="border-b dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-5 font-bold text-zinc-400 whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="px-4 py-5 font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{record.source === 'other' ? record.customSource : record.source}</td>
                    <td className="px-4 py-5 whitespace-nowrap"><span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900/30">{record.type}</span></td>
                    <td className="px-4 py-5 text-right font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">${record.amount.toLocaleString()}</td>
                    <td className="px-4 py-5 text-right whitespace-nowrap"><button onClick={() => openEditModal(record)} className="text-emerald-600 font-bold hover:underline">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRecord ? 'Edit Income' : 'Add Income'} onSubmit={handleSubmit}>
        <DynamicForm 
          sections={[
            { id: 'basic', fields: [
              { name: 'source', label: 'Source', type: 'select', options: SOURCES.map(c => ({ label: c, value: c })) },
              { name: 'type', label: 'Type', type: 'select', options: TYPES.map(t => ({ label: t, value: t })) },
              ...(formData.source === 'other' ? [{ name: 'customSource', label: 'Custom Source', type: 'text' as const }] : [])
            ]},
            { id: 'amount', fields: [
              { name: 'amount', label: 'Amount', type: 'number', required: true },
              { name: 'date', label: 'Date', type: 'date', required: true }
            ]},
            { id: 'linked', fields: [
              { name: 'assetId', label: 'Linked Account', type: 'select', options: [
                { label: 'None', value: '' },
                ...assets.filter(a => a.type === 'Bank Balance' || a.type === 'Cash').map(a => ({ label: a.name, value: a.id }))
              ]}
            ]}
          ]}
          formData={formData}
          onChange={(n, v) => setFormData(p => ({ ...p, [n]: v }))}
        />
        {editingRecord && <button onClick={() => deleteRecord(editingRecord.id)} className="text-red-500 mt-4">Delete Record</button>}
      </Modal>
    </div>
  );
}
