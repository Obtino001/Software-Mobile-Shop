import { supabase } from '../lib/supabase';
import { DbExpense } from '../types/database';
import { Expense, ExpenseCategory, AccountType } from '../types';
import { formatDatabaseError } from './errorHandler';
import { cashTransactionService } from './cashTransactionService';

export function mapDbExpenseToExpense(db: DbExpense): Expense {
  return {
    id: db.id,
    category: db.category as ExpenseCategory,
    title: db.title,
    amount: Number(db.amount || 0),
    paymentMethod: db.payment_method,
    date: db.date,
    notes: db.notes || undefined,
    paidFrom: db.payment_method.toLowerCase().includes('bank') ? 'bank' : 'cash',
  };
}

export class ExpenseService {
  async fetchExpenses(): Promise<{ data: Expense[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        return { data: [], error: formatDatabaseError(error, 'fetch expenses') };
      }

      return { data: (data || []).map(mapDbExpenseToExpense) };
    } catch (err) {
      return { data: [], error: formatDatabaseError(err, 'fetch expenses') };
    }
  }

  async createExpense(params: {
    category: ExpenseCategory;
    title: string;
    amount: number;
    paidFrom: AccountType;
    paidBy?: string;
    notes?: string;
    date?: string;
  }): Promise<{ data: Expense | null; error?: string }> {
    try {
      const nowIso = params.date || new Date().toISOString();
      const paymentMethod = params.paidFrom === 'cash' ? 'Cash' : 'Bank Transfer';

      // 1. Insert into expenses table
      const { data: expenseRow, error: expErr } = await supabase
        .from('expenses')
        .insert({
          category: params.category,
          title: params.title,
          amount: params.amount,
          payment_method: paymentMethod,
          date: nowIso,
          notes: params.notes,
        })
        .select('*')
        .single();

      if (expErr) {
        return { data: null, error: formatDatabaseError(expErr, 'record expense') };
      }

      // 2. Insert into cash_transactions table
      await cashTransactionService.createTransaction({
        type: 'Expense',
        category: params.category,
        amount: params.amount,
        description: `Expense: ${params.title}`,
        account: params.paidFrom,
        date: nowIso,
        referenceId: expenseRow.id,
      });

      return { data: mapDbExpenseToExpense(expenseRow) };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'record expense') };
    }
  }

  async deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Delete associated cash transaction
      await supabase.from('cash_transactions').delete().eq('reference_id', id);

      // 2. Delete expense
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        return { success: false, error: formatDatabaseError(error, 'delete expense') };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'delete expense') };
    }
  }
}

export const expenseService = new ExpenseService();
