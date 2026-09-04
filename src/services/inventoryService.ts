import { supabase } from '../lib/supabase';
import { DbMobileInventory, DbMobileStatus } from '../types/database';
import { MobileProduct } from '../types';
import { formatDatabaseError } from './errorHandler';

export function mapDbMobileToMobileProduct(db: DbMobileInventory): MobileProduct {
  const purchasePrice = Number(db.purchase_price || 0);
  const refurbCost = Number(db.refurb_cost || 0);
  return {
    id: db.id,
    brand: db.brand,
    model: db.model,
    variant: db.variant || `${db.storage} • ${db.color}`,
    storage: db.storage,
    ram: db.ram || undefined,
    color: db.color,
    imei: db.imei,
    serialNumber: db.serial_number || undefined,
    condition: db.condition,
    purchasePrice,
    refurbCost,
    totalCost: purchasePrice + refurbCost,
    sellingPrice: Number(db.expected_selling_price || 0),
    purchaseSource: db.purchase_source || undefined,
    purchaseDate: db.purchase_date,
    saleDate: db.sale_date || undefined,
    status: db.status,
    notes: db.notes || undefined,
    accessories: db.accessories || [],
    ptaStatus: db.pta_status as any,
    batteryHealth: db.battery_health ?? undefined,
    createdAt: db.created_at,
    imei1: db.imei,
  };
}

export class InventoryService {
  async fetchInventory(): Promise<{ data: MobileProduct[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('mobile_inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: formatDatabaseError(error, 'fetch mobile inventory') };
      }

      return { data: (data || []).map(mapDbMobileToMobileProduct) };
    } catch (err) {
      return { data: [], error: formatDatabaseError(err, 'fetch mobile inventory') };
    }
  }

  async createMobile(mobile: Omit<MobileProduct, 'id' | 'createdAt'>): Promise<{ data: MobileProduct | null; error?: string }> {
    try {
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
          status: mobile.status as DbMobileStatus,
          notes: mobile.notes,
          accessories: mobile.accessories,
          pta_status: mobile.ptaStatus,
          battery_health: mobile.batteryHealth,
          refurb_cost: mobile.refurbCost || 0,
        })
        .select('*')
        .single();

      if (error) {
        return { data: null, error: formatDatabaseError(error, 'save mobile to inventory') };
      }

      return { data: mapDbMobileToMobileProduct(data) };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'save mobile to inventory') };
    }
  }

  async updateMobile(id: string, updates: Partial<MobileProduct>): Promise<{ success: boolean; error?: string }> {
    try {
      const dbPayload: any = {};
      if (updates.brand !== undefined) dbPayload.brand = updates.brand;
      if (updates.model !== undefined) dbPayload.model = updates.model;
      if (updates.storage !== undefined) dbPayload.storage = updates.storage;
      if (updates.color !== undefined) dbPayload.color = updates.color;
      if (updates.sellingPrice !== undefined) dbPayload.expected_selling_price = updates.sellingPrice;
      if (updates.purchasePrice !== undefined) dbPayload.purchase_price = updates.purchasePrice;
      if (updates.refurbCost !== undefined) dbPayload.refurb_cost = updates.refurbCost;
      if (updates.status !== undefined) dbPayload.status = updates.status;
      if (updates.saleDate !== undefined) dbPayload.sale_date = updates.saleDate;
      if (updates.condition !== undefined) dbPayload.condition = updates.condition;
      if (updates.notes !== undefined) dbPayload.notes = updates.notes;
      if (updates.batteryHealth !== undefined) dbPayload.battery_health = updates.batteryHealth;
      if (updates.accessories !== undefined) dbPayload.accessories = updates.accessories;

      const { error } = await supabase
        .from('mobile_inventory')
        .update(dbPayload)
        .eq('id', id);

      if (error) {
        return { success: false, error: formatDatabaseError(error, 'update mobile product') };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'update mobile product') };
    }
  }

  async deleteMobile(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('mobile_inventory')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: formatDatabaseError(error, 'delete mobile device') };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'delete mobile device') };
    }
  }

  async markAsSold(id: string, saleDate: string): Promise<{ success: boolean; error?: string }> {
    return this.updateMobile(id, {
      status: 'Sold',
      saleDate,
    });
  }
}

export const inventoryService = new InventoryService();
