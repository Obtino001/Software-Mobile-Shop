import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, where, setDoc } from 'firebase/firestore';
import { DbBudget } from '../types/database';
import { Budget } from '../types';
import { formatDatabaseError } from './errorHandler';

export function mapDbBudgetToBudget(dbId: string, b: any): Budget {
  return {
    id: dbId,
    month: b.month,
    category: b.category,
    limit: Number(b.limit || 0),
  };
}

export class BudgetService {
  async fetchBudgets(month?: string): Promise<{ data: Budget[]; error?: string }> {
    try {
      let q = query(collection(db, 'budgets'), orderBy('category'));
      if (month) {
        // Note: Firestore requires a composite index if combining where and orderBy on different fields,
        // but since we only have a few budgets, we can just filter client-side if needed or just use where.
        q = query(collection(db, 'budgets'), where('month', '==', month));
      }

      const snapshot = await getDocs(q);
      const budgets = snapshot.docs.map(docSnap => mapDbBudgetToBudget(docSnap.id, docSnap.data()));
      return { data: budgets };
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
      // Use month_category as doc ID for easy upsert
      const docId = `${params.month}_${params.category.replace(/[^a-zA-Z0-9]/g, '')}`;
      const payload = {
        month: params.month,
        category: params.category,
        limit: params.limit,
      };

      await setDoc(doc(db, 'budgets', docId), payload);

      return { data: mapDbBudgetToBudget(docId, payload) };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'save budget target') };
    }
  }

  async deleteBudget(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'budgets', id));
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'delete budget') };
    }
  }
}

export const budgetService = new BudgetService();
