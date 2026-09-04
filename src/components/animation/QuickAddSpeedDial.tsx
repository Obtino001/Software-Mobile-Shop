import React, { useState } from 'react';
import { 
  Plus, 
  Zap, 
  ArrowDownLeft, 
  ReceiptText, 
  TrendingUp, 
  ArrowUpRight,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

export function QuickAddSpeedDial() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    openQuickSale, 
    openQuickPurchase, 
    openQuickExpense, 
    setCurrentTab 
  } = useAppStore();
  const { hasPermission } = useAuthStore();

  const canManagePartners = hasPermission('partners:manage');

  const actions = [
    {
      id: 'sell',
      label: 'Sell Mobile (POS)',
      icon: <Zap className="h-4 w-4" />,
      color: 'bg-[#E06349] text-white',
      onClick: () => {
        setIsOpen(false);
        openQuickSale();
      },
    },
    {
      id: 'stock_in',
      label: 'Purchase / Stock In',
      icon: <ArrowDownLeft className="h-4 w-4" />,
      color: 'bg-sky-600 text-white',
      onClick: () => {
        setIsOpen(false);
        openQuickPurchase();
      },
    },
    {
      id: 'expense',
      label: 'Record Expense',
      icon: <ReceiptText className="h-4 w-4" />,
      color: 'bg-rose-500 text-white',
      onClick: () => {
        setIsOpen(false);
        openQuickExpense();
      },
    },
    ...(canManagePartners
      ? [
          {
            id: 'investment',
            label: 'Partner Capital In',
            icon: <TrendingUp className="h-4 w-4" />,
            color: 'bg-emerald-600 text-white',
            onClick: () => {
              setIsOpen(false);
              setCurrentTab('partners');
            },
          },
          {
            id: 'drawings',
            label: 'Partner Withdrawal',
            icon: <ArrowUpRight className="h-4 w-4" />,
            color: 'bg-amber-600 text-white',
            onClick: () => {
              setIsOpen(false);
              setCurrentTab('partners');
            },
          },
        ]
      : []),
  ];

  return (
    <div className="fixed bottom-24 right-3 sm:bottom-6 sm:right-6 z-40 select-none">
      {/* Backdrop — pure opacity, NO blur */}
      <div
        className={cn(
          'fixed inset-0 bg-black/20 z-30 transition-opacity duration-150 ease-out',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Speed dial list */}
      <div className="relative z-40 flex flex-col items-end gap-2.5">
        <div
          className={cn(
            'flex flex-col items-end gap-2 pb-1 transition-all duration-150 ease-out',
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          )}
        >
          {actions.map((action, idx) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex items-center gap-2.5 pl-3.5 pr-2.5 py-2 rounded-2xl bg-white border border-black/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-lg transition-shadow active:scale-95"
              style={{
                transitionDelay: isOpen ? `${idx * 30}ms` : '0ms',
              }}
            >
              <span className="text-xs font-bold text-slate-800 tracking-tight whitespace-nowrap">
                {action.label}
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-sm ${action.color}`}>
                {action.icon}
              </div>
            </button>
          ))}
        </div>

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-13 w-13 items-center justify-center rounded-full bg-[#E06349] text-white shadow-[0_6px_20px_rgba(224,99,73,0.4)] border-2 border-white focus:outline-none active:scale-90 transition-transform duration-150"
          title={isOpen ? 'Close' : 'Quick Actions'}
        >
          <Plus
            className="h-6 w-6 stroke-[2.5] transition-transform duration-200 ease-out"
            style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
          />
        </button>
      </div>
    </div>
  );
}
