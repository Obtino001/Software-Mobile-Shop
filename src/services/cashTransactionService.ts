import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { DbCashTransaction } from '../types/database';
import { CashTransaction, CashTransactionType } from '../types';
import { formatDatabaseError } from './errorHandler';

export function mapDbTransactionToCashTransaction(dbId: string, t: any): CashTransaction {
  return {
    id: dbId,
    type: t.type as CashTransactionType,
    category: t.category,
    amount: Number(t.amount || 0),
    description: t.description,
    account: t.account,
    date: t.date,
    referenceId: t.reference_id || undefined,
  };
}

export class CashTransactionService {
  async fetchTransactions(): Promise<{ data: CashTransaction[]; error?: string }> {
    try {
      const q = query(collection(db, 'cash_transactions'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);

      const transactions = snapshot.docs.map(docSnap => mapDbTransactionToCashTransaction(docSnap.id, docSnap.data()));
      return { data: transactions };
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
      const payload = {
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        description: tx.description,
        account: tx.account,
        date: tx.date || new Date().toISOString(),
        reference_id: tx.referenceId || null,
      };

      const docRef = await addDoc(collection(db, 'cash_transactions'), payload);

      return { data: mapDbTransactionToCashTransaction(docRef.id, payload) };
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

      await addDoc(collection(db, 'cash_transactions'), {
        type: 'Other Expense',
        category: 'Internal Fund Transfer',
        amount: params.amount,
        description: `Transfer to ${toLabel}: ${params.notes || 'Internal transfer'}`,
        account: params.from,
        date: nowIso,
      });

      await addDoc(collection(db, 'cash_transactions'), {
        type: 'Other Income',
        category: 'Internal Fund Transfer',
        amount: params.amount,
        description: `Transfer received from ${fromLabel}: ${params.notes || 'Internal transfer'}`,
        account: params.to,
        date: nowIso,
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'execute fund transfer') };
    }
  }

  async deleteTransaction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'cash_transactions', id));
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

      await updateDoc(doc(db, 'cash_transactions', id), dbUpdates);
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'update transaction') };
    }
  }
}

export const cashTransactionService = new CashTransactionService();
