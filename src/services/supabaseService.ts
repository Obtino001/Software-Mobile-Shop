import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Partner,
  MobileProduct,
  Purchase,
  Sale,
  Expense,
  CashTransaction,
  Budget,
  Settings,
  MobileStatus,
  ExpenseCategory,
  CashTransactionType,
} from '../types';

export interface DatabaseSnapshot {
  partners: Partner[];
  mobiles: MobileProduct[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  transactions: CashTransaction[];
  budgets: Budget[];
  settings: Settings;
}

export class SupabaseService {
  /**
   * Fetch all records across all 8 core entities from Supabase
   */
  async fetchAllData(): Promise<DatabaseSnapshot | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const [
        partnersRes,
        mobilesRes,
        purchasesRes,
        salesRes,
        expensesRes,
        transactionsRes,
        budgetsRes,
        settingsRes,
      ] = await Promise.all([
        supabase.from('partners').select('*').order('name'),
        supabase.from('mobile_inventory').select('*').order('created_at', { ascending: false }),
        supabase.from('purchases').select('*').order('date', { ascending: false }),
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('cash_transactions').select('*').order('date', { ascending: false }),
        supabase.from('budgets').select('*').order('category'),
        supabase.from('business_settings').select('*').limit(1).maybeSingle(),
      ]);

      // If any major query errors (e.g. table not created yet), report error
      if (mobilesRes.error) {
        console.warn('[SupabaseService] Error loading mobile_inventory:', mobilesRes.error);
        return null;
      }

      const partners: Partner[] = (partnersRes.data || []).map((p: any) => {
        const initial = Number(p.initial_investment || 0);
        const addl = Number(p.additional_investment || 0);
        return {
          id: p.id,
          name: p.name,
          initialInvestment: initial,
          additionalInvestment: addl,
          totalInvestment: initial + addl,
          withdrawals: Number(p.total_withdrawals || 0),
          ownershipPercentage: Number(p.ownership_percentage || 50),
          createdAt: p.created_at,
          phone: p.phone,
          role: 'Managing Partner',
        };
      });

      const mobiles: MobileProduct[] = (mobilesRes.data || []).map((m: any) => {
        const purchasePrice = Number(m.purchase_price || 0);
        const refurbCost = Number(m.refurb_cost || 0);
        return {
          id: m.id,
          brand: m.brand,
          model: m.model,
          variant: m.variant,
          storage: m.storage,
          ram: m.ram,
          color: m.color,
          imei: m.imei,
          serialNumber: m.serial_number,
          condition: m.condition,
          purchasePrice,
          refurbCost,
          totalCost: purchasePrice + refurbCost,
          sellingPrice: Number(m.expected_selling_price || 0),
          purchaseSource: m.purchase_source,
          purchaseDate: m.purchase_date,
          saleDate: m.sale_date,
          status: m.status as MobileStatus,
          notes: m.notes,
          accessories: m.accessories || [],
          ptaStatus: m.pta_status,
          batteryHealth: m.battery_health,
          createdAt: m.created_at,
        };
      });

      const purchases: Purchase[] = (purchasesRes.data || []).map((p: any) => ({
        id: p.id,
        mobileId: p.mobile_id,
        supplier: p.supplier,
        purchaseType: p.purchase_type,
        amount: Number(p.amount || 0),
        paymentMethod: p.payment_method,
        date: p.date,
        notes: p.notes,
        brand: p.brand,
        model: p.model,
        storage: p.storage,
        color: p.color,
        imei: p.imei,
      }));

      const sales: Sale[] = (salesRes.data || []).map((s: any) => ({
        id: s.id,
        mobileId: s.mobile_id,
        customerName: s.customer_name,
        customerPhone: s.customer_phone,
        sellingPrice: Number(s.selling_price || 0),
        paymentMethod: s.payment_method,
        date: s.date,
        notes: s.notes,
        invoiceNumber: s.invoice_number,
        warrantyDays: s.warranty_days,
        warrantyExpiryDate: s.warranty_expiry_date,
        cashAmount: Number(s.cash_amount || 0),
        bankAmount: Number(s.bank_amount || 0),
        bankName: s.bank_name,
        isExchange: Boolean(s.is_exchange),
        exchangeDeduction: Number(s.trade_in_credit || 0),
      }));

      const expenses: Expense[] = (expensesRes.data || []).map((e: any) => ({
        id: e.id,
        category: e.category as ExpenseCategory,
        title: e.title,
        amount: Number(e.amount || 0),
        paymentMethod: e.payment_method,
        date: e.date,
        notes: e.notes,
      }));

      const transactions: CashTransaction[] = (transactionsRes.data || []).map((t: any) => ({
        id: t.id,
        type: t.type as CashTransactionType,
        category: t.category,
        amount: Number(t.amount || 0),
        referenceId: t.reference_id,
        description: t.description,
        account: t.account || 'cash',
        date: t.date,
      }));

      const budgets: Budget[] = (budgetsRes.data || []).map((b: any) => ({
        id: b.id,
        month: b.month,
        category: b.category,
        limit: Number(b.limit || 0),
      }));

      const rawSettings = settingsRes.data;
      const settings: Settings = rawSettings
        ? {
            businessName: rawSettings.business_name,
            shopName: rawSettings.business_name,
            currency: rawSettings.currency,
            monthlyExpenseTarget: Number(rawSettings.monthly_expense_target || 55000),
            defaultPartnerSplit: Number(rawSettings.default_partner_split || 50),
            tagline: rawSettings.tagline,
            phone: rawSettings.phone,
            address: rawSettings.address,
            city: rawSettings.city,
            defaultWarrantyDays: rawSettings.default_warranty_days || 7,
            theme: rawSettings.theme || 'dark',
          }
        : {
            businessName: 'Yasir & Saad Mobile Trading',
            shopName: 'Yasir & Saad Mobile Trading',
            currency: 'PKR',
            monthlyExpenseTarget: 55000,
            defaultPartnerSplit: 50,
            theme: 'dark',
          };

      return {
        partners,
        mobiles,
        purchases,
        sales,
        expenses,
        transactions,
        budgets,
        settings,
      };
    } catch (err) {
      console.error('[SupabaseService] fetchAllData failed:', err);
      return null;
    }
  }

  // --- MOBILE INVENTORY MUTATIONS ---
  async insertMobile(mobile: Omit<MobileProduct, 'id' | 'createdAt'>): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('mobile_inventory')
      .insert({
        brand: mobile.brand,
        model: mobile.model,
        variant: mobile.variant,
        storage: mobile.storage,
        ram: mobile.ram,
        color: mobile.color,
        imei: mobile.imei,
        serial_number: mobile.serialNumber,
        condition: mobile.condition,
        purchase_price: mobile.purchasePrice,
        expected_selling_price: mobile.sellingPrice,
        purchase_source: mobile.purchaseSource,
        purchase_date: mobile.purchaseDate,
        status: mobile.status,
        notes: mobile.notes,
        accessories: mobile.accessories,
        pta_status: mobile.ptaStatus,
        battery_health: mobile.batteryHealth,
        refurb_cost: mobile.refurbCost || 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[SupabaseService] insertMobile error:', error);
      return null;
    }
    return data?.id || null;
  }

  async updateMobile(id: string, updates: Partial<MobileProduct>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const dbPayload: any = {};
    if (updates.sellingPrice !== undefined) dbPayload.expected_selling_price = updates.sellingPrice;
    if (updates.purchasePrice !== undefined) dbPayload.purchase_price = updates.purchasePrice;
    if (updates.status !== undefined) dbPayload.status = updates.status;
    if (updates.saleDate !== undefined) dbPayload.sale_date = updates.saleDate;
    if (updates.notes !== undefined) dbPayload.notes = updates.notes;
    if (updates.condition !== undefined) dbPayload.condition = updates.condition;

    const { error } = await supabase.from('mobile_inventory').update(dbPayload).eq('id', id);
    if (error) {
      console.error('[SupabaseService] updateMobile error:', error);
      return false;
    }
    return true;
  }

  async deleteMobile(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const { error } = await supabase.from('mobile_inventory').delete().eq('id', id);
    return !error;
  }

  // --- PURCHASES MUTATION ---
  async insertPurchase(purchase: {
    mobileId: string;
    supplier: string;
    purchaseType: string;
    amount: number;
    paymentMethod: string;
    date: string;
    notes?: string;
  }): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('purchases')
      .insert({
        mobile_id: purchase.mobileId,
        supplier: purchase.supplier,
        purchase_type: purchase.purchaseType,
        amount: purchase.amount,
        payment_method: purchase.paymentMethod,
        date: purchase.date,
        notes: purchase.notes,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[SupabaseService] insertPurchase error:', error);
      return null;
    }
    return data?.id || null;
  }

  // --- SALES MUTATION ---
  async insertSale(sale: {
    mobileId: string;
    customerName: string;
    customerPhone: string;
    sellingPrice: number;
    paymentMethod: string;
    date: string;
    notes?: string;
    invoiceNumber?: string;
    warrantyDays?: number;
    warrantyExpiryDate?: string;
    cashAmount?: number;
    bankAmount?: number;
    bankName?: string;
    isExchange?: boolean;
    tradeInCredit?: number;
  }): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('sales')
      .insert({
        mobile_id: sale.mobileId,
        customer_name: sale.customerName,
        customer_phone: sale.customerPhone,
        selling_price: sale.sellingPrice,
        payment_method: sale.paymentMethod,
        date: sale.date,
        notes: sale.notes,
        invoice_number: sale.invoiceNumber,
        warranty_days: sale.warrantyDays || 7,
        warranty_expiry_date: sale.warrantyExpiryDate,
        cash_amount: sale.cashAmount || 0,
        bank_amount: sale.bankAmount || 0,
        bank_name: sale.bankName,
        is_exchange: Boolean(sale.isExchange),
        trade_in_credit: sale.tradeInCredit || 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[SupabaseService] insertSale error:', error);
      return null;
    }

    // Mark device as Sold in database
    await supabase
      .from('mobile_inventory')
      .update({
        status: 'Sold',
        sale_date: sale.date,
      })
      .eq('id', sale.mobileId);

    return data?.id || null;
  }

  // --- EXPENSES MUTATIONS ---
  async insertExpense(expense: {
    category: ExpenseCategory;
    title: string;
    amount: number;
    paymentMethod: string;
    date: string;
    notes?: string;
  }): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        category: expense.category,
        title: expense.title,
        amount: expense.amount,
        payment_method: expense.paymentMethod,
        date: expense.date,
        notes: expense.notes,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[SupabaseService] insertExpense error:', error);
      return null;
    }
    return data?.id || null;
  }

  async deleteExpense(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    return !error;
  }

  // --- CASH TRANSACTIONS MUTATIONS ---
  async insertCashTransaction(tx: {
    type: CashTransactionType;
    category: string;
    amount: number;
    description: string;
    account: 'cash' | 'bank';
    date: string;
    referenceId?: string;
  }): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('cash_transactions')
      .insert({
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        description: tx.description,
        account: tx.account,
        date: tx.date,
        reference_id: tx.referenceId,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[SupabaseService] insertCashTransaction error:', error);
      return null;
    }
    return data?.id || null;
  }

  // --- PARTNERS MUTATIONS ---
  async updatePartnerWithdrawals(partnerName: string, amount: number): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    // Fetch current withdrawals
    const { data: partner } = await supabase
      .from('partners')
      .select('id, total_withdrawals')
      .ilike('name', partnerName)
      .maybeSingle();

    if (!partner) return false;

    const updated = Number(partner.total_withdrawals || 0) + Number(amount);
    const { error } = await supabase
      .from('partners')
      .update({ total_withdrawals: updated })
      .eq('id', partner.id);

    return !error;
  }

  async addPartnerCapital(partnerId: string, amount: number): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const { data: partner } = await supabase
      .from('partners')
      .select('additional_investment')
      .eq('id', partnerId)
      .maybeSingle();

    if (!partner) return false;

    const updated = Number(partner.additional_investment || 0) + Number(amount);
    const { error } = await supabase
      .from('partners')
      .update({ additional_investment: updated })
      .eq('id', partnerId);

    return !error;
  }

  // --- SETTINGS & BUDGETS ---
  async updateBusinessSettings(settings: Partial<Settings>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const dbPayload: any = {};
    if (settings.businessName) dbPayload.business_name = settings.businessName;
    if (settings.currency) dbPayload.currency = settings.currency;
    if (settings.monthlyExpenseTarget !== undefined) {
      dbPayload.monthly_expense_target = settings.monthlyExpenseTarget;
    }
    if (settings.defaultPartnerSplit !== undefined) {
      dbPayload.default_partner_split = settings.defaultPartnerSplit;
    }
    if (settings.tagline !== undefined) dbPayload.tagline = settings.tagline;
    if (settings.phone !== undefined) dbPayload.phone = settings.phone;
    if (settings.address !== undefined) dbPayload.address = settings.address;
    if (settings.city !== undefined) dbPayload.city = settings.city;
    if (settings.defaultWarrantyDays !== undefined) {
      dbPayload.default_warranty_days = settings.defaultWarrantyDays;
    }
    if (settings.theme !== undefined) dbPayload.theme = settings.theme;

    const { error } = await supabase
      .from('business_settings')
      .update(dbPayload)
      .not('id', 'is', null);

    return !error;
  }

  async upsertBudget(budget: { month: string; category: string; limit: number }): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const { error } = await supabase.from('budgets').upsert(
      {
        month: budget.month,
        category: budget.category,
        limit: budget.limit,
      },
      { onConflict: 'month,category' }
    );
    return !error;
  }
}

export const supabaseService = new SupabaseService();
