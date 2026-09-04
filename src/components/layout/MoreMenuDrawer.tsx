import React from 'react';
import { 
  Users, 
  ReceiptText, 
  Coins, 
  PieChart, 
  Target, 
  Settings, 
  ArrowDownLeft, 
  TrendingUp,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { NavigationTab } from '../../types';
import { Drawer } from '../ui/drawer';
import { formatPKR } from '../../utils/formatters';

interface MoreMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreMenuDrawer({ isOpen, onClose }: MoreMenuDrawerProps) {
  const { currentTab, setCurrentTab, expenses, purchases, getPartnerEquity } = useAppStore();
  const { canAccessTab, hasPermission } = useAuthStore();

  const yasirEquity = getPartnerEquity('Yasir');
  const saadEquity = getPartnerEquity('Saad');
  const canViewFinancials = hasPermission('financials:view');

  const navItems: {
    id: NavigationTab;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
  }[] = [
    {
      id: 'purchases',
      label: 'Purchases (Stock In)',
      description: `${purchases.length} phone purchases recorded`,
      icon: <ArrowDownLeft className="h-5 w-5" />,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      id: 'expenses',
      label: 'Expenses',
      description: `${expenses.length} shop expense records`,
      icon: <ReceiptText className="h-5 w-5" />,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    {
      id: 'partners',
      label: 'Partners & Capital',
      description: 'Yasir & Saad 500K Equity & Drawings',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      badge: '500K',
    },
    {
      id: 'budgets',
      label: 'Monthly Budgets',
      description: 'Sales & profit target progress',
      icon: <Target className="h-5 w-5" />,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      description: 'P&L statements, Brand charts, Valuation',
      icon: <PieChart className="h-5 w-5" />,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'settings',
      label: 'Settings & Data Backup',
      description: 'Shop profile, JSON export/import',
      icon: <Settings className="h-5 w-5" />,
      color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    },
  ];

  // Filter items based on user role permissions
  const visibleNavItems = navItems.filter((item) => canAccessTab(item.id));

  const handleSelect = (tab: NavigationTab) => {
    setCurrentTab(tab);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Shop Modules"
      description="Access management tools & operation logs"
    >
      <div className="space-y-2 pb-2">
        {/* Partner Snapshot Card (Owner ONLY) */}
        {canViewFinancials && (
          <div className="mb-4 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 p-4 text-white shadow-lg border border-emerald-500/20">
            <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                Partner Capital Overview
              </span>
              <span>50% / 50%</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-emerald-500/20">
              <div>
                <p className="text-[10px] text-slate-400">Yasir Net Equity</p>
                <p className="text-sm font-bold text-white">{formatPKR(yasirEquity.currentEquity)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">Saad Net Equity</p>
                <p className="text-sm font-bold text-white">{formatPKR(saadEquity.currentEquity)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modules List */}
        <div className="space-y-1.5">
          {visibleNavItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`flex w-full items-center justify-between p-3.5 rounded-2xl transition-all duration-150 active:scale-98 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50/80 hover:bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            );
          })}
        </div>
      </div>
    </Drawer>
  );
}
