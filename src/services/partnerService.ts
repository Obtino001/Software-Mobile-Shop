import { supabase } from '../lib/supabase';
import { DbPartner, DbProfitDistribution } from '../types/database';
import { Partner } from '../types';
import { formatDatabaseError } from './errorHandler';

export function mapDbPartnerToPartner(db: DbPartner): Partner {
  const initial = Number(db.initial_investment || 0);
  const addl = Number(db.additional_investment || 0);
  return {
    id: db.id,
    name: db.name,
    initialInvestment: initial,
    additionalInvestment: addl,
    totalInvestment: initial + addl,
    withdrawals: Number(db.total_withdrawals || 0),
    ownershipPercentage: Number(db.ownership_percentage || 50),
    createdAt: db.created_at,
    role: 'Managing Partner',
  };
}

export class PartnerService {
  async fetchPartners(): Promise<{ data: Partner[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('name');

      if (error) {
        return { data: [], error: formatDatabaseError(error, 'fetch partner records') };
      }

      return { data: (data || []).map(mapDbPartnerToPartner) };
    } catch (err) {
      return { data: [], error: formatDatabaseError(err, 'fetch partner records') };
    }
  }

  async createPartner(params: {
    name: string;
    initialInvestment: number;
    ownershipPercentage?: number;
  }): Promise<{ data: Partner | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .insert({
          name: params.name,
          initial_investment: params.initialInvestment,
          additional_investment: 0,
          total_withdrawals: 0,
          ownership_percentage: params.ownershipPercentage ?? 50,
        })
        .select('*')
        .single();

      if (error) {
        return { data: null, error: formatDatabaseError(error, 'create partner') };
      }

      return { data: mapDbPartnerToPartner(data) };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'create partner') };
    }
  }

  async addAdditionalCapital(partnerId: string, amount: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: partner, error: fetchErr } = await supabase
        .from('partners')
        .select('additional_investment')
        .eq('id', partnerId)
        .single();

      if (fetchErr || !partner) {
        return { success: false, error: formatDatabaseError(fetchErr, 'find partner record') };
      }

      const updated = Number(partner.additional_investment || 0) + Number(amount);
      const { error } = await supabase
        .from('partners')
        .update({ additional_investment: updated })
        .eq('id', partnerId);

      if (error) {
        return { success: false, error: formatDatabaseError(error, 'add partner capital') };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'add partner capital') };
    }
  }

  async recordWithdrawal(partnerName: string, amount: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: partner, error: fetchErr } = await supabase
        .from('partners')
        .select('id, total_withdrawals')
        .ilike('name', partnerName)
        .maybeSingle();

      if (fetchErr || !partner) {
        return { success: false, error: formatDatabaseError(fetchErr, 'find partner record') };
      }

      const updated = Number(partner.total_withdrawals || 0) + Number(amount);
      const { error } = await supabase
        .from('partners')
        .update({ total_withdrawals: updated })
        .eq('id', partner.id);

      if (error) {
        return { success: false, error: formatDatabaseError(error, 'record partner withdrawal') };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'record partner withdrawal') };
    }
  }

  async updatePartner(id: string, updates: Partial<DbPartner>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('partners')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: formatDatabaseError(error, 'update partner') };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'update partner') };
    }
  }

  async deletePartner(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: formatDatabaseError(error, 'delete partner') };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'delete partner') };
    }
  }
}

export const partnerService = new PartnerService();
