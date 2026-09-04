// ==========================================================
// Strongly Typed Business Models for Mobile Phone Trading ERP
// ==========================================================

export type MobileStatus = 
  | 'In Stock' 
  | 'Sold' 
  | 'Reserved' 
  | 'Returned' 
  | 'Damaged';

export type LegacyPhoneStatus = 
  | 'in_stock' 
  | 'sold' 
  | 'booked_token' 
  | 'under_repair';

export type PhoneStatus = MobileStatus | LegacyPhoneStatus;

export type StandardExpenseCategory = 
  | 'Food' 
  | 'Water' 
  | 'Rent' 
  | 'Electricity' 
  | 'Internet' 
  | 'Transport' 
  | 'Packaging' 
  | 'Repair' 
  | 'Accessories' 
  | 'Marketing' 
  | 'Salary' 
  | 'Other';

export type LegacyExpenseCategory = 
  | 'shop_rent' 
  | 'electricity_bill' 
  | 'lunch_tea_refreshment' 
  | 'staff_salary' 
  | 'marketing_boost' 
  | 'accessories_packaging' 
  | 'repair_tools' 
  | 'shop_maintenance' 
  | 'miscellaneous';

export type ExpenseCategory = StandardExpenseCategory | LegacyExpenseCategory;

export type CashTransactionType = 
  | 'Sale Income' 
  | 'Mobile Purchase' 
  | 'Expense' 
  | 'Partner Investment' 
  | 'Partner Withdrawal' 
  | 'Other Income' 
  | 'Other Expense';

// --- PARTNERS MODEL ---
export interface Partner {
  id: string;
  name: string;
  initialInvestment: number;
  additionalInvestment: number;
  totalInvestment: number;
  withdrawals: number;
  ownershipPercentage: number;
  createdAt: string;
  phone?: string;
  role?: string;
}

// --- MOBILE PRODUCTS MODEL ---
export interface MobileProduct {
  id: string;
  brand: string;
  model: string;
  variant?: string;
  color: string;
  storage: string;
  ram?: string;
  imei: string;
  serialNumber?: string;
  condition: string;
  purchasePrice: number;
  sellingPrice: number;
  purchaseSource?: string;
  purchaseDate: string;
  saleDate?: string;
  status: PhoneStatus;
  notes?: string;
  accessories?: string[];
  createdAt: string;

  // Extended / Pakistani Market specifics & UI helpers
  ptaStatus?: 'official_approved' | 'non_pta' | 'jv_sim' | 'factory_unlock' | 'vip_pass';
  simType?: string;
  batteryHealth?: number; // e.g. 88%
  refurbCost?: number;
  totalCost?: number;
  imei1?: string;
  imei2?: string;
  supplierName?: string;
  supplierContact?: string;
  accessoriesIncluded?: string[];
}

// --- PURCHASES MODEL ---
export interface Purchase {
  id: string;
  mobileId: string;
  supplier: string;
  purchaseType: string; // e.g. 'Walk-in Customer' | 'Wholesale Dealer' | 'Market Trader'
  amount: number;
  paymentMethod: string; // 'Cash' | 'Bank Transfer' | 'Online'
  date: string;
  notes?: string;

  // Metadata snapshots for display & legacy compatibility
  purchaseNumber?: string;
  brand?: string;
  model?: string;
  storage?: string;
  color?: string;
  imei?: string;
  imei1?: string;
  imei2?: string;
  purchasedBy?: string;
  purchasePrice?: number;
  repairCost?: number;
  totalCost?: number;
  sellerName?: string;
  sellerPhone?: string;
  ptaStatus?: any;
}

// --- SALES MODEL ---
export interface Sale {
  id: string;
  mobileId: string;
  customerName: string;
  customerPhone: string;
  sellingPrice: number;
  paymentMethod: string; // 'Cash' | 'Bank Transfer' | 'Split'
  date: string;
  notes?: string;

  // Snapshot details for invoices & receipts
  salePrice?: number; // alias for sellingPrice
  invoiceNumber?: string;
  costPrice?: number;
  profit?: number;
  cashAmount?: number;
  bankAmount?: number;
  bankName?: string;
  warrantyDays?: number;
  warrantyExpiryDate?: string;
  isExchange?: boolean;
  exchangeDetails?: {
    brand: string;
    model: string;
    storage: string;
    imei: string;
    tradeInValue: number;
  };
  exchangePhoneDetails?: {
    brand: any;
    model: string;
    storage: string;
    imei: string;
    tradeInValue: number;
  };
  exchangeDeduction?: number;
  netCashReceived?: number;
  soldBy?: string;
  phoneSnapshot?: {
    brand: string;
    model: string;
    storage: string;
    color: string;
    ptaStatus?: any;
    condition?: any;
    batteryHealth?: number;
    imei1: string;
    imei2?: string;
  };
}

// --- EXPENSES MODEL ---
export interface Expense {
  id: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  paymentMethod: string; // 'Cash' | 'Bank Transfer'
  date: string;
  notes?: string;
  paidBy?: string;
  paidFrom?: AccountType;
}

// --- CASH TRANSACTIONS MODEL ---
export interface CashTransaction {
  id: string;
  type: CashTransactionType;
  category: string;
  amount: number;
  date: string;
  description: string;
  referenceId?: string;
  account?: 'cash' | 'bank';
  recordedBy?: string;
}

// --- BUDGETS MODEL ---
export interface Budget {
  id: string;
  month: string; // e.g. '2026-09'
  category: string;
  limit: number;
}

// --- SETTINGS MODEL ---
export interface Settings {
  businessName: string;
  currency: string;
  monthlyExpenseTarget: number;
  defaultPartnerSplit: number; // e.g. 50 (%)
  
  // Extended Shop Information & Compatibility
  shopName?: string; // alias for businessName
  tagline?: string;
  phone?: string;
  address?: string;
  city?: string;
  defaultWarrantyDays?: number;
  theme?: 'light' | 'dark' | 'system';
  categoryBudgets?: Record<string, number>;
}

// --- Navigation & UI Types ---
export type NavigationTab = 
  | 'dashboard' 
  | 'inventory' 
  | 'purchases' 
  | 'sales' 
  | 'expenses' 
  | 'cash' 
  | 'partners' 
  | 'budgets' 
  | 'reports' 
  | 'settings';

export type Brand = 
  | 'Apple' 
  | 'Samsung' 
  | 'Google' 
  | 'Xiaomi' 
  | 'OnePlus' 
  | 'Vivo' 
  | 'Oppo' 
  | 'Infinix' 
  | 'Tecno' 
  | 'Realme' 
  | 'Other';

export type PtaStatus = 
  | 'official_approved' 
  | 'non_pta' 
  | 'jv_sim' 
  | 'factory_unlock' 
  | 'vip_pass';

export type SimType = 
  | 'physical_esim' 
  | 'dual_physical' 
  | 'single_sim' 
  | 'esim_only';

export type Condition = 
  | 'box_packed_new' 
  | 'pin_pack' 
  | 'mint_10_10' 
  | 'used_9_10' 
  | 'used_8_10' 
  | 'kit_only';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'split';
export type AccountType = 'cash' | 'bank';

// Backward-compatibility aliases for UI convenience
export type PhoneItem = MobileProduct;
export type SaleRecord = Sale;
export type PurchaseRecord = Purchase;
export type ExpenseRecord = Expense;
export type MonthlyBudget = Budget;
export type ShopSettings = Settings;
