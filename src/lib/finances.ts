import { getPrefixedKey } from './keys';
import { SYNC_KEYS } from './sync-keys';
import { setSyncedItem } from './storage';

import { IncomeRecord, ExpenseRecord, Contribution, Asset, PaymentLog, Liability } from '@/types/finance';
export type { IncomeRecord, ExpenseRecord, Contribution, Asset, PaymentLog, Liability };



/**
 * Calculates the current balance of an asset considering its initial value,
 * contributions/withdrawals, and compound growth rate.
 */
export const calculateAssetBalance = (asset: Asset): number => {
  const rate = (asset.growthRate || 0) / 100;
  const now = new Date();
  
  // Calculate years since startDate for initialValue
  const startDateStr = asset.startDate || asset.lastUpdated || new Date().toISOString();
  const startDate = new Date(startDateStr);
  const yearsInit = Math.max(0, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  
  const initGrown = asset.initialValue * Math.pow(1 + rate, yearsInit);
  
  // Calculate years since contribution date for each contribution
  const contribsGrown = (asset.contributions || []).reduce((sum: number, c: Contribution) => {
    const cDate = new Date(c.date);
    const yearsC = Math.max(0, (now.getTime() - cDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    return sum + (c.amount * Math.pow(1 + rate, yearsC));
  }, 0);

  return initGrown + contribsGrown;
};

export const calculateLiabilityBalance = (liability: Liability): number => {
  return liability.remainingBalance;
};

/**
 * Updates asset contributions based on an expense.
 */
export const updateAssetFromExpense = (expenseId: string, assetId: string | undefined, amount: number, date: string, isDelete = false) => {
  if (typeof window === 'undefined') return;
  const savedAssets = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_ASSETS));
  if (!savedAssets) return;

  try {
    let assetsList: Asset[] = JSON.parse(savedAssets);
    let changed = false;

    // 1. Remove old contribution from any asset that might have it
    assetsList = assetsList.map((asset) => {
      const initialLen = asset.contributions.length;
      asset.contributions = asset.contributions.filter((c) => c.id !== `expense-${expenseId}`);
      if (asset.contributions.length !== initialLen) {
          changed = true;
          asset.lastUpdated = new Date().toISOString().split('T')[0];
      }
      return asset;
    });

    // 2. Add new negative contribution if not deleting and assetId is present
    if (!isDelete && assetId) {
      const targetAsset = assetsList.find((a) => a.id === assetId);
      if (targetAsset) {
        targetAsset.contributions.unshift({
          id: `expense-${expenseId}`,
          date: date,
          amount: -amount
        });
        targetAsset.lastUpdated = new Date().toISOString().split('T')[0];
        changed = true;
      }
    }

    if (changed) {
      setSyncedItem(SYNC_KEYS.FINANCES_ASSETS, JSON.stringify(assetsList));
    }
  } catch (e) {
    console.error("Failed to update asset contributions from expenses", e);
  }
};

/**
 * Updates recipient contributions (Savings Goals, Emergency Fund, etc.) based on an expense.
 */
export const updateRecipientFromExpense = (expenseId: string, paidToType: string, paidToId: string | undefined, amount: number, date: string, isDelete = false) => {
  if (typeof window === 'undefined') return;
  
  // 1. Savings Goals
  if (paidToType === 'savings') {
    const saved = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_SAVINGS_TARGETS));
    if (saved) {
      try {
        let goals = JSON.parse(saved);
        let changed = false;
        goals = goals.map((g: any) => {
          const initialLen = g.contributions.length;
          g.contributions = g.contributions.filter((c: any) => c.id !== `expense-${expenseId}`);
          if (g.contributions.length !== initialLen) changed = true;
          if (!isDelete && g.id === paidToId) {
            g.contributions.unshift({ id: `expense-${expenseId}`, date, amount });
            changed = true;
          }
          return g;
        });
        if (changed) setSyncedItem(SYNC_KEYS.FINANCES_SAVINGS_TARGETS, JSON.stringify(goals));
      } catch (e) {}
    }
  }

  // 2. Emergency Fund
  if (paidToType === 'emergency') {
    const saved = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_EMERGENCY_FUND));
    if (saved) {
      try {
        let fund = JSON.parse(saved);
        let changed = false;
        const initialLen = fund.contributions.length;
        fund.contributions = fund.contributions.filter((c: any) => c.id !== `expense-${expenseId}`);
        if (fund.contributions.length !== initialLen) changed = true;
        if (!isDelete) {
          fund.contributions.unshift({ id: `expense-${expenseId}`, date, amount });
          changed = true;
        }
        if (changed) setSyncedItem(SYNC_KEYS.FINANCES_EMERGENCY_FUND, JSON.stringify(fund));
      } catch (e) {}
    }
  }

  // 3. Asset (Contribution to asset)
  if (paidToType === 'asset') {
    const saved = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_ASSETS));
    if (saved) {
      try {
        let assetsList: Asset[] = JSON.parse(saved);
        let changed = false;
        assetsList = assetsList.map((asset) => {
          const initialLen = asset.contributions.length;
          asset.contributions = asset.contributions.filter((c) => c.id !== `expense-recip-${expenseId}`);
          if (asset.contributions.length !== initialLen) changed = true;
          if (!isDelete && asset.id === paidToId) {
            asset.contributions.unshift({ id: `expense-recip-${expenseId}`, date, amount });
            changed = true;
          }
          return asset;
        });
        if (changed) setSyncedItem(SYNC_KEYS.FINANCES_ASSETS, JSON.stringify(assetsList));
      } catch (e) {}
    }
  }
};
/**
 * Updates asset contributions based on an income record.
 */
export const updateAssetFromIncome = (incomeId: string, assetId: string | undefined, amount: number, date: string, isDelete = false) => {
  if (typeof window === 'undefined') return;
  const savedAssets = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_ASSETS));
  if (!savedAssets) return;

  try {
    let assetsList: Asset[] = JSON.parse(savedAssets);
    let changed = false;

    // 1. Remove old contribution from any asset that might have it
    assetsList = assetsList.map((asset) => {
      const initialLen = asset.contributions.length;
      asset.contributions = asset.contributions.filter((c) => c.id !== `income-${incomeId}`);
      if (asset.contributions.length !== initialLen) {
          changed = true;
          asset.lastUpdated = new Date().toISOString().split('T')[0];
      }
      return asset;
    });

    // 2. Add new positive contribution if not deleting and assetId is present
    if (!isDelete && assetId) {
      const targetAsset = assetsList.find((a) => a.id === assetId);
      if (targetAsset) {
        targetAsset.contributions.unshift({
          id: `income-${incomeId}`,
          date: date,
          amount: amount
        });
        targetAsset.lastUpdated = new Date().toISOString().split('T')[0];
        changed = true;
      }
    }

    if (changed) {
      setSyncedItem(SYNC_KEYS.FINANCES_ASSETS, JSON.stringify(assetsList));
    }
  } catch (e) {
    console.error("Failed to update asset contributions from income", e);
  }
};

/**
 * Updates liability balance and logs based on an expense.
 */
export const updateLiabilityFromExpense = (expenseId: string, liabilityId: string | undefined, amount: number, date: string, isDelete = false) => {
  if (typeof window === 'undefined') return;
  const saved = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_LIABILITIES));
  if (!saved) return;

  try {
    let liabilities: Liability[] = JSON.parse(saved);
    let changed = false;

    liabilities = liabilities.map((l) => {
      const initialLen = l.paymentLogs.length;
      l.paymentLogs = l.paymentLogs.filter((p) => p.id !== `expense-${expenseId}`);
      if (l.paymentLogs.length !== initialLen) {
        changed = true;
      }
      
      if (!isDelete && l.id === liabilityId) {
        l.remainingBalance = Math.max(0, l.remainingBalance - amount);
        l.paymentLogs.unshift({
          id: `expense-${expenseId}`,
          date,
          amount,
          type: 'Prepayment' 
        });
        l.lastUpdated = new Date().toISOString().split('T')[0];
        changed = true;
      } else if (isDelete && l.id === liabilityId) {
          l.remainingBalance += amount;
          l.lastUpdated = new Date().toISOString().split('T')[0];
          changed = true;
      }
      return l;
    });

    if (changed) {
      setSyncedItem(SYNC_KEYS.FINANCES_LIABILITIES, JSON.stringify(liabilities));
    }
  } catch (e) {
    console.error("Failed to update liability from expense", e);
  }
};

