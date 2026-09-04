import { supabase } from '../lib/supabase';
import { DbSale } from '../types/database';
import { Sale, MobileProduct } from '../types';
import { formatDatabaseError } from './errorHandler';
import { inventoryService } from './inventoryService';
import { cashTransactionService } from './cashTransactionService';

export function mapDbSaleToSale(db: DbSale, mobile?: MobileProduct): Sale {
  const cost = mobile?.totalCost || mobile?.purchasePrice || 0;
  const sellingPrice = Number(db.selling_price || 0);
  const profit = sellingPrice - cost;

  return {
    id: db.id,
    mobileId: db.mobile_id,
    customerName: db.customer_name,
    customerPhone: db.customer_phone,
    sellingPrice,
    salePrice: sellingPrice,
    paymentMethod: db.payment_method,
    date: db.date,
    notes: db.notes || undefined,
    invoiceNumber: db.invoice_number || undefined,
    warrantyDays: db.warranty_days ?? 7,
    warrantyExpiryDate: db.warranty_expiry_date || undefined,
    cashAmount: Number(db.cash_amount || 0),
    bankAmount: Number(db.bank_amount || 0),
    bankName: db.bank_name || undefined,
    isExchange: Boolean(db.is_exchange),
    exchangeDeduction: Number(db.trade_in_credit || 0),
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
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          mobile_inventory (*)
        `)
        .order('date', { ascending: false });

      if (error) {
        const simple = await supabase.from('sales').select('*').order('date', { ascending: false });
        if (simple.error) {
          return { data: [], error: formatDatabaseError(simple.error, 'fetch sales records') };
        }
        return { data: (simple.data || []).map((s) => mapDbSaleToSale(s)) };
      }

      const sales: Sale[] = (data || []).map((s: any) => {
        const mob = s.mobile_inventory;
        const cost = mob ? Number(mob.purchase_price || 0) + Number(mob.refurb_cost || 0) : 0;
        const sellingPrice = Number(s.selling_price || 0);

        return {
          id: s.id,
          mobileId: s.mobile_id,
          customerName: s.customer_name,
          customerPhone: s.customer_phone,
          sellingPrice,
          salePrice: sellingPrice,
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
          costPrice: cost,
          profit: sellingPrice - cost,
          phoneSnapshot: mob ? {
            brand: mob.brand,
            model: mob.model,
            storage: mob.storage,
            color: mob.color,
            ptaStatus: mob.pta_status,
            condition: mob.condition,
            batteryHealth: mob.battery_health,
            imei1: mob.imei,
          } : undefined,
        };
      });

      return { data: sales };
    } catch (err) {
      return { data: [], error: formatDatabaseError(err, 'fetch sales records') };
    }
  }

  /**
   * Complete transactional checkout:
   * 1. Inserts into sales
   * 2. Marks device as Sold in mobile_inventory
   * 3. Creates cash inflow transactions
   * 4. Inserts trade-in phone if exchange sale
   */
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
      const { data: saleRow, error: saleErr } = await supabase
        .from('sales')
        .insert({
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
        })
        .select('*')
        .single();

      if (saleErr) {
        return { data: null, error: formatDatabaseError(saleErr, 'record sale invoice') };
      }

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
          referenceId: saleRow.id,
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
          referenceId: saleRow.id,
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

      const saleObj = mapDbSaleToSale(saleRow, params.mobile);
      return { data: saleObj };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'record customer sale') };
    }
  }

  async deleteSale(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: formatDatabaseError(error, 'delete sale record') };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'delete sale record') };
    }
  }
}

export const salesService = new SalesService();
