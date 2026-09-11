import { db, isFirebaseConfigured } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
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

export class FirebaseService {
  /**
   * Fetch all records across all 8 core entities from Firebase
   */
  async fetchAllData(): Promise<DatabaseSnapshot | null> {
    if (!isFirebaseConfigured()) {
      return null;
    }

    try {
      const [
        partnersSnap,
        mobilesSnap,
        purchasesSnap,
        salesSnap,
        expensesSnap,
        transactionsSnap,
        budgetsSnap,
        settingsSnap,
      ] = await Promise.all([
        getDocs(query(collection(db, 'partners'), orderBy('name'))),
        getDocs(query(collection(db, 'mobile_inventory'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'purchases'), orderBy('date', 'desc'))),
        getDocs(query(collection(db, 'sales'), orderBy('date', 'desc'))),
        getDocs(query(collection(db, 'expenses'), orderBy('date', 'desc'))),
        getDocs(query(collection(db, 'cash_transactions'), orderBy('date', 'desc'))),
        getDocs(query(collection(db, 'budgets'), orderBy('category'))),
        getDocs(query(collection(db, 'business_settings'), limit(1))),
      ]);

      const partners: Partner[] = partnersSnap.docs.map(doc => {
        const p = doc.data();
        const initial = Number(p.initial_investment || 0);
        const addl = Number(p.additional_investment || 0);
        return {
          id: doc.id,
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

      const mobiles: MobileProduct[] = mobilesSnap.docs.map(doc => {
        const m = doc.data();
        const purchasePrice = Number(m.purchase_price || 0);
        const refurbCost = Number(m.refurb_cost || 0);
        return {
          id: doc.id,
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

      const purchases: Purchase[] = purchasesSnap.docs.map(doc => {
        const p = doc.data();
        return {
          id: doc.id,
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
        };
      });

      const sales: Sale[] = salesSnap.docs.map(doc => {
        const s = doc.data();
        return {
          id: doc.id,
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
        };
      });

      const expenses: Expense[] = expensesSnap.docs.map(doc => {
        const e = doc.data();
        return {
          id: doc.id,
          category: e.category as ExpenseCategory,
          title: e.title,
          amount: Number(e.amount || 0),
          paymentMethod: e.payment_method,
          date: e.date,
          notes: e.notes,
        };
      });

      const transactions: CashTransaction[] = transactionsSnap.docs.map(doc => {
        const t = doc.data();
        return {
          id: doc.id,
          type: t.type as CashTransactionType,
          category: t.category,
          amount: Number(t.amount || 0),
          referenceId: t.reference_id,
          description: t.description,
          account: t.account || 'cash',
          date: t.date,
        };
      });

      const budgets: Budget[] = budgetsSnap.docs.map(doc => {
        const b = doc.data();
        return {
          id: doc.id,
          month: b.month,
          category: b.category,
          limit: Number(b.limit || 0),
        };
      });

      let settings: Settings = {
        businessName: 'Yasir & Saad Mobile Trading',
        shopName: 'Yasir & Saad Mobile Trading',
        currency: 'PKR',
        monthlyExpenseTarget: 55000,
        defaultPartnerSplit: 50,
        theme: 'dark',
      };

      if (!settingsSnap.empty) {
        const rawSettings = settingsSnap.docs[0].data();
        settings = {
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
        };
      }

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
      console.error('[FirebaseService] fetchAllData failed:', err);
      return null;
    }
  }
}

export const firebaseService = new FirebaseService();
