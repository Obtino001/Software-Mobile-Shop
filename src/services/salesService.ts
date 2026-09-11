import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, getDoc } from 'firebase/firestore';
import { DbSale } from '../types/database';
import { Sale, MobileProduct } from '../types';
import { formatDatabaseError } from './errorHandler';
import { inventoryService } from './inventoryService';
import { cashTransactionService } from './cashTransactionService';

export function mapDbSaleToSale(dbId: string, s: any, mobile?: MobileProduct): Sale {
  const cost = mobile?.totalCost || mobile?.purchasePrice || 0;
  const sellingPrice = Number(s.selling_price || 0);
  const profit = sellingPrice - cost;

  return {
    id: dbId,
    mobileId: s.mobile_id,
    customerName: s.customer_name,
    customerPhone: s.customer_phone,
    sellingPrice,
    salePrice: sellingPrice,
    paymentMethod: s.payment_method,
    date: s.date,
    notes: s.notes || undefined,
    invoiceNumber: s.invoice_number || undefined,
    warrantyDays: s.warranty_days ?? 7,
    warrantyExpiryDate: s.warranty_expiry_date || undefined,
    cashAmount: Number(s.cash_amount || 0),
    bankAmount: Number(s.bank_amount || 0),
    bankName: s.bank_name || undefined,
    isExchange: Boolean(s.is_exchange),
    exchangeDeduction: Number(s.trade_in_credit || 0),
    costPrice: cost,
    profit,
    phoneSnapshot: mobile ? {
      brand: mobile.brand,
      model: mobile.model,
      storage: mobile.storage,
      color: mobile.color,
      ptaStatus: mobile.ptaStatus,
      condition: mobile.condition,
      batteryHealth: mobile.batteryHealth,
      imei1: mobile.imei,
    } : undefined,
  };
}

export class SalesService {
  async fetchSales(): Promise<{ data: Sale[]; error?: string }> {
    try {
      const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);

      const sales: Sale[] = [];
      for (const docSnap of snapshot.docs) {
        const sData = docSnap.data();
        let mobile: MobileProduct | undefined = undefined;

        if (sData.mobile_id) {
          try {
            const mobRef = doc(db, 'mobile_inventory', sData.mobile_id);
            const mobSnap = await getDoc(mobRef);
            if (mobSnap.exists()) {
              mobile = mobSnap.data() as any;
            }
          } catch (e) {
            // ignore
          }
        }
        
        sales.push(mapDbSaleToSale(docSnap.id, sData, mobile));
      }

      return { data: sales };
    } catch (err) {
      return { data: [], error: formatDatabaseError(err, 'fetch sales records') };
    }
  }

  async createSale(params: {
    mobile: MobileProduct;
    customerName: string;
    customerPhone: string;
    sellingPrice: number;
    paymentMethod: string;
    date?: string;
    notes?: string;
    invoiceNumber?: string;
    warrantyDays?: number;
    warrantyExpiryDate?: string;
    cashAmount?: number;
    bankAmount?: number;
    bankName?: string;
    isExchange?: boolean;
    tradeInCredit?: number;
    exchangeDetails?: {
      brand: string;
      model: string;
      storage: string;
      imei: string;
      tradeInValue: number;
    };
    soldBy?: string;
  }): Promise<{ data: Sale | null; error?: string }> {
    try {
      const nowIso = params.date || new Date().toISOString();

      // 1. Insert sale record
      const payload = {
        mobile_id: params.mobile.id,
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        selling_price: params.sellingPrice,
        payment_method: params.paymentMethod,
        date: nowIso,
        notes: params.notes,
        invoice_number: params.invoiceNumber,
        warranty_days: params.warrantyDays ?? 7,
        warranty_expiry_date: params.warrantyExpiryDate,
        cash_amount: params.cashAmount || 0,
        bank_amount: params.bankAmount || 0,
        bank_name: params.bankName,
        is_exchange: Boolean(params.isExchange),
        trade_in_credit: params.tradeInCredit || 0,
      };

      const saleRef = await addDoc(collection(db, 'sales'), payload);

      // 2. Mark smartphone as Sold
      await inventoryService.markAsSold(params.mobile.id, nowIso);

      // 3. Create cash inflow transactions
      if (params.cashAmount && params.cashAmount > 0) {
        await cashTransactionService.createTransaction({
          type: 'Sale Income',
          category: 'Customer Sale',
          amount: params.cashAmount,
          description: `Sale ${params.invoiceNumber || ''} (${params.mobile.model}) - Cash`,
          account: 'cash',
          date: nowIso,
          referenceId: saleRef.id,
        });
      }

      if (params.bankAmount && params.bankAmount > 0) {
        await cashTransactionService.createTransaction({
          type: 'Sale Income',
          category: 'Customer Sale',
          amount: params.bankAmount,
          description: `Sale ${params.invoiceNumber || ''} (${params.mobile.model}) - Bank ${params.bankName || ''}`,
          account: 'bank',
          date: nowIso,
          referenceId: saleRef.id,
        });
      }

      // 4. Handle Customer Trade-In device
      if (params.isExchange && params.exchangeDetails) {
        await inventoryService.createMobile({
          brand: params.exchangeDetails.brand,
          model: params.exchangeDetails.model,
          variant: `${params.exchangeDetails.storage} (Trade-in)`,
          storage: params.exchangeDetails.storage,
          color: 'Standard',
          imei: params.exchangeDetails.imei || 'TRADE-IN-DEVICE',
          condition: 'Used 9/10',
          purchasePrice: params.exchangeDetails.tradeInValue,
          refurbCost: 0,
          totalCost: params.exchangeDetails.tradeInValue,
          sellingPrice: Math.round(params.exchangeDetails.tradeInValue * 1.15),
          purchaseSource: `Trade-in from ${params.customerName}`,
          purchaseDate: nowIso,
          status: 'In Stock',
          notes: `Customer trade-in against ${params.mobile.model} (${params.invoiceNumber || ''})`,
          accessories: ['Device Only'],
        });
      }

      const saleObj = mapDbSaleToSale(saleRef.id, payload, params.mobile);
      return { data: saleObj };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'record customer sale') };
    }
  }

  async deleteSale(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'sales', id));
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'delete sale record') };
    }
  }

  async updateSale(id: string, updates: Partial<Sale>): Promise<{ success: boolean; error?: string }> {
    try {
      const dbUpdates: any = {};
      if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName;
      if (updates.customerPhone !== undefined) dbUpdates.customer_phone = updates.customerPhone;
      if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.invoiceNumber !== undefined) dbUpdates.invoice_number = updates.invoiceNumber;
      if (updates.warrantyDays !== undefined) dbUpdates.warranty_days = updates.warrantyDays;
      if (updates.warrantyExpiryDate !== undefined) dbUpdates.warranty_expiry_date = updates.warrantyExpiryDate;
      if (updates.cashAmount !== undefined) dbUpdates.cash_amount = updates.cashAmount;
      if (updates.bankAmount !== undefined) dbUpdates.bank_amount = updates.bankAmount;
      if (updates.bankName !== undefined) dbUpdates.bank_name = updates.bankName;
      if (updates.isExchange !== undefined) dbUpdates.is_exchange = updates.isExchange;
      if (updates.exchangeDeduction !== undefined) dbUpdates.trade_in_credit = updates.exchangeDeduction;

      await updateDoc(doc(db, 'sales', id), dbUpdates);
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'update sale record') };
    }
  }
}

export const salesService = new SalesService();
