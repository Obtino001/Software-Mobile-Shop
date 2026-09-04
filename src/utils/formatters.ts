import { PtaStatus, Condition, ExpenseCategory, MobileStatus, AccountType } from '../types';

/**
 * Format currency strictly as PKR X,XXX
 * Example: 25000 -> "PKR 25,000"
 */
export function formatPKR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'PKR 0';
  }
  return `PKR ${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Standard date formatting as DD MMM YYYY
 * Example: 2026-09-03 -> "03 Sep 2026"
 */
export function formatDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '-';
    
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch {
    return '-';
  }
}

/**
 * Standard date-time formatting as DD MMM YYYY, hh:mm A
 */
export function formatDateTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '-';
    
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 is 12
    const strHours = String(hours).padStart(2, '0');

    return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
  } catch {
    return '-';
  }
}

export function getPtaLabel(status?: string | PtaStatus): { label: string; short: string; color: string; bg: string } {
  switch (status) {
    case 'official_approved':
      return { label: 'Official PTA Approved', short: 'PTA Approved', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800' };
    case 'non_pta':
      return { label: 'Non-PTA (Sim Inactive)', short: 'Non-PTA', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800' };
    case 'jv_sim':
      return { label: 'JV / Gevey SIM Lock', short: 'JV Sim', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800' };
    case 'factory_unlock':
      return { label: 'Factory Unlock (Physical+eSIM)', short: 'Factory Unlock', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-50 border-sky-200 dark:bg-sky-950/50 dark:border-sky-800' };
    case 'vip_pass':
      return { label: 'VIP Pass PTA', short: 'VIP Pass', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800' };
    default:
      return { label: 'PTA Approved', short: 'PTA Approved', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 border-emerald-200' };
  }
}

export function getConditionLabel(condition: string | Condition): { label: string; badge: string; color: string } {
  const norm = (condition || '').toLowerCase();
  if (norm.includes('box') || norm.includes('new') || norm.includes('sealed')) {
    return { label: 'Brand New (Box Pack)', badge: 'Box Pack', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' };
  }
  if (norm.includes('pin')) {
    return { label: 'Pin Pack (Checking Open)', badge: 'Pin Pack', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
  }
  if (norm.includes('10/10') || norm.includes('mint')) {
    return { label: '10/10 Mint Condition', badge: '10/10 Mint', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' };
  }
  if (norm.includes('9/10')) {
    return { label: '9/10 Minor Scratches', badge: '9/10 Used', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
  }
  if (norm.includes('8/10')) {
    return { label: '8/10 Rough Condition', badge: '8/10 Rough', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' };
  }
  if (norm.includes('kit')) {
    return { label: 'Kit Only (No Box/Cable)', badge: 'Kit Only', color: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300' };
  }
  return { label: condition, badge: condition, color: 'bg-gray-100 text-gray-800' };
}

export function getPhoneStatusLabel(status: MobileStatus | string): { label: string; color: string; bg: string } {
  const norm = (status || '').toLowerCase();
  if (norm === 'in stock' || norm === 'in_stock') {
    return { label: 'In Stock', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  }
  if (norm === 'sold') {
    return { label: 'Sold Out', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30' };
  }
  if (norm === 'reserved' || norm === 'booked_token') {
    return { label: 'Reserved / Token', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
  }
  if (norm === 'damaged' || norm === 'under_repair') {
    return { label: 'Damaged / Lab', color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
  }
  if (norm === 'returned') {
    return { label: 'Customer Returned', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' };
  }
  return { label: status, color: 'text-slate-500', bg: 'bg-slate-100' };
}

export function getExpenseCategoryLabel(cat: ExpenseCategory | string): string {
  switch (cat) {
    case 'Food':
    case 'lunch_tea_refreshment':
      return 'Chai / Refreshment & Food';
    case 'Water':
      return 'Drinking Water Bottles';
    case 'Rent':
    case 'shop_rent':
      return 'Shop Rent';
    case 'Electricity':
    case 'electricity_bill':
      return 'Electricity & Utility Bills';
    case 'Internet':
      return 'Internet & WiFi Connection';
    case 'Transport':
      return 'Travel & Fuel Logistics';
    case 'Packaging':
    case 'accessories_packaging':
      return 'Shopping Bags & Packaging';
    case 'Repair':
    case 'repair_tools':
      return 'Phone Repairs & Tools';
    case 'Accessories':
      return 'Mobile Covers & Glasses';
    case 'Marketing':
    case 'marketing_boost':
      return 'Social Media & Ad Boost';
    case 'Salary':
    case 'staff_salary':
      return 'Staff & Helper Salary';
    case 'Other':
    case 'miscellaneous':
      return 'Other Overhead Expense';
    default:
      return cat;
  }
}

export function getAccountLabel(account: AccountType | string): string {
  return account === 'cash' ? 'Cash in Hand (Galla)' : 'Bank / Digital (Meezan/SadaPay)';
}
