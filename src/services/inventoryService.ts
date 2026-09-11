import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { DbMobileInventory, DbMobileStatus } from '../types/database';
import { MobileProduct } from '../types';
import { formatDatabaseError } from './errorHandler';

export function mapDbMobileToMobileProduct(dbId: string, m: any): MobileProduct {
  const purchasePrice = Number(m.purchase_price || 0);
  const refurbCost = Number(m.refurb_cost || 0);
  return {
    id: dbId,
    brand: m.brand,
    model: m.model,
    variant: m.variant || `${m.storage} • ${m.color}`,
    storage: m.storage,
    ram: m.ram || undefined,
    color: m.color,
    imei: m.imei,
    serialNumber: m.serial_number || undefined,
    condition: m.condition,
    purchasePrice,
    refurbCost,
    totalCost: purchasePrice + refurbCost,
    sellingPrice: Number(m.expected_selling_price || 0),
    purchaseSource: m.purchase_source || undefined,
    purchaseDate: m.purchase_date,
    saleDate: m.sale_date || undefined,
    status: m.status as DbMobileStatus,
    notes: m.notes || undefined,
    accessories: m.accessories || [],
    ptaStatus: m.pta_status as any,
    batteryHealth: m.battery_health ?? undefined,
    createdAt: m.created_at,
    imei1: m.imei,
  };
}

export class InventoryService {
  async fetchInventory(): Promise<{ data: MobileProduct[]; error?: string }> {
    try {
      const q = query(collection(db, 'mobile_inventory'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => mapDbMobileToMobileProduct(doc.id, doc.data()));
      return { data };
    } catch (err) {
      return { data: [], error: formatDatabaseError(err, 'fetch mobile inventory') };
    }
  }

  async createMobile(mobile: Omit<MobileProduct, 'id' | 'createdAt'>): Promise<{ data: MobileProduct | null; error?: string }> {
    try {
      const payload = {
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
        created_at: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'mobile_inventory'), payload);
      return { data: mapDbMobileToMobileProduct(docRef.id, payload) };
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

      await updateDoc(doc(db, 'mobile_inventory', id), dbPayload);
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'update mobile product') };
    }
  }

  async deleteMobile(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'mobile_inventory', id));
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
