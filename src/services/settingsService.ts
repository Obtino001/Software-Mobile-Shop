import { supabase } from '../lib/supabase';
import { DbBusinessSettings } from '../types/database';
import { Settings } from '../types';
import { formatDatabaseError } from './errorHandler';

export function mapDbSettingsToSettings(db: DbBusinessSettings): Settings {
  return {
    businessName: db.business_name,
    shopName: db.business_name,
    currency: db.currency || 'PKR',
    monthlyExpenseTarget: Number(db.monthly_expense_target || 55000),
    defaultPartnerSplit: Number(db.default_partner_split || 50),
    tagline: db.tagline || undefined,
    phone: db.phone || undefined,
    address: db.address || undefined,
    city: db.city || undefined,
    defaultWarrantyDays: db.default_warranty_days ?? 7,
    theme: (db.theme as any) || 'dark',
  };
}

export class SettingsService {
  async fetchSettings(): Promise<{ data: Settings | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        return { data: null, error: formatDatabaseError(error, 'fetch business settings') };
      }

      if (!data) return { data: null };
      return { data: mapDbSettingsToSettings(data) };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'fetch business settings') };
    }
  }

  async updateSettings(updates: Partial<Settings>): Promise<{ success: boolean; error?: string }> {
    try {
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

      const { error } = await supabase
        .from('business_settings')
        .update(dbPayload)
        .not('id', 'is', null);

      if (error) {
        return { success: false, error: formatDatabaseError(error, 'update business settings') };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'update business settings') };
    }
  }
}

export const settingsService = new SettingsService();
