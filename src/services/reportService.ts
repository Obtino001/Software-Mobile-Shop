import {
  Partner,
  MobileProduct,
  Sale,
  Purchase,
  Expense,
  CashTransaction,
  Budget,
} from '../types';
import {
  calculateTotalCapital,
  calculatePartnerInvestments,
  calculateCurrentInventoryCost,
  calculateInventoryRetailValue,
  calculateTotalSales,
  calculateTotalPurchases,
  calculateGrossProfit,
  calculateTotalExpenses,
  calculateNetProfit,
  calculateCashBalance,
  calculatePartnerBalances,
  calculateMonthlyExpenses,
  calculateMonthlySales,
  calculateMonthlyProfit,
  calculateBudgetUsage,
  calculateStockCount,
  calculateSoldCount,
  calculateUnsoldInventoryValue,
  PartnerBalance,
  BudgetUsage,
  UnsoldInventoryValue,
} from '../utils/calculations';

export interface ComprehensiveReport {
  totalCapital: number;
  partnerInvestments: ReturnType<typeof calculatePartnerInvestments>;
  totalSales: number;
  totalPurchases: number;
  inventoryCost: number;
  inventoryRetailValue: number;
  potentialProfitInStock: number;
  realizedGrossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  cashBalance: number;
  partnerBalances: PartnerBalance[];
  stockCount: number;
  soldCount: number;
  monthlySales: number;
  monthlyExpenses: number;
  monthlyNetProfit: number;
  budgetUsage: BudgetUsage[];
  unsoldInventory: UnsoldInventoryValue;
}

export class ReportService {
  generateReport(data: {
    partners: Partner[];
    mobiles: MobileProduct[];
    sales: Sale[];
    purchases: Purchase[];
    expenses: Expense[];
    transactions: CashTransaction[];
    budgets: Budget[];
    month?: string;
  }): ComprehensiveReport {
    const currentMonth = data.month || new Date().toISOString().slice(0, 7);

    const totalCapital = calculateTotalCapital(data.partners);
    const partnerInvestments = calculatePartnerInvestments(data.partners);
    const totalSales = calculateTotalSales(data.sales);
    const totalPurchases = calculateTotalPurchases(data.purchases);
    const inventoryCost = calculateCurrentInventoryCost(data.mobiles);
    const inventoryRetailValue = calculateInventoryRetailValue(data.mobiles);
    const potentialProfitInStock = inventoryRetailValue - inventoryCost;

    const realizedGrossProfit = calculateGrossProfit(data.sales, data.mobiles);
    const operatingExpenses = calculateTotalExpenses(data.expenses);
    const netProfit = calculateNetProfit(data.sales, data.mobiles, data.expenses);

    const cashBalance = calculateCashBalance(data.transactions);
    const partnerBalances = calculatePartnerBalances(data.partners, netProfit);

    const stockCount = calculateStockCount(data.mobiles);
    const soldCount = calculateSoldCount(data.mobiles);
    const unsoldInventory = calculateUnsoldInventoryValue(data.mobiles);

    const monthlySales = calculateMonthlySales(data.sales, currentMonth);
    const monthlyExpenses = calculateMonthlyExpenses(data.expenses, currentMonth);
    const monthlyNetProfit = calculateMonthlyProfit(
      data.sales,
      data.mobiles,
      data.expenses,
      currentMonth
    );
    const budgetUsage = calculateBudgetUsage(data.expenses, data.budgets, currentMonth);

    return {
      totalCapital,
      partnerInvestments,
      totalSales,
      totalPurchases,
      inventoryCost,
      inventoryRetailValue,
      potentialProfitInStock,
      realizedGrossProfit,
      operatingExpenses,
      netProfit,
      cashBalance,
      partnerBalances,
      stockCount,
      soldCount,
      monthlySales,
      monthlyExpenses,
      monthlyNetProfit,
      budgetUsage,
      unsoldInventory,
    };
  }
}

export const reportService = new ReportService();
