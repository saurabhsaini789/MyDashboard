"use client";

import React, { useState, useEffect } from 'react';
import { Wallet, Shield, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { getPrefixedKey } from '@/lib/keys';
import { MultiSelectDropdown } from '../ui/MultiSelectDropdown';
import { MONTHS, YEARS } from '@/lib/constants';
import { calculateAssetBalance, calculateLiabilityBalance, type Asset, type Liability } from '@/lib/finances';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { Text, SectionTitle } from '../ui/Text';

interface MetricProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  color: 'teal' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'blue';
  customBg?: string;
}

function MetricCard({ label, value, subValue, icon, color, customBg }: MetricProps) {
  const iconClasses = {
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  };

  const borderClasses = {
    teal: "border-teal-100/50 dark:border-teal-900/30",
    emerald: "border-emerald-100/50 dark:border-emerald-900/30",
    rose: "border-rose-100/50 dark:border-rose-900/30",
    amber: "border-amber-100/50 dark:border-amber-900/30",
    indigo: "border-indigo-100/50 dark:border-indigo-900/30",
    blue: "border-blue-100/50 dark:border-blue-900/30",
  };

  return (
    <div className={`flex flex-col p-4 md:p-6 rounded-2xl border border-l-4 shadow-sm transition-all group relative overflow-hidden h-full bg-white dark:bg-zinc-900/60 ${customBg || borderClasses[color]}`}>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className={`p-2.5 md:p-3.5 rounded-2xl transition-colors ${iconClasses[color]}`}>
          {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5 md:w-6 md:h-6" })}
        </div>
        {subValue && (
          <div className="flex flex-col items-end">
            <Text variant="label" as="span" className="bg-zinc-50 dark:bg-zinc-800/50 px-2.5 py-1 rounded-full text-right leading-none">
              {subValue}
            </Text>
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-0.5">
        <Text variant="label" as="span" className="mb-0.5">
          {label}
        </Text>
        <div className="flex flex-col">
          <Text variant="metric" as="span" className="text-xl md:text-2xl leading-none">
            {value}
          </Text>
        </div>
      </div>
    </div>
  );
}

interface EmergencyFundData {
  targetAmount: number;
  monthlyExpenses: number;
  contributions: { id: string; amount: number }[];
}

export function FinanceOverview() {
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [emergencyFundMonths, setEmergencyFundMonths] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filter states
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]); // Initialize empty for SSR
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  const calculateFinance = () => {
    // 1. Calculate Income
    const incomeData = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_INCOME));
    let totalIncomeCount = 0;
    if (incomeData) {
      try {
        const records = JSON.parse(incomeData);
        totalIncomeCount = records
          .filter((r: any) => {
            const d = new Date(r.date);
            return selectedMonths.includes(d.getMonth()) && selectedYears.includes(d.getFullYear());
          })
          .reduce((sum: number, r: any) => sum + r.amount, 0);
      } catch (e) { }
    }
    setIncome(totalIncomeCount);

    // 2. Calculate Expenses
    const expenseData = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_EXPENSES));
    let totalExpensesCount = 0;
    if (expenseData) {
      try {
        const records = JSON.parse(expenseData);
        totalExpensesCount = records
          .filter((r: any) => {
            const d = new Date(r.date);
            return selectedMonths.includes(d.getMonth()) && selectedYears.includes(d.getFullYear());
          })
          .reduce((sum: number, r: any) => sum + r.amount, 0);
      } catch (e) { }
    }
    setExpenses(totalExpensesCount);

    // 3. Calculate Net Worth
    let totalAssets = 0;
    const assetsData = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_ASSETS));
    if (assetsData) {
      try {
        const assets: Asset[] = JSON.parse(assetsData);
        totalAssets = assets.reduce((sum, a) => sum + calculateAssetBalance(a), 0);
      } catch (e) {}
    }

    let totalLiabilities = 0;
    const liabilitiesData = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_LIABILITIES));
    if (liabilitiesData) {
      try {
        const liabilities: Liability[] = JSON.parse(liabilitiesData);
        totalLiabilities = liabilities.reduce((sum, l) => sum + calculateLiabilityBalance(l), 0);
      } catch (e) {}
    }
    setNetWorth(totalAssets - totalLiabilities);

    // 4. Calculate Emergency Fund
    const efData = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_EMERGENCY_FUND));
    let monthsCovered = 0;
    if (efData) {
      try {
        const data: EmergencyFundData = JSON.parse(efData);
        const totalSaved = data.contributions.reduce((sum, c) => sum + c.amount, 0);
        monthsCovered = data.monthlyExpenses > 0 ? totalSaved / data.monthlyExpenses : 0;
      } catch (e) {}
    }
    setEmergencyFundMonths(monthsCovered);
  };

  useEffect(() => {
    setSelectedMonths([new Date().getMonth()]);
    setSelectedYears([new Date().getFullYear()]);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      calculateFinance();
    }
    
    const handleLocal = (e: any) => {
      if (e.detail && [
        SYNC_KEYS.FINANCES_INCOME, 
        SYNC_KEYS.FINANCES_EXPENSES, 
        SYNC_KEYS.FINANCES_ASSETS, 
        SYNC_KEYS.FINANCES_LIABILITIES, 
        SYNC_KEYS.FINANCES_EMERGENCY_FUND,
      ].includes(e.detail.key)) {
        calculateFinance();
      }
    };

    window.addEventListener('local-storage-change', handleLocal);
    return () => window.removeEventListener('local-storage-change', handleLocal);
  }, [selectedMonths, selectedYears, isLoaded]);

  if (!isLoaded) return null;

  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 px-1 md:px-2">
        <SectionTitle>
          Financial Overview
        </SectionTitle>

        <div className="flex gap-2 md:gap-3">
          <MultiSelectDropdown
            label="Month"
            options={MONTHS}
            selected={selectedMonths}
            onChange={setSelectedMonths}
          />
          <MultiSelectDropdown
            label="Year"
            options={YEARS}
            selected={selectedYears}
            onChange={setSelectedYears}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
        <MetricCard 
          label="Net Worth"
          value={`$${netWorth.toLocaleString("en-CA", { maximumFractionDigits: 0 })}`}
          subValue={netWorth >= 0 ? "Positive Equity" : "Negative Equity"}
          color={netWorth >= 0 ? "emerald" : "rose"}
          customBg={netWorth >= 0 
            ? "border-emerald-100/50 dark:border-emerald-900/30" 
            : "border-rose-100/50 dark:border-rose-900/30"
          }
          icon={<Wallet strokeWidth={2.5} />}
        />

        <MetricCard 
          label="Emergency Fund"
          value={`${emergencyFundMonths < 10 ? emergencyFundMonths.toFixed(1) : Math.floor(emergencyFundMonths)} Months`}
          subValue={emergencyFundMonths >= 6 ? "Fully Funded" : emergencyFundMonths >= 3 ? "On Track" : "Focus Needed"}
          color={emergencyFundMonths >= 6 ? "emerald" : emergencyFundMonths >= 3 ? "amber" : "rose"}
          customBg={emergencyFundMonths >= 6 
            ? "border-emerald-100/50 dark:border-emerald-900/30"
            : emergencyFundMonths >= 3
            ? "border-amber-100/50 dark:border-amber-900/30"
            : "border-rose-100/50 dark:border-rose-900/30"
          }
          icon={<Shield strokeWidth={2.5} />}
        />

        <MetricCard
          label="Monthly Income"
          value={`$${income.toLocaleString("en-CA", { maximumFractionDigits: 0 })}`}
          subValue={selectedMonths.length === 1 && selectedYears.length === 1 ? MONTHS[selectedMonths[0]] : `${selectedMonths.length} Months`}
          color="emerald"
          icon={<TrendingUp strokeWidth={2.5} />}
        />

        <MetricCard
          label="Monthly Expenses"
          value={`$${expenses.toLocaleString("en-CA", { maximumFractionDigits: 0 })}`}
          subValue={`${income > 0 ? ((expenses / income) * 100).toFixed(0) : 0}% of Income`}
          color="rose"
          icon={<TrendingDown strokeWidth={2.5} />}
        />

        <MetricCard
          label="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          subValue="Goal: 20%"
          color={savingsRate >= 20 ? "emerald" : savingsRate >= 10 ? "amber" : "rose"}
          customBg={savingsRate >= 20
            ? "border-emerald-100/50 dark:border-emerald-900/30"
            : savingsRate >= 10
            ? "border-amber-100/50 dark:border-amber-900/30"
            : "border-rose-100/50 dark:border-rose-900/30"
          }
          icon={<Percent strokeWidth={2.5} />}
        />
      </div>
    </div>
  );
}
