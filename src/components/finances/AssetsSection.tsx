"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getPrefixedKey } from '@/lib/keys';
import { setSyncedItem } from '@/lib/storage';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { calculateAssetBalance, type Asset, type Contribution } from '@/lib/finances';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { Text, SectionTitle } from '../ui/Text';
import { LayoutGrid, List } from 'lucide-react';

export type AssetType = 'Cash' | 'Bank Balance' | 'Property' | 'Business Value' | 'Vehicle' | 'Investment' | 'Metal' | 'Loans Given';

const ASSET_TYPES: AssetType[] = [
 'Cash', 'Bank Balance', 'Property', 'Business Value', 'Vehicle', 'Investment', 'Metal', 'Loans Given'
];

export function AssetsSection() {
 const [assets, setAssets] = useState<Asset[]>([]);
 const [isLoaded, setIsLoaded] = useState(false);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
 const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean>>({});
 const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

 useEffect(() => {
   const savedView = localStorage.getItem('finances-assets-view');
   if (savedView === 'table' || savedView === 'grid') setViewMode(savedView);
 }, []);

 const toggleViewMode = (mode: 'grid' | 'table') => {
   setViewMode(mode);
   localStorage.setItem('finances-assets-view', mode);
 };

 const toggleExpand = (id: string) => {
 setExpandedAssets(prev => ({ ...prev, [id]: !prev[id] }));
 };

 // Contribution modal state
 const [isContribModalOpen, setIsContribModalOpen] = useState(false);
 const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
 const [contribAmount, setContribAmount] = useState('');
 

  // History modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

 // Growth Rate modal state
 const [isRateModalOpen, setIsRateModalOpen] = useState(false);
 const [rateValue, setRateValue] = useState('');

 // Form state for Add/Edit Asset
 const [formData, setFormData] = useState({
 name: '',
 type: 'Bank Balance' as AssetType,
 initialValue: '',
 
 startDate: '', // Initialize empty for SSR
 lastUpdated: ''
 });

 const assetsRef = useRef(assets);
 useEffect(() => {
 assetsRef.current = assets;
 }, [assets]);

 useEffect(() => {
 const saved = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_ASSETS));
 if (saved) {
 try {
 const parsed = JSON.parse(saved);
 // Migration to new model
 const migrated = parsed.map((a: any) => ({
 ...a,
 initialValue: a.initialValue ?? a.currentValue ?? 0,
 startDate: a.startDate ?? a.lastUpdated ?? new Date().toISOString().split('T')[0],
 contributions: a.contributions ?? [],
 growthRate: a.growthRate ?? 0
 }));
 setAssets(migrated);
 } catch (e) {
 console.error("Failed to parse asset data", e);
 }
 } else {
 const mockAssets: Asset[] = [
 { id: 'a1', name: 'Main Savings', type: 'Bank Balance', initialValue: 12500, startDate: '2025-01-01', contributions: [], growthRate: 1.5, lastUpdated: new Date().toISOString().split('T')[0] },
 { id: 'a2', name: 'Primary Residence', type: 'Property', initialValue: 450000, startDate: '2020-06-15', contributions: [], growthRate: 5.2, lastUpdated: new Date().toISOString().split('T')[0] },
 { id: 'a3', name: 'Vanguard ETF', type: 'Investment', initialValue: 85000, startDate: '2023-01-01', contributions: [], growthRate: 8.5, lastUpdated: new Date().toISOString().split('T')[0] },
 ];
 setAssets(mockAssets);
 }
 setFormData({
 ...formData,
 startDate: new Date().toISOString().split('T')[0],
 lastUpdated: new Date().toISOString().split('T')[0]
 });
 setIsLoaded(true);

 const handleLocal = (e: any) => {
 if (e.detail && e.detail.key === SYNC_KEYS.FINANCES_ASSETS) {
 const val = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_ASSETS));
 if (val) {
 try { 
 const parsed = JSON.parse(val);
 const migrated = parsed.map((a: any) => ({
 ...a,
 initialValue: a.initialValue ?? a.currentValue ?? 0,
 startDate: a.startDate ?? a.lastUpdated ?? new Date().toISOString().split('T')[0],
 contributions: a.contributions || [],
 growthRate: a.growthRate ?? 0
 }));
 // Update state ONLY if it actually differs from current ref to prevent infinite loops
 if (val !== JSON.stringify(assetsRef.current)) {
 setAssets(migrated); 
 }
 } catch (e) {}
 }
 }
 };
 window.addEventListener('local-storage-change', handleLocal);
 return () => window.removeEventListener('local-storage-change', handleLocal);
 }, []);




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
 const updated = assets.map(a => a.id === editingAsset.id ? newAsset : a);
 setAssets(updated);
 setSyncedItem(SYNC_KEYS.FINANCES_ASSETS, JSON.stringify(updated));
 } else {
 const updated = [...assets, newAsset];
 setAssets(updated);
 setSyncedItem(SYNC_KEYS.FINANCES_ASSETS, JSON.stringify(updated));
 }
 setIsModalOpen(false);
 };

 const deleteAsset = (id: string) => {
 const updated = assets.filter(a => a.id !== id);
 setAssets(updated);
 setSyncedItem(SYNC_KEYS.FINANCES_ASSETS, JSON.stringify(updated));
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

    const updated = assets.map(a => 
      a.id === activeAssetId 
        ? { ...a, contributions: [newContrib, ...(a.contributions || [])], lastUpdated: new Date().toISOString().split('T')[0] } 
        : a
    );
    setAssets(updated);
    setSyncedItem(SYNC_KEYS.FINANCES_ASSETS, JSON.stringify(updated));
    setIsContribModalOpen(false);
    setContribAmount('');
  };

  const deleteContribution = (assetId: string, contribId: string) => {
    const updated = assets.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          contributions: (a.contributions || []).filter(c => c.id !== contribId),
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return a;
    });
    setAssets(updated);
    setSyncedItem(SYNC_KEYS.FINANCES_ASSETS, JSON.stringify(updated));
  };

 const handleRateSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 const rate = parseFloat(rateValue);
 if (isNaN(rate) || !activeAssetId) return;

 const updated = assets.map(a => 
 a.id === activeAssetId 
 ? { ...a, growthRate: rate, lastUpdated: new Date().toISOString().split('T')[0] } 
 : a
 );
 setAssets(updated);
 setSyncedItem(SYNC_KEYS.FINANCES_ASSETS, JSON.stringify(updated));
 setIsRateModalOpen(false);
 setRateValue('');
 };

 const totalPortfolioValue = assets.reduce((sum, a) => sum + calculateAssetBalance(a), 0);

 if (!isLoaded) return null;

 return (
 <div className="flex flex-col gap-6 md:gap-8 w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
 {/* Heading & Summary Card */}
 <div className="flex flex-col gap-4 md:gap-6 px-1 md:px-2">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <SectionTitle>
 Assets Portfolio
 </SectionTitle>
 <div className="flex items-center gap-3">
    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
      <button 
        onClick={() => toggleViewMode('grid')}
        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
        title="Grid View"
      >
        <LayoutGrid size={18} />
      </button>
      <button 
        onClick={() => toggleViewMode('table')}
        className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
        title="Table View"
      >
        <List size={18} />
      </button>
    </div>
    <button 
    onClick={openAddModal}
    className="bg-emerald-600 text-white text-xs px-5 md:px-6 py-2.5 md:py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg md:h-[46px] w-fit"
    >
    Add Asset
    </button>
  </div>
 </div>

 {/* Total Assets Metric */}
 <div className="bg-white dark:bg-zinc-900/60 border border-l-4 border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl p-5 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-all group overflow-hidden relative">
 <div className="flex flex-col gap-1 relative z-10">
 <Text variant="label" as="span">Portfolio valuation</Text>
 <div className="flex items-baseline gap-2">
 <Text variant="metric" as="span" className="text-2xl md:text-3xl">
 ${totalPortfolioValue.toLocaleString("en-CA", { maximumFractionDigits: 0 })}
 </Text>
 </div>
 </div>

 <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1 relative z-10">
 <Text variant="label" as="span" className="leading-none">Total Assets</Text>
 <Text variant="heading" as="span" className="text-base md:text-lg">{assets.length} Holdings</Text>
 </div>
 </div>
 </div>

 {/* Assets Content based on View Mode */}
 {viewMode === 'grid' ? (
  <div className="flex flex-col gap-8 md:gap-10 px-1 md:px-2">
  {ASSET_TYPES.map(type => {
  const typeAssets = assets.filter(a => a.type === type);
  if (typeAssets.length === 0) return null;

  return (
  <div key={type} className="flex flex-col gap-4">
  <div className="flex items-center gap-4 px-2">
  <Text variant="label" as="h3" className="font-bold">
  {type}
  </Text>
  <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/30" />
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
  {typeAssets.map(asset => {
  const currentValue = calculateAssetBalance(asset);
  return (
  <div 
  key={asset.id} 
  className="bg-white dark:bg-zinc-900/60 border border-l-4 border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl p-5 md:p-6 flex flex-col gap-4 group shadow-sm transition-all relative overflow-hidden"
  >
  {/* Action Buttons */}
  <div className="absolute top-5 right-5 flex items-center gap-1 z-10">
  <button 
  onClick={() => openEditModal(asset)}
  className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
  title="Edit Asset"
  >
  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
  </button>
                   <button 
                   onClick={() => {
                     setActiveAssetId(asset.id);
                     setIsHistoryModalOpen(true);
                   }}
                   className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                   title="View History"
                 >
                   <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </button>
  <button 
  onClick={() => toggleExpand(asset.id)}
  className="sm:hidden p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
  >
  <svg 
  className={`w-5 h-5 transition-transform duration-300 ${expandedAssets[asset.id] ? 'rotate-180' : ''}`} 
  fill="none" viewBox="0 0 24 24" stroke="currentColor"
  >
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
  </svg>
  </button>
  </div>

  <div className="flex flex-col gap-2 min-w-0">
  <div className="flex flex-col gap-1 min-w-0">
  <div className="pr-16 md:pr-0">
  <Text variant="label" as="span" className="px-2 py-0.5 rounded-full border border-emerald-100/50 bg-emerald-50/50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/30 w-fit whitespace-nowrap font-bold">
  {asset.type}
  </Text>
  </div>
  <Text variant="title" as="h3" className="text-base md:text-lg whitespace-nowrap overflow-hidden text-ellipsis w-full" title={asset.name}>
  {asset.name}
  </Text>
  </div>

  {/* Valuation Summary (Always visible or specifically formatted for mobile) */}
  <div className="flex flex-col gap-0.5">
  <div className="flex items-baseline gap-2">
  <Text variant="title" as="span" className="text-xl">
  ${currentValue.toLocaleString("en-CA", { maximumFractionDigits: 0 })}
  </Text>
  {asset.growthRate !== 0 && (
  <span className={`text-xs font-bold ${asset.growthRate > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
  {asset.growthRate > 0 ? '↑' : '↓'}{Math.abs(asset.growthRate)}%
  </span>
  )}
  </div>
  </div>
  </div>

  <div className={`md:flex flex-col gap-4 w-full ${expandedAssets[asset.id] ? 'flex mt-2' : 'hidden'}`}>
  <div className="flex flex-col gap-0.5">

  <Text variant="label" as="span">Compounded Valuation</Text>
  <div className="flex items-baseline gap-2">
  <Text variant="title" as="span" className="text-2xl">
  ${currentValue.toLocaleString("en-CA", { maximumFractionDigits: 0 })}
  </Text>
  {(asset.contributions || []).length > 0 && asset.growthRate !== 0 && (
  <span className={`text-xs ${asset.growthRate > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
  {asset.growthRate > 0 ? '↑' : '↓'}{Math.abs(asset.growthRate)}% <span className="text-xs opacity-60">APY</span>
  </span>
  )}
  </div>
  </div>

  <div className="grid grid-cols-2 gap-2">
  <button 
  onClick={() => {
  setActiveAssetId(asset.id);
  setIsContribModalOpen(true);
  }}
  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs uppercase hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
  >
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
  Record
  </button>
  <button 
  onClick={() => {
  setActiveAssetId(asset.id);
  setRateValue(asset.growthRate.toString());
  setIsRateModalOpen(true);
  }}
  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs uppercase hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-emerald-600 dark:text-emerald-400"
  >
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
  APY %
  </button>
  </div>

  <div className="flex flex-col gap-1.5 mt-auto border-t border-zinc-50 dark:border-zinc-800/50 pt-4">
  <div className="flex items-center justify-between">
  <Text variant="label" as="span">Last Updated</Text>
  <Text variant="bodySmall" muted as="span" className="text-xs">

  {new Date(asset.lastUpdated).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
  </Text>
  </div>
  </div>
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
  <div className="bg-white dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-500">
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800">
            <th className="p-4 px-6 text-[11px] uppercase text-zinc-500 font-bold tracking-wider">Asset</th>
            <th className="p-4 px-6 text-[11px] uppercase text-zinc-500 font-bold tracking-wider">Current Balance</th>
            <th className="p-4 px-6 text-[11px] uppercase text-zinc-500 font-bold tracking-wider">Growth (APY)</th>
            <th className="p-4 px-6 text-[11px] uppercase text-zinc-500 font-bold tracking-wider">Last Updated</th>
            <th className="p-4 px-6 text-[11px] uppercase text-zinc-500 font-bold tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {assets.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).map(asset => {
            const currentValue = calculateAssetBalance(asset);
            return (
              <tr key={asset.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                <td className="p-4 px-6">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{asset.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 w-fit font-bold uppercase">
                      {asset.type}
                    </span>
                  </div>
                </td>
                <td className="p-4 px-6">
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    ${currentValue.toLocaleString("en-CA", { maximumFractionDigits: 0 })}
                  </span>
                </td>
                <td className="p-4 px-6">
                  {asset.growthRate !== 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold ${asset.growthRate > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {asset.growthRate > 0 ? '↑' : '↓'}{Math.abs(asset.growthRate)}%
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">APY</span>
                    </div>
                  ) : (
                    <span className="text-zinc-400 text-xs font-medium">No Growth Set</span>
                  )}
                </td>
                <td className="p-4 px-6">
                  <span className="text-xs text-zinc-500 font-medium">
                    {new Date(asset.lastUpdated).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </td>
                <td className="p-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      onClick={() => {
                        setActiveAssetId(asset.id);
                        setIsContribModalOpen(true);
                      }}
                      className="p-2 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Record Contribution"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </button>
                    <button 
                      onClick={() => {
                        setActiveAssetId(asset.id);
                        setRateValue(asset.growthRate.toString());
                        setIsRateModalOpen(true);
                      }}
                      className="p-2 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Set APY"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </button>
                    <button 
                      onClick={() => {
                        setActiveAssetId(asset.id);
                        setIsHistoryModalOpen(true);
                      }}
                      className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      title="View History"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    <button 
                      onClick={() => openEditModal(asset)}
                      className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      title="Edit Asset"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
 )}

 {/* Schema-Driven Asset Add/Edit Modal */}
 <Modal
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 title={editingAsset ? 'Modify asset' : 'New asset'}
 onSubmit={handleSubmit}
 submitText={editingAsset ? 'Update' : 'Save'}
 accentColor="emerald"
 >
 <DynamicForm
 sections={[
 {
 id: 'basic',
 title: 'Asset profile',
 fields: [
 { name: 'name', label: 'Asset Name', type: 'text', required: true, fullWidth: true, placeholder: 'e.g. Primary Residence...' },
 { 
 name: 'type', 
 label: 'Asset Type', 
 type: 'select', 
 options: ASSET_TYPES.map(t => ({ label: t, value: t }))
 },
 { name: 'initialValue', label: 'Initial Balance', type: 'number', required: true, step: "0.01", placeholder: "0.00" },
 { name: 'startDate', label: 'Asset Acquisition (Start Date)', type: 'date', required: true, fullWidth: true }
 ]
 }
 ]}
 formData={formData}
 accentColor="emerald"
 onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
 />
 {editingAsset && (
 <div className="mt-4 flex justify-start w-full">
 <button 
 type="button" 
 onClick={() => deleteAsset(editingAsset.id)} 
 className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
 >
 Delete Asset
 </button>
 </div>
 )}
 </Modal>

      {/* Schema-Driven Record Contribution Modal */}
      <Modal
        isOpen={isContribModalOpen}
        onClose={() => setIsContribModalOpen(false)}
        title="Log contribution"
        onSubmit={handleContribSubmit}
        submitText="Log Contribution"
      >
        <DynamicForm
          sections={[
            {
              id: 'contrib',
              title: 'Contribution',
              fields: [
                { name: 'amount', label: 'Amount', type: 'number', required: true, step: "0.01", placeholder: "0.00", fullWidth: true }
              ]
            }
          ]}
          formData={{ amount: contribAmount }}
          onChange={(_, value) => setContribAmount(value)}
        />
      </Modal>

 {/* Schema-Driven Set Growth Rate Modal */}
 <Modal
 isOpen={isRateModalOpen}
 onClose={() => setIsRateModalOpen(false)}
 title="Annual APY (%)"
 onSubmit={handleRateSubmit}
 submitText="Update APY"
 >
 <p className="text-xs text-zinc-600 text-center uppercase mb-6 leading-relaxed">
 Set annual appreciation (+) or depreciation (-)<br />to calculate compounding growth over time.
 </p>
 <DynamicForm
 sections={[
 {
 id: 'rate',
 title: 'Growth rate',
 fields: [
 { name: 'rate', label: 'Rate (%)', type: 'number', required: true, step: "0.01", placeholder: "0.0%", fullWidth: true }
 ]
 }
 ]}
 formData={{ rate: rateValue }}
 onChange={(_, value) => setRateValue(value)}
 />
 </Modal>
      {/* History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Contribution History"
        accentColor="emerald"
      >
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {activeAssetId && (assets.find(a => a.id === activeAssetId)?.contributions || []).length === 0 && (
            <div className="text-center py-10">
              <p className="text-zinc-500 text-sm uppercase font-semibold tracking-wider">No contribution history found</p>
            </div>
          )}
          {activeAssetId && (assets.find(a => a.id === activeAssetId)?.contributions || []).map(contrib => (
            <div key={contrib.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-all hover:border-emerald-100/50 dark:hover:border-emerald-900/30 group">
              <div className="flex flex-col gap-0.5">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${contrib.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {contrib.amount >= 0 ? 'Contribution' : 'Withdrawal'}
                </span>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  ${Math.abs(contrib.amount).toLocaleString("en-CA", { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  {new Date(contrib.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <button 
                onClick={() => deleteContribution(activeAssetId, contrib.id)}
                className="p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                title="Delete Log"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
 );
}
