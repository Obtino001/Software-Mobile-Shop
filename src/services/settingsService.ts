import { db } from '../lib/firebase';
import { collection, doc, getDocs, query, limit, updateDoc } from 'firebase/firestore';
import { DbBusinessSettings } from '../types/database';
import { Settings } from '../types';
import { formatDatabaseError } from './errorHandler';

export function mapDbSettingsToSettings(dbData: any): Settings {
  return {
    businessName: dbData.business_name,
    shopName: dbData.business_name,
    currency: dbData.currency || 'PKR',
    monthlyExpenseTarget: Number(dbData.monthly_expense_target || 55000),
    defaultPartnerSplit: Number(dbData.default_partner_split || 50),
    tagline: dbData.tagline || undefined,
    phone: dbData.phone || undefined,
    address: dbData.address || undefined,
    city: dbData.city || undefined,
    defaultWarrantyDays: dbData.default_warranty_days ?? 7,
    theme: (dbData.theme as any) || 'dark',
  };
}

export class SettingsService {
  async fetchSettings(): Promise<{ data: Settings | null; error?: string }> {
    try {
      const q = query(collection(db, 'business_settings'), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { data: null };
      }

      return { data: mapDbSettingsToSettings(snapshot.docs[0].data()) };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'fetch business settings') };
    }
  }

  async updateSettings(updates: Partial<Settings>): Promise<{ success: boolean; error?: string }> {
    try {
      const q = query(collection(db, 'business_settings'), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: 'No settings document found to update' };
      }

      const docId = snapshot.docs[0].id;
      const dbPayload: any = {};
      if (updates.businessName !== undefined) dbPayload.business_name = updates.businessName;
      if (updates.currency !== undefined) dbPayload.currency = updates.currency;
      if (updates.monthlyExpenseTarget !== undefined) {
        dbPayload.monthly_expense_target = updates.monthlyExpenseTarget;
      }
      if (updates.defaultPartnerSplit !== undefined) {
        dbPayload.default_partner_split = updates.defaultPartnerSplit;
      }
      if (updates.tagline !== undefined) dbPayload.tagline = updates.tagline;
      if (updates.phone !== undefined) dbPayload.phone = updates.phone;
      if (updates.address !== undefined) dbPayload.address = updates.address;
      if (updates.city !== undefined) dbPayload.city = updates.city;
      if (updates.defaultWarrantyDays !== undefined) {
        dbPayload.default_warranty_days = updates.defaultWarrantyDays;
      }
      if (updates.theme !== undefined) dbPayload.theme = updates.theme;

      await updateDoc(doc(db, 'business_settings', docId), dbPayload);

      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'update business settings') };
    }
  }
}

export const settingsService = new SettingsService();
