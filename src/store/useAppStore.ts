import { create } from 'zustand';
import { 
  Partner, 
  MobileProduct, 
  Purchase, 
  Sale, 
  Expense, 
  CashTransaction, 
  Budget, 
  Settings, 
  NavigationTab,
  MobileStatus,
  ExpenseCategory,
  AccountType
} from '../types';
import { 
  partnerService,
  inventoryService,
  purchaseService,
  salesService,
  expenseService,
  cashTransactionService,
  budgetService,
  settingsService,
  formatDatabaseError
} from '../services';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  calculateTotalCapital,
  calculatePartnerInvestments,
  calculateCurrentInventoryCost,
  calculateInventoryRetailValue,
  calculateTotalSales,
  calculateTotalPurchases,
  calculateGrossProfit,
  calculateTotalExpenses,
  calculateNetProfit,
  calculateCashBalance,
  calculatePartnerBalances,
  calculateMonthlyExpenses,
  calculateMonthlySales,
  calculateMonthlyProfit,
  calculateBudgetUsage,
  calculateStockCount,
  calculateSoldCount,
  calculateUnsoldInventoryValue,
  PartnerBalance,
  BudgetUsage,
  UnsoldInventoryValue
} from '../utils/calculations';

interface AppState {
  // Navigation & UI States
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  
  // Quick Drawers
  isQuickSaleOpen: boolean;
  isQuickPurchaseOpen: boolean;
  isQuickExpenseOpen: boolean;
  selectedPhoneForSale: MobileProduct | null;
  openQuickSale: (phone?: MobileProduct) => void;
  closeQuickSale: () => void;
  openQuickPurchase: () => void;
  closeQuickPurchase: () => void;
  openQuickExpense: () => void;
  closeQuickExpense: () => void;

  // Supabase Cloud State
  isLoadingData: boolean;
  isSaving: boolean;
  isSyncingWithSupabase: boolean;
  dbError: string | null;
  lastSupabaseSync: string | null;
  isSupabaseConnected: boolean;
  fetchInitialData: () => Promise<void>;
  syncFromSupabase: () => Promise<void>;
  setupRealtimeSubscription: () => () => void;
  resetAllData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonStr: string) => boolean;

  // Domain Entity Collections (Source of truth: Supabase PostgreSQL)
  partners: Partner[];
  mobiles: MobileProduct[];
  phones: MobileProduct[]; // alias
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  transactions: CashTransaction[];
  budgets: Budget[];
  budget: any; // compatibility with budget meter
  settings: Settings;
  drawings: any[]; // compatibility alias

  // Clean Actions: Partners
  addPartner: (partner: Omit<Partner, 'id' | 'totalInvestment' | 'ownershipPercentage' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  investAdditionalCapital: (partnerId: string, amount: number, account: 'cash' | 'bank', recordedBy: string) => Promise<{ success: boolean; error?: string }>;
  recordPartnerDrawing: (params: {
    partnerName: 'Yasir' | 'Saad' | string;
    amount: number;
    reason: string;
    paidFrom: AccountType;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  // Clean Actions: Mobile Products (Inventory)
  addMobileProduct: (mobile: Omit<MobileProduct, 'id' | 'createdAt'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  addPhone: (mobile: Omit<MobileProduct, 'id' | 'createdAt'>) => void; // alias
  updateMobileProduct: (id: string, updates: Partial<MobileProduct>) => Promise<{ success: boolean; error?: string }>;
  updatePhone: (id: string, updates: Partial<MobileProduct>) => void; // alias
  deleteMobileProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  deletePhone: (id: string) => void; // alias
  setMobileStatus: (id: string, status: MobileStatus) => Promise<{ success: boolean; error?: string }>;

  // Clean Actions: Purchases (Stock In)
  recordPurchase: (params: {
    brand: string;
    model: string;
    variant?: string;
    color: string;
    storage: string;
    ram?: string;
    imei1: string;
    imei2?: string;
    condition: string;
    purchasePrice: number;
    refurbCost?: number;
    sellingPrice: number;
    sellerName: string;
    sellerPhone?: string;
    paymentMethod: AccountType | string;
    purchasedBy: 'Yasir' | 'Saad' | string;
    accessories?: string[];
    notes?: string;
    ptaStatus?: any;
    simType?: any;
    batteryHealth?: number;
  }) => Promise<{ success: boolean; error?: string }>;
  updatePurchase: (id: string, updates: Partial<Purchase>) => Promise<{ success: boolean; error?: string }>;
  deletePurchase: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Clean Actions: Sales (POS Out)
  recordSale: (params: {
    phoneId: string;
    customerName: string;
    customerPhone: string;
    customerCnic?: string;
    salePrice: number;
    paymentMethod: any;
    cashAmount?: number;
    bankAmount?: number;
    bankName?: string;
    warrantyDays?: number;
    isExchange?: boolean;
    exchangeDetails?: {
      brand: any;
      model: string;
      storage: string;
      imei: string;
      tradeInValue: number;
    };
    exchangeDeduction?: number;
    soldBy: 'Yasir' | 'Saad' | string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateSale: (id: string, updates: Partial<Sale>) => Promise<{ success: boolean; error?: string }>;
  deleteSale: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Clean Actions: Expenses
  addExpense: (params: {
    category: ExpenseCategory | any;
    title: string;
    amount: number;
    paidFrom: AccountType;
    paidBy?: 'Yasir' | 'Saad' | string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<{ success: boolean; error?: string }>;
  deleteExpense: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Clean Actions: Cash Transactions
  addCashTransaction: (tx: Omit<CashTransaction, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateCashTransaction: (id: string, updates: Partial<CashTransaction>) => Promise<{ success: boolean; error?: string }>;
  deleteCashTransaction: (id: string) => Promise<{ success: boolean; error?: string }>;
  transferFunds: (params: {
    from: AccountType;
    to: AccountType;
    amount: number;
    notes?: string;
    recordedBy?: 'Yasir' | 'Saad' | string;
  }) => Promise<{ success: boolean; error?: string }>;

  // Clean Actions: Budgets & Settings
  setBudget: (budget: Omit<Budget, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateBudget: (budget: Partial<any>) => void;
  updateSettings: (settings: Partial<Settings>) => Promise<{ success: boolean; error?: string }>;

  // --- Dynamic Pure Calculation Getters (Driven 100% by live Supabase data) ---
  getTotalCapital: () => number;
  getPartnerInvestments: () => ReturnType<typeof calculatePartnerInvestments>;
  getCurrentInventoryCost: () => number;
  getTotalStockCost: () => number; // alias
  getInventoryRetailValue: () => number;
  getTotalStockExpectedValue: () => number; // alias
  getTotalSales: () => number;
  getTotalPurchases: () => number;
  getGrossProfit: () => number;
  getTotalExpenses: () => number;
  getNetProfit: () => number;
  getCashBalance: () => number;
  getCashInHand: () => number;
  getBankBalance: () => number;
  getPartnerBalances: () => PartnerBalance[];
  getPartnerEquity: (partnerName: 'Yasir' | 'Saad' | string) => {
    initial: number;
    profitShare: number;
    drawingsTotal: number;
    currentEquity: number;
  };
  getMonthlyExpenses: (month?: string) => number;
  getMonthlySales: (month?: string) => number;
  getMonthlyProfit: (month?: string) => number;
  getBudgetUsage: (month?: string) => BudgetUsage[];
  getStockCount: () => number;
  getSoldCount: () => number;
  getUnsoldInventoryValue: () => UnsoldInventoryValue;
}

const DEFAULT_SETTINGS: Settings = {
  businessName: 'Yasir & Saad Mobile Trading',
  shopName: 'Yasir & Saad Mobile Trading',
  currency: 'PKR',
  monthlyExpenseTarget: 20000,
  defaultPartnerSplit: 50,
  tagline: 'Premium Used & New Smartphones | Hall Road Quality',
  phone: '+92 300 1234567 / +92 301 9876543',
  address: 'Shop # 14, Ground Floor, Al-Hafeez Shopping Mall',
  city: 'Lahore, Pakistan',
  defaultWarrantyDays: 7,
  theme: 'dark',
  categoryBudgets: {
    Food: 6000,
    Water: 1500,
  },
};

const DEFAULT_BUDGET = {
  month: '2026-09',
  salesTarget: 1200000,
  grossProfitTarget: 150000,
  expenseLimit: 55000,
};

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentTab: 'dashboard',
  setCurrentTab: (tab) => set({ currentTab: tab }),

  // Quick Drawers
  isQuickSaleOpen: false,
  isQuickPurchaseOpen: false,
  isQuickExpenseOpen: false,
  selectedPhoneForSale: null,

  openQuickSale: (phone) => set({ 
    isQuickSaleOpen: true, 
    selectedPhoneForSale: phone || null 
  }),
  closeQuickSale: () => set({ 
    isQuickSaleOpen: false, 
    selectedPhoneForSale: null 
  }),

  openQuickPurchase: () => set({ isQuickPurchaseOpen: true }),
  closeQuickPurchase: () => set({ isQuickPurchaseOpen: false }),

  openQuickExpense: () => set({ isQuickExpenseOpen: true }),
  closeQuickExpense: () => set({ isQuickExpenseOpen: false }),

  // Supabase State (Live Cloud Source of Truth)
  isLoadingData: false,
  isSaving: false,
  isSyncingWithSupabase: false,
  dbError: null,
  lastSupabaseSync: null,
  isSupabaseConnected: isSupabaseConfigured(),

  syncFromSupabase: async () => {
    set({ isSyncingWithSupabase: true });
    await get().fetchInitialData();
    set({ isSyncingWithSupabase: false });
  },

  resetAllData: () => {
    set({
      mobiles: [],
      phones: [],
      purchases: [],
      sales: [],
      expenses: [],
      transactions: [],
      budgets: [],
      drawings: [],
    });
  },

  exportDatabaseJson: () => {
    const state = get();
    return JSON.stringify({
      version: '3.0',
      exportedAt: new Date().toISOString(),
      partners: state.partners,
      mobiles: state.mobiles,
      purchases: state.purchases,
      sales: state.sales,
      expenses: state.expenses,
      transactions: state.transactions,
      budgets: state.budgets,
      settings: state.settings,
    }, null, 2);
  },

  importDatabaseJson: (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') return false;
      const loadedMobiles = parsed.mobiles || parsed.phones || [];
      set({
        partners: parsed.partners || get().partners,
        mobiles: loadedMobiles,
        phones: loadedMobiles,
        purchases: parsed.purchases || [],
        sales: parsed.sales || [],
        expenses: parsed.expenses || [],
        transactions: parsed.transactions || [],
        budgets: parsed.budgets || [],
        settings: parsed.settings || get().settings,
      });
      return true;
    } catch {
      return false;
    }
  },

  // Entities (Initialized with initial capital & handwritten entries)
  partners: [
    {
        "id": "partner_kaqm98w",
        "name": "Yasir",
        "initialInvestment": 250000,
        "additionalInvestment": 0,
        "totalInvestment": 250000,
        "withdrawals": 0,
        "ownershipPercentage": 50,
        "createdAt": "2026-08-01T10:00:00.000Z"
    },
    {
        "id": "partner_mexadrb",
        "name": "Saad",
        "initialInvestment": 250000,
        "additionalInvestment": 0,
        "totalInvestment": 250000,
        "withdrawals": 0,
        "ownershipPercentage": 50,
        "createdAt": "2026-08-01T10:00:00.000Z"
    }
],
  mobiles: [],
  phones: [],
  purchases: [],
  sales: [
    {
        "id": "sale_august_ledger_profit",
        "mobileId": "mob_august_summary",
        "customerName": "August Mobile Trading (Walk-in Customers)",
        "customerPhone": "Walk-in",
        "sellingPrice": 19500,
        "costPrice": 0,
        "profit": 19500,
        "paymentMethod": "Cash",
        "date": "2026-08-31T18:00:00.000Z",
        "notes": "Total gross trading profit for August recorded from notebook reconciliation ledger",
        "soldBy": "Yasir & Saad"
    }
],
  expenses: [
    {
        "id": "exp_20260806_1",
        "category": "Electricity",
        "title": "Cable / Taar for fan + supply (One-Time)",
        "amount": 300,
        "date": "2026-08-06T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "One Time Expense for Shop - Cable / Taar"
    },
    {
        "id": "exp_20260806_2",
        "category": "Electricity",
        "title": "Supply (One-Time)",
        "amount": 1000,
        "date": "2026-08-06T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "One Time Expense for Shop - Power Supply"
    },
    {
        "id": "exp_20260806_3",
        "category": "Electricity",
        "title": "Lights (One-Time)",
        "amount": 300,
        "date": "2026-08-06T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "One Time Expense for Shop - Shop Lights"
    },
    {
        "id": "exp_20260806_4",
        "category": "Other",
        "title": "Tech / Tools (One-Time)",
        "amount": 500,
        "date": "2026-08-06T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "One Time Expense for Shop - Tech"
    },
    {
        "id": "exp_20260806_5",
        "category": "Other",
        "title": "Chairs (One-Time)",
        "amount": 8500,
        "date": "2026-08-06T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "One Time Expense for Shop - Chairs"
    },
    {
        "id": "exp_20260806_6",
        "category": "Electricity",
        "title": "Extension (One-Time)",
        "amount": 650,
        "date": "2026-08-06T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "One Time Expense for Shop - Extension Board"
    },
    {
        "id": "exp_20260806_7",
        "category": "Other",
        "title": "Artificial grass for counter (One-Time)",
        "amount": 500,
        "date": "2026-08-06T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "One Time Expense for Shop - Counter Grass"
    },
    {
        "id": "exp_20260806_8",
        "category": "Electricity",
        "title": "Fan (One-Time)",
        "amount": 1000,
        "date": "2026-08-06T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "One Time Expense for Shop - Fan"
    },
    {
        "id": "exp_20260806_9",
        "category": "Internet",
        "title": "Internet (wifi) 6/August (One-Time)",
        "amount": 600,
        "date": "2026-08-06T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "One Time Expense for Shop - Wifi Internet"
    },
    {
        "id": "exp_20260806_10",
        "category": "Accessories",
        "title": "Mobile cooler fan CX07 (One-Time)",
        "amount": 2000,
        "date": "2026-08-06T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "One Time Expense for Shop - Mobile Cooler Fan CX07"
    },
    {
        "id": "exp_20260806_11",
        "category": "Other",
        "title": "Bill Pad + Thumb Pad + stapler + carbon paper (One-Time)",
        "amount": 520,
        "date": "2026-08-06T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "One Time Expense for Shop - Stationery"
    },
    {
        "id": "exp_20260805_12",
        "category": "Food",
        "title": "100 Pani, 30 Copy, 120 Khana",
        "amount": 250,
        "date": "2026-08-05T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260806_13",
        "category": "Food",
        "title": "100 Pani, 150 Khana",
        "amount": 250,
        "date": "2026-08-06T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260807_14",
        "category": "Transport",
        "title": "Karachi for Purchasing",
        "amount": 3000,
        "date": "2026-08-07T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense - Karachi Trip"
    },
    {
        "id": "exp_20260807_15",
        "category": "Food",
        "title": "Food",
        "amount": 600,
        "date": "2026-08-07T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260808_16",
        "category": "Electricity",
        "title": "Lights",
        "amount": 300,
        "date": "2026-08-08T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260808_17",
        "category": "Water",
        "title": "Pani",
        "amount": 100,
        "date": "2026-08-08T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260808_18",
        "category": "Food",
        "title": "Paan",
        "amount": 50,
        "date": "2026-08-08T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260808_19",
        "category": "Accessories",
        "title": "Samsung S20+ Protector Yasir",
        "amount": 500,
        "date": "2026-08-08T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260809_20",
        "category": "Food",
        "title": "Tea",
        "amount": 40,
        "date": "2026-08-09T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260811_21",
        "category": "Water",
        "title": "Pani",
        "amount": 100,
        "date": "2026-08-11T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260812_22",
        "category": "Food",
        "title": "Water and Food",
        "amount": 300,
        "date": "2026-08-12T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260813_23",
        "category": "Food",
        "title": "Water and Food",
        "amount": 300,
        "date": "2026-08-13T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260815_24",
        "category": "Accessories",
        "title": "50 Glass Moto G 2024, 100 Pani, 200 Food, 100 Glass",
        "amount": 400,
        "date": "2026-08-15T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260816_25",
        "category": "Accessories",
        "title": "400 Protector ONN Tab, 300 Food+Water",
        "amount": 700,
        "date": "2026-08-16T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260817_26",
        "category": "Transport",
        "title": "Bus Rent, Rikshaw, Bykea, Petrol, Food in Karachi",
        "amount": 4750,
        "date": "2026-08-17T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense - Karachi Tour 2"
    },
    {
        "id": "exp_20260820_27",
        "category": "Food",
        "title": "Water and Food",
        "amount": 300,
        "date": "2026-08-20T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260822_28",
        "category": "Transport",
        "title": "TCS for Moto g Power 2025",
        "amount": 610,
        "date": "2026-08-22T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense - Return TCS"
    },
    {
        "id": "exp_20260822_29",
        "category": "Food",
        "title": "Water and food",
        "amount": 300,
        "date": "2026-08-22T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260823_30",
        "category": "Water",
        "title": "Water",
        "amount": 100,
        "date": "2026-08-23T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260824_31",
        "category": "Water",
        "title": "Water",
        "amount": 100,
        "date": "2026-08-24T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260825_32",
        "category": "Water",
        "title": "Water",
        "amount": 100,
        "date": "2026-08-25T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260829_33",
        "category": "Accessories",
        "title": "Water and Panni on S2+",
        "amount": 250,
        "date": "2026-08-29T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260830_34",
        "category": "Food",
        "title": "Water and Food",
        "amount": 340,
        "date": "2026-08-30T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260831_35",
        "category": "Food",
        "title": "Water and Food",
        "amount": 340,
        "date": "2026-08-31T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Daily Expense"
    },
    {
        "id": "exp_20260901_36",
        "category": "Rent",
        "title": "Shop Rent September (Advance)",
        "amount": 15000,
        "date": "2026-09-01T10:00:00.000Z",
        "paymentMethod": "Cash",
        "paidFrom": "cash",
        "notes": "Shop Rent September 15000 as per Ledger Sheet"
    }
],
  transactions: [
    {
        "id": "txn_init_yasir",
        "type": "Partner Investment",
        "category": "Capital In",
        "amount": 250000,
        "date": "2026-08-01T10:00:00.000Z",
        "description": "Initial Capital Investment - Yasir",
        "account": "cash",
        "recordedBy": "Admin"
    },
    {
        "id": "txn_init_saad",
        "type": "Partner Investment",
        "category": "Capital In",
        "amount": 250000,
        "date": "2026-08-01T10:00:00.000Z",
        "description": "Initial Capital Investment - Saad",
        "account": "cash",
        "recordedBy": "Admin"
    },
    {
        "id": "txn_exp_20260806_1",
        "type": "Expense",
        "category": "Electricity",
        "amount": 300,
        "date": "2026-08-06T10:00:00.000Z",
        "description": "Cable / Taar for fan + supply (One-Time)",
        "account": "cash",
        "referenceId": "exp_20260806_1"
    },
    {
        "id": "txn_exp_20260806_2",
        "type": "Expense",
        "category": "Electricity",
        "amount": 1000,
        "date": "2026-08-06T10:00:00.000Z",
        "description": "Supply (One-Time)",
        "account": "cash",
        "referenceId": "exp_20260806_2"
    },
    {
        "id": "txn_exp_20260806_3",
        "type": "Expense",
        "category": "Electricity",
        "amount": 300,
        "date": "2026-08-06T10:00:00.000Z",
        "description": "Lights (One-Time)",
        "account": "cash",
        "referenceId": "exp_20260806_3"
    },
    {
        "id": "txn_exp_20260806_4",
        "type": "Expense",
        "category": "Other",
        "amount": 500,
        "date": "2026-08-06T10:00:00.000Z",
        "description": "Tech / Tools (One-Time)",
        "account": "cash",
        "referenceId": "exp_20260806_4"
    },
    {
        "id": "txn_exp_20260806_5",
        "type": "Expense",
        "category": "Other",
        "amount": 8500,
        "date": "2026-08-06T10:00:00.000Z",
        "description": "Chairs (One-Time)",
        "account": "cash",
        "referenceId": "exp_20260806_5"
    },
    {
        "id": "txn_exp_20260806_6",
        "type": "Expense",
        "category": "Electricity",
        "amount": 650,
        "date": "2026-08-06T10:00:00.000Z",
        "description": "Extension (One-Time)",
        "account": "cash",
        "referenceId": "exp_20260806_6"
    },
    {
        "id": "txn_exp_20260806_7",
        "type": "Expense",
        "category": "Other",
        "amount": 500,
        "date": "2026-08-06T10:00:00.000Z",
        "description": "Artificial grass for counter (One-Time)",
        "account": "cash",
        "referenceId": "exp_20260806_7"
    },
    {
        "id": "txn_exp_20260806_8",
        "type": "Expense",
        "category": "Electricity",
        "amount": 1000,
        "date": "2026-08-06T10:00:00.000Z",
        "description": "Fan (One-Time)",
        "account": "cash",
        "referenceId": "exp_20260806_8"
    },
    {
        "id": "txn_exp_20260806_9",
        "type": "Expense",
        "category": "Internet",
        "amount": 600,
        "date": "2026-08-06T10:00:00.000Z",
        "description": "Internet (wifi) 6/August (One-Time)",
        "account": "cash",
        "referenceId": "exp_20260806_9"
    },
    {
        "id": "txn_exp_20260806_10",
        "type": "Expense",
        "category": "Accessories",
        "amount": 2000,
        "date": "2026-08-06T10:00:00.000Z",
        "description": "Mobile cooler fan CX07 (One-Time)",
        "account": "cash",
        "referenceId": "exp_20260806_10"
    },
    {
        "id": "txn_exp_20260806_11",
        "type": "Expense",
        "category": "Other",
        "amount": 520,
        "date": "2026-08-06T10:00:00.000Z",
        "description": "Bill Pad + Thumb Pad + stapler + carbon paper (One-Time)",
        "account": "cash",
        "referenceId": "exp_20260806_11"
    },
    {
        "id": "txn_exp_20260805_12",
        "type": "Expense",
        "category": "Food",
        "amount": 250,
        "date": "2026-08-05T10:00:00.000Z",
        "description": "100 Pani, 30 Copy, 120 Khana",
        "account": "cash",
        "referenceId": "exp_20260805_12"
    },
    {
        "id": "txn_exp_20260806_13",
        "type": "Expense",
        "category": "Food",
        "amount": 250,
        "date": "2026-08-06T10:00:00.000Z",
        "description": "100 Pani, 150 Khana",
        "account": "cash",
        "referenceId": "exp_20260806_13"
    },
    {
        "id": "txn_exp_20260807_14",
        "type": "Expense",
        "category": "Transport",
        "amount": 3000,
        "date": "2026-08-07T10:00:00.000Z",
        "description": "Karachi for Purchasing",
        "account": "cash",
        "referenceId": "exp_20260807_14"
    },
    {
        "id": "txn_exp_20260807_15",
        "type": "Expense",
        "category": "Food",
        "amount": 600,
        "date": "2026-08-07T10:00:00.000Z",
        "description": "Food",
        "account": "cash",
        "referenceId": "exp_20260807_15"
    },
    {
        "id": "txn_exp_20260808_16",
        "type": "Expense",
        "category": "Electricity",
        "amount": 300,
        "date": "2026-08-08T10:00:00.000Z",
        "description": "Lights",
        "account": "cash",
        "referenceId": "exp_20260808_16"
    },
    {
        "id": "txn_exp_20260808_17",
        "type": "Expense",
        "category": "Water",
        "amount": 100,
        "date": "2026-08-08T10:00:00.000Z",
        "description": "Pani",
        "account": "cash",
        "referenceId": "exp_20260808_17"
    },
    {
        "id": "txn_exp_20260808_18",
        "type": "Expense",
        "category": "Food",
        "amount": 50,
        "date": "2026-08-08T10:00:00.000Z",
        "description": "Paan",
        "account": "cash",
        "referenceId": "exp_20260808_18"
    },
    {
        "id": "txn_exp_20260808_19",
        "type": "Expense",
        "category": "Accessories",
        "amount": 500,
        "date": "2026-08-08T10:00:00.000Z",
        "description": "Samsung S20+ Protector Yasir",
        "account": "cash",
        "referenceId": "exp_20260808_19"
    },
    {
        "id": "txn_exp_20260809_20",
        "type": "Expense",
        "category": "Food",
        "amount": 40,
        "date": "2026-08-09T10:00:00.000Z",
        "description": "Tea",
        "account": "cash",
        "referenceId": "exp_20260809_20"
    },
    {
        "id": "txn_exp_20260811_21",
        "type": "Expense",
        "category": "Water",
        "amount": 100,
        "date": "2026-08-11T10:00:00.000Z",
        "description": "Pani",
        "account": "cash",
        "referenceId": "exp_20260811_21"
    },
    {
        "id": "txn_exp_20260812_22",
        "type": "Expense",
        "category": "Food",
        "amount": 300,
        "date": "2026-08-12T10:00:00.000Z",
        "description": "Water and Food",
        "account": "cash",
        "referenceId": "exp_20260812_22"
    },
    {
        "id": "txn_exp_20260813_23",
        "type": "Expense",
        "category": "Food",
        "amount": 300,
        "date": "2026-08-13T10:00:00.000Z",
        "description": "Water and Food",
        "account": "cash",
        "referenceId": "exp_20260813_23"
    },
    {
        "id": "txn_exp_20260815_24",
        "type": "Expense",
        "category": "Accessories",
        "amount": 400,
        "date": "2026-08-15T10:00:00.000Z",
        "description": "50 Glass Moto G 2024, 100 Pani, 200 Food, 100 Glass",
        "account": "cash",
        "referenceId": "exp_20260815_24"
    },
    {
        "id": "txn_exp_20260816_25",
        "type": "Expense",
        "category": "Accessories",
        "amount": 700,
        "date": "2026-08-16T10:00:00.000Z",
        "description": "400 Protector ONN Tab, 300 Food+Water",
        "account": "cash",
        "referenceId": "exp_20260816_25"
    },
    {
        "id": "txn_exp_20260817_26",
        "type": "Expense",
        "category": "Transport",
        "amount": 4750,
        "date": "2026-08-17T10:00:00.000Z",
        "description": "Bus Rent, Rikshaw, Bykea, Petrol, Food in Karachi",
        "account": "cash",
        "referenceId": "exp_20260817_26"
    },
    {
        "id": "txn_exp_20260820_27",
        "type": "Expense",
        "category": "Food",
        "amount": 300,
        "date": "2026-08-20T10:00:00.000Z",
        "description": "Water and Food",
        "account": "cash",
        "referenceId": "exp_20260820_27"
    },
    {
        "id": "txn_exp_20260822_28",
        "type": "Expense",
        "category": "Transport",
        "amount": 610,
        "date": "2026-08-22T10:00:00.000Z",
        "description": "TCS for Moto g Power 2025",
        "account": "cash",
        "referenceId": "exp_20260822_28"
    },
    {
        "id": "txn_exp_20260822_29",
        "type": "Expense",
        "category": "Food",
        "amount": 300,
        "date": "2026-08-22T10:00:00.000Z",
        "description": "Water and food",
        "account": "cash",
        "referenceId": "exp_20260822_29"
    },
    {
        "id": "txn_exp_20260823_30",
        "type": "Expense",
        "category": "Water",
        "amount": 100,
        "date": "2026-08-23T10:00:00.000Z",
        "description": "Water",
        "account": "cash",
        "referenceId": "exp_20260823_30"
    },
    {
        "id": "txn_exp_20260824_31",
        "type": "Expense",
        "category": "Water",
        "amount": 100,
        "date": "2026-08-24T10:00:00.000Z",
        "description": "Water",
        "account": "cash",
        "referenceId": "exp_20260824_31"
    },
    {
        "id": "txn_exp_20260825_32",
        "type": "Expense",
        "category": "Water",
        "amount": 100,
        "date": "2026-08-25T10:00:00.000Z",
        "description": "Water",
        "account": "cash",
        "referenceId": "exp_20260825_32"
    },
    {
        "id": "txn_exp_20260829_33",
        "type": "Expense",
        "category": "Accessories",
        "amount": 250,
        "date": "2026-08-29T10:00:00.000Z",
        "description": "Water and Panni on S2+",
        "account": "cash",
        "referenceId": "exp_20260829_33"
    },
    {
        "id": "txn_exp_20260830_34",
        "type": "Expense",
        "category": "Food",
        "amount": 340,
        "date": "2026-08-30T10:00:00.000Z",
        "description": "Water and Food",
        "account": "cash",
        "referenceId": "exp_20260830_34"
    },
    {
        "id": "txn_exp_20260831_35",
        "type": "Expense",
        "category": "Food",
        "amount": 340,
        "date": "2026-08-31T10:00:00.000Z",
        "description": "Water and Food",
        "account": "cash",
        "referenceId": "exp_20260831_35"
    },
    {
        "id": "txn_exp_20260901_36",
        "type": "Expense",
        "category": "Rent",
        "amount": 15000,
        "date": "2026-09-01T10:00:00.000Z",
        "description": "Shop Rent September (Advance)",
        "account": "cash",
        "referenceId": "exp_20260901_36"
    },
    {
        "id": "txn_sale_august_profit",
        "type": "Sale Income",
        "category": "Trading Profit",
        "amount": 19500,
        "date": "2026-08-31T18:00:00.000Z",
        "description": "August Mobile Sales Gross Profit (Notebook Ledger)",
        "account": "cash",
        "referenceId": "sale_august_ledger_profit"
    }
],
  budgets: [],
  budget: DEFAULT_BUDGET,
  settings: DEFAULT_SETTINGS,
  drawings: [],

  // --- Initial Data Fetch from Supabase ---
  fetchInitialData: async () => {
    // If Supabase is not configured, load from localStorage if available or retain store defaults
    if (!isSupabaseConfigured()) {
      try {
        if (typeof window !== 'undefined') {
          const localRaw = localStorage.getItem('pakmobile_local_db');
          if (localRaw) {
            const parsed = JSON.parse(localRaw);
            if (parsed && typeof parsed === 'object') {
              const loadedMobiles = parsed.mobiles || parsed.phones || [];
              set({
                partners: parsed.partners && parsed.partners.length > 0 ? parsed.partners : get().partners,
                mobiles: loadedMobiles,
                phones: loadedMobiles,
                purchases: parsed.purchases || get().purchases,
                sales: parsed.sales && parsed.sales.length > 0 ? parsed.sales : get().sales,
                expenses: (parsed.expenses && parsed.expenses.length >= get().expenses.length) ? parsed.expenses : get().expenses,
                transactions: (parsed.transactions && parsed.transactions.length >= get().transactions.length) ? parsed.transactions : get().transactions,
                budgets: parsed.budgets || get().budgets,
                settings: parsed.settings || get().settings,
                isLoadingData: false,
                isSupabaseConnected: false,
                dbError: null,
              });
              // Update local storage with current full dataset
              try {
                const updatedState = get();
                localStorage.setItem('pakmobile_local_db', JSON.stringify({
                  partners: updatedState.partners,
                  mobiles: updatedState.mobiles,
                  purchases: updatedState.purchases,
                  sales: updatedState.sales,
                  expenses: updatedState.expenses,
                  transactions: updatedState.transactions,
                  budgets: updatedState.budgets,
                  settings: updatedState.settings,
                }));
              } catch (e) {}
              return;
            }
          }
        }
      } catch (err) {
        console.error('[useAppStore] local storage load error:', err);
      }

      // Initialize localStorage with current defaults
      try {
        if (typeof window !== 'undefined') {
          const state = get();
          localStorage.setItem('pakmobile_local_db', JSON.stringify({
            partners: state.partners,
            mobiles: state.mobiles,
            purchases: state.purchases,
            sales: state.sales,
            expenses: state.expenses,
            transactions: state.transactions,
            budgets: state.budgets,
            settings: state.settings,
          }));
        }
      } catch (e) {}

      set({
        isLoadingData: false,
        isSupabaseConnected: false,
        dbError: null,
      });
      return;
    }

    set({ isLoadingData: true, dbError: null });

    try {
      const [
        partnersRes,
        inventoryRes,
        purchasesRes,
        salesRes,
        expensesRes,
        transactionsRes,
        budgetsRes,
        settingsRes,
      ] = await Promise.all([
        partnerService.fetchPartners(),
        inventoryService.fetchInventory(),
        purchaseService.fetchPurchases(),
        salesService.fetchSales(),
        expenseService.fetchExpenses(),
        cashTransactionService.fetchTransactions(),
        budgetService.fetchBudgets(),
        settingsService.fetchSettings(),
      ]);

      const nowIso = new Date().toISOString();
      const loadedPartners = partnersRes.data.length > 0 ? partnersRes.data : get().partners;
      const loadedMobiles = inventoryRes.data;
      const loadedSettings = settingsRes.data || get().settings;

      set({
        partners: loadedPartners,
        mobiles: loadedMobiles,
        phones: loadedMobiles,
        purchases: purchasesRes.data,
        sales: salesRes.data,
        expenses: expensesRes.data,
        transactions: transactionsRes.data,
        budgets: budgetsRes.data,
        settings: loadedSettings,
        lastSupabaseSync: nowIso,
        isLoadingData: false,
        isSupabaseConnected: isSupabaseConfigured(),
        dbError: null,
      });
    } catch (err: any) {
      console.error('[useAppStore] fetchInitialData error:', err);
      set({ 
        isLoadingData: false,
        dbError: formatDatabaseError(err, 'connect to Supabase database')
      });
    }
  },

  setupRealtimeSubscription: () => {
    if (!isSupabaseConfigured()) return () => {};

    const channel = supabase
      .channel('pakmobile-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        get().fetchInitialData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // --- Partner Actions ---
  addPartner: async (partnerData) => {
    set({ isSaving: true });
    const res = await partnerService.createPartner({
      name: partnerData.name,
      initialInvestment: partnerData.initialInvestment,
      ownershipPercentage: 50,
    });
    set({ isSaving: false });

    if (res.error || !res.data) {
      return { success: false, error: res.error || "Couldn't save this entry. Please check your internet connection and try again." };
    }

    set((state) => ({
      partners: [...state.partners, res.data!],
    }));
    return { success: true };
  },

  investAdditionalCapital: async (partnerId, amount, account, recordedBy) => {
    set({ isSaving: true });
    const partner = get().partners.find((p) => p.id === partnerId);
    if (!partner) {
      set({ isSaving: false });
      return { success: false, error: 'Partner not found.' };
    }

    const res = await partnerService.addAdditionalCapital(partnerId, Number(amount));
    if (!res.success) {
      set({ isSaving: false });
      return { success: false, error: res.error || "Couldn't save this entry. Please check your internet connection and try again." };
    }

    // Record cash transaction
    await cashTransactionService.createTransaction({
      type: 'Partner Investment',
      category: 'Capital Inflow',
      amount: Number(amount),
      description: `Additional Capital Infusion: ${partner.name}`,
      account,
    });

    set({ isSaving: false });
    await get().fetchInitialData();
    return { success: true };
  },

  recordPartnerDrawing: async (params) => {
    set({ isSaving: true });
    const res = await partnerService.recordWithdrawal(params.partnerName, Number(params.amount));
    if (!res.success) {
      set({ isSaving: false });
      return { success: false, error: res.error || "Couldn't save this entry. Please check your internet connection and try again." };
    }

    // Record cash transaction
    await cashTransactionService.createTransaction({
      type: 'Partner Withdrawal',
      category: 'Drawings',
      amount: Number(params.amount),
      description: `Partner Drawing: ${params.partnerName} (${params.reason})`,
      account: params.paidFrom,
    });

    set({ isSaving: false });
    await get().fetchInitialData();
    return { success: true };
  },

  // --- Mobile Inventory Actions ---
  addMobileProduct: async (mobileData) => {
    set({ isSaving: true });
    const res = await inventoryService.createMobile(mobileData);
    set({ isSaving: false });

    if (res.error || !res.data) {
      return { success: false, error: res.error || "Couldn't save this entry. Please check your internet connection and try again." };
    }

    set((state) => ({
      mobiles: [res.data!, ...state.mobiles],
      phones: [res.data!, ...state.phones],
    }));

    return { success: true, id: res.data.id };
  },

  addPhone: (phoneData) => {
    get().addMobileProduct(phoneData);
  },

  updateMobileProduct: async (id, updates) => {
    set({ isSaving: true });
    const res = await inventoryService.updateMobile(id, updates);
    set({ isSaving: false });

    if (!res.success) {
      return { success: false, error: res.error || "Couldn't save this entry. Please check your internet connection and try again." };
    }

    set((state) => {
      const updated = state.mobiles.map((m) => m.id === id ? { ...m, ...updates } : m);
      return { mobiles: updated, phones: updated };
    });

    return { success: true };
  },

  updatePhone: (id, updates) => {
    get().updateMobileProduct(id, updates);
  },

  deleteMobileProduct: async (id) => {
    set({ isSaving: true });
    const res = await inventoryService.deleteMobile(id);
    set({ isSaving: false });

    if (!res.success) {
      return { success: false, error: res.error || "Couldn't save this entry. Please check your internet connection and try again." };
    }

    set((state) => {
      const updated = state.mobiles.filter((m) => m.id !== id);
      return { mobiles: updated, phones: updated };
    });

    return { success: true };
  },

  deletePhone: (id) => {
    get().deleteMobileProduct(id);
  },

  setMobileStatus: async (id, status) => {
    return get().updateMobileProduct(id, { status });
  },

  // --- Purchases Action (Stock In) ---
  recordPurchase: async (params) => {
    set({ isSaving: true });
    const totalCost = Number(params.purchasePrice) + Number(params.refurbCost || 0);

    const mobilePayload: Omit<MobileProduct, 'id' | 'createdAt'> = {
      brand: params.brand,
      model: params.model,
      variant: params.variant || `${params.storage} • ${params.color}`,
      color: params.color,
      storage: params.storage,
      ram: params.ram,
      imei: params.imei1,
      condition: params.condition,
      purchasePrice: Number(params.purchasePrice),
      refurbCost: Number(params.refurbCost || 0),
      totalCost,
      sellingPrice: Number(params.sellingPrice),
      purchaseSource: params.sellerName,
      purchaseDate: new Date().toISOString(),
      status: 'In Stock',
      notes: params.notes,
      accessories: params.accessories || [],
      ptaStatus: params.ptaStatus,
      simType: params.simType,
      batteryHealth: params.batteryHealth,
    };

    const res = await purchaseService.createPurchase({
      mobileData: mobilePayload,
      supplier: params.sellerName || 'Walk-in Seller',
      purchaseType: 'Stock In',
      amount: totalCost,
      paymentMethod: params.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash',
      purchasedBy: params.purchasedBy,
      notes: params.notes,
    });

    set({ isSaving: false });

    if (!res.data || res.error) {
      return { 
        success: false, 
        error: res.error || "Couldn't save this entry. Please check your internet connection and try again." 
      };
    }

    // Instant local UI state update
    set((state) => ({
      mobiles: [res.data!.mobile, ...state.mobiles],
      phones: [res.data!.mobile, ...state.phones],
      purchases: [res.data!.purchase, ...state.purchases],
      isQuickPurchaseOpen: false,
    }));

    // Trigger full background sync
    get().fetchInitialData();
    return { success: true };
  },

  updatePurchase: async (id, updates) => {
    set({ isSaving: true });
    const res = await purchaseService.updatePurchase(id, updates);
    if (res.success) {
      set((state) => ({
        purchases: state.purchases.map(p => p.id === id ? { ...p, ...updates } : p)
      }));
    }
    set({ isSaving: false });
    return res;
  },

  deletePurchase: async (id) => {
    set({ isSaving: true });
    const res = await purchaseService.deletePurchase(id);
    if (res.success) {
      set((state) => ({
        purchases: state.purchases.filter(p => p.id !== id)
      }));
    }
    set({ isSaving: false });
    return res;
  },

  // --- Sales Action (POS Out) ---
  recordSale: async (params) => {
    const mobile = get().mobiles.find((m) => m.id === params.phoneId);
    if (!mobile) {
      return { success: false, error: 'Selected smartphone not found in inventory.' };
    }

    set({ isSaving: true });
    const nowIso = new Date().toISOString();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (params.warrantyDays || 7));

    const res = await salesService.createSale({
      mobile,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      sellingPrice: Number(params.salePrice),
      paymentMethod: typeof params.paymentMethod === 'string' ? params.paymentMethod : 'Cash',
      date: nowIso,
      notes: params.notes,
      warrantyDays: params.warrantyDays ?? 7,
      warrantyExpiryDate: expiryDate.toISOString(),
      cashAmount: Number(params.cashAmount || 0),
      bankAmount: Number(params.bankAmount || 0),
      bankName: params.bankName,
      isExchange: params.isExchange,
      tradeInCredit: Number(params.exchangeDeduction || 0),
      exchangeDetails: params.exchangeDetails ? {
        brand: params.exchangeDetails.brand,
        model: params.exchangeDetails.model,
        storage: params.exchangeDetails.storage,
        imei: params.exchangeDetails.imei,
        tradeInValue: params.exchangeDetails.tradeInValue,
      } : undefined,
      soldBy: params.soldBy,
    });

    set({ isSaving: false });

    if (!res.data || res.error) {
      return { 
        success: false, 
        error: res.error || "Couldn't save this entry. Please check your internet connection and try again." 
      };
    }

    // Instant local UI state update
    set((state) => ({
      sales: [res.data!, ...state.sales],
      mobiles: state.mobiles.map((m) => m.id === mobile.id ? { ...m, status: 'Sold' as MobileStatus, saleDate: nowIso } : m),
      phones: state.phones.map((m) => m.id === mobile.id ? { ...m, status: 'Sold' as MobileStatus, saleDate: nowIso } : m),
      isQuickSaleOpen: false,
      selectedPhoneForSale: null,
    }));

    // Trigger full background sync
    get().fetchInitialData();
    return { success: true };
  },

  updateSale: async (id, updates) => {
    set({ isSaving: true });
    const res = await salesService.updateSale(id, updates);
    if (res.success) {
      set((state) => ({
        sales: state.sales.map(s => s.id === id ? { ...s, ...updates } : s)
      }));
    }
    set({ isSaving: false });
    return res;
  },

  deleteSale: async (id) => {
    set({ isSaving: true });
    const res = await salesService.deleteSale(id);
    if (res.success) {
      set((state) => ({
        sales: state.sales.filter(s => s.id !== id)
      }));
    }
    set({ isSaving: false });
    return res;
  },

  // --- Expenses Actions ---
  addExpense: async (params) => {
    set({ isSaving: true });

    if (!isSupabaseConfigured()) {
      const newId = 'exp_' + Math.random().toString(36).substring(2, 9);
      const nowIso = new Date().toISOString();
      const newExpense: Expense = {
        id: newId,
        category: params.category,
        title: params.title,
        amount: Number(params.amount),
        date: nowIso,
        paymentMethod: params.paidFrom === 'cash' ? 'Cash' : 'Bank Transfer',
        paidFrom: params.paidFrom,
        paidBy: params.paidBy || 'Yasir',
        notes: params.notes,
      };

      const newTx: CashTransaction = {
        id: 'txn_' + Math.random().toString(36).substring(2, 9),
        type: 'Expense',
        category: params.category,
        amount: Number(params.amount),
        description: params.title,
        account: params.paidFrom,
        date: nowIso,
        referenceId: newId,
      };

      set((state) => {
        const nextExpenses = [newExpense, ...state.expenses];
        const nextTx = [newTx, ...state.transactions];
        try {
          if (typeof window !== 'undefined') {
            const stateToSave = {
              partners: state.partners,
              mobiles: state.mobiles,
              purchases: state.purchases,
              sales: state.sales,
              expenses: nextExpenses,
              transactions: nextTx,
              budgets: state.budgets,
              settings: state.settings,
            };
            localStorage.setItem('pakmobile_local_db', JSON.stringify(stateToSave));
          }
        } catch (e) {}

        return {
          expenses: nextExpenses,
          transactions: nextTx,
          isQuickExpenseOpen: false,
          isSaving: false,
        };
      });

      return { success: true };
    }

    const res = await expenseService.createExpense({
      category: params.category,
      title: params.title,
      amount: Number(params.amount),
      paidFrom: params.paidFrom,
      paidBy: params.paidBy,
      notes: params.notes,
    });

    set({ isSaving: false });

    if (!res.data || res.error) {
      return { 
        success: false, 
        error: res.error || "Couldn't save this entry. Please check your internet connection and try again." 
      };
    }

    set((state) => ({
      expenses: [res.data!, ...state.expenses],
      isQuickExpenseOpen: false,
    }));

    // Trigger full background sync
    get().fetchInitialData();
    return { success: true };
  },

  deleteExpense: async (id) => {
    set({ isSaving: true });

    if (!isSupabaseConfigured()) {
      set((state) => {
        const nextExpenses = state.expenses.filter((e) => e.id !== id);
        const nextTx = state.transactions.filter((t) => t.referenceId !== id);
        try {
          if (typeof window !== 'undefined') {
            const stateToSave = {
              partners: state.partners,
              mobiles: state.mobiles,
              purchases: state.purchases,
              sales: state.sales,
              expenses: nextExpenses,
              transactions: nextTx,
              budgets: state.budgets,
              settings: state.settings,
            };
            localStorage.setItem('pakmobile_local_db', JSON.stringify(stateToSave));
          }
        } catch (e) {}

        return {
          expenses: nextExpenses,
          transactions: nextTx,
          isSaving: false,
        };
      });
      return { success: true };
    }

    const res = await expenseService.deleteExpense(id);
    set({ isSaving: false });

    if (!res.success) {
      return { success: false, error: res.error || "Couldn't save this entry. Please check your internet connection and try again." };
    }

    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));

    get().fetchInitialData();
    return { success: true };
  },

  updateExpense: async (id, updates) => {
    set({ isSaving: true });
    const res = await expenseService.updateExpense(id, updates);
    if (res.success) {
      set((state) => ({
        expenses: state.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
      }));
    }
    set({ isSaving: false });
    return res;
  },

  // --- Cash Transactions Actions ---
  addCashTransaction: async (txData) => {
    set({ isSaving: true });
    const res = await cashTransactionService.createTransaction({
      type: txData.type,
      category: txData.category,
      amount: txData.amount,
      description: txData.description,
      account: txData.account || 'cash',
      date: txData.date,
      referenceId: txData.referenceId,
    });
    set({ isSaving: false });

    if (!res.data || res.error) {
      return { success: false, error: res.error || "Couldn't save this entry. Please check your internet connection and try again." };
    }

    set((state) => ({
      transactions: [res.data!, ...state.transactions],
    }));

    return { success: true };
  },

  updateCashTransaction: async (id, updates) => {
    set({ isSaving: true });
    const res = await cashTransactionService.updateTransaction(id, updates);
    if (res.success) {
      set((state) => ({
        transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
      }));
    }
    set({ isSaving: false });
    return res;
  },

  deleteCashTransaction: async (id) => {
    set({ isSaving: true });
    const res = await cashTransactionService.deleteTransaction(id);
    if (res.success) {
      set((state) => ({
        transactions: state.transactions.filter(t => t.id !== id)
      }));
    }
    set({ isSaving: false });
    return res;
  },

  transferFunds: async (params) => {
    set({ isSaving: true });
    const res = await cashTransactionService.transferFunds(params);
    set({ isSaving: false });

    if (!res.success) {
      return { success: false, error: res.error || "Couldn't save this entry. Please check your internet connection and try again." };
    }

    get().fetchInitialData();
    return { success: true };
  },

  // --- Budgets & Settings Actions ---
  setBudget: async (budgetData) => {
    set({ isSaving: true });
    const res = await budgetService.upsertBudget({
      month: budgetData.month,
      category: budgetData.category,
      limit: budgetData.limit,
    });
    set({ isSaving: false });

    if (!res.data || res.error) {
      return { success: false, error: res.error || "Couldn't save this entry. Please check your internet connection and try again." };
    }

    get().fetchInitialData();
    return { success: true };
  },

  updateBudget: (budgetUpdates) => {
    set((state) => ({
      budget: { ...state.budget, ...budgetUpdates },
    }));
  },

  updateSettings: async (settingsUpdates) => {
    set({ isSaving: true });
    const res = await settingsService.updateSettings(settingsUpdates);
    set({ isSaving: false });

    if (!res.success) {
      return { success: false, error: res.error || "Couldn't save this entry. Please check your internet connection and try again." };
    }

    set((state) => ({
      settings: { ...state.settings, ...settingsUpdates },
    }));

    return { success: true };
  },

  // ==========================================================
  // Dynamic Calculation Getters (Driven 100% by live Supabase data)
  // ==========================================================
  getTotalCapital: () => {
    return calculateTotalCapital(get().partners);
  },

  getPartnerInvestments: () => {
    return calculatePartnerInvestments(get().partners);
  },

  getCurrentInventoryCost: () => {
    return calculateCurrentInventoryCost(get().mobiles);
  },
  getTotalStockCost: () => {
    return calculateCurrentInventoryCost(get().mobiles);
  },

  getInventoryRetailValue: () => {
    return calculateInventoryRetailValue(get().mobiles);
  },
  getTotalStockExpectedValue: () => {
    return calculateInventoryRetailValue(get().mobiles);
  },

  getTotalSales: () => {
    return calculateTotalSales(get().sales);
  },

  getTotalPurchases: () => {
    return calculateTotalPurchases(get().purchases);
  },

  getGrossProfit: () => {
    return calculateGrossProfit(get().sales, get().mobiles);
  },

  getTotalExpenses: () => {
    return calculateTotalExpenses(get().expenses);
  },

  getNetProfit: () => {
    return calculateNetProfit(get().sales, get().mobiles, get().expenses);
  },

  getCashBalance: () => {
    return calculateCashBalance(get().transactions);
  },

  getCashInHand: () => {
    const state = get();
    return state.transactions.reduce((acc, tx) => {
      if (tx.account === 'cash') {
        if (tx.type === 'Sale Income' || tx.type === 'Partner Investment' || tx.type === 'Other Income') {
          return acc + tx.amount;
        }
        if (tx.type === 'Mobile Purchase' || tx.type === 'Expense' || tx.type === 'Partner Withdrawal' || tx.type === 'Other Expense') {
          return acc - tx.amount;
        }
      }
      return acc;
    }, 0);
  },

  getBankBalance: () => {
    const state = get();
    return state.transactions.reduce((acc, tx) => {
      if (tx.account === 'bank') {
        if (tx.type === 'Sale Income' || tx.type === 'Partner Investment' || tx.type === 'Other Income') {
          return acc + tx.amount;
        }
        if (tx.type === 'Mobile Purchase' || tx.type === 'Expense' || tx.type === 'Partner Withdrawal' || tx.type === 'Other Expense') {
          return acc - tx.amount;
        }
      }
      return acc;
    }, 0);
  },

  getPartnerBalances: () => {
    const state = get();
    const netProfit = calculateNetProfit(state.sales, state.mobiles, state.expenses);
    return calculatePartnerBalances(state.partners, netProfit);
  },

  getPartnerEquity: (partnerName: string) => {
    const state = get();
    const balances = state.getPartnerBalances();
    const p = balances.find((b) => b.name.toLowerCase() === partnerName.toLowerCase());
    if (p) {
      return {
        initial: p.totalInvestment,
        profitShare: p.profitShare,
        drawingsTotal: p.withdrawals,
        currentEquity: p.currentBalance,
      };
    }
    return {
      initial: 0,
      profitShare: 0,
      drawingsTotal: 0,
      currentEquity: 0,
    };
  },

  getMonthlyExpenses: (month = new Date().toISOString().slice(0, 7)) => {
    return calculateMonthlyExpenses(get().expenses, month);
  },

  getMonthlySales: (month = new Date().toISOString().slice(0, 7)) => {
    return calculateMonthlySales(get().sales, month);
  },

  getMonthlyProfit: (month = new Date().toISOString().slice(0, 7)) => {
    const state = get();
    return calculateMonthlyProfit(state.sales, state.mobiles, state.expenses, month);
  },

  getBudgetUsage: (month = new Date().toISOString().slice(0, 7)) => {
    const state = get();
    return calculateBudgetUsage(state.expenses, state.budgets, month);
  },

  getStockCount: () => {
    return calculateStockCount(get().mobiles);
  },

  getSoldCount: () => {
    return calculateSoldCount(get().mobiles);
  },

  getUnsoldInventoryValue: () => {
    return calculateUnsoldInventoryValue(get().mobiles);
  },
}));
