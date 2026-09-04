import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatPKR, formatDate, getPtaLabel, getExpenseCategoryLabel } from '../../utils/formatters';
import { AnimatedNumber } from '../../components/animation/AnimatedNumber';
import { AnimatedProgressBar } from '../../components/animation/AnimatedProgressBar';
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
  Landmark,
  Smartphone,
  TrendingUp,
  Zap,
  ArrowDownLeft,
  ReceiptText,
  ArrowRight,
  AlertTriangle,
  Clock,
  ShoppingBag,
  DollarSign,
  Users,
  Package,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';

// ─── Status semantic helpers (not hardcoded colors) ───
type BudgetStatus = 'healthy' | 'warning' | 'critical' | 'over';

function getBudgetStatus(pct: number): BudgetStatus {
  if (pct > 100) return 'over';
  if (pct >= 90) return 'critical';
  if (pct >= 70) return 'warning';
  return 'healthy';
}

const STATUS_STYLES: Record<BudgetStatus, { bar: string; badge: string; text: string }> = {
  healthy: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600' },
  warning: { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600' },
  critical: { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-600' },
  over: { bar: 'bg-rose-600', badge: 'bg-rose-100 text-rose-800 border-rose-300', text: 'text-rose-700' },
};

// ─── Time range types ───
type TimeRange = 'this_month' | 'last_month' | 'last_3' | 'last_6' | 'this_year';

const TIME_LABELS: Record<TimeRange, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  last_3: 'Last 3 Months',
  last_6: 'Last 6 Months',
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
  return `${months[parseInt(m) - 1]} ${y.slice(-2)}`;
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
// DASHBOARD SCREEN
// ═════════════════════════════════════════
export function DashboardScreen() {
  const {
    phones,
    sales,
    purchases,
    expenses,
    partners,
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
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');

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
  const potentialProfit = stockRetail - stockCost;

  const yasirEquity = getPartnerEquity('Yasir');
  const saadEquity = getPartnerEquity('Saad');
  const totalCapital = yasirEquity.initial + saadEquity.initial;
  const yasirPct = totalCapital > 0 ? Math.round((yasirEquity.initial / totalCapital) * 100) : 50;
  const saadPct = 100 - yasirPct;

  const inStockPhones = useMemo(
    () => phones.filter((p) => p.status === 'In Stock' || (p.status as string) === 'in_stock'),
    [phones]
  );

  // ── Monthly expense budget (default PKR 20,000) ──
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
    const items: { icon: React.ReactNode; text: string; severity: 'warning' | 'danger' | 'info' }[] = [];

    // Phones with no selling price
    const noPrice = inStockPhones.filter((p) => !p.sellingPrice || p.sellingPrice <= 0);
    if (noPrice.length > 0) {
      items.push({ icon: <DollarSign className="h-4 w-4" />, text: `${noPrice.length} phone(s) have no selling price set`, severity: 'warning' });
    }

    // Aging stock (>14 days)
    const aging = inStockPhones.filter((p) => {
      const days = (Date.now() - new Date(p.purchaseDate).getTime()) / (1000 * 3600 * 24);
      return days > 14;
    });
    if (aging.length > 0) {
      items.push({ icon: <Clock className="h-4 w-4" />, text: `${aging.length} phone(s) in stock for over 14 days`, severity: 'warning' });
    }

    // Budget exceeded
    if (budgetStatus === 'over') {
      items.push({ icon: <AlertTriangle className="h-4 w-4" />, text: `Monthly expense budget exceeded by ${formatPKR(Math.abs(budgetRemaining))}`, severity: 'danger' });
    }

    // Low cash
    if (cashInHand < 5000 && cashInHand >= 0) {
      items.push({ icon: <Wallet className="h-4 w-4" />, text: `Cash counter is low: ${formatPKR(cashInHand)}`, severity: 'info' });
    }

    // Reserved phones
    const reserved = phones.filter((p) => p.status === 'Reserved' || (p.status as string) === 'booked_token');
    if (reserved.length > 0) {
      items.push({ icon: <Package className="h-4 w-4" />, text: `${reserved.length} phone(s) are reserved / token booked`, severity: 'info' });
    }

    return items;
  }, [inStockPhones, phones, budgetStatus, budgetRemaining, cashInHand]);

  // ── Recent activity feed (merged & sorted) ──
  const recentActivity = useMemo(() => {
    type Activity = { id: string; icon: React.ReactNode; desc: string; amount: number; date: string; type: 'income' | 'expense' | 'neutral'; category: string };
    const items: Activity[] = [];

    sales.slice(0, 10).forEach((s) => {
      items.push({
        id: `s-${s.id}`,
        icon: <Zap className="h-3.5 w-3.5" />,
        desc: `Sold ${s.phoneSnapshot?.brand || ''} ${s.phoneSnapshot?.model || 'Phone'} to ${s.customerName}`,
        amount: s.sellingPrice || s.salePrice || 0,
        date: s.date,
        type: 'income',
        category: 'Sale',
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
        category: 'Purchase',
      });
    });

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items.slice(0, 8);
  }, [sales, expenses, purchases]);

  return (
    <div className="space-y-3 md:space-y-4 pb-8 select-none">

      {/* ═══════ GREETING ═══════ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {partnerName || 'Partner'} 👋
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3" />
            {getCurrentDateStr()}
          </p>
        </div>
        <button
          onClick={() => openQuickPurchase()}
          className="h-9 px-3 rounded-2xl bg-[#E06349] hover:bg-[#D05339] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Quick Add</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* ═══════ HERO CARD — Cash + Net Profit ═══════ */}
      {canViewFinancials && (
        <div 
          className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-5 text-white shadow-lg border border-white/5 cursor-pointer active:scale-[0.99] transition-transform"
          onClick={() => setCurrentTab('cash')}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Cash in Hand</p>
              <p className="text-xl md:text-2xl font-bold font-mono text-white leading-tight">
                {formatPKR(cashInHand)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Bank: {formatPKR(bankBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Net Profit</p>
              <p className={`text-xl md:text-2xl font-bold font-mono leading-tight ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPKR(netProfit)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Stock: {stockCount} phones
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ KPI GRID (4 cards, 2x2) ═══════ */}
      <div className="grid grid-cols-2 gap-2 md:gap-2.5">
        <KpiMini label="Total Sales" value={totalSales} icon={<ShoppingBag className="h-4 w-4" />} onClick={() => setCurrentTab('sales')} />
        <KpiMini label="Gross Profit" value={grossProfit} icon={<TrendingUp className="h-4 w-4" />} accent />
        <KpiMini label="Expenses" value={totalExpenses} icon={<ReceiptText className="h-4 w-4" />} onClick={() => setCurrentTab('expenses')} negative />
        <KpiMini label="Stock Value" value={stockCost} icon={<Smartphone className="h-4 w-4" />} onClick={() => setCurrentTab('inventory')} />
      </div>

      {/* ═══════ CAPITAL CARD (Owner only — HIDDEN on mobile) ═══════ */}
      {canViewFinancials && canManagePartners && (
        <div className="hidden md:block rounded-3xl border border-black/[0.08] bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Capital Invested</p>
              <AnimatedNumber value={totalCapital} className="text-xl font-bold text-slate-900" />
            </div>
            <button
              onClick={() => setCurrentTab('partners')}
              className="text-[11px] font-semibold text-[#E06349] flex items-center gap-0.5 hover:underline"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Ledgers</span>
            </button>
          </div>

          {/* Visual split bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex mb-3">
            <div className="h-full bg-[#E06349] rounded-l-full transition-all duration-500" style={{ width: `${yasirPct}%` }} />
            <div className="h-full bg-sky-500 rounded-r-full transition-all duration-500" style={{ width: `${saadPct}%` }} />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#FAFAFA] border border-black/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Yasir</span>
                <span className="text-[10px] font-bold text-[#E06349] bg-[#E06349]/10 px-1.5 py-0.5 rounded-full">{yasirPct}%</span>
              </div>
              <AnimatedNumber value={yasirEquity.currentEquity} className="text-sm font-bold text-slate-800 mt-1 block" />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Invested {formatPKR(yasirEquity.initial)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAFAFA] border border-black/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Saad</span>
                <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">{saadPct}%</span>
              </div>
              <AnimatedNumber value={saadEquity.currentEquity} className="text-sm font-bold text-slate-800 mt-1 block" />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Invested {formatPKR(saadEquity.initial)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MONTHLY EXPENSE BUDGET (compact on mobile) ═══════ */}
      <div className="rounded-2xl md:rounded-3xl border border-black/[0.08] bg-white p-4 md:p-5">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Budget</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle.badge}`}>
            {budgetStatus === 'over' ? 'Over Budget' : budgetStatus === 'critical' ? 'Critical' : budgetStatus === 'warning' ? 'Warning' : 'Healthy'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 md:h-3 rounded-full bg-slate-100 overflow-hidden mb-2.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${statusStyle.bar}`}
            style={{ width: `${Math.min(budgetPct, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-slate-400 font-medium">Spent</p>
            <p className={`text-sm font-bold font-mono ${statusStyle.text}`}>{formatPKR(monthlyExpensesTotal)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">Budget</p>
            <p className="text-sm font-bold font-mono text-slate-700">{formatPKR(MONTHLY_BUDGET)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">{budgetRemaining >= 0 ? 'Left' : 'Over'}</p>
            <p className={`text-sm font-bold font-mono ${budgetRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatPKR(Math.abs(budgetRemaining))}
            </p>
          </div>
        </div>
      </div>

      {/* ═══════ MONTHLY PERFORMANCE CHART ═══════ */}
      <div className="rounded-2xl md:rounded-3xl border border-black/[0.08] bg-white p-4 md:p-5">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance</p>
        </div>
        {/* Time range pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
          {(Object.keys(TIME_LABELS) as TimeRange[]).map((key) => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-xl text-[10px] md:text-[11px] font-bold transition-all shrink-0 ${
                timeRange === key
                  ? 'bg-[#141414] text-white shadow-sm'
                  : 'bg-[#FAFAFA] text-slate-500 border border-black/[0.06] hover:bg-slate-100'
              }`}
            >
              {TIME_LABELS[key]}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-56 md:h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="25%" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} 
                tickLine={false} 
                axisLine={false} 
                width={40} 
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                formatter={(val: any, name: any) => [
                  <span className="font-mono font-bold">{formatPKR(Number(val))}</span>, 
                  <span className="capitalize">{name}</span>
                ]}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(0,0,0,0.06)', 
                  fontSize: '12px', 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  backdropFilter: 'blur(8px)',
                  padding: '12px'
                }}
              />
              <Bar dataKey="Sales" fill="#141414" radius={[6, 6, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Expenses" fill="#E06349" radius={[6, 6, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Profit" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-1 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#141414]" /> Sales</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#E06349]" /> Expenses</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Profit</span>
        </div>
      </div>

      {/* ═══════ ALERTS (compact) ═══════ */}
      {alerts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attention</p>
          {alerts.map((a, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2.5 p-3 rounded-2xl border text-[11px] font-medium ${
                a.severity === 'danger'
                  ? 'bg-rose-50/60 border-rose-200/60 text-rose-800'
                  : a.severity === 'warning'
                  ? 'bg-amber-50/60 border-amber-200/60 text-amber-800'
                  : 'bg-sky-50/60 border-sky-200/60 text-sky-800'
              }`}
            >
              <div className="shrink-0 opacity-70">{a.icon}</div>
              <span className="leading-tight">{a.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══════ RECENT ACTIVITY FEED ═══════ */}
      <div className="rounded-2xl md:rounded-3xl border border-black/[0.08] bg-white">
        <div className="flex items-center justify-between px-4 md:px-5 pt-3 pb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Activity</p>
          <button onClick={() => setCurrentTab('sales')} className="text-[11px] font-semibold text-[#E06349] flex items-center gap-0.5 hover:underline">
            View All <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {recentActivity.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8 px-5">No transactions recorded yet</p>
          ) : (
            recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 px-4 md:px-5 py-2.5 hover:bg-[#FAFAFA] transition-colors cursor-default"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                    item.type === 'income'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      : 'bg-rose-50 border-rose-200 text-rose-500'
                  }`}
                >
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-800 truncate">{item.desc}</p>
                  <p className="text-[10px] text-slate-400">{formatDate(item.date)} • {item.category}</p>
                </div>
                <span
                  className={`text-[12px] font-bold font-mono shrink-0 ${
                    item.type === 'income' ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {item.type === 'income' ? '+' : '-'}{formatPKR(item.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Receipt modal */}
      <SaleReceiptModal
        sale={selectedReceipt}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}

// ═══ Sub-components (private to this file) ═══

function KpiMini({ label, value, icon, onClick, accent, negative }: {
  label: string; value: number; icon: React.ReactNode; onClick?: () => void; accent?: boolean; negative?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-black/[0.08] bg-white p-3 md:p-3.5 transition-all ${onClick ? 'cursor-pointer hover:border-black/[0.18] active:scale-[0.98]' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="text-slate-400">{icon}</div>
      </div>
      <AnimatedNumber
        value={value}
        className={`text-lg md:text-xl font-bold tracking-tight ${
          accent ? 'text-[#E06349]' : negative ? 'text-rose-600' : 'text-slate-900'
        }`}
      />
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-black/[0.04] text-center">
      <p className="text-[10px] text-slate-400 font-medium">{label}</p>
      <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">{value}</p>
      {sub && <p className="text-[9px] text-slate-400">{sub}</p>}
    </div>
  );
}

function QuickAction({ label, sub, icon, color, onClick }: {
  label: string; sub: string; icon: React.ReactNode; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-2xl border border-black/[0.08] bg-white hover:border-black/[0.18] active:scale-[0.97] text-left transition-all"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <span className="text-xs font-bold text-slate-900 block truncate">{label}</span>
        <span className="text-[10px] text-slate-400 block truncate">{sub}</span>
      </div>
    </button>
  );
}
