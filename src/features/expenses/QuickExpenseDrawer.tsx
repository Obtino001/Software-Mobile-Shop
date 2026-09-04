import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Drawer } from '../../components/ui/drawer';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { ExpenseCategory, AccountType } from '../../types';
import { formatPKR } from '../../utils/formatters';
import {
  Coffee,
  Droplets,
  Home,
  Zap,
  Wifi,
  Car,
  Package,
  Wrench,
  Headphones,
  Megaphone,
  Briefcase,
  MoreHorizontal,
  Check
} from 'lucide-react';

const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'Food', label: 'Food/Tea', icon: <Coffee className="h-6 w-6" />, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'Water', label: 'Water', icon: <Droplets className="h-6 w-6" />, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { id: 'Transport', label: 'Transport', icon: <Car className="h-6 w-6" />, color: 'text-slate-600 bg-slate-100 border-slate-300' },
  { id: 'Electricity', label: 'Electric', icon: <Zap className="h-6 w-6" />, color: 'text-yellow-600 bg-yellow-50 border-yellow-300' },
  { id: 'Internet', label: 'Internet', icon: <Wifi className="h-6 w-6" />, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { id: 'Rent', label: 'Rent', icon: <Home className="h-6 w-6" />, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'Packaging', label: 'Package', icon: <Package className="h-6 w-6" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'Marketing', label: 'Marketing', icon: <Megaphone className="h-6 w-6" />, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'Repair', label: 'Repair', icon: <Wrench className="h-6 w-6" />, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'Accessories', label: 'Accessory', icon: <Headphones className="h-6 w-6" />, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'Salary', label: 'Salary', icon: <Briefcase className="h-6 w-6" />, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { id: 'Other', label: 'Other', icon: <MoreHorizontal className="h-6 w-6" />, color: 'text-slate-500 bg-slate-50 border-slate-200' },
];

export function QuickExpenseDrawer() {
  const { isQuickExpenseOpen, closeQuickExpense, addExpense } = useAppStore();
  const { success, error } = useToast();

  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Advanced options hidden by default for speed
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [title, setTitle] = useState<string>('');
  const [paidFrom, setPaidFrom] = useState<AccountType>('cash');
  const [paidBy, setPaidBy] = useState<'Yasir' | 'Saad'>('Yasir');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      error('Please enter a valid amount');
      return;
    }

    const res = await addExpense({
      title: title.trim() || `${category} Expense`,
      amount: numAmount,
      category,
      paidFrom,
      paidBy,
      notes,
    });

    if (!res.success) {
      error('Expense Failed', res.error || "Couldn't save this entry.");
      return;
    }

    success('Expense Recorded', `${formatPKR(numAmount)} for ${category}`);

    // Reset
    setCategory('Food');
    setAmount('');
    setNotes('');
    setTitle('');
    setShowAdvanced(false);
  };

  return (
    <Drawer
      isOpen={isQuickExpenseOpen}
      onClose={closeQuickExpense}
      title="Quick Expense"
      description="Select category and enter amount"
      maxWidth="md"
      footer={
        <div className="flex w-full gap-2.5">
          <Button variant="secondary" className="flex-1" onClick={closeQuickExpense}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => handleSubmit()}>
            Save Expense
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Category Selection Grid (Large Tap Targets) */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 block">
            Select Category
          </label>
          <div className="grid grid-cols-4 gap-2">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all active:scale-95 ${
                  category === cat.id
                    ? `${cat.color} shadow-sm ring-2 ring-offset-1 ring-current`
                    : 'bg-white border-black/[0.08] text-slate-400 hover:border-black/[0.15]'
                }`}
              >
                <div className={`mb-1.5 ${category === cat.id ? '' : 'opacity-70'}`}>
                  {cat.icon}
                </div>
                <span className={`text-[9px] font-bold ${category === cat.id ? '' : 'text-slate-600'}`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
            Expense Amount (PKR)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">
              Rs
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full h-14 pl-12 pr-4 rounded-2xl border border-black/[0.08] bg-[#FAFAFA] text-2xl font-bold font-mono text-slate-900 focus:border-[#E06349] focus:ring-1 focus:ring-[#E06349] transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
            />
          </div>
        </div>

        {/* Optional Note */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
            Note (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Lunch for staff"
            className="w-full h-11 px-4 rounded-xl border border-black/[0.08] bg-[#FAFAFA] text-sm text-slate-900 focus:border-[#E06349] focus:ring-1 focus:ring-[#E06349] transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
          />
        </div>

        {/* Toggle Advanced */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[11px] font-bold text-[#E06349] hover:underline"
        >
          {showAdvanced ? '- Hide Details' : '+ Paid By / Account Details'}
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-black/[0.04] animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Paid From Account
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaidFrom('cash')}
                  className={`flex-1 h-10 rounded-xl border text-xs font-bold transition-all ${
                    paidFrom === 'cash' ? 'bg-[#141414] text-white border-transparent' : 'bg-white border-black/[0.08] text-slate-600'
                  }`}
                >
                  Cash Counter
                </button>
                <button
                  type="button"
                  onClick={() => setPaidFrom('bank')}
                  className={`flex-1 h-10 rounded-xl border text-xs font-bold transition-all ${
                    paidFrom === 'bank' ? 'bg-[#141414] text-white border-transparent' : 'bg-white border-black/[0.08] text-slate-600'
                  }`}
                >
                  Bank / Raast
                </button>
              </div>
            </div>
            
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Paid By
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaidBy('Yasir')}
                  className={`flex-1 h-10 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    paidBy === 'Yasir' ? 'bg-[#E06349]/10 text-[#E06349] border-[#E06349]/20' : 'bg-white border-black/[0.08] text-slate-600'
                  }`}
                >
                  {paidBy === 'Yasir' && <Check className="h-3 w-3" />} Yasir
                </button>
                <button
                  type="button"
                  onClick={() => setPaidBy('Saad')}
                  className={`flex-1 h-10 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    paidBy === 'Saad' ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-white border-black/[0.08] text-slate-600'
                  }`}
                >
                  {paidBy === 'Saad' && <Check className="h-3 w-3" />} Saad
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
