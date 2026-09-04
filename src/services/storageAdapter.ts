import { 
  Partner, 
  MobileProduct, 
  Sale, 
  Purchase, 
  Expense, 
  CashTransaction, 
  Budget, 
  Settings 
} from '../types';

export interface DatabaseSchema {
  version: string;
  updatedAt: string;
  partners: Partner[];
  mobiles: MobileProduct[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  transactions: CashTransaction[];
  budgets: Budget[];
  settings: Settings;
}

export interface IDatabaseAdapter {
  loadData(): Promise<DatabaseSchema | null>;
  saveData(data: DatabaseSchema): Promise<void>;
  exportJson(): Promise<string>;
  importJson(json: string): Promise<boolean>;
  clearData(): Promise<void>;
}

const STORAGE_KEY = 'pakmobile_erp_database_v2';

/**
 * LocalStorage Implementation of Database Adapter
 * Easily swappable for SupabaseAdapter, FirebaseAdapter, or ApiAdapter later.
 */
export class LocalStorageAdapter implements IDatabaseAdapter {
  async loadData(): Promise<DatabaseSchema | null> {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed as DatabaseSchema;
    } catch (err) {
      console.error('[LocalStorageAdapter] Failed to load data:', err);
      return null;
    }
  }

  async saveData(data: DatabaseSchema): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      data.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('[LocalStorageAdapter] Failed to save data:', err);
    }
  }

  async exportJson(): Promise<string> {
    const data = await this.loadData();
    return JSON.stringify(data, null, 2);
  }

  async importJson(json: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return false;
      await this.saveData(parsed);
      return true;
    } catch (err) {
      console.error('[LocalStorageAdapter] Failed to import json:', err);
      return false;
    }
  }

  async clearData(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

// Global active database service instance
export const dbService: IDatabaseAdapter = new LocalStorageAdapter();
