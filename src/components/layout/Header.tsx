import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Wallet, 
  Cloud, 
  LogOut, 
  ChevronDown, 
  Bell,
  Clock,
  AlertTriangle,
  AlertCircle,
  Package,
  DollarSign,
  ReceiptText,
  ShoppingBag,
  ArrowDownLeft,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatPKR } from '../../utils/formatters';
import { getRoleBadge } from '../../lib/permissions';

export function Header() {
  const { 
    settings, 
    getCashInHand, 
    openQuickSale,
    openQuickPurchase,
    openQuickExpense,
    setCurrentTab,
    isSyncingWithFirebase,
    phones,
    expenses
  } = useAppStore();

  const { 
    partnerName, 
    role, 
    avatarUrl, 
    hasPermission, 
    signOut, 
    switchRoleForTesting, 
    isConfigured 
  } = useAuthStore();

  const canViewFinancials = hasPermission('financials:view');
  const cashInHand = getCashInHand();
  const roleInfo = getRoleBadge(role);

  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Compute live shop notifications from real state
  const notifications = useMemo(() => {
    const items: { id: string; title: string; desc: string; type: 'warning' | 'danger' | 'info'; tab?: any }[] = [];
    const inStock = phones.filter((p) => p.status === 'In Stock' || (p.status as string) === 'in_stock');

    // 1. Missing prices
    const noPrice = inStock.filter((p) => !p.sellingPrice || p.sellingPrice <= 0);
    if (noPrice.length > 0) {
      items.push({
        id: 'no-price',
        title: 'Missing Selling Price',
        desc: `${noPrice.length} phone(s) in stock have no selling price set`,
        type: 'warning',
        tab: 'inventory',
      });
    }

    // 2. Aging stock (>14 days)
    const aging = inStock.filter((p) => {
      const days = (Date.now() - new Date(p.purchaseDate).getTime()) / (1000 * 3600 * 24);
      return days > 14;
    });
    if (aging.length > 0) {
      items.push({
        id: 'aging-stock',
        title: 'Aging Stock Alert',
        desc: `${aging.length} phone(s) unsold for over 14 days`,
        type: 'warning',
        tab: 'inventory',
      });
    }

    // 3. Low Cash in Hand
    if (cashInHand < 5000 && cashInHand >= 0) {
      items.push({
        id: 'low-cash',
        title: 'Low Cash Register',
        desc: `Counter cash is low at ${formatPKR(cashInHand)}`,
        type: 'info',
        tab: 'cash',
      });
    }

    // 4. Reserved phones
    const reserved = phones.filter((p) => p.status === 'Reserved' || (p.status as string) === 'booked_token');
    if (reserved.length > 0) {
      items.push({
        id: 'reserved-phones',
        title: 'Token Booked Units',
        desc: `${reserved.length} phone(s) currently on hold / token booked`,
        type: 'info',
        tab: 'inventory',
      });
    }

    // 5. Budget Check
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const monthlyBudget = settings?.monthlyExpenseTarget || 20000;
    const spentThisMonth = expenses
      .filter((e) => e.date.startsWith(currentMonthKey))
      .reduce((sum, e) => sum + e.amount, 0);

    if (spentThisMonth > monthlyBudget) {
      items.push({
        id: 'over-budget',
        title: 'Budget Exceeded',
        desc: `Monthly budget exceeded by ${formatPKR(spentThisMonth - monthlyBudget)}`,
        type: 'danger',
        tab: 'expenses',
      });
    }

    return items;
  }, [phones, cashInHand, expenses, settings]);

  const initials = partnerName ? partnerName.trim().slice(0, 2).toUpperCase() : 'PM';

  return (
    <header className="sticky top-0 z-20 flex h-14 md:h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 md:px-6 backdrop-blur-md select-none">
      {/* Business Identity */}
      <div 
        onClick={() => setCurrentTab('dashboard')} 
        className="flex items-center gap-2.5 md:gap-3 cursor-pointer min-w-0"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 truncate">
              {settings.businessName || (settings as any).shopName || 'PakMobile Trading'}
            </h1>
            {isConfigured && (
              <span 
                title={isSyncingWithFirebase ? 'Syncing with cloud...' : 'Connected & Synced'} 
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full shrink-0"
              >
                <Cloud className={`h-2.5 w-2.5 text-emerald-600 ${isSyncingWithFirebase ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">Synced</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium hidden md:block">
            Fintech POS & Inventory Management
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Cash Register Pill (Owner Only) */}
        {canViewFinancials && (
          <div 
            onClick={() => setCurrentTab('cash')}
            className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer transition-all shadow-subtle"
            title="Cash Counter Register (Galla)"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100/80 text-emerald-700">
              <Wallet className="h-3 w-3" />
            </div>
            <span className="text-slate-400 text-[11px] font-medium">Counter:</span>
            <span className="font-mono text-slate-900 font-bold tabular-nums">{formatPKR(cashInHand)}</span>
          </div>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
              setShowQuickMenu(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-subtle focus:outline-none focus:ring-1 focus:ring-slate-400"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E06349] px-1 text-[9px] font-bold text-white shadow-sm">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)} 
              />
              <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-xl animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Shop Alerts</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                      {notifications.length} active
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="py-2 max-h-72 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                      All operations healthy. No pending alerts.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (n.tab) setCurrentTab(n.tab);
                          setShowNotifications(false);
                        }}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          n.type === 'danger'
                            ? 'bg-rose-50/70 border-rose-200/80 hover:bg-rose-100/70 text-rose-900'
                            : n.type === 'warning'
                            ? 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/70 text-amber-900'
                            : 'bg-sky-50/70 border-sky-200/80 hover:bg-sky-100/70 text-sky-900'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="shrink-0 mt-0.5">
                            {n.type === 'danger' ? (
                              <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                            ) : n.type === 'warning' ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            ) : (
                              <Package className="h-3.5 w-3.5 text-sky-600" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold leading-snug">{n.title}</p>
                            <p className="text-[11px] opacity-80 mt-0.5">{n.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowQuickMenu(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-all shadow-subtle focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={partnerName} 
                className="h-7 w-7 rounded-lg object-cover"
              />
            ) : (
              <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold bg-slate-800 text-white shadow-sm tracking-wider">
                {initials}
              </div>
            )}

            <div className="text-left hidden sm:block leading-tight">
              <span className="block text-xs font-bold text-slate-900 truncate max-w-[90px]">
                {partnerName}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {roleInfo.label}
              </span>
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* User Profile Dropdown */}
          {showProfileMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowProfileMenu(false)} 
              />
              <div className="absolute right-0 mt-2 z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl animate-in zoom-in-95">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold bg-slate-900 text-white shadow-sm tracking-wider">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{partnerName}</h4>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {roleInfo.label}
                    </span>
                  </div>
                </div>

                <div className="py-2.5 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                    Switch Partner Role
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        switchRoleForTesting('owner', 'Yasir');
                        setShowProfileMenu(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        role === 'owner'
                          ? 'bg-[#E06349]/10 border-[#E06349] text-[#E06349]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Yasir (Owner)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchRoleForTesting('manager', 'Saad');
                        setShowProfileMenu(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        role === 'manager'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Saad (Manager)
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Coral Primary Action Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowQuickMenu(!showQuickMenu);
              setShowProfileMenu(false);
              setShowNotifications(false);
            }}
            className="h-9 md:h-10 px-3.5 md:px-4 rounded-xl bg-[#E06349] hover:bg-[#D05339] text-white shadow-sm flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E06349]/50"
            title="New Action"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Action</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>

          {showQuickMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowQuickMenu(false)} 
              />
              <div className="absolute right-0 mt-2 z-50 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in zoom-in-95">
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    openQuickSale();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-[#E06349]/10 hover:text-[#E06349] transition-colors"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E06349]/10 text-[#E06349]">
                    <ShoppingBag className="h-3.5 w-3.5" />
                  </div>
                  <span>Issue POS Invoice</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    openQuickPurchase();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                  </div>
                  <span>Stock In Phone</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    openQuickExpense();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50 text-rose-600">
                    <ReceiptText className="h-3.5 w-3.5" />
                  </div>
                  <span>Record Shop Expense</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
