-- ==========================================================
-- PakMobile ERP: Complete PostgreSQL Database Schema for Supabase
-- Target: Used/New Mobile Phone Trading Business (Yasir & Saad)
-- ==========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------
-- 1. PROFILES TABLE (Linked to Supabase Auth auth.users)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('owner', 'manager', 'partner', 'admin', 'sales_staff')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------
-- 2. PARTNERS TABLE (Capital & Equity Ledger)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL UNIQUE,
  initial_investment NUMERIC(12, 2) NOT NULL DEFAULT 250000.00 CHECK (initial_investment >= 0),
  additional_investment NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (additional_investment >= 0),
  total_withdrawals NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_withdrawals >= 0),
  ownership_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00 CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------
-- 3. MOBILE_INVENTORY TABLE (Smartphones in stock or sold)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mobile_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  storage TEXT NOT NULL,
  ram TEXT,
  color TEXT NOT NULL,
  imei TEXT NOT NULL,
  serial_number TEXT,
  condition TEXT NOT NULL,
  purchase_price NUMERIC(12, 2) NOT NULL CHECK (purchase_price >= 0),
  expected_selling_price NUMERIC(12, 2) NOT NULL CHECK (expected_selling_price >= 0),
  purchase_source TEXT,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  sale_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Sold', 'Reserved', 'Returned', 'Damaged')),
  notes TEXT,
  accessories TEXT[] DEFAULT ARRAY[]::TEXT[],
  pta_status TEXT DEFAULT 'official_approved',
  battery_health INTEGER CHECK (battery_health IS NULL OR (battery_health >= 0 AND battery_health <= 100)),
  refurb_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (refurb_cost >= 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial index ensuring unique IMEI for active unsold stock
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_imei 
ON public.mobile_inventory(imei) 
WHERE status = 'In Stock';

-- Frequently searched indexes
CREATE INDEX IF NOT EXISTS idx_mobile_inventory_imei ON public.mobile_inventory(imei);
CREATE INDEX IF NOT EXISTS idx_mobile_inventory_status ON public.mobile_inventory(status);
CREATE INDEX IF NOT EXISTS idx_mobile_inventory_brand ON public.mobile_inventory(brand);
CREATE INDEX IF NOT EXISTS idx_mobile_inventory_purchase_date ON public.mobile_inventory(purchase_date);
CREATE INDEX IF NOT EXISTS idx_mobile_inventory_sale_date ON public.mobile_inventory(sale_date);

-- ----------------------------------------------------------
-- 4. PURCHASES TABLE (Stock Procurement from Dealers/Walk-ins)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_id UUID NOT NULL REFERENCES public.mobile_inventory(id) ON DELETE CASCADE,
  supplier TEXT NOT NULL,
  purchase_type TEXT NOT NULL DEFAULT 'Stock In',
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Online', 'Split')),
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(date);
CREATE INDEX IF NOT EXISTS idx_purchases_mobile_id ON public.purchases(mobile_id);

-- ----------------------------------------------------------
-- 5. SALES TABLE (Point-of-Sale Realized Transactions)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_id UUID NOT NULL REFERENCES public.mobile_inventory(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
  payment_method TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  invoice_number TEXT,
  warranty_days INTEGER DEFAULT 7 CHECK (warranty_days >= 0),
  warranty_expiry_date TIMESTAMPTZ,
  cash_amount NUMERIC(12, 2) DEFAULT 0.00 CHECK (cash_amount >= 0),
  bank_amount NUMERIC(12, 2) DEFAULT 0.00 CHECK (bank_amount >= 0),
  bank_name TEXT,
  is_exchange BOOLEAN DEFAULT false,
  trade_in_credit NUMERIC(12, 2) DEFAULT 0.00 CHECK (trade_in_credit >= 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_mobile_id ON public.sales(mobile_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_phone ON public.sales(customer_phone);

-- ----------------------------------------------------------
-- 6. EXPENSES TABLE (Operating Overheads, NOT inventory)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN (
    'Food', 'Water', 'Rent', 'Electricity', 'Internet', 
    'Transport', 'Packaging', 'Repair', 'Accessories', 
    'Marketing', 'Salary', 'Other'
  )),
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer')),
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- ----------------------------------------------------------
-- 7. CASH_TRANSACTIONS TABLE (Double-Entry Cash & Bank Passbook)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'Sale Income', 'Mobile Purchase', 'Expense', 
    'Partner Investment', 'Partner Withdrawal', 
    'Other Income', 'Other Expense'
  )),
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  reference_id TEXT,
  description TEXT NOT NULL,
  account TEXT NOT NULL DEFAULT 'cash' CHECK (account IN ('cash', 'bank')),
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON public.cash_transactions(date);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON public.cash_transactions(type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_account ON public.cash_transactions(account);

-- ----------------------------------------------------------
-- 8. BUDGETS TABLE (Monthly Expense Ceilings by Category)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL, -- e.g. '2026-09'
  category TEXT NOT NULL,
  "limit" NUMERIC(12, 2) NOT NULL CHECK ("limit" >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_budget_month_category UNIQUE(month, category)
);

CREATE INDEX IF NOT EXISTS idx_budgets_month ON public.budgets(month);

-- ----------------------------------------------------------
-- 9. PROFIT_DISTRIBUTIONS TABLE (Formal Partner Payouts)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profit_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profit_distributions_partner_id ON public.profit_distributions(partner_id);

-- ----------------------------------------------------------
-- 10. BUSINESS_SETTINGS TABLE (Shop Identity & Target Config)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'Yasir & Saad Mobile Trading',
  currency TEXT NOT NULL DEFAULT 'PKR',
  monthly_expense_target NUMERIC(12, 2) NOT NULL DEFAULT 55000.00 CHECK (monthly_expense_target >= 0),
  default_partner_split NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
  tagline TEXT DEFAULT 'Premium Used & New Smartphones | Hall Road Quality',
  phone TEXT DEFAULT '+92 300 1234567 / +92 301 9876543',
  address TEXT DEFAULT 'Shop # 14, Ground Floor, Al-Hafeez Shopping Mall',
  city TEXT DEFAULT 'Lahore, Pakistan',
  default_warranty_days INTEGER DEFAULT 7,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------
-- AUTOMATIC updated_at TIMESTAMP TRIGGER
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_partners_updated_at ON public.partners;
CREATE TRIGGER trg_partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_mobile_inventory_updated_at ON public.mobile_inventory;
CREATE TRIGGER trg_mobile_inventory_updated_at BEFORE UPDATE ON public.mobile_inventory FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_budgets_updated_at ON public.budgets;
CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_business_settings_updated_at ON public.business_settings;
CREATE TRIGGER trg_business_settings_updated_at BEFORE UPDATE ON public.business_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------
-- ROLE HELPER FUNCTIONS & NEW USER AUTH TRIGGER
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'owner'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'manager';
  v_name TEXT;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  
  -- Automatically assign 'owner' to Yasir and 'manager' to Saad
  IF lower(NEW.email) LIKE '%yasir%' OR lower(v_name) = 'yasir' OR NEW.raw_user_meta_data->>'role' = 'owner' THEN
    v_role := 'owner';
  ELSE
    v_role := 'manager';
  END IF;

  INSERT INTO public.profiles (id, name, role, phone)
  VALUES (
    NEW.id,
    v_name,
    v_role,
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES (Role-Based Permissions)
-- Yasir: Owner (Full Access, Financials, Settings, Deletions)
-- Saad: Manager (Inventory, Purchases, Sales POS, Expenses)
-- ----------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Table Policies
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND (
      public.is_owner() OR role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

-- 2. Partners Table: Capital & Equity (Restricted to Owner)
DROP POLICY IF EXISTS "Owner select on partners" ON public.partners;
CREATE POLICY "Owner select on partners" ON public.partners FOR SELECT TO authenticated USING (public.is_owner());

DROP POLICY IF EXISTS "Owner insert on partners" ON public.partners;
CREATE POLICY "Owner insert on partners" ON public.partners FOR INSERT TO authenticated WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner update on partners" ON public.partners;
CREATE POLICY "Owner update on partners" ON public.partners FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner delete on partners" ON public.partners;
CREATE POLICY "Owner delete on partners" ON public.partners FOR DELETE TO authenticated USING (public.is_owner());

-- 3. Profit Distributions Table: Formal Partner Payouts (Restricted to Owner)
DROP POLICY IF EXISTS "Owner select on profit_distributions" ON public.profit_distributions;
CREATE POLICY "Owner select on profit_distributions" ON public.profit_distributions FOR SELECT TO authenticated USING (public.is_owner());

DROP POLICY IF EXISTS "Owner insert on profit_distributions" ON public.profit_distributions;
CREATE POLICY "Owner insert on profit_distributions" ON public.profit_distributions FOR INSERT TO authenticated WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner update on profit_distributions" ON public.profit_distributions;
CREATE POLICY "Owner update on profit_distributions" ON public.profit_distributions FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner delete on profit_distributions" ON public.profit_distributions;
CREATE POLICY "Owner delete on profit_distributions" ON public.profit_distributions FOR DELETE TO authenticated USING (public.is_owner());

-- 4. Business Settings Table: Shop Identity & Parameters
DROP POLICY IF EXISTS "Allow authenticated read settings" ON public.business_settings;
CREATE POLICY "Allow authenticated read settings" ON public.business_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Owner insert on business_settings" ON public.business_settings;
CREATE POLICY "Owner insert on business_settings" ON public.business_settings FOR INSERT TO authenticated WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner update on business_settings" ON public.business_settings;
CREATE POLICY "Owner update on business_settings" ON public.business_settings FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner delete on business_settings" ON public.business_settings;
CREATE POLICY "Owner delete on business_settings" ON public.business_settings FOR DELETE TO authenticated USING (public.is_owner());

-- 5. Budgets Table: Monthly Financial Limits (Restricted to Owner)
DROP POLICY IF EXISTS "Owner select on budgets" ON public.budgets;
CREATE POLICY "Owner select on budgets" ON public.budgets FOR SELECT TO authenticated USING (public.is_owner());

DROP POLICY IF EXISTS "Owner insert on budgets" ON public.budgets;
CREATE POLICY "Owner insert on budgets" ON public.budgets FOR INSERT TO authenticated WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner update on budgets" ON public.budgets;
CREATE POLICY "Owner update on budgets" ON public.budgets FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner delete on budgets" ON public.budgets;
CREATE POLICY "Owner delete on budgets" ON public.budgets FOR DELETE TO authenticated USING (public.is_owner());

-- 6. Cash Transactions: Double-Entry Cash & Bank Passbook
-- Owner can view and manage. Both Owner and Manager can record automated transaction entries from sales/purchases/expenses.
DROP POLICY IF EXISTS "Owner select on cash_transactions" ON public.cash_transactions;
CREATE POLICY "Owner select on cash_transactions" ON public.cash_transactions FOR SELECT TO authenticated USING (public.is_owner());

DROP POLICY IF EXISTS "Authenticated insert on cash_transactions" ON public.cash_transactions;
CREATE POLICY "Authenticated insert on cash_transactions" ON public.cash_transactions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Owner update on cash_transactions" ON public.cash_transactions;
CREATE POLICY "Owner update on cash_transactions" ON public.cash_transactions FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner delete on cash_transactions" ON public.cash_transactions;
CREATE POLICY "Owner delete on cash_transactions" ON public.cash_transactions FOR DELETE TO authenticated USING (public.is_owner());

-- 7. Mobile Inventory:
-- Both Yasir & Saad can view and insert stock.
-- Update: Owner can update all fields; Manager can update operational fields (such as status upon sale).
-- Delete: Only Owner can delete!
DROP POLICY IF EXISTS "Allow authenticated read mobile_inventory" ON public.mobile_inventory;
CREATE POLICY "Allow authenticated read mobile_inventory" ON public.mobile_inventory FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert mobile_inventory" ON public.mobile_inventory;
CREATE POLICY "Allow authenticated insert mobile_inventory" ON public.mobile_inventory FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update mobile_inventory" ON public.mobile_inventory;
CREATE POLICY "Allow update mobile_inventory" ON public.mobile_inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Owner delete on mobile_inventory" ON public.mobile_inventory;
CREATE POLICY "Owner delete on mobile_inventory" ON public.mobile_inventory FOR DELETE TO authenticated USING (public.is_owner());

-- 8. Purchases Table (Stock In):
-- Both Yasir & Saad can view and insert stock purchases.
-- Update & Delete: Only Owner!
DROP POLICY IF EXISTS "Allow authenticated read purchases" ON public.purchases;
CREATE POLICY "Allow authenticated read purchases" ON public.purchases FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert purchases" ON public.purchases;
CREATE POLICY "Allow authenticated insert purchases" ON public.purchases FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Owner update on purchases" ON public.purchases;
CREATE POLICY "Owner update on purchases" ON public.purchases FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner delete on purchases" ON public.purchases;
CREATE POLICY "Owner delete on purchases" ON public.purchases FOR DELETE TO authenticated USING (public.is_owner());

-- 9. Sales Table (Point of Sale):
-- Both Yasir & Saad can view and record sales.
-- Update & Delete: Only Owner!
DROP POLICY IF EXISTS "Allow authenticated read sales" ON public.sales;
CREATE POLICY "Allow authenticated read sales" ON public.sales FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert sales" ON public.sales;
CREATE POLICY "Allow authenticated insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Owner update on sales" ON public.sales;
CREATE POLICY "Owner update on sales" ON public.sales FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner delete on sales" ON public.sales;
CREATE POLICY "Owner delete on sales" ON public.sales FOR DELETE TO authenticated USING (public.is_owner());

-- 10. Expenses Table:
-- Both Yasir & Saad can view and record expenses.
-- Update & Delete: Only Owner!
DROP POLICY IF EXISTS "Allow authenticated read expenses" ON public.expenses;
CREATE POLICY "Allow authenticated read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert expenses" ON public.expenses;
CREATE POLICY "Allow authenticated insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Owner update on expenses" ON public.expenses;
CREATE POLICY "Owner update on expenses" ON public.expenses FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Owner delete on expenses" ON public.expenses;
CREATE POLICY "Owner delete on expenses" ON public.expenses FOR DELETE TO authenticated USING (public.is_owner());

-- ----------------------------------------------------------
-- INITIAL SEED DATA (Yasir & Saad PKR 500K Initial Capital)
-- ----------------------------------------------------------
INSERT INTO public.partners (id, name, initial_investment, additional_investment, total_withdrawals, ownership_percentage)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Yasir', 250000.00, 0.00, 5000.00, 50.00),
  ('00000000-0000-0000-0000-000000000002', 'Saad', 250000.00, 0.00, 5000.00, 50.00)
ON CONFLICT (name) DO UPDATE SET
  initial_investment = EXCLUDED.initial_investment,
  ownership_percentage = EXCLUDED.ownership_percentage;

INSERT INTO public.business_settings (id, business_name, currency, monthly_expense_target, default_partner_split)
VALUES (
  '00000000-0000-0000-0000-000000000099',
  'Yasir & Saad Mobile Trading',
  'PKR',
  55000.00,
  50.00
)
ON CONFLICT (id) DO NOTHING;

-- Initial Budgets
INSERT INTO public.budgets (month, category, "limit")
VALUES 
  ('2026-09', 'Rent', 40000.00),
  ('2026-09', 'Food', 8000.00),
  ('2026-09', 'Electricity', 12000.00),
  ('2026-09', 'Packaging', 6000.00),
  ('2026-09', 'Marketing', 8000.00)
ON CONFLICT (month, category) DO NOTHING;
