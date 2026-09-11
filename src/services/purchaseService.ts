import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, getDoc } from 'firebase/firestore';
import { DbPurchase } from '../types/database';
import { Purchase, MobileProduct } from '../types';
import { formatDatabaseError } from './errorHandler';
import { inventoryService } from './inventoryService';
import { cashTransactionService } from './cashTransactionService';

export function mapDbPurchaseToPurchase(dbId: string, p: any, mobile?: MobileProduct): Purchase {
  return {
    id: dbId,
    mobileId: p.mobile_id,
    supplier: p.supplier,
    purchaseType: p.purchase_type,
    amount: Number(p.amount || 0),
    paymentMethod: p.payment_method,
    date: p.date,
    notes: p.notes || undefined,
    brand: mobile?.brand,
    model: mobile?.model,
    storage: mobile?.storage,
    color: mobile?.color,
    imei: mobile?.imei,
    imei1: mobile?.imei,
    totalCost: Number(p.amount || 0),
    purchasePrice: mobile?.purchasePrice,
    repairCost: mobile?.refurbCost,
    ptaStatus: mobile?.ptaStatus,
  };
}

export class PurchaseService {
  async fetchPurchases(): Promise<{ data: Purchase[]; error?: string }> {
    try {
      const q = query(collection(db, 'purchases'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      
      const purchases: Purchase[] = [];
      for (const docSnap of snapshot.docs) {
        const pData = docSnap.data();
        let mobile: MobileProduct | undefined = undefined;
        
        if (pData.mobile_id) {
          try {
            const mobRef = doc(db, 'mobile_inventory', pData.mobile_id);
            const mobSnap = await getDoc(mobRef);
            if (mobSnap.exists()) {
              mobile = mobSnap.data() as any;
            }
          } catch (e) {
            // ignore
          }
        }
        
        purchases.push(mapDbPurchaseToPurchase(docSnap.id, pData, mobile));
      }

      return { data: purchases };
    } catch (err) {
      return { data: [], error: formatDatabaseError(err, 'fetch purchases') };
    }
  }

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
      const payload = {
        mobile_id: createdMobile.id,
        supplier: params.supplier,
        purchase_type: params.purchaseType,
        amount: params.amount,
        payment_method: params.paymentMethod,
        date: params.mobileData.purchaseDate || new Date().toISOString(),
        notes: params.notes,
      };
      
      const purchaseRef = await addDoc(collection(db, 'purchases'), payload);

      // 3. Create cash outflow transaction
      const isBank = params.paymentMethod.toLowerCase().includes('bank');
      await cashTransactionService.createTransaction({
        type: 'Mobile Purchase',
        category: 'Stock Acquisition',
        amount: params.amount,
        description: `Stock In: ${createdMobile.brand} ${createdMobile.model} (${createdMobile.storage})`,
        account: isBank ? 'bank' : 'cash',
        date: payload.date,
        referenceId: purchaseRef.id,
      });

      const purchaseObj = mapDbPurchaseToPurchase(purchaseRef.id, payload, createdMobile);
      return { data: { purchase: purchaseObj, mobile: createdMobile } };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'complete purchase intake') };
    }
  }

  async deletePurchase(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'purchases', id));
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'delete purchase record') };
    }
  }

  async updatePurchase(id: string, updates: Partial<Purchase>): Promise<{ success: boolean; error?: string }> {
    try {
      const dbUpdates: any = {};
      if (updates.supplier !== undefined) dbUpdates.supplier = updates.supplier;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.purchaseType !== undefined) dbUpdates.purchase_type = updates.purchaseType;

      await updateDoc(doc(db, 'purchases', id), dbUpdates);
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'update purchase record') };
    }
  }
}

export const purchaseService = new PurchaseService();
