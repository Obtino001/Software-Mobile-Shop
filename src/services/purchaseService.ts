import { supabase } from '../lib/supabase';
import { DbPurchase } from '../types/database';
import { Purchase, MobileProduct } from '../types';
import { formatDatabaseError } from './errorHandler';
import { inventoryService } from './inventoryService';
import { cashTransactionService } from './cashTransactionService';

export function mapDbPurchaseToPurchase(db: DbPurchase, mobile?: MobileProduct): Purchase {
  return {
    id: db.id,
    mobileId: db.mobile_id,
    supplier: db.supplier,
    purchaseType: db.purchase_type,
    amount: Number(db.amount || 0),
    paymentMethod: db.payment_method,
    date: db.date,
    notes: db.notes || undefined,
    brand: mobile?.brand,
    model: mobile?.model,
    storage: mobile?.storage,
    color: mobile?.color,
    imei: mobile?.imei,
    imei1: mobile?.imei,
    totalCost: Number(db.amount || 0),
    purchasePrice: mobile?.purchasePrice,
    repairCost: mobile?.refurbCost,
    ptaStatus: mobile?.ptaStatus,
  };
}

export class PurchaseService {
  async fetchPurchases(): Promise<{ data: Purchase[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          mobile_inventory (*)
        `)
        .order('date', { ascending: false });

      if (error) {
        // Fallback without join in case foreign key join alias issues
        const simple = await supabase.from('purchases').select('*').order('date', { ascending: false });
        if (simple.error) {
          return { data: [], error: formatDatabaseError(simple.error, 'fetch purchases') };
        }
        return { data: (simple.data || []).map((p) => mapDbPurchaseToPurchase(p)) };
      }

      const purchases: Purchase[] = (data || []).map((p: any) => {
        const mob = p.mobile_inventory;
        return {
          id: p.id,
          mobileId: p.mobile_id,
          supplier: p.supplier,
          purchaseType: p.purchase_type,
          amount: Number(p.amount || 0),
          paymentMethod: p.payment_method,
          date: p.date,
          notes: p.notes,
          brand: mob?.brand,
          model: mob?.model,
          storage: mob?.storage,
          color: mob?.color,
          imei: mob?.imei,
          imei1: mob?.imei,
          totalCost: Number(p.amount || 0),
          purchasePrice: mob ? Number(mob.purchase_price) : undefined,
          repairCost: mob ? Number(mob.refurb_cost) : undefined,
          ptaStatus: mob?.pta_status,
        };
      });

      return { data: purchases };
    } catch (err) {
      return { data: [], error: formatDatabaseError(err, 'fetch purchases') };
    }
  }

  /**
   * Complete transactional intake:
   * 1. Inserts phone into mobile_inventory
   * 2. Inserts purchase record
   * 3. Creates cash outflow transaction
   */
  async createPurchase(params: {
    mobileData: Omit<MobileProduct, 'id' | 'createdAt'>;
    supplier: string;
    purchaseType: string;
    amount: number;
    paymentMethod: 'Cash' | 'Bank Transfer' | string;
    purchasedBy: string;
    notes?: string;
  }): Promise<{ data: { purchase: Purchase; mobile: MobileProduct } | null; error?: string }> {
    try {
      // 1. Create mobile in inventory
      const mobRes = await inventoryService.createMobile(params.mobileData);
      if (!mobRes.data || mobRes.error) {
        return { data: null, error: mobRes.error || "Couldn't save inventory device." };
      }
      const createdMobile = mobRes.data;

      // 2. Insert purchase record
      const { data: purchaseRow, error: purchaseErr } = await supabase
        .from('purchases')
        .insert({
          mobile_id: createdMobile.id,
          supplier: params.supplier,
          purchase_type: params.purchaseType,
          amount: params.amount,
          payment_method: params.paymentMethod,
          date: params.mobileData.purchaseDate || new Date().toISOString(),
          notes: params.notes,
        })
        .select('*')
        .single();

      if (purchaseErr) {
        // Rollback mobile if purchase fails
        await inventoryService.deleteMobile(createdMobile.id);
        return { data: null, error: formatDatabaseError(purchaseErr, 'record purchase invoice') };
      }

      // 3. Create cash outflow transaction
      const isBank = params.paymentMethod.toLowerCase().includes('bank');
      await cashTransactionService.createTransaction({
        type: 'Mobile Purchase',
        category: 'Stock Acquisition',
        amount: params.amount,
        description: `Stock In: ${createdMobile.brand} ${createdMobile.model} (${createdMobile.storage})`,
        account: isBank ? 'bank' : 'cash',
        date: purchaseRow.date,
        referenceId: purchaseRow.id,
      });

      const purchaseObj = mapDbPurchaseToPurchase(purchaseRow, createdMobile);
      return { data: { purchase: purchaseObj, mobile: createdMobile } };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'complete purchase intake') };
    }
  }

  async deletePurchase(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: formatDatabaseError(error, 'delete purchase record') };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'delete purchase record') };
    }
  }

  async updatePurchase(id: string, updates: Partial<Purchase>): Promise<{ success: boolean; error?: string }> {
    try {
      // Create db update object
      const dbUpdates: any = {};
      if (updates.supplier !== undefined) dbUpdates.supplier = updates.supplier;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.purchaseType !== undefined) dbUpdates.purchase_type = updates.purchaseType;

      const { error } = await supabase
        .from('purchases')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        return { success: false, error: formatDatabaseError(error, 'update purchase record') };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'update purchase record') };
    }
  }
}

export const purchaseService = new PurchaseService();
