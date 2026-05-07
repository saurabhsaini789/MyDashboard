"use client";

import React, { useState, useEffect } from 'react';
import { setSyncedItem } from '@/lib/storage';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { SectionTitle } from '../ui/Text';
import { LayoutGrid, List } from 'lucide-react';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

interface Contribution {
  id: string;
  date: string;
  amount: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  initialAmount: number;
  startDate: string;
  targetDate: string;
  contributions: Contribution[];
}

export function SavingsTargets() {
  const goals = useStorageSubscription<SavingsGoal[]>(SYNC_KEYS.FINANCES_SAVINGS_TARGETS, []);
  
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  
  // Contribution modal state
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [targetGoalId, setTargetGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  // History modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyGoalId, setHistoryGoalId] = useState<string | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});

  const viewMode = useStorageSubscription<'grid' | 'table'>(SYNC_KEYS.FINANCES_SAVINGS_VIEW, 'grid');

  useEffect(() => {
    // Component mount logic if needed
  }, []);

  const toggleViewMode = (mode: 'grid' | 'table') => {
    setSyncedItem(SYNC_KEYS.FINANCES_SAVINGS_VIEW, mode);
  };

  const toggleExpand = (id: string) => {
    setExpandedGoals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    initialAmount: '',
    startDate: '',
    targetDate: ''
  });

  const updateGoals = (newGoals: SavingsGoal[]) => {
    setSyncedItem(SYNC_KEYS.FINANCES_SAVINGS_TARGETS, JSON.stringify(newGoals));
  };

  const openAddModal = () => {
    setEditingGoal(null);
    setFormData({
      name: '',
      targetAmount: '',
      initialAmount: '',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });
    setIsGoalModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      initialAmount: goal.initialAmount.toString(),
      startDate: goal.startDate,
      targetDate: goal.targetDate
    });
    setIsGoalModalOpen(true);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal: SavingsGoal = {
      id: editingGoal ? editingGoal.id : Math.random().toString(36).substr(2, 9),
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      initialAmount: parseFloat(formData.initialAmount),
      startDate: formData.startDate,
      targetDate: formData.targetDate,
      contributions: editingGoal ? editingGoal.contributions : []
    };

    if (editingGoal) {
      updateGoals(goals.map(g => g.id === editingGoal.id ? newGoal : g));
    } else {
      updateGoals([...goals, newGoal]);
    }
    setIsGoalModalOpen(false);
  };

  const recordContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetGoalId || !contributionAmount) return;

    const newContrib: Contribution = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(contributionAmount)
    };

    updateGoals(goals.map(g => 
      g.id === targetGoalId 
      ? { ...g, contributions: [newContrib, ...g.contributions] } 
      : g
    ));

    setIsContributionModalOpen(false);
    setContributionAmount('');
    setTargetGoalId(null);
  };

  const deleteContribution = (goalId: string, contribId: string) => {
    updateGoals(goals.map(g => 
      g.id === goalId 
      ? { ...g, contributions: g.contributions.filter(c => c.id !== contribId) } 
      : g
    ));
  };

  const deleteGoal = (id: string) => {
    updateGoals(goals.filter(g => g.id !== id));
    setIsGoalModalOpen(false);
    setEditingGoal(null);
  };

  const calculateTrajectoryMetrics = (goal: SavingsGoal) => {
    const totalContributed = (goal.contributions || []).reduce((sum, c) => sum + c.amount, 0);
    const currentTotal = goal.initialAmount + totalContributed;
    const progress = Math.min(100, (currentTotal / goal.targetAmount) * 100);
    const remaining = Math.max(0, goal.targetAmount - currentTotal);
    
    const now = new Date();
    const start = new Date(goal.startDate);
    const end = new Date(goal.targetDate);
    
    const totalDurationMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const monthsRemaining = Math.max(1, totalDurationMonths - monthsElapsed);
    
    const savingsToGain = goal.targetAmount - goal.initialAmount;
    const expectedCompoundedSavings = (savingsToGain / Math.max(1, totalDurationMonths)) * monthsElapsed;
    const expectedActual = goal.initialAmount + expectedCompoundedSavings;
    
    const status = currentTotal >= expectedActual ? 'Ahead' : 'Behind';
    const requiredMonthly = remaining / monthsRemaining;

    return { 
      progress, 
      currentTotal, 
      remaining, 
      requiredMonthly, 
      status, 
      monthsRemaining,
      recentContributions: (goal.contributions || []).slice(0, 3) 
    };
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full transition-all duration-700 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex flex-row items-center justify-between gap-4 px-1 md:px-2">
        <SectionTitle>Savings Planner</SectionTitle>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button 
              onClick={() => toggleViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => toggleViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              title="Table View"
            >
              <List size={18} />
            </button>
          </div>
          <button 
            onClick={openAddModal}
            className="bg-blue-600 text-white text-xs px-5 sm:px-8 py-2.5 sm:py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-sm dark:shadow-none font-semibold"
          >
            New Goal
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {goals.map(goal => {
            const { progress, currentTotal, remaining, requiredMonthly, status, recentContributions } = calculateTrajectoryMetrics(goal);
            return (
              <div key={goal.id} className="bg-white dark:bg-zinc-900/60 border border-l-4 border-blue-100/50 dark:border-blue-900/30 rounded-2xl p-5 md:p-8 flex flex-col gap-5 md:gap-6 group shadow-sm transition-all relative overflow-hidden">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-xl md:text-2xl text-zinc-900 dark:text-zinc-100 capitalize">{goal.name}</h3>
                      <div className={`hidden sm:block text-xs uppercase px-2.5 py-1 rounded-full border font-semibold ${ status === 'Ahead' ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/30" : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/30" }`}>
                        {status === 'Ahead' ? 'On Schedule' : 'Behind'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(goal)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-6 md:gap-10">
                  <div className="flex flex-col gap-4 md:gap-6">
                    <div className="flex justify-between items-end">
                      <span className="text-2xl md:text-3xl text-zinc-900 dark:text-zinc-100 font-bold">{progress.toFixed(0)}%</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-300 uppercase font-medium">${(currentTotal || 0).toLocaleString()} / ${(goal.targetAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col"><span className="text-xs text-zinc-500 uppercase">Target</span><span className="text-sm font-medium">{new Date(goal.targetDate).toLocaleDateString()}</span></div>
                      <div className="flex flex-col"><span className="text-xs text-zinc-500 uppercase">Monthly</span><span className="text-sm font-bold text-blue-500">${Math.ceil(requiredMonthly).toLocaleString()}</span></div>
                    </div>
                    <button 
                      onClick={() => {setTargetGoalId(goal.id); setIsContributionModalOpen(true);}}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
                    >
                      Fuel Goal
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-x-auto shadow-sm custom-scrollbar">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] md:text-xs text-zinc-500 uppercase font-bold">
              <tr>
                <th className="p-4 px-4 whitespace-nowrap">Goal</th>
                <th className="p-4 px-4 whitespace-nowrap">Target</th>
                <th className="p-4 px-4 whitespace-nowrap">Progress</th>
                <th className="p-4 px-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm md:text-base">
              {goals.map(goal => {
                const { progress } = calculateTrajectoryMetrics(goal);
                return (
                  <tr key={goal.id} className="border-b dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 px-4 font-semibold whitespace-nowrap">{goal.name}</td>
                    <td className="p-4 px-4 font-bold whitespace-nowrap">${goal.targetAmount.toLocaleString()}</td>
                    <td className="p-4 px-4 whitespace-nowrap">{progress.toFixed(0)}%</td>
                    <td className="p-4 px-4 text-right whitespace-nowrap">
                      <button onClick={() => openEditModal(goal)} className="text-blue-600 font-bold hover:underline">Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={editingGoal ? 'Edit Goal' : 'New Goal'} onSubmit={handleGoalSubmit}>
        <DynamicForm 
          sections={[{ id: 'basic', fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'targetAmount', label: 'Target ($)', type: 'number', required: true },
            { name: 'initialAmount', label: 'Initial', type: 'number', required: true },
            { name: 'startDate', label: 'Start', type: 'date', required: true },
            { name: 'targetDate', label: 'Target Date', type: 'date', required: true }
          ]}]}
          formData={formData}
          onChange={(n, v) => setFormData(p => ({ ...p, [n]: v }))}
        />
        {editingGoal && <button onClick={() => deleteGoal(editingGoal.id)} className="text-red-500 mt-4">Delete</button>}
      </Modal>

      <Modal isOpen={isContributionModalOpen} onClose={() => setIsContributionModalOpen(false)} title="Fuel Goal" onSubmit={recordContribution}>
        <DynamicForm 
          sections={[{ id: 'fuel', fields: [{ name: 'amount', label: 'Amount', type: 'number', required: true }]}]}
          formData={{ amount: contributionAmount }}
          onChange={(_, v) => setContributionAmount(v)}
        />
      </Modal>

      <Modal isOpen={isHistoryModalOpen && !!historyGoalId} onClose={() => setIsHistoryModalOpen(false)} title="History">
        <div className="flex flex-col gap-2">
          {goals.find(g => g.id === historyGoalId)?.contributions.map(c => (
            <div key={c.id} className="flex justify-between p-3 bg-zinc-50 rounded-xl">
              <span>${c.amount.toLocaleString()}</span>
              <span>{new Date(c.date).toLocaleDateString()}</span>
              <button onClick={() => deleteContribution(historyGoalId as string, c.id)} className="text-red-500">Delete</button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
