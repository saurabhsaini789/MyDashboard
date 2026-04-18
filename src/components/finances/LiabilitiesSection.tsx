"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getPrefixedKey } from '@/lib/keys';
import { setSyncedItem } from '@/lib/storage';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { calculateLiabilityBalance, type Liability, type PaymentLog } from '@/lib/finances';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { SectionTitle, Text } from '../ui/Text';
import { LayoutGrid, List } from 'lucide-react';

export type LiabilityType = 'Home Loan' | 'Car Loan' | 'Personal Loan' | 'Credit Card' | 'Education Loan' | 'Business Loan' | 'Other';

const LIABILITY_TYPES: LiabilityType[] = [
 'Home Loan', 'Car Loan', 'Personal Loan', 'Credit Card', 'Education Loan', 'Business Loan', 'Other'
];

export function LiabilitiesSection() {
 const [liabilities, setLiabilities] = useState<Liability[]>([]);
 const [monthlyIncome, setMonthlyIncome] = useState(0);
 const [isLoaded, setIsLoaded] = useState(false);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
 const [expandedLiabilities, setExpandedLiabilities] = useState<Record<string, boolean>>({});
 const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

 useEffect(() => {
   const savedView = localStorage.getItem('finances-liabilities-view');
   if (savedView === 'table' || savedView === 'grid') setViewMode(savedView);
 }, []);

 const toggleViewMode = (mode: 'grid' | 'table') => {
   setViewMode(mode);
   localStorage.setItem('finances-liabilities-view', mode);
 };

 const toggleExpand = (id: string) => {
 setExpandedLiabilities(prev => ({ ...prev, [id]: !prev[id] }));
 };

 // Repayment modal state
 const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
 const [activeLiabilityId, setActiveLiabilityId] = useState<string | null>(null);
 const [repayAmount, setRepayAmount] = useState('');
 
 const [repayType, setRepayType] = useState<'Regular EMI' | 'Prepayment'>('Regular EMI');

 // Prepayment Simulation state
 const [isSimModalOpen, setIsSimModalOpen] = useState(false);
 const [simExtraPayment, setSimExtraPayment] = useState('');

 // Payment History state
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

 const liabilitiesRef = useRef(liabilities);
 useEffect(() => {
 liabilitiesRef.current = liabilities;
 }, [liabilities]);

 useEffect(() => {
 // Load Liabilities
 const savedLiabilities = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_LIABILITIES));
 if (savedLiabilities) {
 try {
 setLiabilities(JSON.parse(savedLiabilities));
 } catch (e) {
 console.error("Failed to parse liabilities data", e);
 }
 } else {
 const mock: Liability[] = [
 { 
 id: 'l1', name: 'Home Mortgage', type: 'Home Loan', totalAmount: 350000, remainingBalance: 285000, 
 interestRate: 4.5, emi: 1800, tenureRemaining: 240, paymentLogs: [], lastUpdated: new Date().toISOString().split('T')[0] 
 },
 { 
 id: 'l2', name: 'Tesla Model 3', type: 'Car Loan', totalAmount: 45000, remainingBalance: 12500, 
 interestRate: 2.9, emi: 650, tenureRemaining: 22, paymentLogs: [], lastUpdated: new Date().toISOString().split('T')[0] 
 },
 { 
 id: 'l3', name: 'Amex Platinum', type: 'Credit Card', totalAmount: 5000, remainingBalance: 4200, 
 interestRate: 18.9, emi: 250, tenureRemaining: 18, paymentLogs: [], lastUpdated: new Date().toISOString().split('T')[0] 
 },
 ];
 setLiabilities(mock);
 }

 // Load Income for DTI calculation
 const savedIncome = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_INCOME));
 if (savedIncome) {
 try {
 const records = JSON.parse(savedIncome);
 // Calculate average monthly income (simple sum for current month for now)
 const currentMonth = new Date().getMonth();
 const currentYear = new Date().getFullYear();
 const monthlyTotal = (records || [])
 .filter((r: any) => {
 const d = new Date(r.date);
 return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
 })
 .reduce((sum: number, r: any) => sum + r.amount, 0);
 setMonthlyIncome(monthlyTotal || 5000); // Default fallback
 } catch (e) {}
 } else {
 setMonthlyIncome(6200); // Mock fallback
 }

 const handleLocal = (e: any) => {
 if (e.detail && e.detail.key === SYNC_KEYS.FINANCES_LIABILITIES) {
 const val = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_LIABILITIES));
 if (val && val !== JSON.stringify(liabilitiesRef.current)) {
 try { setLiabilities(JSON.parse(val)); } catch (e) {}
 }
 }
 };
 window.addEventListener('local-storage-change', handleLocal);
 setIsLoaded(true);
 return () => window.removeEventListener('local-storage-change', handleLocal);
 }, []);

 const openAddModal = () => {
 setEditingLiability(null);
 setFormData({
 name: '',
 type: 'Personal Loan',
 totalAmount: '',
 
 remainingBalance: '',
 
 interestRate: '',
 emi: '',
 
 tenureRemaining: ''
 });
 setIsModalOpen(true);
 };

 const openEditModal = (liability: Liability) => {
 setEditingLiability(liability);
 setFormData({
 name: liability.name,
 type: liability.type as LiabilityType,
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
 name: formData.name,
 type: formData.type,
 totalAmount: parseFloat(formData.totalAmount),
 
 remainingBalance: parseFloat(formData.remainingBalance),
 
 interestRate: parseFloat(formData.interestRate),
 emi: parseFloat(formData.emi),
 
 tenureRemaining: parseInt(formData.tenureRemaining),
 paymentLogs: editingLiability ? editingLiability.paymentLogs : [],
 lastUpdated: new Date().toISOString().split('T')[0]
 };

 if (editingLiability) {
 const updated = liabilities.map(l => l.id === editingLiability.id ? newLiability : l);
 setLiabilities(updated);
 setSyncedItem(SYNC_KEYS.FINANCES_LIABILITIES, JSON.stringify(updated));
 } else {
 const updated = [...liabilities, newLiability];
 setLiabilities(updated);
 setSyncedItem(SYNC_KEYS.FINANCES_LIABILITIES, JSON.stringify(updated));
 }
 setIsModalOpen(false);
 };

 const deleteLiability = (id: string) => {
 const updated = liabilities.filter(l => l.id !== id);
 setLiabilities(updated);
 setSyncedItem(SYNC_KEYS.FINANCES_LIABILITIES, JSON.stringify(updated));
 setIsModalOpen(false);
 };

 const handleRepaySubmit = (e: React.FormEvent) => {
 e.preventDefault();
 const amount = parseFloat(repayAmount);
 if (isNaN(amount) || !activeLiabilityId) return;

 const newLog: PaymentLog = {
 id: Math.random().toString(36).substr(2, 9),
 date: new Date().toISOString().split('T')[0],
 amount,
 
 type: repayType
 };

 const updated = liabilities.map(l => {
 if (l.id === activeLiabilityId) {
 const newBalance = Math.max(0, l.remainingBalance - amount);
 return {
 ...l,
 remainingBalance: newBalance,
 paymentLogs: [newLog, ...l.paymentLogs],
 lastUpdated: new Date().toISOString().split('T')[0]
 };
 }
 return l;
 });
 setLiabilities(updated);
 setSyncedItem(SYNC_KEYS.FINANCES_LIABILITIES, JSON.stringify(updated));
 setIsRepayModalOpen(false);
 setRepayAmount('');
 };

 const deletePaymentLog = (liabilityId: string, logId: string) => {
 const updated = liabilities.map(l => {
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
 });
 setLiabilities(updated);
 setSyncedItem(SYNC_KEYS.FINANCES_LIABILITIES, JSON.stringify(updated));
 };

 // Prepayment Simulation Logic
 const calculateSim = (liability: Liability, extra: number) => {
 const r = (liability.interestRate / 100) / 12; // Monthly interest rate
 const P = liability.remainingBalance - extra; // New principal after extra payment
 const EMI = liability.emi;

 if (P <= 0) return { monthsSaved: liability.tenureRemaining, interestSaved: liability.remainingBalance * r * liability.tenureRemaining }; // Simplified

 // Monthly repayment simulation to find Interest Saved & Reduced Tenure
 let currentBalance = liability.remainingBalance;
 let totalInterestOriginal = 0;
 let monthsOriginal = 0;
 while (currentBalance > 0 && monthsOriginal < 600) { // Limit to 50 years
 const interest = currentBalance * r;
 totalInterestOriginal += interest;
 currentBalance = currentBalance - (EMI - interest);
 monthsOriginal++;
 }

 currentBalance = liability.remainingBalance - extra;
 let totalInterestReduced = 0;
 let monthsReduced = 0;
 while (currentBalance > 0 && monthsReduced < 600) {
 const interest = currentBalance * r;
 totalInterestReduced += interest;
 currentBalance = currentBalance - (EMI - interest);
 monthsReduced++;
 }

 return {
 monthsSaved: Math.max(0, monthsOriginal - monthsReduced),
 interestSaved: Math.max(0, totalInterestOriginal - totalInterestReduced)
 };
 };

 const totalDebt = liabilities.reduce((sum, l) => sum + calculateLiabilityBalance(l), 0);
 const totalEMI = liabilities.reduce((sum, l) => sum + l.emi, 0);
 const dti = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0;

 if (!isLoaded) return null;

 return (
 <div className="flex flex-col gap-6 md:gap-8 w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
 {/* Heading & Top Summary Metrics */}
 <div className="flex flex-col gap-4 md:gap-6 px-1 md:px-2">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <SectionTitle>
 Liabilities &amp; Debt
 </SectionTitle>
 <div className="flex items-center gap-3">
    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
      <button 
        onClick={() => toggleViewMode('grid')}
        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
        title="Grid View"
      >
        <LayoutGrid size={18} />
      </button>
      <button 
        onClick={() => toggleViewMode('table')}
        className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 shadow-sm text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
        title="Table View"
      >
        <List size={18} />
      </button>
    </div>
    <button 
    onClick={openAddModal}
    className="bg-rose-600 text-white text-xs px-5 md:px-6 py-2.5 md:py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg md:h-[46px] w-fit font-semibold"
    >
    Add Liability
    </button>
  </div>
 </div>

 {/* Global Summary Cards */}
 <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
 <div className="bg-white dark:bg-zinc-900/60 border border-l-4 border-rose-100/50 dark:border-rose-900/30 rounded-2xl p-5 md:p-6 flex flex-col gap-1 shadow-sm transition-all group overflow-hidden relative">
 <span className="text-xs text-zinc-500 dark:text-zinc-300 font-semibold uppercase">Total Debt</span>
 <div className="flex flex-col">
 <span className="text-xl md:text-2xl text-zinc-900 dark:text-zinc-100 font-bold">
 ${totalDebt.toLocaleString("en-CA", { maximumFractionDigits: 0 })}
 </span>
 
 </div>
 </div>

 <div className="bg-white dark:bg-zinc-900/60 border border-rose-100/50 dark:border-rose-900/30 rounded-2xl p-5 md:p-6 flex flex-col gap-1 shadow-sm transition-all group overflow-hidden relative">
 <span className="text-xs text-zinc-500 dark:text-zinc-300 font-semibold uppercase">EMI Burden</span>
 <div className="flex flex-col">
 <span className="text-xl md:text-2xl text-zinc-900 dark:text-zinc-100 font-bold">
 ${totalEMI.toLocaleString("en-CA", { maximumFractionDigits: 0 })}
 </span>
 
 </div>
 </div>

 <div className="bg-white dark:bg-zinc-900/60 border border-rose-100/50 dark:border-rose-900/30 rounded-2xl p-5 md:p-6 flex flex-col gap-1 shadow-sm transition-all group overflow-hidden relative col-span-2 lg:col-span-1">
 <span className="text-xs text-zinc-500 dark:text-zinc-300 font-semibold uppercase">DTI Ratio</span>
 <div className="flex items-baseline gap-2">
 <span className={`text-xl md:text-2xl font-bold ${dti > 40 ? 'text-rose-500' : dti > 25 ? 'text-amber-500' : 'text-emerald-500'}`}>
 {dti.toFixed(1)}%
 </span>
 <span className={`text-xs uppercase font-semibold ${dti > 40 ? 'text-rose-500' : dti > 25 ? 'text-amber-500' : 'text-emerald-500'}`}>
 {dti > 40 ? 'Critical' : dti > 25 ? 'Moderate' : 'Healthy'}
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* Liabilities Content based on View Mode */}
 {viewMode === 'grid' ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 px-1 md:px-2">
 {liabilities.map(liability => {
 const payoffProgress = ((liability.totalAmount - liability.remainingBalance) / liability.totalAmount) * 100;
 const isHighInterest = liability.interestRate >= 10;
 
 return (
 <div 
 key={liability.id} 
 className="bg-white dark:bg-zinc-900/60 border border-l-4 border-rose-100/50 dark:border-rose-900/30 rounded-2xl p-5 md:p-6 flex flex-col gap-5 group shadow-sm transition-all relative overflow-hidden"
 >
 {/* Card Header */}
 <div className="flex justify-between items-start gap-4">
 <div className="flex flex-col flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2 mb-1">
 <span className="text-xs uppercase px-2 py-0.5 rounded-full border border-rose-100/50 bg-rose-50/50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/30 w-fit leading-none whitespace-nowrap font-semibold">
 {liability.type}
 </span>
 {isHighInterest && (
 <span className="bg-rose-500 text-white text-xs font-semibold uppercase px-2 py-0.5 rounded-full animate-pulse leading-none whitespace-nowrap">
 High interest
 </span>
 )}
 </div>
 <h3 className="text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
 {liability.name}
 </h3>
 </div>
 <div className="flex items-center gap-1 flex-shrink-0">
 <button 
 onClick={() => openEditModal(liability)}
 className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
 title="Edit Liability"
 >
 <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
 </button>
 <button 
 onClick={() => {
 setActiveLiabilityId(liability.id);
 setIsHistoryModalOpen(true);
 }}
 className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
 title="View History"
 >
 <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
 </button>
 <button 
 onClick={() => toggleExpand(liability.id)}
 className="sm:hidden p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
 >
 <svg 
 className={`w-5 h-5 transition-transform duration-300 ${expandedLiabilities[liability.id] ? 'rotate-180' : ''}`} 
 fill="none" viewBox="0 0 24 24" stroke="currentColor"
 >
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
 </svg>
 </button>
 </div>
 </div>

 <div className="flex flex-col gap-4">
 {/* Progress Bar (Always visible for better hierarchy) */}
 <div className="flex flex-col gap-1.5">
 <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-300 uppercase font-semibold">
 <span>Payoff progress</span>
 <span>{payoffProgress.toFixed(0)}%</span>
 </div>
 <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
 <div 
 className={`h-full transition-all duration-1000 bg-rose-500`} 
 style={{ width: `${payoffProgress}%` }}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="flex flex-col">
 <span className="text-xs text-zinc-500 dark:text-zinc-300 uppercase font-semibold">Outstanding Bal</span>
 <span className="text-lg md:text-xl text-zinc-900 dark:text-zinc-100 font-bold">
 ${calculateLiabilityBalance(liability).toLocaleString("en-CA", { maximumFractionDigits: 0 })}
 </span>
 
 </div>
 </div>
 </div>

 <div className={`md:flex flex-col gap-5 w-full ${expandedLiabilities[liability.id] ? 'flex' : 'hidden'}`}>
 {/* Progress Bar */}
 <div className="flex flex-col gap-2">
 <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-300 uppercase">
 <span>Payoff Progress</span>
 <span>{payoffProgress.toFixed(0)}%</span>
 </div>
 <div className="w-full h-2 bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden">
 <div 
 className={`h-full transition-all duration-1000 bg-rose-500`} 
 style={{ width: `${payoffProgress}%` }}
 />
 </div>
 </div>

 {/* Loan Details */}
 <div className="grid grid-cols-2 gap-4">
 <div className="flex flex-col gap-0.5">
 <span className="text-xs text-zinc-600 dark:text-zinc-300 uppercase font-semibold">Remaining</span>
 <span className="text-lg text-zinc-900 dark:text-zinc-100">
 ${calculateLiabilityBalance(liability).toLocaleString("en-CA", { maximumFractionDigits: 0 })}
 </span>
 </div>
 <div className="flex flex-col gap-0.5 text-right">
 <span className="text-xs text-zinc-600 dark:text-zinc-300 uppercase">Interest Rate</span>
 <span className={`text-lg ${isHighInterest ? 'text-rose-500' : liability.interestRate < 5 ? 'text-emerald-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
 {liability.interestRate}%
 </span>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="grid grid-cols-2 gap-2">
 <button 
 onClick={() => {
 setActiveLiabilityId(liability.id);
 setRepayType('Regular EMI');
 setRepayAmount(liability.emi.toString());
 setIsRepayModalOpen(true);
 }}
 className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs uppercase hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-semibold"
 >
 Repay
 </button>
 <button 
 onClick={() => {
 setActiveLiabilityId(liability.id);
 setIsSimModalOpen(true);
 }}
 className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-500/10 text-rose-600 dark:text-rose-400 text-xs uppercase hover:bg-rose-50 dark:hover:bg-rose-500/5 transition-all font-semibold"
 >
 Preview Payoff
 </button>
 </div>

 {/* Footer Meta */}
 <div className="flex flex-col gap-1.5 mt-auto border-t border-zinc-50 dark:border-zinc-800/50 pt-4">
 <div className="flex items-center justify-between">
 <span className="text-xs text-zinc-500 dark:text-zinc-300 uppercase">Tenure Left</span>
 <span className="text-xs text-zinc-600 dark:text-zinc-300">
 {liability.tenureRemaining} Months
 </span>
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
   <div className="bg-white dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-500 mx-1 md:mx-2">
     <div className="overflow-x-auto custom-scrollbar">
       <table className="w-full text-left border-collapse min-w-[900px]">
         <thead>
           <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800">
             <th className="p-4 px-6 text-[11px] uppercase text-zinc-500 font-bold tracking-wider">Liability</th>
             <th className="p-4 px-6 text-[11px] uppercase text-zinc-500 font-bold tracking-wider">Outstanding Balance</th>
             <th className="p-4 px-6 text-[11px] uppercase text-zinc-500 font-bold tracking-wider">Interest Rate</th>
             <th className="p-4 px-6 text-[11px] uppercase text-zinc-500 font-bold tracking-wider">Monthly EMI</th>
             <th className="p-4 px-6 text-[11px] uppercase text-zinc-500 font-bold tracking-wider">Tenure Left</th>
             <th className="p-4 px-6 text-[11px] uppercase text-zinc-500 font-bold tracking-wider text-right">Actions</th>
           </tr>
         </thead>
         <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
           {liabilities.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).map(liability => {
             const isHighInterest = liability.interestRate >= 10;
             const payoffProgress = ((liability.totalAmount - liability.remainingBalance) / liability.totalAmount) * 100;
             return (
               <tr key={liability.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                 <td className="p-4 px-6">
                   <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-2">
                       <span className="font-semibold text-zinc-900 dark:text-zinc-100">{liability.name}</span>
                       {isHighInterest && (
                         <span className="bg-rose-500 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full leading-none">
                           High
                         </span>
                       )}
                     </div>
                     <span className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 w-fit font-bold uppercase">
                       {liability.type}
                     </span>
                   </div>
                 </td>
                 <td className="p-4 px-6">
                   <div className="flex flex-col gap-1.5">
                     <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                       ${calculateLiabilityBalance(liability).toLocaleString("en-CA", { maximumFractionDigits: 0 })}
                     </span>
                     <div className="w-24 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-rose-500" style={{ width: `${payoffProgress}%` }} />
                     </div>
                   </div>
                 </td>
                 <td className="p-4 px-6">
                   <span className={`text-sm font-bold ${isHighInterest ? 'text-rose-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                     {liability.interestRate}%
                   </span>
                 </td>
                 <td className="p-4 px-6">
                   <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                     ${liability.emi.toLocaleString("en-CA", { maximumFractionDigits: 0 })}
                   </span>
                 </td>
                 <td className="p-4 px-6">
                   <span className="text-xs text-zinc-500 font-medium">
                     {liability.tenureRemaining} Months
                   </span>
                 </td>
                 <td className="p-4 px-6 text-right">
                   <div className="flex items-center justify-end gap-1">
                     <button 
                       onClick={() => {
                         setActiveLiabilityId(liability.id);
                         setRepayType('Regular EMI');
                         setRepayAmount(liability.emi.toString());
                         setIsRepayModalOpen(true);
                       }}
                       className="p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                       title="Repay EMI"
                     >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                     </button>
                     <button 
                       onClick={() => {
                         setActiveLiabilityId(liability.id);
                         setIsSimModalOpen(true);
                       }}
                       className="p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                       title="Preview Payoff"
                     >
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                     </button>
                     <button 
                       onClick={() => {
                         setActiveLiabilityId(liability.id);
                         setIsHistoryModalOpen(true);
                       }}
                       className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                       title="View History"
                     >
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </button>
                     <button 
                       onClick={() => openEditModal(liability)}
                       className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                       title="Edit Liability"
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

 {/* Schema-Driven Add/Edit Liability Modal */}
 <Modal
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 title={editingLiability ? 'Modify liability' : 'New liability'}
 onSubmit={handleSubmit}
 submitText={editingLiability ? 'Update' : 'Save'}
 accentColor="rose"
 >
 <DynamicForm
 sections={[
 {
 id: 'basic',
 title: 'Liability profile',
 fields: [
 { name: 'name', label: 'Liability Name', type: 'text', required: true, fullWidth: true, placeholder: 'e.g. Home Mortgage...' },
 { 
 name: 'type', 
 label: 'Loan Type', 
 type: 'select', 
 options: LIABILITY_TYPES.map(t => ({ label: t, value: t }))
 },
 { name: 'totalAmount', label: 'Total Amount', type: 'number', required: true, step: "0.01", placeholder: "0.00" },
 { name: 'remainingBalance', label: 'Remaining Balance', type: 'number', required: true, step: "0.01", placeholder: "0.00" },
 { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true, step: "0.01", placeholder: "0.00" },
 { name: 'emi', label: 'Monthly EMI', type: 'number', required: true, step: "0.01", placeholder: "0.00" },
 { name: 'tenureRemaining', label: 'Remaining Tenure (Months)', type: 'number', required: true, placeholder: "0" }
 ]
 }
 ]}
 formData={formData}
 accentColor="rose"
 onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
 />
 {editingLiability && (
 <div className="mt-4 flex justify-start w-full">
 <button 
 type="button" 
 onClick={() => deleteLiability(editingLiability.id)} 
 className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
 >
 Delete Liability
 </button>
 </div>
 )}
 </Modal>

 {/* Schema-Driven Repay Modal */}
 <Modal
 isOpen={isRepayModalOpen}
 onClose={() => setIsRepayModalOpen(false)}
 title="Log payment"
 onSubmit={handleRepaySubmit}
 submitText="Log Payment"
 >
 <DynamicForm
 sections={[
 {
 id: 'repay',
 title: 'Payment details',
 fields: [
 {
 name: 'repayType',
 label: 'Payment Type',
 fullWidth: true,
 render: ({ name, value, onChange }) => (
 <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-2">
 <button 
 type="button" 
 onClick={() => onChange(name, 'Regular EMI')}
 className={`flex-1 py-2 text-xs uppercase rounded-lg transition-all font-semibold ${value === 'Regular EMI' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-600'}`}
 >
 Regular EMI
 </button>
 <button 
 type="button" 
 onClick={() => onChange(name, 'Prepayment')}
 className={`flex-1 py-2 text-xs uppercase rounded-lg transition-all font-semibold ${value === 'Prepayment' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none' : 'text-zinc-600'}`}
 >
 Prepayment
 </button>
 </div>
 )
 },
 { name: 'amount', label: 'Amount', type: 'number', required: true, step: "0.01", placeholder: "0.00", fullWidth: true }
 ]
 }
 ]}
 formData={{ amount: repayAmount, repayType }}
 onChange={(name, value) => {
 if (name === 'amount') setRepayAmount(value);
 if (name === 'repayType') setRepayType(value);
 }}
 />
 </Modal>

 {/* Schema-Driven Simulation Modal */}
 <Modal
 isOpen={isSimModalOpen}
 onClose={() => setIsSimModalOpen(false)}
 title="Payoff impact"
 onSubmit={(e) => { e.preventDefault(); setIsSimModalOpen(false); }}
 submitText="Done"
 >
 <p className="text-xs text-zinc-500 text-center uppercase mb-6 font-semibold">
 Visualize how much time and interest you save with an extra payment.
 </p>
 <DynamicForm
 sections={[
 {
 id: 'sim',
 title: 'Simulation',
 fields: [
 { name: 'extra', label: 'Extra One-Time Payment ($)', type: 'number', step: "100", placeholder: "e.g. 5000", fullWidth: true }
 ]
 }
 ]}
 formData={{ extra: simExtraPayment }}
 onChange={(_, value) => setSimExtraPayment(value)}
 />
 {simExtraPayment && activeLiabilityId && (
 <div className="mt-6 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
 <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl p-6 flex flex-col gap-1 items-center text-center">
 <span className="text-xs text-zinc-600 dark:text-zinc-300 uppercase font-semibold">Interest Saved</span>
 <span className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
 ${calculateSim(liabilities.find(l => l.id === activeLiabilityId)!, parseFloat(simExtraPayment)).interestSaved.toLocaleString("en-CA", { maximumFractionDigits: 0 })}
 </span>
 </div>
 <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-3xl p-6 flex flex-col gap-1 items-center text-center">
 <span className="text-xs text-zinc-600 dark:text-zinc-300 uppercase font-semibold">Time Saved</span>
 <span className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
 {calculateSim(liabilities.find(l => l.id === activeLiabilityId)!, parseFloat(simExtraPayment)).monthsSaved} Months
 </span>
 </div>
 </div>
 )}
 </Modal>

 {/* History Modal */}
 <Modal
 isOpen={isHistoryModalOpen}
 onClose={() => setIsHistoryModalOpen(false)}
 title="Payment History"
 accentColor="rose"
 >
 <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
 {activeLiabilityId && (liabilities.find(l => l.id === activeLiabilityId)?.paymentLogs || []).length === 0 && (
 <div className="text-center py-10">
 <p className="text-zinc-500 text-sm uppercase font-semibold tracking-wider">No payment history found</p>
 </div>
 )}
 {activeLiabilityId && (liabilities.find(l => l.id === activeLiabilityId)?.paymentLogs || []).map(log => (
 <div key={log.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-all hover:border-rose-100/50 dark:hover:border-rose-900/30 group">
 <div className="flex flex-col gap-0.5">
 <span className={`text-[10px] uppercase font-bold tracking-wider ${log.type === 'Prepayment' ? 'text-rose-500' : 'text-zinc-500'}`}>
 {log.type}
 </span>
 <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
 ${log.amount.toLocaleString("en-CA", { maximumFractionDigits: 0 })}
 </span>
 <span className="text-xs text-zinc-500 font-medium">
 {new Date(log.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
 </span>
 </div>
 <button 
 onClick={() => deletePaymentLog(activeLiabilityId, log.id)}
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
