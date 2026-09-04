// ==========================================================
// Configurable Role-Based Access Control (RBAC) System
// PakMobile ERP: Yasir (Owner) & Saad (Manager / Entry User)
// ==========================================================

import { NavigationTab } from '../types';

export type UserRole = 'owner' | 'manager' | 'sales_staff';

export type Permission =
  // Financial permissions
  | 'financials:view'         // View liquid cash, bank balance, net worth, partner capital/drawings, gross profit margins
  | 'cash_register:view'      // View cash & bank double-entry transaction ledger
  | 'cash_register:manage'    // Transfer funds or record manual cash transactions
  | 'partners:manage'         // View & manage partner equity, investments, and personal drawings
  | 'budgets:manage'          // View & manage monthly expense and profit budgets
  | 'reports:view'            // View business analytics, P&L reports, asset valuation

  // Business settings permissions
  | 'settings:manage'         // Edit shop profile, financial targets, backup/restore database

  // Record modification & deletion permissions
  | 'records:edit'            // Edit business records (e.g. inventory pricing, details)
  | 'records:delete'          // Delete inventory phones, sales, purchases, or expenses

  // Operational permissions
  | 'dashboard:view'          // Access dashboard screen
  | 'inventory:view'          // View smartphone stock list
  | 'inventory:create'        // Add new mobile products / stock in
  | 'inventory:delete'        // Delete phones from inventory
  | 'sales:view'              // View sales list & invoices
  | 'sales:create'            // Record POS smartphone sale
  | 'purchases:view'          // View stock procurement log
  | 'purchases:create'        // Add new purchase records
  | 'expenses:view'           // View overhead expenses list
  | 'expenses:create'         // Add overhead expenses
  | 'expenses:delete';        // Delete overhead expense records

/**
 * Role-to-Permissions Configuration Matrix
 * Easily extendable for new roles or permission adjustments in the future.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  // 1. Yasir - Owner: Full access to all operations, financials, partners, settings, deletion
  owner: [
    'financials:view',
    'cash_register:view',
    'cash_register:manage',
    'partners:manage',
    'budgets:manage',
    'reports:view',
    'settings:manage',
    'records:edit',
    'records:delete',
    'dashboard:view',
    'inventory:view',
    'inventory:create',
    'inventory:delete',
    'sales:view',
    'sales:create',
    'purchases:view',
    'purchases:create',
    'expenses:view',
    'expenses:create',
    'expenses:delete',
  ],

  // 2. Saad - Manager / Entry User: Can add mobile purchases, add inventory, record sales,
  // add expenses, view inventory, view sales, view dashboard.
  // Restricted from: viewing financial margins/equity, deleting records, editing critical params,
  // managing partners, managing settings, viewing reports, viewing cash ledger.
  manager: [
    'dashboard:view',
    'inventory:view',
    'inventory:create',
    'purchases:view',
    'purchases:create',
    'sales:view',
    'sales:create',
    'expenses:view',
    'expenses:create',
  ],

  // Future role: Sales Staff
  sales_staff: [
    'dashboard:view',
    'inventory:view',
    'sales:view',
    'sales:create',
  ],
} as const;

/**
 * Check whether a given role has a specific permission
 */
export function hasPermission(role: UserRole | string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const userRole = (role.toLowerCase() as UserRole);
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Map navigation tabs to their required permission
 */
export const TAB_PERMISSION_MAP: Record<NavigationTab, Permission> = {
  dashboard: 'dashboard:view',
  inventory: 'inventory:view',
  sales: 'sales:view',
  purchases: 'purchases:view',
  expenses: 'expenses:view',
  cash: 'cash_register:view',
  partners: 'partners:manage',
  budgets: 'budgets:manage',
  reports: 'reports:view',
  settings: 'settings:manage',
};

/**
 * Check whether a given role can access a navigation tab
 */
export function canAccessTab(role: UserRole | string | undefined | null, tab: NavigationTab): boolean {
  const requiredPermission = TAB_PERMISSION_MAP[tab];
  if (!requiredPermission) return true;
  return hasPermission(role, requiredPermission);
}

/**
 * Human-readable role labels and badges
 */
export function getRoleBadge(role: UserRole | string | undefined | null): {
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
} {
  const normalized = (role || 'manager').toLowerCase();
  switch (normalized) {
    case 'owner':
      return {
        label: 'Owner',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
        dotClass: 'bg-emerald-500',
        description: 'Full access • Financials • Settings • Partners • Deletion',
      };
    case 'manager':
      return {
        label: 'Manager',
        badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
        dotClass: 'bg-blue-500',
        description: 'Entry User • Inventory • Sales POS • Purchases • Expenses',
      };
    default:
      return {
        label: 'Staff',
        badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30',
        dotClass: 'bg-slate-400',
        description: 'Standard Operator',
      };
  }
}
