import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, Smartphone, Zap, ArrowDownLeft, ReceiptText, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { Button } from './button';
import { getRoleBadge } from '../../lib/permissions';

interface UnauthorizedScreenProps {
  moduleName?: string;
}

export function UnauthorizedScreen({ moduleName }: UnauthorizedScreenProps) {
  const { partnerName, role, switchRoleForTesting } = useAuthStore();
  const { setCurrentTab } = useAppStore();

  const roleInfo = getRoleBadge(role);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center select-none">
      <div className="max-w-md w-full rounded-3xl border border-amber-500/20 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-amber-500/20 dark:bg-slate-900/80 space-y-6">
        {/* Animated Shield / Lock Icon */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
          <ShieldAlert className="h-10 w-10 animate-bounce" />
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-amber-400 shadow-md">
            <Lock className="h-4 w-4" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Lock className="h-3 w-3" />
            Security Guard • Protected Module
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {moduleName ? `The "${moduleName}" module` : 'This section'} contains sensitive financial records, capital balances, or system controls reserved exclusively for the <strong>Owner (Yasir)</strong>.
          </p>
        </div>

        {/* Current Active Account Status */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Current User:</span>
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                {partnerName.charAt(0)}
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-100">{partnerName}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Assigned Role:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${roleInfo.badgeClass}`}>
              {roleInfo.label}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
            {roleInfo.description}
          </p>
        </div>

        {/* Available Modules for Manager */}
        <div className="text-left space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Available to {partnerName}:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setCurrentTab('inventory')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500/40 bg-white dark:bg-slate-800/40 dark:border-slate-700/60 hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-300 font-semibold"
            >
              <Smartphone className="h-4 w-4 text-emerald-500" />
              <span>Stock Inventory</span>
            </button>
            <button
              onClick={() => setCurrentTab('sales')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500/40 bg-white dark:bg-slate-800/40 dark:border-slate-700/60 hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-300 font-semibold"
            >
              <Zap className="h-4 w-4 text-emerald-500" />
              <span>Sales POS</span>
            </button>
            <button
              onClick={() => setCurrentTab('purchases')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-blue-500/40 bg-white dark:bg-slate-800/40 dark:border-slate-700/60 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-300 font-semibold"
            >
              <ArrowDownLeft className="h-4 w-4 text-blue-500" />
              <span>Stock Purchases</span>
            </button>
            <button
              onClick={() => setCurrentTab('expenses')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-rose-500/40 bg-white dark:bg-slate-800/40 dark:border-slate-700/60 hover:bg-rose-50/50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-300 font-semibold"
            >
              <ReceiptText className="h-4 w-4 text-rose-500" />
              <span>Shop Expenses</span>
            </button>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 flex flex-col gap-2">
          <Button
            onClick={() => setCurrentTab('dashboard')}
            variant="primary"
            className="w-full h-11 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <LayoutDashboard className="h-4 w-4" />
            Return to Dashboard
          </Button>

          {/* Developer / Tester shortcut to test Yasir Owner account */}
          <button
            type="button"
            onClick={() => {
              switchRoleForTesting('owner', 'Yasir');
            }}
            className="text-[11px] text-slate-400 hover:text-emerald-500 hover:underline py-1 transition-colors"
          >
            (Testing: Switch to Yasir Owner Account)
          </button>
        </div>
      </div>
    </div>
  );
}
