import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { NavigationTab } from '../../types';
import { getRoleBadge } from '../../lib/permissions';

interface DesktopSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DesktopSidebar({ isCollapsed: externalCollapsed, onToggleCollapse }: DesktopSidebarProps) {
  const { currentTab, setCurrentTab, getStockCount } = useAppStore();
  const { canAccessTab, partnerName, role } = useAuthStore();

  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  const inStockCount = getStockCount();
  const roleInfo = getRoleBadge(role);

  const allNavigationItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Mobile Stock', icon: Smartphone, badge: inStockCount > 0 ? inStockCount : undefined },
    { id: 'sales', label: 'Sales & POS', icon: Zap },
    { id: 'purchases', label: 'Stock Purchases', icon: ArrowDownLeft },
    { id: 'expenses', label: 'Expenses', icon: ReceiptText },
    { id: 'cash', label: 'Cash & Bank', icon: Wallet },
    { id: 'partners', label: 'Partners & Equity', icon: Users },
    { id: 'budgets', label: 'Monthly Budgets', icon: Target },
    { id: 'reports', label: 'Reports & Analytics', icon: PieChart },
    { id: 'settings', label: 'Shop Settings', icon: Settings },
  ];

  const visibleNavItems = allNavigationItems.filter((item) => canAccessTab(item.id));

  // Partner initials
  const initials = partnerName
    ? partnerName.trim().slice(0, 2).toUpperCase()
    : 'PM';

  return (
    <aside 
      className={`hidden md:flex flex-col shrink-0 select-none sticky top-0 h-screen transition-all duration-300 ease-in-out z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-[#0B0F19] text-slate-300 border-r border-slate-800/80 shadow-xl`}
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
        <div 
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer min-w-0 overflow-hidden"
          title="PakMobile Trading System"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-700/80 shadow-sm overflow-hidden p-0.5">
            <img 
              src="/sidebar-logo.jpg" 
              alt="PakMobile" 
              className="h-full w-full object-cover rounded-lg"
              onError={(e) => {
                // Fallback icon if image doesn't load
                (e.target as HTMLElement).style.display = 'none';
              }} 
            />
          </div>
          {!isCollapsed && (
            <div className="leading-tight truncate">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                PakMobile
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.2 rounded-md">
                  ERP
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                Trading System
              </p>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-600 shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
        {!isCollapsed && (
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operations
          </div>
        )}

        {visibleNavItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => setCurrentTab(item.id)}
                className={`group flex w-full items-center ${
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'
                } rounded-xl text-xs font-semibold transition-all duration-150 relative ${
                  isActive
                    ? 'bg-slate-800/90 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 focus-visible:ring-1 focus-visible:ring-slate-600'
                }`}
                title={isCollapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#E06349] rounded-r" />
                )}

                <div className={`flex items-center ${isCollapsed ? '' : 'gap-3 min-w-0'}`}>
                  <span className={`shrink-0 transition-colors ${
                    isActive ? 'text-[#E06349]' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {!isCollapsed && item.badge !== undefined && (
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold font-mono shrink-0 ${
                    isActive
                      ? 'bg-[#E06349] text-white'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Badge Dot */}
                {isCollapsed && item.badge !== undefined && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#E06349]" />
                )}
              </button>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 z-50 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium border border-slate-700 shadow-xl whitespace-nowrap pointer-events-none">
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="bg-[#E06349] text-white text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className={`flex items-center ${
          isCollapsed ? 'justify-center' : 'justify-between'
        } p-2 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Clean Monogram Initials Avatar */}
            <div 
              className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/80 tracking-wider"
              title={partnerName}
            >
              {initials}
            </div>

            {!isCollapsed && (
              <div className="text-left leading-tight truncate">
                <p className="text-xs font-bold text-white truncate">
                  {partnerName || 'Partner'}
                </p>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5 text-slate-500" />
                  {roleInfo.label}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
