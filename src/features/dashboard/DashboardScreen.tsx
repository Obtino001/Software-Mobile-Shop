import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatPKR, formatDate, getExpenseCategoryLabel } from '../../utils/formatters';
import { AnimatedNumber } from '../../components/animation/AnimatedNumber';
import { SaleReceiptModal } from '../sales/SaleReceiptModal';
import { SaleRecord } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Wallet,
  Smartphone,
  TrendingUp,
  Zap,
  ArrowDownLeft,
  ReceiptText,
  AlertTriangle,
  AlertCircle,
  Clock,
  ShoppingBag,
  DollarSign,
  Users,
  Package,
  ChevronRight,
  CalendarDays,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  BarChart3,
  Layers
} from 'lucide-react';

// ─── Status semantic helpers ───
type BudgetStatus = 'healthy' | 'warning' | 'critical' | 'over';

function getBudgetStatus(pct: number): BudgetStatus {
  if (pct > 100) return 'over';
  if (pct >= 90) return 'critical';
  if (pct >= 70) return 'warning';
  return 'healthy';
}

const STATUS_STYLES: Record<BudgetStatus, { bar: string; badge: string; text: string }> = {
  healthy: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', text: 'text-emerald-600' },
  warning: { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800 border-amber-200/80', text: 'text-amber-700' },
  critical: { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-800 border-rose-200/80', text: 'text-rose-600' },
  over: { bar: 'bg-rose-600', badge: 'bg-rose-100 text-rose-900 border-rose-300', text: 'text-rose-700' },
};

// ─── Time range types ───
type TimeRange = 'this_month' | 'last_month' | 'last_3' | 'last_6' | 'this_year';

const TIME_LABELS: Record<TimeRange, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  last_3: '3 Months',
  last_6: '6 Months',
  this_year: 'This Year',
};

// ─── Greeting based on time ───
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getCurrentDateStr(): string {
  const d = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Month helpers ───
function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string): string {
  const [y, m] = key.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} '${y.slice(-2)}`;
}

function getMonthsInRange(range: TimeRange): string[] {
  const now = new Date();
  const keys: string[] = [];

  switch (range) {
    case 'this_month':
      keys.push(getMonthKey(now));
      break;
    case 'last_month': {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      keys.push(getMonthKey(last));
      break;
    }
    case 'last_3':
      for (let i = 2; i >= 0; i--) {
        keys.push(getMonthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
      }
      break;
    case 'last_6':
      for (let i = 5; i >= 0; i--) {
        keys.push(getMonthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
      }
      break;
    case 'this_year':
      for (let i = 0; i <= now.getMonth(); i++) {
        keys.push(getMonthKey(new Date(now.getFullYear(), i, 1)));
      }
      break;
  }

  return keys;
}

function isInMonth(dateStr: string, monthKey: string): boolean {
  try {
    const d = new Date(dateStr);
    return getMonthKey(d) === monthKey;
  } catch {
    return false;
  }
}

// ═════════════════════════════════════════
// REDESIGNED FINTECH DASHBOARD SCREEN
// ═════════════════════════════════════════
export function DashboardScreen() {
  const {
    phones,
    sales,
    purchases,
    expenses,
    settings,
    getCashInHand,
    getBankBalance,
    getTotalStockCost,
    getInventoryRetailValue,
    getPartnerEquity,
    getTotalSales,
    getGrossProfit,
    getTotalExpenses,
    getNetProfit,
    getStockCount,
    getSoldCount,
    openQuickSale,
    openQuickPurchase,
    openQuickExpense,
    setCurrentTab,
  } = useAppStore();

  const { hasPermission, partnerName } = useAuthStore();
  const canViewFinancials = hasPermission('financials:view');
  const canManagePartners = hasPermission('partners:manage');

  const [selectedReceipt, setSelectedReceipt] = useState<SaleRecord | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('last_6');

  // ── Core computed values ──
  const cashInHand = getCashInHand();
  const bankBalance = getBankBalance();
  const stockCost = getTotalStockCost();
  const stockRetail = getInventoryRetailValue();
  const totalSales = getTotalSales();
  const grossProfit = getGrossProfit();
  const totalExpenses = getTotalExpenses();
  const netProfit = getNetProfit();
  const stockCount = getStockCount();
  const soldCount = getSoldCount();
  const potentialProfit = Math.max(0, stockRetail - stockCost);

  // Partner equity
  const yasirEquity = getPartnerEquity('Yasir');
  const saadEquity = getPartnerEquity('Saad');
  const totalCapital = yasirEquity.initial + saadEquity.initial;
  const yasirPct = totalCapital > 0 ? Math.round((yasirEquity.initial / totalCapital) * 100) : 50;
  const saadPct = 100 - yasirPct;

  const inStockPhones = useMemo(
    () => phones.filter((p) => p.status === 'In Stock' || (p.status as string) === 'in_stock'),
    [phones]
  );

  // ── Monthly expense budget ──
  const MONTHLY_BUDGET = settings?.monthlyExpenseTarget || 20000;
  const currentMonthKey = getMonthKey(new Date());
  const monthlyExpensesTotal = useMemo(
    () => expenses.filter((e) => isInMonth(e.date, currentMonthKey)).reduce((s, e) => s + e.amount, 0),
    [expenses, currentMonthKey]
  );
  const budgetPct = MONTHLY_BUDGET > 0 ? Math.round((monthlyExpensesTotal / MONTHLY_BUDGET) * 100) : 0;
  const budgetRemaining = MONTHLY_BUDGET - monthlyExpensesTotal;
  const budgetStatus = getBudgetStatus(budgetPct);
  const statusStyle = STATUS_STYLES[budgetStatus];

  // ── Monthly chart data ──
  const chartData = useMemo(() => {
    const months = getMonthsInRange(timeRange);
    return months.map((mk) => {
      const mSales = sales.filter((s) => isInMonth(s.date, mk)).reduce((s, r) => s + (r.sellingPrice || r.salePrice || 0), 0);
      const mExpenses = expenses.filter((e) => isInMonth(e.date, mk)).reduce((s, e) => s + e.amount, 0);
      const mProfit = mSales - mExpenses;
      return { name: getMonthLabel(mk), Sales: mSales, Expenses: mExpenses, Profit: mProfit };
    });
  }, [sales, expenses, timeRange]);

  // ── Alerts ──
  const alerts = useMemo(() => {
    const items: { id: string; icon: React.ReactNode; text: string; severity: 'warning' | 'danger' | 'info'; actionLabel?: string; tab?: any }[] = [];

    // Phones with no selling price
    const noPrice = inStockPhones.filter((p) => !p.sellingPrice || p.sellingPrice <= 0);
    if (noPrice.length > 0) {
      items.push({ 
        id: 'no-price', 
        icon: <DollarSign className="h-4 w-4" />, 
        text: `${noPrice.length} phone(s) have no retail price set`, 
        severity: 'warning',
        actionLabel: 'Set Prices',
        tab: 'inventory'
      });
    }

    // Aging stock (>14 days)
    const aging = inStockPhones.filter((p) => {
      const days = (Date.now() - new Date(p.purchaseDate).getTime()) / (1000 * 3600 * 24);
      return days > 14;
    });
    if (aging.length > 0) {
      items.push({ 
        id: 'aging', 
        icon: <Clock className="h-4 w-4" />, 
        text: `${aging.length} phone(s) in stock for over 14 days`, 
        severity: 'warning',
        actionLabel: 'View Stock',
        tab: 'inventory'
      });
    }

    // Budget exceeded
    if (budgetStatus === 'over') {
      items.push({ 
        id: 'budget-over', 
        icon: <AlertTriangle className="h-4 w-4" />, 
        text: `Monthly expense budget exceeded by ${formatPKR(Math.abs(budgetRemaining))}`, 
        severity: 'danger',
        actionLabel: 'Check Budget',
        tab: 'budgets'
      });
    }

    // Low cash
    if (cashInHand < 5000 && cashInHand >= 0) {
      items.push({ 
        id: 'low-cash', 
        icon: <Wallet className="h-4 w-4" />, 
        text: `Cash counter low: ${formatPKR(cashInHand)} remaining`, 
        severity: 'info',
        actionLabel: 'View Register',
        tab: 'cash'
      });
    }

    // Reserved phones
    const reserved = phones.filter((p) => p.status === 'Reserved' || (p.status as string) === 'booked_token');
    if (reserved.length > 0) {
      items.push({ 
        id: 'reserved', 
        icon: <Package className="h-4 w-4" />, 
        text: `${reserved.length} phone(s) reserved on customer token`, 
        severity: 'info',
        actionLabel: 'Check Token',
        tab: 'inventory'
      });
    }

    return items;
  }, [inStockPhones, phones, budgetStatus, budgetRemaining, cashInHand]);

  // ── Recent activity feed (merged & sorted) ──
  const recentActivity = useMemo(() => {
    type Activity = { 
      id: string; 
      rawSale?: SaleRecord;
      icon: React.ReactNode; 
      desc: string; 
      amount: number; 
      date: string; 
      type: 'income' | 'expense'; 
      category: string; 
    };
    const items: Activity[] = [];

    sales.slice(0, 10).forEach((s) => {
      items.push({
        id: `s-${s.id}`,
        rawSale: s,
        icon: <Zap className="h-3.5 w-3.5" />,
        desc: `Sold ${s.phoneSnapshot?.brand || ''} ${s.phoneSnapshot?.model || 'Phone'} (${s.customerName})`,
        amount: s.sellingPrice || s.salePrice || 0,
        date: s.date,
        type: 'income',
        category: 'Sale POS',
      });
    });

    expenses.slice(0, 10).forEach((e) => {
      items.push({
        id: `e-${e.id}`,
        icon: <ReceiptText className="h-3.5 w-3.5" />,
        desc: e.title,
        amount: e.amount,
        date: e.date,
        type: 'expense',
        category: getExpenseCategoryLabel(e.category),
      });
    });

    purchases.slice(0, 10).forEach((p) => {
      items.push({
        id: `p-${p.id}`,
        icon: <ArrowDownLeft className="h-3.5 w-3.5" />,
        desc: `Purchased ${p.brand || ''} ${p.model || 'Phone'}`,
        amount: p.amount || p.totalCost || 0,
        date: p.date,
        type: 'expense',
        category: 'Stock Purchase',
      });
    });

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items.slice(0, 7);
  }, [sales, expenses, purchases]);

  // Margin ratios
  const grossMarginPct = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : '0.0';
  const netMarginPct = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-4 md:space-y-6 pb-12 select-none">

      {/* ═══════ 1. COMPACT DASHBOARD HEADER ═══════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Live Operations
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Counter Active
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {partnerName || 'Partner'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            {getCurrentDateStr()}
          </p>
        </div>

        {/* Header Quick Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => openQuickExpense()}
            className="h-9 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 focus:outline-none focus:ring-1 focus:ring-slate-400"
            title="Record Shop Expense"
          >
            <ReceiptText className="h-3.5 w-3.5 text-rose-500" />
            <span className="hidden sm:inline">Expense</span>
          </button>
          <button
            onClick={() => openQuickSale()}
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 focus:outline-none focus:ring-1 focus:ring-slate-400"
            title="Issue Sale Invoice"
          >
            <Zap className="h-3.5 w-3.5 text-[#E06349]" />
            <span>New Sale</span>
          </button>
          <button
            onClick={() => openQuickPurchase()}
            className="h-9 px-3.5 rounded-xl bg-[#E06349] hover:bg-[#D05339] text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E06349]/40"
            title="Stock in new mobile device"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Stock In Phone</span>
          </button>
        </div>
      </div>

      {/* ═══════ 2. FINANCIAL OVERVIEW — RESPONSIVE BENTO GRID (6 CARDS) ═══════ */}
      <section aria-label="Financial Overview">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
            Financial Overview
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            Store Performance Snapshot
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Card 1: Cash in Hand */}
          {canViewFinancials ? (
            <BentoKpiCard
              label="Cash in Hand"
              value={cashInHand}
              subtext={`Bank: ${formatPKR(bankBalance)}`}
              icon={<Wallet className="h-4 w-4 text-emerald-600" />}
              iconBg="bg-emerald-50 border-emerald-200/80"
              valueColor="text-slate-900"
              onClick={() => setCurrentTab('cash')}
              clickableText="View Register"
            />
          ) : (
            <BentoKpiCard
              label="Cash Register"
              value="Restricted"
              subtext="Owner Only Access"
              icon={<Wallet className="h-4 w-4 text-slate-400" />}
              iconBg="bg-slate-100 border-slate-200"
              valueColor="text-slate-400"
            />
          )}

          {/* Card 2: Net Profit */}
          {canViewFinancials ? (
            <BentoKpiCard
              label="Net Profit"
              value={netProfit}
              subtext={`${netMarginPct}% net margin`}
              icon={<TrendingUp className={`h-4 w-4 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />}
              iconBg={netProfit >= 0 ? 'bg-emerald-50 border-emerald-200/80' : 'bg-rose-50 border-rose-200/80'}
              valueColor={netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}
              isCurrency
              badge={netProfit >= 0 ? '+Profit' : '-Loss'}
              badgeStyle={netProfit >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' : 'bg-rose-50 text-rose-700 border-rose-200/80'}
            />
          ) : (
            <BentoKpiCard
              label="Net Profit"
              value="Restricted"
              subtext="Owner Only Access"
              icon={<TrendingUp className="h-4 w-4 text-slate-400" />}
              iconBg="bg-slate-100 border-slate-200"
              valueColor="text-slate-400"
            />
          )}

          {/* Card 3: Total Sales */}
          <BentoKpiCard
            label="Total Sales"
            value={totalSales}
            subtext={`${soldCount} units sold`}
            icon={<ShoppingBag className="h-4 w-4 text-blue-600" />}
            iconBg="bg-blue-50 border-blue-200/80"
            valueColor="text-slate-900"
            onClick={() => setCurrentTab('sales')}
            clickableText="View Sales"
            isCurrency
          />

          {/* Card 4: Gross Profit */}
          {canViewFinancials ? (
            <BentoKpiCard
              label="Gross Profit"
              value={grossProfit}
              subtext={`${grossMarginPct}% gross margin`}
              icon={<DollarSign className="h-4 w-4 text-teal-600" />}
              iconBg="bg-teal-50 border-teal-200/80"
              valueColor={grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}
              isCurrency
            />
          ) : (
            <BentoKpiCard
              label="Gross Profit"
              value="Restricted"
              subtext="Owner Only Access"
              icon={<DollarSign className="h-4 w-4 text-slate-400" />}
              iconBg="bg-slate-100 border-slate-200"
              valueColor="text-slate-400"
            />
          )}

          {/* Card 5: Expenses */}
          <BentoKpiCard
            label="Expenses"
            value={totalExpenses}
            subtext={`${formatPKR(monthlyExpensesTotal)} this month`}
            icon={<ReceiptText className="h-4 w-4 text-rose-600" />}
            iconBg="bg-rose-50 border-rose-200/80"
            valueColor="text-rose-600"
            onClick={() => setCurrentTab('expenses')}
            clickableText="View Log"
            isCurrency
          />

          {/* Card 6: Stock Value */}
          <BentoKpiCard
            label="Stock Value"
            value={stockCost}
            subtext={`${stockCount} phones • Retail ${formatPKR(stockRetail)}`}
            icon={<Smartphone className="h-4 w-4 text-indigo-600" />}
            iconBg="bg-indigo-50 border-indigo-200/80"
            valueColor="text-slate-900"
            onClick={() => setCurrentTab('inventory')}
            clickableText="View Stock"
            isCurrency
          />
        </div>
      </section>

      {/* ═══════ 3. CAPITAL & MONTHLY BUDGET BENTO ROW ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* ── Total Capital Invested (7 cols on large screens, Owner Only) ── */}
        {canViewFinancials && canManagePartners && (
          <div className="lg:col-span-7 rounded-xl border border-slate-200/80 bg-white p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Partner Capital & Ownership
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <AnimatedNumber value={totalCapital} className="text-xl md:text-2xl font-bold font-mono text-slate-900" />
                  <span className="text-xs text-slate-500 font-medium">Total Invested</span>
                </div>
              </div>
              <button
                onClick={() => setCurrentTab('partners')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#E06349] hover:text-[#C94E36] transition-colors"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Partner Ledgers</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Proportional Split Bar */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">Yasir ({yasirPct}%)</span>
                <span className="text-slate-700">Saad ({saadPct}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                <div 
                  className="h-full bg-slate-800 rounded-l-full transition-all duration-500" 
                  style={{ width: `${yasirPct}%` }}
                  title={`Yasir: ${yasirPct}%`} 
                />
                <div 
                  className="h-full bg-blue-600 rounded-r-full transition-all duration-500" 
                  style={{ width: `${saadPct}%` }}
                  title={`Saad: ${saadPct}%`}
                />
              </div>
            </div>

            {/* Partner Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Yasir */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold bg-slate-800 text-white shadow-sm">
                    YA
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">Yasir</span>
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-200/70 px-1.5 py-0.2 rounded">
                        {yasirPct}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      Invested {formatPKR(yasirEquity.initial)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Net Equity</span>
                  <AnimatedNumber value={yasirEquity.currentEquity} className="text-sm font-bold font-mono text-slate-900" />
                </div>
              </div>

              {/* Saad */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold bg-blue-600 text-white shadow-sm">
                    SA
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">Saad</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
                        {saadPct}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      Invested {formatPKR(saadEquity.initial)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Net Equity</span>
                  <AnimatedNumber value={saadEquity.currentEquity} className="text-sm font-bold font-mono text-slate-900" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Monthly Expense Budget (5 cols or full width) ── */}
        <div className={`${canViewFinancials && canManagePartners ? 'lg:col-span-5' : 'lg:col-span-12'} rounded-xl border border-slate-200/80 bg-white p-4 md:p-5 shadow-sm flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Monthly Expense Budget
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl md:text-2xl font-bold font-mono text-slate-900">
                    {formatPKR(MONTHLY_BUDGET)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Target Limit</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${statusStyle.badge}`}>
                {budgetStatus === 'over' 
                  ? 'Over Budget' 
                  : budgetStatus === 'critical' 
                  ? 'Critical' 
                  : budgetStatus === 'warning' 
                  ? 'Warning' 
                  : 'Healthy Budget'}
              </span>
            </div>

            {/* Budget Progress Bar */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Progress</span>
                <span className="font-bold text-slate-800 font-mono">{budgetPct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${statusStyle.bar}`}
                  style={{ width: `${Math.min(budgetPct, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3-Column Budget Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            <div className="p-2 rounded-lg bg-slate-50/60 border border-slate-200/60">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Spent</p>
              <p className={`text-xs sm:text-sm font-bold font-mono mt-0.5 ${statusStyle.text}`}>
                {formatPKR(monthlyExpensesTotal)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50/60 border border-slate-200/60">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target</p>
              <p className="text-xs sm:text-sm font-bold font-mono text-slate-700 mt-0.5">
                {formatPKR(MONTHLY_BUDGET)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50/60 border border-slate-200/60">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {budgetRemaining >= 0 ? 'Remaining' : 'Over Limit'}
              </p>
              <p className={`text-xs sm:text-sm font-bold font-mono mt-0.5 ${budgetRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatPKR(Math.abs(budgetRemaining))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ 4. PERFORMANCE CHART & SECONDARY FEED ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* ── Monthly Performance Chart (8 cols) ── */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200/80 bg-white p-4 md:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-slate-500" />
                Financial Performance Trend
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Comparative revenue, expenses, and net profit
              </p>
            </div>

            {/* Time range filters */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/80 overflow-x-auto">
              {(Object.keys(TIME_LABELS) as TimeRange[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setTimeRange(key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all shrink-0 ${
                    timeRange === key
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {TIME_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-64 md:h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="28%" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }} 
                  dy={8} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} 
                  tickLine={false} 
                  axisLine={false} 
                  width={42} 
                />
                <Tooltip
                  cursor={{ fill: 'rgba(15, 23, 42, 0.03)' }}
                  formatter={(val: any, name: any) => [
                    <span key="amount" className="font-mono font-bold text-slate-900">{formatPKR(Number(val))}</span>, 
                    <span key="metric" className="capitalize text-slate-600 font-medium">{name}</span>
                  ]}
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    fontSize: '12px', 
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                    padding: '10px 14px'
                  }}
                />
                <Bar dataKey="Sales" fill="#0F172A" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="Expenses" fill="#E06349" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="Profit" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Clean Legend */}
          <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#0F172A]" /> Sales
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#E06349]" /> Expenses
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#10B981]" /> Net Profit
            </span>
          </div>
        </div>

        {/* ── Secondary Alerts & Inventory Glance (4 cols) ── */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Quick Inventory Stock Glance */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                Inventory Glance
              </h4>
              <button
                onClick={() => setCurrentTab('inventory')}
                className="text-[11px] font-semibold text-[#E06349] hover:underline"
              >
                View Stock
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">IN STOCK</span>
                <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">{stockCount}</span>
                <span className="text-[9px] text-slate-400">units</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">SOLD</span>
                <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">{soldCount}</span>
                <span className="text-[9px] text-slate-400">units</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">EXP. GAIN</span>
                <span className="text-sm font-bold text-emerald-600 font-mono mt-0.5 block">
                  {potentialProfit >= 1000 ? `${Math.round(potentialProfit / 1000)}k` : formatPKR(potentialProfit)}
                </span>
                <span className="text-[9px] text-slate-400">retail margin</span>
              </div>
            </div>
          </div>

          {/* Attention Alerts Feed */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                Requires Attention
              </h4>
              {alerts.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
                  {alerts.length} Pending
                </span>
              )}
            </div>

            {alerts.length === 0 ? (
              <div className="py-5 text-center text-xs text-slate-400">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1 opacity-80" />
                No outstanding inventory or budget alerts.
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      if (a.tab) setCurrentTab(a.tab);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      a.severity === 'danger'
                        ? 'bg-rose-50/70 border-rose-200/80 hover:bg-rose-100/70 text-rose-900'
                        : a.severity === 'warning'
                        ? 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/70 text-amber-900'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="shrink-0 opacity-80">{a.icon}</div>
                      <span className="text-[11px] font-medium leading-tight truncate">{a.text}</span>
                    </div>
                    {a.actionLabel && (
                      <span className="text-[10px] font-bold text-[#E06349] shrink-0 ml-2 hover:underline">
                        {a.actionLabel}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ 5. RECENT ACTIVITY FEED ═══════ */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Recent Operations & Transactions
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real-time audit log of sales, purchases, and expenses
            </p>
          </div>
          <button 
            onClick={() => setCurrentTab('sales')} 
            className="text-xs font-semibold text-[#E06349] flex items-center gap-0.5 hover:underline"
          >
            View All Sales <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivity.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No transactions recorded yet in the database.
            </div>
          ) : (
            recentActivity.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.rawSale) {
                    setSelectedReceipt(item.rawSale);
                  }
                }}
                className={`flex items-center justify-between gap-3 px-4 md:px-5 py-3 transition-colors ${
                  item.rawSale ? 'hover:bg-slate-50/80 cursor-pointer' : 'hover:bg-slate-50/40 cursor-default'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                      item.type === 'income'
                        ? 'bg-emerald-50 border-emerald-200/80 text-emerald-600'
                        : 'bg-rose-50 border-rose-200/80 text-rose-600'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {item.desc}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{formatDate(item.date)}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-500">{item.category}</span>
                      {item.rawSale && (
                        <span className="text-[10px] text-[#E06349] font-semibold underline ml-1">
                          View Receipt
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-bold font-mono ${
                      item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {item.type === 'income' ? '+' : '-'}{formatPKR(item.amount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sale Receipt Modal */}
      <SaleReceiptModal
        sale={selectedReceipt}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}

// ═════════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════════

interface BentoKpiCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon: React.ReactNode;
  iconBg?: string;
  valueColor?: string;
  onClick?: () => void;
  clickableText?: string;
  isCurrency?: boolean;
  badge?: string;
  badgeStyle?: string;
}

function BentoKpiCard({
  label,
  value,
  subtext,
  icon,
  iconBg = 'bg-slate-100 border-slate-200',
  valueColor = 'text-slate-900',
  onClick,
  clickableText,
  isCurrency: _isCurrency = true,
  badge,
  badgeStyle
}: BentoKpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200/80 bg-white p-3.5 md:p-4 shadow-sm transition-all duration-200 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-md active:scale-[0.99]' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
            {label}
          </span>
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${iconBg}`}>
            {icon}
          </div>
        </div>

        <div className="mt-1">
          {typeof value === 'number' ? (
            <AnimatedNumber
              value={value}
              className={`text-lg md:text-xl font-bold font-mono tracking-tight block ${valueColor}`}
            />
          ) : (
            <span className={`text-lg md:text-xl font-bold font-mono tracking-tight block ${valueColor}`}>
              {value}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        {subtext && (
          <span className="text-slate-400 font-medium truncate">
            {subtext}
          </span>
        )}
        {badge && (
          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeStyle}`}>
            {badge}
          </span>
        )}
        {clickableText && !badge && (
          <span className="text-[10px] font-semibold text-[#E06349] hover:underline flex items-center gap-0.5 ml-auto">
            {clickableText} <ArrowUpRight className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
    </div>
  );
}

