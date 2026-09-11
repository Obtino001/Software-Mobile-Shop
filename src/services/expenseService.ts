import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { DbExpense } from '../types/database';
import { Expense, ExpenseCategory, AccountType } from '../types';
import { formatDatabaseError } from './errorHandler';
import { cashTransactionService } from './cashTransactionService';

export function mapDbExpenseToExpense(dbId: string, e: any): Expense {
  return {
    id: dbId,
    category: e.category as ExpenseCategory,
    title: e.title,
    amount: Number(e.amount || 0),
    paymentMethod: e.payment_method,
    date: e.date,
    notes: e.notes || undefined,
    paidFrom: (e.payment_method || '').toLowerCase().includes('bank') ? 'bank' : 'cash',
  };
}

export class ExpenseService {
  async fetchExpenses(): Promise<{ data: Expense[]; error?: string }> {
    try {
      const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);

      const expenses = snapshot.docs.map(docSnap => mapDbExpenseToExpense(docSnap.id, docSnap.data()));
      return { data: expenses };
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
      const payload = {
        category: params.category,
        title: params.title,
        amount: params.amount,
        payment_method: paymentMethod,
        date: nowIso,
        notes: params.notes,
      };

      const expRef = await addDoc(collection(db, 'expenses'), payload);

      // 2. Insert into cash_transactions table
      await cashTransactionService.createTransaction({
        type: 'Expense',
        category: params.category,
        amount: params.amount,
        description: `Expense: ${params.title}`,
        account: params.paidFrom,
        date: nowIso,
        referenceId: expRef.id,
      });

      return { data: mapDbExpenseToExpense(expRef.id, payload) };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'record expense') };
    }
  }

  async deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Delete associated cash transaction
      const txQuery = query(collection(db, 'cash_transactions'), where('reference_id', '==', id));
      const txSnapshot = await getDocs(txQuery);
      for (const txDoc of txSnapshot.docs) {
        await deleteDoc(doc(db, 'cash_transactions', txDoc.id));
      }

      // 2. Delete expense
      await deleteDoc(doc(db, 'expenses', id));

      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'delete expense') };
    }
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<{ success: boolean; error?: string }> {
    try {
      const dbUpdates: any = {};
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      await updateDoc(doc(db, 'expenses', id), dbUpdates);
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'update expense') };
    }
  }
}

export const expenseService = new ExpenseService();
