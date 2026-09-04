import React from 'react';
import { 
  LayoutDashboard, 
  Smartphone, 
  ArrowDownLeft, 
  Zap, 
  ReceiptText, 
  Wallet, 
  Users, 
  Target, 
  PieChart, 
  Settings,
  CircleDot
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { NavigationTab } from '../../types';
import { getRoleBadge } from '../../lib/permissions';

export function DesktopSidebar() {
  const { currentTab, setCurrentTab, getStockCount } = useAppStore();
  const { canAccessTab, partnerName, role } = useAuthStore();

  const inStockCount = getStockCount();
  const roleInfo = getRoleBadge(role);

  const allNavigationItems: {
    id: NavigationTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'inventory', label: 'Mobile Inventory', icon: <Smartphone className="h-4 w-4" />, badge: inStockCount > 0 ? inStockCount : undefined },
    { id: 'sales', label: 'Sales & POS', icon: <Zap className="h-4 w-4" /> },
    { id: 'purchases', label: 'Stock Purchases', icon: <ArrowDownLeft className="h-4 w-4" /> },
    { id: 'expenses', label: 'Expenses', icon: <ReceiptText className="h-4 w-4" /> },
    { id: 'cash', label: 'Cash & Bank Register', icon: <Wallet className="h-4 w-4" /> },
    { id: 'partners', label: 'Partners & Capital', icon: <Users className="h-4 w-4" /> },
    { id: 'budgets', label: 'Monthly Budgets', icon: <Target className="h-4 w-4" /> },
    { id: 'reports', label: 'Reports & Analytics', icon: <PieChart className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const visibleNavItems = allNavigationItems.filter((item) => canAccessTab(item.id));

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 flex-col border-r border-black/[0.08] bg-white shrink-0 select-none sticky top-0 h-screen">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-black/[0.08]">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm overflow-hidden border border-black/5">
          <img src="/sidebar-logo.jpg" alt="PakMobile" className="h-full w-full object-cover" />
        </div>
        <div className="leading-tight">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            PakMobile
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            Trading System
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {visibleNavItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`group flex w-full items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#141414] text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-black/[0.03]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-[#E06349]' : 'text-slate-400 group-hover:text-slate-700 transition-colors'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold font-mono ${
                  isActive
                    ? 'bg-[#E06349] text-white'
                    : 'bg-[#E06349]/10 text-[#E06349] border border-[#E06349]/20'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Session Footer */}
      <div className="p-3.5 border-t border-black/[0.08] bg-[#FAFAFA]">
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-lg shadow-sm ${
              partnerName.toLowerCase() === 'saad'
                ? 'bg-blue-50'
                : 'bg-red-50'
            }`}>
              🍎
            </div>
            <div className="text-left leading-tight">
              <p className="text-xs font-bold text-slate-900">
                {partnerName}
              </p>
              <span className="text-[10px] text-slate-400 font-medium">
                {roleInfo.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-semibold text-[#E06349]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E06349] animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
