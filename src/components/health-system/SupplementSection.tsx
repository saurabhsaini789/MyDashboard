"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { setSyncedItem } from '@/lib/storage';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { SupplementItem, SUPPLEMENT_CATEGORIES, FAMILY_MEMBERS, DOSE_UNITS, type InventoryStatus } from '@/types/health-system';
import { Text, SectionTitle } from '../ui/Text';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { LayoutGrid, List, User, Plus, Trash2, Settings, Search, Pill, Clock, Calendar, AlertCircle, CheckCircle2, Info, ChevronRight } from 'lucide-react';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

const STORAGE_KEY = SYNC_KEYS.HEALTH_SUPPLEMENTS;
const VIEW_MODE_KEY = 'health-supplements-view-mode';

interface SupplementSectionProps {
  externalFilter?: 'ALL' | 'LOW' | 'MISSING' | 'EXPIRED' | 'OK';
}

export function SupplementSection({ externalFilter }: SupplementSectionProps) {
  const items = useStorageSubscription<SupplementItem[]>(STORAGE_KEY, []);
  const familyMembers = useStorageSubscription<string[]>(SYNC_KEYS.HEALTH_FAMILY_MEMBERS, []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplementItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPerson, setSelectedPerson] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW' | 'MISSING' | 'EXPIRED' | 'OK'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const viewMode = useStorageSubscription<'grid' | 'table'>(VIEW_MODE_KEY, 'grid');
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    itemName: '',
    category: SUPPLEMENT_CATEGORIES[0],
    person: 'Shared',
    purpose: '',
    doseAmount: '',
    doseUnit: DOSE_UNITS[0],
    doseOther: '',
    frequency: '',
    quantity: 0,
    targetQuantity: 1,
    expiryDate: '',
    instructions: '',
    notes: ''
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, expiryDate: new Date().toISOString().split('T')[0] }));
  }, []);

  const toggleViewMode = (mode: 'grid' | 'table') => {
    setSyncedItem(VIEW_MODE_KEY, mode);
  };

  const addFamilyMember = () => {
    if (!newPersonName.trim()) return;
    const updated = [...familyMembers, newPersonName.trim()];
    setSyncedItem(SYNC_KEYS.HEALTH_FAMILY_MEMBERS, JSON.stringify(updated));
    setNewPersonName('');
  };

  const removeFamilyMember = (name: string) => {
    setSyncedItem(SYNC_KEYS.HEALTH_FAMILY_MEMBERS, JSON.stringify(familyMembers.filter(m => m !== name)));
  };

  const getStatus = (item: SupplementItem): InventoryStatus => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(item.expiryDate);
    expiry.setHours(0, 0, 0, 0);

    if (expiry < today) return 'EXPIRED';
    if (item.quantity === 0) return 'MISSING';
    if (item.quantity < item.targetQuantity) return 'LOW';
    return 'OK';
  };

  const getStatusStyles = (status: InventoryStatus) => {
    const base = "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm";
    switch (status) {
      case 'OK': return `${base} text-emerald-700 bg-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20`;
      case 'LOW': return `${base} text-amber-700 bg-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20`;
      case 'MISSING': return `${base} text-rose-700 bg-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20`;
      case 'EXPIRED': return `${base} text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700`;
      default: return `${base} text-zinc-500 bg-zinc-100 dark:bg-zinc-800`;
    }
  };

  const getStatusIcon = (status: InventoryStatus) => {
    switch (status) {
      case 'OK': return <CheckCircle2 size={12} />;
      case 'LOW': return <AlertCircle size={12} />;
      case 'MISSING': return <AlertCircle size={12} />;
      case 'EXPIRED': return <Clock size={12} />;
      default: return null;
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      itemName: '', category: SUPPLEMENT_CATEGORIES[0], person: 'Shared', purpose: '',
      doseAmount: '', doseUnit: DOSE_UNITS[0], doseOther: '', frequency: '',
      quantity: 0, targetQuantity: 1, expiryDate: new Date().toISOString().split('T')[0],
      instructions: '', notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: SupplementItem) => {
    setEditingItem(item);
    const doseMatch = (item.dose || '').match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    const amount = doseMatch ? doseMatch[1] : (item.dose || '');
    const unit = doseMatch ? doseMatch[2] : '';
    const isStandard = DOSE_UNITS.includes(unit);

    setFormData({
      itemName: item.itemName, category: item.category, person: item.person || 'Shared',
      purpose: item.purpose, doseAmount: amount, doseUnit: isStandard ? unit : (unit ? 'Other' : DOSE_UNITS[0]),
      doseOther: isStandard ? '' : unit, frequency: item.frequency,
      quantity: item.quantity, targetQuantity: item.targetQuantity, expiryDate: item.expiryDate,
      instructions: item.instructions, notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDose = `${formData.doseAmount} ${formData.doseUnit === 'Other' ? formData.doseOther : formData.doseUnit}`.trim();
    const newItem: SupplementItem = {
      id: editingItem ? editingItem.id : crypto.randomUUID(),
      itemName: formData.itemName, category: formData.category, person: formData.person,
      purpose: formData.purpose, dose: finalDose, frequency: formData.frequency,
      quantity: Number(formData.quantity), targetQuantity: Number(formData.targetQuantity),
      expiryDate: formData.expiryDate, instructions: formData.instructions, notes: formData.notes
    };

    const updated = editingItem ? items.map(i => i.id === editingItem.id ? newItem : i) : [newItem, ...items];
    setSyncedItem(STORAGE_KEY, JSON.stringify(updated));
    setIsModalOpen(false);
  };

  const deleteItem = (id: string) => {
    setSyncedItem(STORAGE_KEY, JSON.stringify(items.filter(i => i.id !== id)));
    if (editingItem?.id === id) setIsModalOpen(false);
  };

  const sortedItems = [...items].sort((a, b) => {
    const map = { EXPIRED: 0, MISSING: 1, LOW: 2, OK: 3 };
    return map[getStatus(a)] - map[getStatus(b)];
  });

  const effectiveFilter = externalFilter && externalFilter !== 'ALL' ? externalFilter : statusFilter;
  
  const filtered = useMemo(() => {
    let baseFiltered = sortedItems.filter(i => {
      const matchesCat = selectedCategory === 'All' || i.category === selectedCategory;
      const matchesPerson = selectedPerson === 'All' || i.person === selectedPerson || (!i.person && selectedPerson === 'Shared');
      const matchesStatus = effectiveFilter === 'ALL' || getStatus(i) === effectiveFilter;
      return matchesCat && matchesPerson && matchesStatus;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      baseFiltered = baseFiltered.filter(i => 
        i.itemName.toLowerCase().includes(q) ||
        (i.purpose || '').toLowerCase().includes(q) ||
        (i.dose || '').toLowerCase().includes(q) ||
        (i.notes || '').toLowerCase().includes(q)
      );
    }
    return baseFiltered;
  }, [sortedItems, selectedCategory, selectedPerson, effectiveFilter, searchQuery]);

  const stats = {
    low: items.filter(i => getStatus(i) === 'LOW').length,
    missing: items.filter(i => getStatus(i) === 'MISSING').length,
    expired: items.filter(i => getStatus(i) === 'EXPIRED').length
  };

  return (
    <section className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2 font-bold uppercase">
        <SectionTitle>Supplement Section</SectionTitle>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl h-[54px]">
            <button onClick={() => toggleViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => toggleViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`}><List size={18} /></button>
          </div>
          <select value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)} className="bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 rounded-2xl h-[54px] px-4 text-xs border-none cursor-pointer outline-none">
            <option value="All">Anyone</option>
            <option value="Shared">Shared</option>
            {familyMembers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="relative group flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search supplements..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 text-xs font-bold rounded-2xl h-[54px] pl-12 pr-4 border-none w-full outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all font-bold"
            />
          </div>
          <button onClick={() => setIsFamilyModalOpen(true)} className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl h-[54px] text-zinc-500 dark:text-zinc-400"><Settings size={20} /></button>
          <button onClick={openAddModal} className="bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 text-xs px-8 py-4 rounded-2xl h-[54px] transition-all hover:scale-105 w-full md:w-auto border border-transparent dark:border-zinc-700">+ ADD</button>
        </div>
      </div>

      <div className={`p-5 rounded-2xl border-2 border-l-[6px] bg-white dark:bg-zinc-900 mb-8 shadow-sm ${stats.expired ? 'border-rose-200 dark:border-rose-900 border-l-rose-500' : stats.missing ? 'border-amber-200 dark:border-amber-900 border-l-amber-500' : 'border-emerald-200 dark:border-emerald-900 border-l-emerald-500'}`}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 font-bold">
           <span>{stats.expired ? 'Replace expired items' : stats.missing ? 'Restock missing items' : 'Systems nominal'}</span>
           <div className="flex gap-4 text-xs">
             {stats.low > 0 && <button onClick={() => setStatusFilter('LOW')} className="text-amber-600 underline">{stats.low} low</button>}
             {stats.missing > 0 && <button onClick={() => setStatusFilter('MISSING')} className="text-rose-600 underline">{stats.missing} missing</button>}
             {stats.expired > 0 && <button onClick={() => setStatusFilter('EXPIRED')} className="text-zinc-500 underline">{stats.expired} expired</button>}
             {statusFilter !== 'ALL' && <button onClick={() => setStatusFilter('ALL')} className="text-zinc-400">Clear</button>}
           </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[700px] overflow-y-auto custom-scrollbar pr-2 pb-6">
          {filtered.map(i => {
            const status = getStatus(i);
            const progress = Math.min((i.quantity / i.targetQuantity) * 100, 100);
            
            return (
              <div 
                key={i.id} 
                onClick={() => openEditModal(i)} 
                className="relative group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
              >
                {/* Status Badge Floating */}
                <div className="absolute top-6 right-6">
                  <span className={getStatusStyles(status)}>
                    {getStatusIcon(status)}
                    {status}
                  </span>
                </div>

                {/* Header Content */}
                <div className="mb-6 pr-20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 shrink-0 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                      <Pill size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {i.itemName}
                      </h3>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{i.category}</span>
                      </div>
                    </div>
                  </div>
                  {i.purpose && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium italic mt-2 line-clamp-1">
                      {i.purpose}
                    </p>
                  )}
                </div>

                {/* Progress Section */}
                <div className="mt-auto space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end px-1">
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">Current Stock</span>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {i.quantity} <span className="text-zinc-400 font-medium">/ {i.targetQuantity}</span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          status === 'OK' ? 'bg-emerald-500' : 
                          status === 'LOW' ? 'bg-amber-500' : 
                          'bg-rose-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Dose</span>
                      </div>
                      <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate">
                        {i.dose || 'Not set'}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Expiry</span>
                      </div>
                      <div className={`text-[11px] font-bold ${status === 'EXPIRED' ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {new Date(i.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Footer Badge */}
                  <div className="flex items-center justify-between mt-2 pt-2">
                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-white/5 px-3 py-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                      <User size={12} className="text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{i.person || 'Shared'}</span>
                    </div>
                    {i.notes && (
                      <div title={i.notes} className="p-2 text-zinc-300 hover:text-emerald-500 transition-colors">
                        <Info size={16} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left font-bold min-w-[800px]">
              <thead className="bg-zinc-50 dark:bg-zinc-800 text-[10px] text-zinc-500 uppercase">
                <tr><th className="p-4">Status</th><th className="p-4">Name</th><th className="p-4">Purpose</th><th className="p-4">Person</th><th className="p-4">Qty</th><th className="p-4">Expiry</th><th className="p-4">Notes</th></tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map(i => (
                  <tr key={i.id} onClick={() => openEditModal(i)} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <td className="p-4"><span className={getStatusStyles(getStatus(i))}>{getStatus(i)}</span></td>
                    <td className="p-4">{i.itemName}</td>
                    <td className="p-4 text-zinc-500 font-medium">{i.purpose || '-'}</td>
                    <td className="p-4">{i.person || 'Shared'}</td>
                    <td className="p-4">{i.quantity}</td>
                    <td className="p-4">{new Date(i.expiryDate).toLocaleDateString()}</td>
                    <td className="p-4 text-[11px] text-zinc-400 max-w-[150px] truncate">{i.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Supplement" onSubmit={handleSubmit}>
        <DynamicForm 
          sections={[{ id: 's', fields: [
            { name: 'itemName', label: 'Name', type: 'text', required: true, fullWidth: true },
            { name: 'purpose', label: 'Purpose (e.g. Muscle Growth)', type: 'text', fullWidth: true },
            { name: 'category', label: 'Category', type: 'select', options: SUPPLEMENT_CATEGORIES.map(c=>({label:c,value:c})) },
            { name: 'person', label: 'Person', type: 'select', options: ['Shared', ...familyMembers].map(p=>({label:p,value:p})) },
            { name: 'doseAmount', label: 'Dose', type: 'text', required: true },
            { name: 'doseUnit', label: 'Unit', type: 'select', options: [...DOSE_UNITS, 'Other'].map(u=>({label:u,value:u})) },
            { name: 'quantity', label: 'Quantity', type: 'number', required: true },
            { name: 'targetQuantity', label: 'Target', type: 'number', required: true },
            { name: 'expiryDate', label: 'Expiry', type: 'date', required: true },
            { name: 'instructions', label: 'Instructions', type: 'textarea', fullWidth: true },
            { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
          ]}]}
          formData={formData}
          onChange={(n, v) => setFormData(p => ({ ...p, [n]: v }))}
        />
        {editingItem && <button onClick={() => deleteItem(editingItem.id)} className="text-red-500 mt-4 font-bold uppercase">Delete</button>}
      </Modal>

      <Modal isOpen={isFamilyModalOpen} onClose={() => setIsFamilyModalOpen(false)} title="Family">
        <div className="space-y-4">
          <div className="flex gap-2"><input value={newPersonName} onChange={e=>setNewPersonName(e.target.value)} placeholder="Name" className="flex-1 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 p-3 rounded-xl border-none outline-none font-bold"/><button onClick={addFamilyMember} className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-colors"><Plus size={20}/></button></div>
          {familyMembers.map(m => <div key={m} className="flex justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl font-bold border border-zinc-100 dark:border-zinc-800"><span>{m}</span><button onClick={()=>removeFamilyMember(m)} className="text-rose-500 hover:text-rose-600 transition-colors"><Trash2 size={18}/></button></div>)}
        </div>
      </Modal>
    </section>
  );
}
