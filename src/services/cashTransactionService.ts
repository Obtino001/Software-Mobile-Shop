import { supabase } from '../lib/supabase';
import { DbCashTransaction } from '../types/database';
import { CashTransaction, CashTransactionType } from '../types';
import { formatDatabaseError } from './errorHandler';

export function mapDbTransactionToCashTransaction(db: DbCashTransaction): CashTransaction {
  return {
    id: db.id,
    type: db.type as CashTransactionType,
    category: db.category,
    amount: Number(db.amount || 0),
    description: db.description,
    account: db.account,
    date: db.date,
    referenceId: db.reference_id || undefined,
  };
}

export class CashTransactionService {
  async fetchTransactions(): Promise<{ data: CashTransaction[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        return { data: [], error: formatDatabaseError(error, 'fetch cash transactions') };
      }

      return { data: (data || []).map(mapDbTransactionToCashTransaction) };
    } catch (err) {
      return { data: [], error: formatDatabaseError(err, 'fetch cash transactions') };
    }
  }

  async createTransaction(tx: {
    type: CashTransactionType;
    category: string;
    amount: number;
    description: string;
    account: 'cash' | 'bank';
    date?: string;
    referenceId?: string;
  }): Promise<{ data: CashTransaction | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .insert({
          type: tx.type,
          category: tx.category,
          amount: tx.amount,
          description: tx.description,
          account: tx.account,
          date: tx.date || new Date().toISOString(),
          reference_id: tx.referenceId,
        })
        .select('*')
        .single();

      if (error) {
        return { data: null, error: formatDatabaseError(error, 'record cash transaction') };
      }

      return { data: mapDbTransactionToCashTransaction(data) };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'record cash transaction') };
    }
  }

  async transferFunds(params: {
    from: 'cash' | 'bank';
    to: 'cash' | 'bank';
    amount: number;
    notes?: string;
    recordedBy?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const nowIso = new Date().toISOString();
      const fromLabel = params.from === 'cash' ? 'Cash Counter' : 'Bank Account';
      const toLabel = params.to === 'cash' ? 'Cash Counter' : 'Bank Account';

      const { error: outErr } = await supabase.from('cash_transactions').insert({
        type: 'Other Expense',
        category: 'Internal Fund Transfer',
        amount: params.amount,
        description: `Transfer to ${toLabel}: ${params.notes || 'Internal transfer'}`,
        account: params.from,
        date: nowIso,
      });

      if (outErr) {
        return { success: false, error: formatDatabaseError(outErr, 'record transfer withdrawal') };
      }

      const { error: inErr } = await supabase.from('cash_transactions').insert({
        type: 'Other Income',
        category: 'Internal Fund Transfer',
        amount: params.amount,
        description: `Transfer received from ${fromLabel}: ${params.notes || 'Internal transfer'}`,
        account: params.to,
        date: nowIso,
      });

      if (inErr) {
        return { success: false, error: formatDatabaseError(inErr, 'record transfer receipt') };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'execute fund transfer') };
    }
  }

  async deleteTransaction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: formatDatabaseError(error, 'delete transaction') };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'delete transaction') };
    }
  }

  async updateTransaction(id: string, updates: Partial<CashTransaction>): Promise<{ success: boolean; error?: string }> {
    try {
      const dbUpdates: any = {};
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.account !== undefined) dbUpdates.account = updates.account;
      if (updates.date !== undefined) dbUpdates.date = updates.date;

      const { error } = await supabase.from('cash_transactions').update(dbUpdates).eq('id', id);
      if (error) {
        return { success: false, error: formatDatabaseError(error, 'update transaction') };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'update transaction') };
    }
  }
}

export const cashTransactionService = new CashTransactionService();
