import { 
  Partner, 
  MobileProduct, 
  Sale, 
  Purchase, 
  Expense, 
  CashTransaction, 
  Budget 
} from '../types';

export interface PartnerBalance {
  partnerId: string;
  name: string;
  totalInvestment: number;
  ownershipPercentage: number;
  profitShare: number;
  withdrawals: number;
  currentBalance: number;
}

export interface BudgetUsage {
  budgetId: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  usagePercentage: number;
}

export interface UnsoldInventoryValue {
  stockCount: number;
  totalCost: number;
  totalRetailValue: number;
  potentialProfit: number;
}

/**
 * 1. Total capital invested across all business partners
 */
export function calculateTotalCapital(partners: Partner[]): number {
  return partners.reduce((sum, p) => sum + (p.totalInvestment || 0), 0);
}

/**
 * 2. Total money invested by each partner with dynamically recalculated ownership percentage
 */
export function calculatePartnerInvestments(partners: Partner[]): {
  totalCapital: number;
  partnerInvestments: {
    id: string;
    name: string;
    initialInvestment: number;
    additionalInvestment: number;
    totalInvestment: number;
    ownershipPercentage: number;
  }[];
} {
  const totalCapital = calculateTotalCapital(partners);
  const partnerInvestments = partners.map((p) => {
    const total = (p.initialInvestment || 0) + (p.additionalInvestment || 0);
    const ownership = totalCapital > 0 ? (total / totalCapital) * 100 : 0;
    return {
      id: p.id,
      name: p.name,
      initialInvestment: p.initialInvestment,
      additionalInvestment: p.additionalInvestment || 0,
      totalInvestment: total,
      ownershipPercentage: Math.round(ownership * 100) / 100,
    };
  });

  return { totalCapital, partnerInvestments };
}

/**
 * 3. Current inventory cost of all unsold devices
 */
export function calculateCurrentInventoryCost(mobiles: MobileProduct[]): number {
  return mobiles
    .filter((m) => m.status === 'In Stock')
    .reduce((sum, m) => sum + (m.totalCost || m.purchasePrice || 0), 0);
}

/**
 * 4. Inventory expected retail value of all unsold devices
 */
export function calculateInventoryRetailValue(mobiles: MobileProduct[]): number {
  return mobiles
    .filter((m) => m.status === 'In Stock')
    .reduce((sum, m) => sum + (m.sellingPrice || 0), 0);
}

/**
 * 5. Total gross sales revenue to date
 */
export function calculateTotalSales(sales: Sale[]): number {
  return sales.reduce((sum, s) => sum + (s.sellingPrice || 0), 0);
}

/**
 * 6. Total purchases (capital deployed in inventory procurement)
 */
export function calculateTotalPurchases(purchases: Purchase[]): number {
  return purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
}

/**
 * 7. Gross profit across all completed sales
 * Rule: For a mobile, Profit = Selling Price - Purchase Price
 */
export function calculateGrossProfit(sales: Sale[], mobiles: MobileProduct[]): number {
  const mobileMap = new Map<string, MobileProduct>();
  mobiles.forEach((m) => mobileMap.set(m.id, m));

  return sales.reduce((sum, sale) => {
    // If sale already has snapshot cost, use it; otherwise look up by mobileId
    const mobile = mobileMap.get(sale.mobileId);
    const cost = sale.costPrice !== undefined 
      ? sale.costPrice 
      : (mobile ? (mobile.totalCost || mobile.purchasePrice) : 0);
    const profit = sale.profit !== undefined ? sale.profit : (sale.sellingPrice - cost);
    return sum + profit;
  }, 0);
}

/**
 * 8. Total operating expenses
 * Note: Inventory purchases are NOT treated as expenses.
 */
export function calculateTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
}

/**
 * 9. Overall Net Profit
 * Rule: Gross Mobile Profit - Business Expenses
 */
export function calculateNetProfit(
  sales: Sale[],
  mobiles: MobileProduct[],
  expenses: Expense[]
): number {
  const grossProfit = calculateGrossProfit(sales, mobiles);
  const totalExpenses = calculateTotalExpenses(expenses);
  return grossProfit - totalExpenses;
}

/**
 * 10. Cash balance
 * Net cash balance = Total Cash Inflows - Total Cash Outflows
 */
export function calculateCashBalance(transactions: CashTransaction[]): number {
  return transactions.reduce((balance, tx) => {
    switch (tx.type) {
      case 'Sale Income':
      case 'Partner Investment':
      case 'Other Income':
        return balance + tx.amount;
      case 'Mobile Purchase':
      case 'Expense':
      case 'Partner Withdrawal':
      case 'Other Expense':
        return balance - tx.amount;
      default:
        return balance;
    }
  }, 0);
}

/**
 * 11. Partner balances & individual equity
 * Formula: Partner Total Investment + (Net Profit * ownership%) - Partner Withdrawals
 */
export function calculatePartnerBalances(
  partners: Partner[],
  netProfit: number
): PartnerBalance[] {
  const totalCapital = calculateTotalCapital(partners);

  return partners.map((partner) => {
    const totalInvestment = (partner.initialInvestment || 0) + (partner.additionalInvestment || 0);
    const ownershipPercentage = totalCapital > 0 
      ? (totalInvestment / totalCapital) * 100 
      : (partner.ownershipPercentage || 50);

    const profitShare = Math.round(netProfit * (ownershipPercentage / 100));
    const withdrawals = partner.withdrawals || 0;
    const currentBalance = totalInvestment + profitShare - withdrawals;

    return {
      partnerId: partner.id,
      name: partner.name,
      totalInvestment,
      ownershipPercentage: Math.round(ownershipPercentage * 100) / 100,
      profitShare,
      withdrawals,
      currentBalance,
    };
  });
}

/**
 * 12. Monthly expenses for a specific month (e.g. '2026-09')
 */
export function calculateMonthlyExpenses(expenses: Expense[], month: string): number {
  return expenses
    .filter((e) => e.date && e.date.startsWith(month))
    .reduce((sum, e) => sum + (e.amount || 0), 0);
}

/**
 * 13. Monthly sales for a specific month (e.g. '2026-09')
 */
export function calculateMonthlySales(sales: Sale[], month: string): number {
  return sales
    .filter((s) => s.date && s.date.startsWith(month))
    .reduce((sum, s) => sum + (s.sellingPrice || 0), 0);
}

/**
 * 14. Monthly profit for a specific month
 * Formula: Monthly Gross Profit - Monthly Business Expenses
 */
export function calculateMonthlyProfit(
  sales: Sale[],
  mobiles: MobileProduct[],
  expenses: Expense[],
  month: string
): number {
  const monthSales = sales.filter((s) => s.date && s.date.startsWith(month));
  const monthExpenses = expenses.filter((e) => e.date && e.date.startsWith(month));

  const monthGrossProfit = calculateGrossProfit(monthSales, mobiles);
  const monthExpensesTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  return monthGrossProfit - monthExpensesTotal;
}

/**
 * 15. Budget usage percentage per category
 */
export function calculateBudgetUsage(
  expenses: Expense[],
  budgets: Budget[],
  month: string
): BudgetUsage[] {
  const monthExpenses = expenses.filter((e) => e.date && e.date.startsWith(month));

  return budgets
    .filter((b) => b.month === month)
    .map((b) => {
      const spent = monthExpenses
        .filter((e) => e.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, e) => sum + e.amount, 0);

      const usagePercentage = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
      const remaining = b.limit - spent;

      return {
        budgetId: b.id,
        category: b.category,
        limit: b.limit,
        spent,
        remaining,
        usagePercentage,
      };
    });
}

/**
 * 16. In-stock count
 */
export function calculateStockCount(mobiles: MobileProduct[]): number {
  return mobiles.filter((m) => m.status === 'In Stock').length;
}

/**
 * 17. Sold count
 */
export function calculateSoldCount(mobiles: MobileProduct[]): number {
  return mobiles.filter((m) => m.status === 'Sold').length;
}

/**
 * 18. Unsold inventory value breakdown
 */
export function calculateUnsoldInventoryValue(mobiles: MobileProduct[]): UnsoldInventoryValue {
  const inStock = mobiles.filter((m) => m.status === 'In Stock');
  const totalCost = inStock.reduce((sum, m) => sum + (m.totalCost || m.purchasePrice || 0), 0);
  const totalRetailValue = inStock.reduce((sum, m) => sum + (m.sellingPrice || 0), 0);
  const potentialProfit = totalRetailValue - totalCost;

  return {
    stockCount: inStock.length,
    totalCost,
    totalRetailValue,
    potentialProfit,
  };
}
