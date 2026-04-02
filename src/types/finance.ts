export type ExpenseCategory = 'rent' | 'EMI' | 'Insurance' | 'food' | 'travel' | 'shopping' | 'investment' | 'savings' | 'Grocery' | 'Clothing' | 'Transport' | 'Dining' | 'Bills' | 'Other';
export type ExpenseType = 'need' | 'want' | 'investment';
export type PaymentMethod = 'Cash' | 'Debit Card' | 'Credit Card' | 'UPI / Wallet' | 'Bank Transfer';
export type EntryType = 'Bill' | 'Quick';

export interface ExpenseItem {
  id: string;
  name: string;
  quantity: string;
  unitPrice: number;
  totalPrice: number;
  brand?: string;
  notes?: string;
  
  // Clothing extras (supporting multi-item clothing bills)
  itemType?: string; 
  color?: string;
  size?: string;
  person?: string;
  quality?: string;
}

export interface GroceryPlanItem {
  id: string;
  name: string;
  category?: string;
  plannedQuantity: number;
  unitSize: string; // e.g. 1L, 500g, 1 Dozen
  frequency: 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'As Needed';
  idealTiming: string; // e.g. "Start of month", "Every Sunday"
  expectedPrice: number;
  currency: 'INR' | 'CAD';
  // Checkbox state mapping where index corresponds to the tracked unit out of plannedQuantity.
  // true = manually checked, false = unchecked, undefined = uninitialized
  checkedUnits?: boolean[]; 
}

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  subcategory: string;
  amount: number;
  currency?: 'INR' | 'CAD';
  date: string;
  type: ExpenseType; // Need vs Want
  assetId?: string; // Account used for payment
  paidToType: 'savings' | 'emergency' | 'asset' | 'other';
  paidToId?: string; // ID of Goal/Asset or 'emergency'
  paidToName?: string; // For 'other' recipient
  
  // Pantry / Detailed Fields
  entryType: EntryType;
  paymentMethod: PaymentMethod;
  vendor?: string; // Place of Shop
  notes?: string;
  tags?: string[];
  items?: ExpenseItem[];
  sgst?: number;
  cgst?: number;
  
  // Category specific fields (dynamic)
  quantity?: string; // for Top-level quick entry
  size?: string;
  person?: string;
  brand?: string;
  transportType?: 'Recharge' | 'Ticket' | 'Ride' | 'Other';
  mealType?: 'Lunch' | 'Dinner' | 'Snack';
  occasion?: string;
  peopleCount?: number;
  balanceAfter?: number;
  color?: string;
  quality?: string;
  itemType?: string; // clothing type
}

export interface IncomeRecord {
  id: string;
  source: 'salary' | 'bonus' | 'freelance' | 'business' | 'investment' | 'Govt Benefits' | 'tax refund' | 'gift' | 'sale' | 'refund' | 'other';
  amount: number;
  currency?: 'INR' | 'CAD';
  date: string;
  type: 'active' | 'passive' | 'one time';
  assetId?: string;
  notes?: string;
  customSource?: string;
}

export interface Contribution {
  id: string;
  date: string;
  amount: number;
  currency?: 'INR' | 'CAD';
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  initialValue: number;
  initialCurrency?: 'INR' | 'CAD';
  startDate: string;
  contributions: Contribution[];
  growthRate: number;
  lastUpdated: string;
  balance?: number;
}

export interface PaymentLog {
  id: string;
  date: string;
  amount: number;
  currency?: 'INR' | 'CAD';
  type: 'Regular EMI' | 'Prepayment';
}

export interface Liability {
  id: string;
  name: string;
  type: string;
  totalAmount: number;
  totalAmountCurrency?: 'INR' | 'CAD';
  remainingBalance: number;
  remainingBalanceCurrency?: 'INR' | 'CAD';
  interestRate: number;
  emi: number;
  emiCurrency?: 'INR' | 'CAD';
  tenureRemaining: number;
  paymentLogs: PaymentLog[];
  lastUpdated: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;          // e.g., 'bottles', 'kg', 'L'
  monthlyUsage: number;  // How many units consumed per month
  quantity: number;      // Stock amount recorded at lastUpdated
  lastUpdated: string;   // ISO date when stock was last manually verified
}
