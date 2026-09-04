import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatPKR } from '../../utils/formatters';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/toast';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Edit3 } from 'lucide-react';
import { AnimatedProgressBar } from '../../components/animation/AnimatedProgressBar';
import { AnimatedNumber } from '../../components/animation/AnimatedNumber';

export function BudgetsScreen() {
  const { 
    budget, 
    updateBudget, 
    getMonthlySales, 
    getMonthlyProfit, 
    getMonthlyExpenses 
  } = useAppStore();
  const { success } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [salesTarget, setSalesTarget] = useState(budget.salesTarget);
  const [profitTarget, setProfitTarget] = useState(budget.grossProfitTarget);
  const [expenseLimit, setExpenseLimit] = useState(budget.expenseLimit);

  // Actuals calculated from pure accounting logic
  const currentMonth = budget.month || '2026-09';
  const actualSales = getMonthlySales(currentMonth);
  const actualProfit = getMonthlyProfit(currentMonth);
  const actualExpenses = getMonthlyExpenses(currentMonth);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    updateBudget({
      salesTarget: Number(salesTarget),
      grossProfitTarget: Number(profitTarget),
      expenseLimit: Number(expenseLimit),
    });
    success('Budget Targets Updated');
    setIsEditOpen(false);
  };

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Monthly Budgets & Targets
          </h2>
          <p className="text-xs text-slate-400">
            Performance targets vs actuals for {budget.month}
          </p>
        </div>

        <Button
          onClick={() => {
            setSalesTarget(budget.salesTarget);
            setProfitTarget(budget.grossProfitTarget);
            setExpenseLimit(budget.expenseLimit);
            setIsEditOpen(true);
          }}
          size="sm"
          className="bg-[#E06349] hover:bg-[#D05339] text-white font-bold h-10 px-4 rounded-2xl shadow-sm"
        >
          <Edit3 className="h-4 w-4 mr-1.5" />
          Edit Monthly Targets
        </Button>
      </div>

      {/* Target Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sales Target */}
        <Card className="p-5 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sales Target</span>
            <span className="text-xs font-black text-[#E06349]">
              Goal: {formatPKR(budget.salesTarget)}
            </span>
          </div>

          <div className="mb-2">
            <AnimatedNumber
              value={actualSales}
              className="text-xl font-bold text-slate-900"
            />
          </div>

          {/* Animated Progress Bar */}
          <AnimatedProgressBar
            value={actualSales}
            max={budget.salesTarget}
            showPercentage={true}
          />
          <p className="text-[11px] text-slate-400 mt-2">
            Remaining: {formatPKR(Math.max(0, budget.salesTarget - actualSales))}
          </p>
        </Card>

        {/* Profit Target */}
        <Card className="p-5 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Profit Target</span>
            <span className="text-xs font-black text-sky-600">
              Goal: {formatPKR(budget.grossProfitTarget)}
            </span>
          </div>

          <div className="mb-2">
            <AnimatedNumber
              value={actualProfit}
              className="text-xl font-bold text-slate-900"
            />
          </div>

          <AnimatedProgressBar
            value={actualProfit}
            max={budget.grossProfitTarget}
            showPercentage={true}
          />
          <p className="text-[11px] text-slate-400 mt-2">
            Remaining: {formatPKR(Math.max(0, budget.grossProfitTarget - actualProfit))}
          </p>
        </Card>

        {/* Expense Cap */}
        <Card className="p-5 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expense Cap Limit</span>
            <span className="text-xs font-black text-slate-500">
              Limit: {formatPKR(budget.expenseLimit)}
            </span>
          </div>

          <div className="mb-2">
            <AnimatedNumber
              value={actualExpenses}
              className="text-xl font-bold text-slate-900"
            />
          </div>

          <AnimatedProgressBar
            value={actualExpenses}
            max={budget.expenseLimit}
            showPercentage={true}
            criticalThreshold={85}
          />
          <p className="text-[11px] text-slate-400 mt-2">
            Budget buffer left: {formatPKR(Math.max(0, budget.expenseLimit - actualExpenses))}
          </p>
        </Card>
      </div>

      {/* Advisory Note */}
      <Card className="p-4 rounded-3xl border border-black/[0.08] bg-[#FAFAFA]">
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 text-[#E06349] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900">Partner Profit-Sharing Advisory</p>
            <p className="text-[11px] text-slate-500">
              Budget targets guide monthly drawings and partner profit allocations. Keeping expenses below PKR {budget.expenseLimit?.toLocaleString()} ensures maximum capital retention for high-velocity phone inventory turnover.
            </p>
          </div>
        </div>
      </Card>

      {/* Edit Budget Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Monthly Performance Targets"
        description={`Set target goals for ${budget.month}`}
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <Input
            label="Monthly Sales Turnover Target"
            type="number"
            value={salesTarget}
            onChange={(e) => setSalesTarget(Number(e.target.value))}
            prefixText="PKR"
            required
          />

          <Input
            label="Monthly Gross Profit Target"
            type="number"
            value={profitTarget}
            onChange={(e) => setProfitTarget(Number(e.target.value))}
            prefixText="PKR"
            required
          />

          <Input
            label="Monthly Expense Cap Limit"
            type="number"
            value={expenseLimit}
            onChange={(e) => setExpenseLimit(Number(e.target.value))}
            prefixText="PKR"
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Targets
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
