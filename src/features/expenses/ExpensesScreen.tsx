import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatPKR, formatDate, getExpenseCategoryLabel } from '../../utils/formatters';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import {
  Plus,
  Search,
  ReceiptText,
  Trash2,
  Coffee,
  AlertTriangle,
  TrendingUp,
  Filter,
  Calendar
} from 'lucide-react';
import { ExpenseCategory } from '../../types';
import { AnimatedNumber } from '../../components/animation/AnimatedNumber';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';

export function ExpensesScreen() {
  const { expenses, settings, openQuickExpense, deleteExpense } = useAppStore();
  const { hasPermission } = useAuthStore();
  const { success } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('this_month');
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const canDeleteExpense = hasPermission('expenses:delete');

  const MONTHLY_BUDGET = settings?.monthlyExpenseTarget || 20000;
  const categoryBudgets = settings?.categoryBudgets || {};

  // Time calculations
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const isInMonth = (dateStr: string, monthKey: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthKey;
    } catch {
      return false;
    }
  };

  // ─── Filtered lists ───
  const thisMonthExpenses = useMemo(() => expenses.filter(e => isInMonth(e.date, thisMonthKey)), [expenses, thisMonthKey]);
  const lastMonthExpenses = useMemo(() => expenses.filter(e => isInMonth(e.date, lastMonthKey)), [expenses, lastMonthKey]);
  
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // ─── Budget Status ───
  const budgetPct = MONTHLY_BUDGET > 0 ? Math.round((thisMonthTotal / MONTHLY_BUDGET) * 100) : 0;
  let statusStyle = { bar: 'bg-emerald-500', text: 'text-emerald-600', label: 'Healthy' };
  if (budgetPct >= 100) statusStyle = { bar: 'bg-rose-600', text: 'text-rose-700', label: 'Over Budget' };
  else if (budgetPct >= 90) statusStyle = { bar: 'bg-rose-500', text: 'text-rose-600', label: 'Critical' };
  else if (budgetPct >= 70) statusStyle = { bar: 'bg-amber-500', text: 'text-amber-600', label: 'Warning' };

  // ─── Category Breakdown (This Month) ───
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    thisMonthExpenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.entries(totals)
      .map(([cat, amount]) => ({ cat, amount, budget: categoryBudgets[cat] || 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [thisMonthExpenses, categoryBudgets]);

  // ─── Chart Data (Top 5 Categories) ───
  const chartData = categoryTotals.slice(0, 5).map(item => ({
    name: item.cat,
    Amount: item.amount,
  }));
  const chartColors = ['#E06349', '#f59e0b', '#3b82f6', '#10b981', '#6366f1'];

  // ─── List Filtering ───
  const displayedExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = selectedCat === 'all' || e.category === selectedCat;
      const matchesMonth = selectedMonth === 'all' || 
                           (selectedMonth === 'this_month' && isInMonth(e.date, thisMonthKey)) ||
                           (selectedMonth === 'last_month' && isInMonth(e.date, lastMonthKey));
      return matchesSearch && matchesCat && matchesMonth;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchQuery, selectedCat, selectedMonth, thisMonthKey, lastMonthKey]);

  // Unique categories for filter dropdown
  const allUsedCategories = Array.from(new Set(expenses.map(e => e.category)));

  const handleDelete = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete);
      success('Expense deleted');
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="space-y-3 md:space-y-4 pb-8 select-none">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
            Expenses
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Daily overheads & bills
          </p>
        </div>
        <button
          onClick={openQuickExpense}
          className="h-9 px-3 md:px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-[0_4px_12px_rgba(225,29,72,0.25)] transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Quick Expense</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* ═══════ INTELLIGENT WARNINGS ═══════ */}
      {budgetPct >= 90 && (
        <div className={`flex items-center gap-3 p-3.5 rounded-2xl border text-xs font-medium ${
          budgetPct >= 100 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <AlertTriangle className={`h-5 w-5 shrink-0 ${budgetPct >= 100 ? 'text-rose-600' : 'text-amber-600'}`} />
          <span>
            {budgetPct >= 100 
              ? `You have exceeded this month's budget by ${formatPKR(thisMonthTotal - MONTHLY_BUDGET)}.` 
              : `Watch spending! You have used ${budgetPct}% of this month's expense budget.`}
          </span>
        </div>
      )}

      {/* ═══════ OVERALL MONTHLY PROGRESS ═══════ */}
      <div className="rounded-2xl md:rounded-3xl border border-black/[0.08] bg-white p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This Month</p>
          <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
            Budget: {formatPKR(MONTHLY_BUDGET)}
          </span>
        </div>
        
        <div className="w-full h-2.5 md:h-3 rounded-full bg-slate-100 overflow-hidden mb-2.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${statusStyle.bar}`}
            style={{ width: `${Math.min(budgetPct, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-slate-400 font-medium">Spent</p>
            <AnimatedNumber value={thisMonthTotal} className={`text-lg md:text-2xl font-bold font-mono ${statusStyle.text}`} />
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-medium">{budgetPct >= 100 ? 'Over By' : 'Left'}</p>
            <AnimatedNumber 
              value={Math.abs(MONTHLY_BUDGET - thisMonthTotal)} 
              className={`text-lg md:text-2xl font-bold font-mono ${budgetPct >= 100 ? 'text-rose-600' : 'text-emerald-600'}`} 
            />
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="mt-3 pt-2.5 border-t border-black/[0.04] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="h-3 w-3" />
            <span>Last: <b className="text-slate-700 font-mono">{formatPKR(lastMonthTotal)}</b></span>
          </div>
          {thisMonthTotal > 0 && lastMonthTotal > 0 && (
            <div className={`flex items-center gap-1 font-bold ${thisMonthTotal > lastMonthTotal ? 'text-rose-500' : 'text-emerald-500'}`}>
              <TrendingUp className={`h-3 w-3 ${thisMonthTotal <= lastMonthTotal ? 'rotate-180' : ''}`} />
              {Math.abs(Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100))}%
            </div>
          )}
        </div>
      </div>

      {/* ═══════ CATEGORY & CHART SECTION ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category breakdown */}
        <div className="rounded-3xl border border-black/[0.08] bg-white p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Category Breakdown (This Month)</p>
          <div className="space-y-4">
            {categoryTotals.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No expenses recorded this month.</p>
            ) : (
              categoryTotals.map(item => {
                const catPct = item.budget > 0 ? Math.round((item.amount / item.budget) * 100) : 0;
                const overCat = item.amount > item.budget && item.budget > 0;
                return (
                  <div key={item.cat}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-700">{item.cat}</span>
                      <span className="font-mono text-slate-900 font-bold">{formatPKR(item.amount)}</span>
                    </div>
                    {item.budget > 0 && (
                      <>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-1">
                          <div
                            className={`h-full rounded-full ${overCat ? 'bg-rose-500' : 'bg-sky-500'}`}
                            style={{ width: `${Math.min(catPct, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400">Budget: {formatPKR(item.budget)}</span>
                          {overCat ? (
                            <span className="text-rose-500 font-bold">Over by {formatPKR(item.amount - item.budget)}</span>
                          ) : (
                            <span className="text-emerald-600">Remaining: {formatPKR(item.budget - item.amount)}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Highest spending chart */}
        <div className="rounded-3xl border border-black/[0.08] bg-white p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Highest Spending Categories</p>
          {chartData.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No data to chart</p>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} stroke="#64748b" width={70} />
                  <Tooltip
                    formatter={(val: any, name: any) => [formatPKR(Number(val)), 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '11px' }}
                  />
                  <Bar dataKey="Amount" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ EXPENSE HISTORY & FILTERS ═══════ */}
      <div className="rounded-2xl md:rounded-3xl border border-black/[0.08] bg-white">
        <div className="p-3 md:p-5 border-b border-black/[0.04]">
          <h3 className="text-[13px] font-bold text-slate-900 mb-2.5">History</h3>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-xl border border-black/[0.08] bg-[#FAFAFA] text-xs focus:border-[#E06349] focus:ring-1 focus:ring-[#E06349] transition-all"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {(['this_month', 'last_month', 'all'] as const).map(m => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${selectedMonth === m ? 'bg-slate-900 text-white' : 'bg-[#FAFAFA] text-slate-500 border border-black/[0.06]'}`}
              >
                {m === 'this_month' ? 'This Month' : m === 'last_month' ? 'Last Month' : 'All Time'}
              </button>
            ))}
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="h-[26px] px-2 rounded-lg border border-black/[0.06] bg-[#FAFAFA] text-[10px] font-bold text-slate-600 outline-none shrink-0"
            >
              <option value="all">All Types</option>
              {allUsedCategories.map(c => (
                <option key={c} value={c}>{getExpenseCategoryLabel(c as ExpenseCategory)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="divide-y divide-black/[0.04]">
          {displayedExpenses.length === 0 ? (
            <div className="py-12 text-center">
              <ReceiptText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">No expenses found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or record a new expense.</p>
            </div>
          ) : (
            displayedExpenses.map((expense) => (
              <div key={expense.id} className="px-3 md:px-4 py-2.5 hover:bg-[#FAFAFA] transition-colors flex items-center justify-between gap-2.5 group">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-500">
                    {expense.category === 'Food' ? <Coffee className="h-3.5 w-3.5" /> : <ReceiptText className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-slate-900 truncate">{expense.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {formatDate(expense.date)} • {getExpenseCategoryLabel(expense.category)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-[13px] font-bold text-slate-900 font-mono">{formatPKR(expense.amount)}</p>
                  
                  {canDeleteExpense && (
                    <button
                      onClick={() => setExpenseToDelete(expense.id)}
                      className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Expense Record"
        message="Are you sure you want to delete this expense? This will restore the balance to your account."
        confirmText="Delete Expense"
      />
    </div>
  );
}
