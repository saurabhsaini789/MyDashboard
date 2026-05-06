"use client";

import React, { useState, useEffect } from 'react';
import { setSyncedItem } from '@/lib/storage';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { calculateLiabilityBalance, type Liability, type PaymentLog } from '@/lib/finances';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { SectionTitle, Text } from '../ui/Text';
import { LayoutGrid, List } from 'lucide-react';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

export type LiabilityType = 'Home Loan' | 'Car Loan' | 'Personal Loan' | 'Credit Card' | 'Education Loan' | 'Business Loan' | 'Other';

const LIABILITY_TYPES: LiabilityType[] = [
  'Home Loan', 'Car Loan', 'Personal Loan', 'Credit Card', 'Education Loan', 'Business Loan', 'Other'
];

export function LiabilitiesSection() {
  const liabilities = useStorageSubscription<Liability[]>(SYNC_KEYS.FINANCES_LIABILITIES, []);
  const incomeRecords = useStorageSubscription<any[]>(SYNC_KEYS.FINANCES_INCOME, []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [expandedLiabilities, setExpandedLiabilities] = useState<Record<string, boolean>>({});
  const viewMode = useStorageSubscription<'grid' | 'table'>(SYNC_KEYS.FINANCES_LIABILITIES_VIEW, 'grid');

  useEffect(() => {
    // Component mount logic if needed
  }, []);

  const toggleViewMode = (mode: 'grid' | 'table') => {
    setSyncedItem(SYNC_KEYS.FINANCES_LIABILITIES_VIEW, mode);
  };

  const toggleExpand = (id: string) => {
    setExpandedLiabilities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [activeLiabilityId, setActiveLiabilityId] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayType, setRepayType] = useState<'Regular EMI' | 'Prepayment'>('Regular EMI');
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [simExtraPayment, setSimExtraPayment] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'Personal Loan' as LiabilityType,
    totalAmount: '',
    remainingBalance: '',
    interestRate: '',
    emi: '',
    tenureRemaining: ''
  });

  const updateLiabilities = (newLiabilities: Liability[]) => {
    setSyncedItem(SYNC_KEYS.FINANCES_LIABILITIES, JSON.stringify(newLiabilities));
  };

  const openAddModal = () => {
    setEditingLiability(null);
    setFormData({
      name: '', type: 'Personal Loan', totalAmount: '',
      remainingBalance: '', interestRate: '', emi: '', tenureRemaining: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (liability: Liability) => {
    setEditingLiability(liability);
    setFormData({
      name: liability.name, type: liability.type as LiabilityType,
      totalAmount: liability.totalAmount?.toString() || '',
      remainingBalance: liability.remainingBalance?.toString() || '',
      interestRate: liability.interestRate?.toString() || '',
      emi: liability.emi?.toString() || '',
      tenureRemaining: liability.tenureRemaining?.toString() || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLiability: Liability = {
      id: editingLiability ? editingLiability.id : Math.random().toString(36).substr(2, 9),
      name: formData.name, type: formData.type,
      totalAmount: parseFloat(formData.totalAmount),
      remainingBalance: parseFloat(formData.remainingBalance),
      interestRate: parseFloat(formData.interestRate),
      emi: parseFloat(formData.emi),
      tenureRemaining: parseInt(formData.tenureRemaining),
      paymentLogs: editingLiability ? editingLiability.paymentLogs : [],
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (editingLiability) {
      updateLiabilities(liabilities.map(l => l.id === editingLiability.id ? newLiability : l));
    } else {
      updateLiabilities([...liabilities, newLiability]);
    }
    setIsModalOpen(false);
  };

  const deleteLiability = (id: string) => {
    updateLiabilities(liabilities.filter(l => l.id !== id));
    setIsModalOpen(false);
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(repayAmount);
    if (isNaN(amount) || !activeLiabilityId) return;

    const newLog: PaymentLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      amount, type: repayType
    };

    updateLiabilities(liabilities.map(l => {
      if (l.id === activeLiabilityId) {
        return {
          ...l,
          remainingBalance: Math.max(0, l.remainingBalance - amount),
          paymentLogs: [newLog, ...l.paymentLogs],
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return l;
    }));
    setIsRepayModalOpen(false);
    setRepayAmount('');
  };

  const deletePaymentLog = (liabilityId: string, logId: string) => {
    updateLiabilities(liabilities.map(l => {
      if (l.id === liabilityId) {
        const logToDelete = l.paymentLogs.find(p => p.id === logId);
        if (!logToDelete) return l;
        return {
          ...l,
          remainingBalance: l.remainingBalance + logToDelete.amount,
          paymentLogs: l.paymentLogs.filter(p => p.id !== logId),
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return l;
    }));
  };

  const monthlyIncome = incomeRecords
    .filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
    })
    .reduce((sum, r) => sum + r.amount, 0) || 5000;

  const totalDebt = liabilities.reduce((sum, l) => sum + calculateLiabilityBalance(l), 0);
  const totalEMI = liabilities.reduce((sum, l) => sum + l.emi, 0);
  const dti = (totalEMI / monthlyIncome) * 100;

  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col gap-4 md:gap-6 px-1 md:px-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <SectionTitle>Liabilities & Debt</SectionTitle>
          <div className="flex items-center gap-3">
             <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
               <button onClick={() => toggleViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`} title="Grid View"><LayoutGrid size={18} /></button>
               <button onClick={() => toggleViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 shadow-sm text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`} title="Table View"><List size={18} /></button>
             </div>
             <button onClick={openAddModal} className="bg-rose-600 text-white text-xs px-5 md:px-6 py-2.5 md:py-3 rounded-xl hover:scale-105 transition-all shadow-lg font-semibold">Add Liability</button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 font-bold uppercase">
          <div className="bg-white dark:bg-zinc-900/60 border border-l-4 border-rose-100 rounded-2xl p-5 md:p-6 flex flex-col gap-1 shadow-sm">
            <span className="text-xs text-zinc-500">Total Debt</span>
            <span className="text-xl md:text-2xl">${totalDebt.toLocaleString()}</span>
          </div>
          <div className="bg-white dark:bg-zinc-900/60 border border-rose-100 rounded-2xl p-5 md:p-6 flex flex-col gap-1 shadow-sm">
            <span className="text-xs text-zinc-500">Monthly EMI</span>
            <span className="text-xl md:text-2xl text-rose-500">${totalEMI.toLocaleString()}</span>
          </div>
          <div className="bg-white dark:bg-zinc-900/60 border border-rose-100 rounded-2xl p-5 md:p-6 flex flex-col gap-1 shadow-sm">
            <span className="text-xs text-zinc-500">DTI Ratio</span>
            <span className={`text-xl md:text-2xl ${dti > 40 ? 'text-rose-500' : 'text-emerald-500'}`}>{dti.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 px-1 md:px-2">
          {liabilities.map(l => {
             const progress = ((l.totalAmount - l.remainingBalance) / l.totalAmount) * 100;
             return (
               <div key={l.id} className="bg-white dark:bg-zinc-900/60 border border-l-4 border-rose-100 rounded-2xl p-5 md:p-6 flex flex-col gap-5 shadow-sm group relative">
                 <div className="flex justify-between items-start">
                   <div className="flex flex-col"><span className="text-xs text-rose-600 font-bold uppercase">{l.type}</span><h3 className="font-semibold text-lg">{l.name}</h3></div>
                   <button onClick={() => openEditModal(l)} className="text-zinc-400 transition-colors hover:text-zinc-900"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                 </div>
                 <div className="flex flex-col gap-2">
                   <div className="flex justify-between text-xs font-bold text-zinc-500"><span>Progress</span><span>{progress.toFixed(0)}%</span></div>
                   <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-rose-500" style={{width:`${progress}%`}} /></div>
                   <div className="mt-2"><span className="text-xs font-bold text-zinc-500 uppercase">Balance</span><div className="text-xl font-bold">${calculateLiabilityBalance(l).toLocaleString()}</div></div>
                 </div>
                 <div className="grid grid-cols-2 gap-2"><button onClick={() => { setActiveLiabilityId(l.id); setRepayType('Regular EMI'); setRepayAmount(l.emi.toString()); setIsRepayModalOpen(true); }} className="p-2.5 border dark:border-zinc-800 rounded-xl text-xs font-bold uppercase hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">Pay EMI</button><button onClick={() => { setActiveLiabilityId(l.id); setIsSimModalOpen(true); }} className="p-2.5 border dark:border-zinc-800 rounded-xl text-xs font-bold uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">Preview</button></div>
               </div>
             );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden mx-1 md:mx-2 shadow-sm">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-500 uppercase font-bold">
              <tr><th className="p-4 px-6">Liability</th><th className="p-4 px-6">Balance</th><th className="p-4 px-6">Rate</th><th className="p-4 px-6">EMI</th><th className="p-4 px-6 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {liabilities.map(l => (
                <tr key={l.id} className="border-b dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="p-4 px-6 font-semibold">{l.name}</td>
                  <td className="p-4 px-6 font-bold">${calculateLiabilityBalance(l).toLocaleString()}</td>
                  <td className="p-4 px-6">{l.interestRate}%</td>
                  <td className="p-4 px-6 font-bold text-rose-500">${l.emi.toLocaleString()}</td>
                  <td className="p-4 px-6 text-right"><button onClick={() => openEditModal(l)} className="text-rose-500">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLiability ? 'Edit Liability' : 'New Liability'} onSubmit={handleSubmit}>
        <DynamicForm sections={[{id:'a', fields:[
          {name:'name', label:'Name', type:'text', required:true},
          {name:'type', label:'Type', type:'select', options:LIABILITY_TYPES.map(t=>({label:t,value:t}))},
          {name:'totalAmount', label:'Total', type:'number', required:true},
          {name:'remainingBalance', label:'Balance', type:'number', required:true},
          {name:'interestRate', label:'Rate (%)', type:'number', required:true},
          {name:'emi', label:'EMI', type:'number', required:true},
          {name:'tenureRemaining', label:'Tenure (Months)', type:'number', required:true}
        ]}]} formData={formData} onChange={(n,v)=>setFormData(p=>({...p,[n]:v}))} />
        {editingLiability && <button onClick={()=>deleteLiability(editingLiability.id)} className="text-red-500 mt-4">Delete</button>}
      </Modal>

      <Modal isOpen={isRepayModalOpen} onClose={() => setIsRepayModalOpen(false)} title="Repay" onSubmit={handleRepaySubmit}>
        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-4"><button type="button" onClick={()=>setRepayType('Regular EMI')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${repayType==='Regular EMI'?'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white':'text-zinc-500 dark:text-zinc-400'}`}>Regular EMI</button><button type="button" onClick={()=>setRepayType('Prepayment')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${repayType==='Prepayment'?'bg-rose-500 text-white shadow-lg':'text-zinc-500 dark:text-zinc-400'}`}>Prepayment</button></div>
        <DynamicForm sections={[{id:'r', fields:[{name:'amount', label:'Amount', type:'number', required:true}]}]} formData={{amount:repayAmount}} onChange={(_,v)=>setRepayAmount(v)} />
      </Modal>

      <Modal isOpen={isSimModalOpen} onClose={() => setIsSimModalOpen(false)} title="Payoff Impact">
        <DynamicForm sections={[{id:'s', fields:[{name:'extra', label:'One-Time Extra', type:'number'}]}]} formData={{extra:simExtraPayment}} onChange={(_,v)=>setSimExtraPayment(v)} />
      </Modal>
    </div>
  );
}
