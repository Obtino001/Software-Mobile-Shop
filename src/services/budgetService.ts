import { supabase } from '../lib/supabase';
import { DbBudget } from '../types/database';
import { Budget } from '../types';
import { formatDatabaseError } from './errorHandler';

export function mapDbBudgetToBudget(db: DbBudget): Budget {
  return {
    id: db.id,
    month: db.month,
    category: db.category,
    limit: Number(db.limit || 0),
  };
}

export class BudgetService {
  async fetchBudgets(month?: string): Promise<{ data: Budget[]; error?: string }> {
    try {
      let query = supabase.from('budgets').select('*').order('category');
      if (month) {
        query = query.eq('month', month);
      }

      const { data, error } = await query;
      if (error) {
        return { data: [], error: formatDatabaseError(error, 'fetch budget limits') };
      }

      return { data: (data || []).map(mapDbBudgetToBudget) };
    } catch (err) {
      return { data: [], error: formatDatabaseError(err, 'fetch budget limits') };
    }
  }

  async upsertBudget(params: {
    month: string;
    category: string;
    limit: number;
  }): Promise<{ data: Budget | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .upsert(
          {
            month: params.month,
            category: params.category,
            limit: params.limit,
          },
          { onConflict: 'month,category' }
        )
        .select('*')
        .single();

      if (error) {
        return { data: null, error: formatDatabaseError(error, 'save budget target') };
      }

      return { data: mapDbBudgetToBudget(data) };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'save budget target') };
    }
  }

  async deleteBudget(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) {
        return { success: false, error: formatDatabaseError(error, 'delete budget') };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'delete budget') };
    }
  }
}

export const budgetService = new BudgetService();
