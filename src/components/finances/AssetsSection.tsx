"use client";

import React, { useState, useEffect } from 'react';
import { setSyncedItem } from '@/lib/storage';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { calculateAssetBalance, type Asset, type Contribution } from '@/lib/finances';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { Text, SectionTitle } from '../ui/Text';
import { LayoutGrid, List } from 'lucide-react';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

export type AssetType = 'Cash' | 'Bank Balance' | 'Property' | 'Business Value' | 'Vehicle' | 'Investment' | 'Metal' | 'Loans Given';

const ASSET_TYPES: AssetType[] = [
  'Cash', 'Bank Balance', 'Property', 'Business Value', 'Vehicle', 'Investment', 'Metal', 'Loans Given'
];

export function AssetsSection() {
  const assets = useStorageSubscription<Asset[]>(SYNC_KEYS.FINANCES_ASSETS, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean>>({});
  const viewMode = useStorageSubscription<'grid' | 'table'>(SYNC_KEYS.FINANCES_ASSETS_VIEW, 'grid');

  useEffect(() => {
    // Component mount logic if needed
  }, []);

  const toggleViewMode = (mode: 'grid' | 'table') => {
    setSyncedItem(SYNC_KEYS.FINANCES_ASSETS_VIEW, mode);
  };

  const toggleExpand = (id: string) => {
    setExpandedAssets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [isContribModalOpen, setIsContribModalOpen] = useState(false);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateValue, setRateValue] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'Bank Balance' as AssetType,
    initialValue: '',
    startDate: '',
    lastUpdated: ''
  });

  const updateAssets = (newAssets: Asset[]) => {
    setSyncedItem(SYNC_KEYS.FINANCES_ASSETS, JSON.stringify(newAssets));
  };

  const openAddModal = () => {
    setEditingAsset(null);
    setFormData({
      name: '',
      type: 'Bank Balance' as AssetType,
      initialValue: '',
      startDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type as AssetType,
      initialValue: asset.initialValue?.toString() || '',
      startDate: asset.startDate,
      lastUpdated: asset.lastUpdated
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(formData.initialValue);
    if (isNaN(value)) return;

    const newAsset: Asset = {
      id: editingAsset ? editingAsset.id : Math.random().toString(36).substr(2, 9),
      name: formData.name,
      type: formData.type as AssetType,
      initialValue: value,
      startDate: formData.startDate,
      contributions: editingAsset ? editingAsset.contributions : [],
      growthRate: editingAsset ? editingAsset.growthRate : 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (editingAsset) {
      updateAssets(assets.map(a => a.id === editingAsset.id ? newAsset : a));
    } else {
      updateAssets([...assets, newAsset]);
    }
    setIsModalOpen(false);
  };

  const deleteAsset = (id: string) => {
    updateAssets(assets.filter(a => a.id !== id));
    if (editingAsset?.id === id) setIsModalOpen(false);
  };

  const handleContribSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(contribAmount);
    if (isNaN(amount) || !activeAssetId) return;

    const newContrib: Contribution = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      amount,
    };

    updateAssets(assets.map(a => 
      a.id === activeAssetId 
        ? { ...a, contributions: [newContrib, ...(a.contributions || [])], lastUpdated: new Date().toISOString().split('T')[0] } 
        : a
    ));
    setIsContribModalOpen(false);
    setContribAmount('');
  };

  const deleteContribution = (assetId: string, contribId: string) => {
    updateAssets(assets.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          contributions: (a.contributions || []).filter(c => c.id !== contribId),
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return a;
    }));
  };

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(rateValue);
    if (isNaN(rate) || !activeAssetId) return;

    updateAssets(assets.map(a => 
      a.id === activeAssetId 
      ? { ...a, growthRate: rate, lastUpdated: new Date().toISOString().split('T')[0] } 
      : a
    ));
    setIsRateModalOpen(false);
    setRateValue('');
  };

  const totalPortfolioValue = assets.reduce((sum, a) => sum + calculateAssetBalance(a), 0);

  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col gap-4 md:gap-6 px-1 md:px-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <SectionTitle>Assets Portfolio</SectionTitle>
          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <button onClick={() => toggleViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`} title="Grid View"><LayoutGrid size={18} /></button>
              <button onClick={() => toggleViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`} title="Table View"><List size={18} /></button>
            </div>
            <button onClick={openAddModal} className="bg-emerald-600 text-white text-xs px-5 md:px-6 py-2.5 md:py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg">Add Asset</button>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900/60 border border-l-4 border-emerald-100 rounded-2xl p-5 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
          <div className="flex flex-col gap-1 relative z-10">
            <Text variant="label" as="span">Portfolio valuation</Text>
            <Text variant="metric" as="span" className="text-2xl md:text-3xl">${totalPortfolioValue.toLocaleString("en-CA", { maximumFractionDigits: 0 })}</Text>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:items-end relative z-10">
            <Text variant="label" as="span">Total Assets</Text>
            <Text variant="heading" as="span" className="text-base md:text-lg">{assets.length} Holdings</Text>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="flex flex-col gap-8 md:gap-10 px-1 md:px-2">
          {ASSET_TYPES.map(type => {
            const typeAssets = assets.filter(a => a.type === type);
            if (typeAssets.length === 0) return null;
            return (
              <div key={type} className="flex flex-col gap-4">
                <div className="flex items-center gap-4 px-2">
                  <Text variant="label" as="h3" className="font-bold">{type}</Text>
                  <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/30" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
                  {typeAssets.map(asset => {
                    const currentValue = calculateAssetBalance(asset);
                    return (
                      <div key={asset.id} className="bg-white dark:bg-zinc-900/60 border border-l-4 border-emerald-100 rounded-2xl p-5 md:p-6 flex flex-col gap-4 group shadow-sm relative overflow-hidden">
                        <div className="absolute top-5 right-5 flex items-center gap-1 z-10">
                          <button onClick={() => openEditModal(asset)} className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Text variant="title" as="h3" className="text-base md:text-lg truncate">{asset.name}</Text>
                          <Text variant="title" as="span" className="text-xl">${currentValue.toLocaleString("en-CA", { maximumFractionDigits: 0 })}</Text>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                          <button onClick={() => {setActiveAssetId(asset.id); setIsContribModalOpen(true);}} className="text-xs uppercase p-2 border rounded-xl hover:bg-zinc-50">Log</button>
                          <button onClick={() => {setActiveAssetId(asset.id); setIsRateModalOpen(true); setRateValue(asset.growthRate.toString());}} className="text-xs uppercase p-2 border rounded-xl hover:bg-zinc-50 text-emerald-600">APY %</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-x-auto shadow-sm custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] md:text-xs text-zinc-500 uppercase font-bold">
              <tr>
                <th className="p-4 px-4 whitespace-nowrap">Asset</th>
                <th className="p-4 px-4 whitespace-nowrap">Balance</th>
                <th className="p-4 px-4 whitespace-nowrap">APY %</th>
                <th className="p-4 px-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm md:text-base">
              {assets.map(asset => (
                <tr key={asset.id} className="border-b dark:border-zinc-800 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="p-4 px-4 font-semibold whitespace-nowrap">{asset.name}</td>
                  <td className="p-4 px-4 font-bold whitespace-nowrap">${calculateAssetBalance(asset).toLocaleString()}</td>
                  <td className="p-4 px-4 whitespace-nowrap">{asset.growthRate}%</td>
                  <td className="p-4 px-4 text-right whitespace-nowrap">
                    <button onClick={() => openEditModal(asset)} className="text-emerald-600 font-bold hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAsset ? 'Edit Asset' : 'New Asset'} onSubmit={handleSubmit}>
        <DynamicForm 
          sections={[{ id: 'basic', fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'type', label: 'Type', type: 'select', options: ASSET_TYPES.map(t => ({ label: t, value: t })) },
            { name: 'initialValue', label: 'Initial Balance', type: 'number', required: true },
            { name: 'startDate', label: 'Start Date', type: 'date', required: true }
          ]}]}
          formData={formData}
          onChange={(n, v) => setFormData(p => ({ ...p, [n]: v }))}
        />
        {editingAsset && <button onClick={() => deleteAsset(editingAsset.id)} className="text-red-500 mt-4">Delete Asset</button>}
      </Modal>

      <Modal isOpen={isContribModalOpen} onClose={() => setIsContribModalOpen(false)} title="Log Contribution" onSubmit={handleContribSubmit}>
        <DynamicForm sections={[{id:'c', fields:[{name:'amount', label:'Amount', type:'number', required:true}]}]} formData={{amount:contribAmount}} onChange={(_,v)=>setContribAmount(v)} />
      </Modal>

      <Modal isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} title="Set APY %" onSubmit={handleRateSubmit}>
        <DynamicForm sections={[{id:'r', fields:[{name:'rate', label:'Annual APY (%)', type:'number', required:true}]}]} formData={{rate:rateValue}} onChange={(_,v)=>setRateValue(v)} />
      </Modal>
    </div>
  );
}
