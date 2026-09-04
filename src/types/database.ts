// ==========================================================
// PostgreSQL Database Schema Types (1:1 with Supabase)
// ==========================================================

export interface DbProfile {
  id: string; // UUID references auth.users
  name: string;
  role: 'partner' | 'admin' | 'manager' | 'sales_staff';
  phone?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPartner {
  id: string;
  user_id?: string | null;
  name: string;
  initial_investment: number;
  additional_investment: number;
  total_withdrawals: number;
  ownership_percentage: number;
  created_at: string;
  updated_at: string;
}

export type DbMobileStatus = 'In Stock' | 'Sold' | 'Reserved' | 'Returned' | 'Damaged';

export interface DbMobileInventory {
  id: string;
  brand: string;
  model: string;
  variant?: string | null;
  storage: string;
  ram?: string | null;
  color: string;
  imei: string;
  serial_number?: string | null;
  condition: string;
  purchase_price: number;
  expected_selling_price: number;
  purchase_source?: string | null;
  purchase_date: string;
  sale_date?: string | null;
  status: DbMobileStatus;
  notes?: string | null;
  accessories?: string[] | null;
  pta_status?: string | null;
  battery_health?: number | null;
  refurb_cost: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPurchase {
  id: string;
  mobile_id: string;
  supplier: string;
  purchase_type: string;
  amount: number;
  payment_method: string;
  date: string;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface DbSale {
  id: string;
  mobile_id: string;
  customer_name: string;
  customer_phone: string;
  selling_price: number;
  payment_method: string;
  date: string;
  notes?: string | null;
  invoice_number?: string | null;
  warranty_days?: number | null;
  warranty_expiry_date?: string | null;
  cash_amount?: number | null;
  bank_amount?: number | null;
  bank_name?: string | null;
  is_exchange?: boolean | null;
  trade_in_credit?: number | null;
  created_by?: string | null;
  created_at: string;
}

export interface DbExpense {
  id: string;
  category: string;
  title: string;
  amount: number;
  payment_method: string;
  date: string;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface DbCashTransaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  reference_id?: string | null;
  description: string;
  account: 'cash' | 'bank';
  date: string;
  created_by?: string | null;
  created_at: string;
}

export interface DbBudget {
  id: string;
  month: string;
  category: string;
  limit: number;
  created_at: string;
  updated_at: string;
}

export interface DbProfitDistribution {
  id: string;
  partner_id: string;
  amount: number;
  date: string;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface DbBusinessSettings {
  id: string;
  business_name: string;
  currency: string;
  monthly_expense_target: number;
  default_partner_split: number;
  tagline?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  default_warranty_days?: number | null;
  theme?: string | null;
  created_at: string;
  updated_at: string;
}
