import React, { useState } from 'react';
import { 
  Plus, 
  Wallet, 
  Smartphone, 
  Cloud, 
  LogOut, 
  ChevronDown, 
  ArrowRightLeft,
  Lock,
  Search
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatPKR } from '../../utils/formatters';
import { getRoleBadge } from '../../lib/permissions';
import { Button } from '../ui/button';

export function Header() {
  const { 
    settings, 
    getCashInHand, 
    openQuickSale,
    openQuickPurchase,
    openQuickExpense,
    setCurrentTab,
    isSyncingWithFirebase
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

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 w-full items-center justify-between border-b border-black/[0.08] bg-white/95 px-3 md:px-6 backdrop-blur-md select-none">
      {/* Title / Module Name */}
      <div 
        onClick={() => setCurrentTab('dashboard')} 
        className="flex items-center gap-2 md:gap-3 cursor-pointer min-w-0"
      >
        <div className="min-w-0">
          <h1 className="text-[13px] md:text-sm font-bold tracking-tight text-slate-900 truncate">
            {settings.businessName || (settings as any).shopName || 'Yasir & Saad Mobile'}
          </h1>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              Enterprise Dashboard
            </span>
            {isConfigured && (
              <span 
                title={isSyncingWithFirebase ? 'Syncing...' : 'Connected to Firebase PostgreSQL'} 
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full"
              >
                <Cloud className={`h-2.5 w-2.5 ${isSyncingWithFirebase ? 'animate-bounce' : ''}`} />
                Cloud
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Quick Cash-in-Hand Pill (Owner ONLY: hidden for manager) */}
        {canViewFinancials && (
          <div 
            onClick={() => setCurrentTab('cash')}
            className="hidden sm:flex items-center gap-2 rounded-2xl border border-black/[0.08] bg-[#FAFAFA] hover:bg-black/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-800 cursor-pointer transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            title="Cash Counter Register"
          >
            <Wallet className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px] font-medium">Galla:</span>
            <span className="font-mono text-slate-900 font-bold">{formatPKR(cashInHand)}</span>
          </div>
        )}

        {/* User Profile Pill */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl border border-black/[0.08] bg-[#FAFAFA] hover:bg-black/[0.03] text-xs font-semibold text-slate-800 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={partnerName} 
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-lg shadow-sm ${
                partnerName.toLowerCase() === 'saad' 
                  ? 'bg-blue-50' 
                  : 'bg-red-50'
              }`}>
                🍎
              </div>
            )}

            <div className="text-left hidden sm:block leading-tight">
              <span className="block text-xs font-bold text-slate-900">
                {partnerName}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {roleInfo.label}
              </span>
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* User Profile Dropdown */}
          {showProfileMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowProfileMenu(false)} 
              />
              <div className="absolute right-0 mt-2 z-50 w-64 rounded-2xl border border-black/[0.08] bg-white p-3 shadow-xl animate-in zoom-in-95">
                <div className="flex items-center gap-3 pb-3 border-b border-black/[0.06]">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                    partnerName.toLowerCase() === 'saad' ? 'bg-blue-50' : 'bg-red-50'
                  }`}>
                    🍎
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{partnerName}</h4>
                    <span className="text-[10px] font-semibold text-[#E06349] bg-[#E06349]/10 px-2 py-0.5 rounded-full">
                      {roleInfo.label}
                    </span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                    Switch User For Testing
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        switchRoleForTesting('owner', 'Yasir');
                        setShowProfileMenu(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        role === 'owner'
                          ? 'bg-[#E06349]/10 border-[#E06349] text-[#E06349]'
                          : 'border-black/[0.08] text-slate-600 hover:bg-black/[0.03]'
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
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        role === 'manager'
                          ? 'bg-blue-50 border-blue-500 text-blue-600'
                          : 'border-black/[0.08] text-slate-600 hover:bg-black/[0.03]'
                      }`}
                    >
                      Saad (Manager)
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Coral Primary Action Button (Figma Style) */}
        <div className="relative">
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="h-10 px-4 rounded-2xl bg-[#E06349] hover:bg-[#D05339] text-white shadow-[0_4px_12px_rgba(224,99,73,0.25)] flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Action</span>
          </button>

          {showQuickMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowQuickMenu(false)} 
              />
              <div className="absolute right-0 mt-2 z-50 w-52 rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-xl animate-in zoom-in-95">
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    openQuickSale();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-[#E06349]/10 hover:text-[#E06349] transition-colors"
                >
                  <Plus className="h-4 w-4 text-[#E06349]" />
                  <span>Issue POS Invoice</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    openQuickPurchase();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-[#E06349]/10 hover:text-[#E06349] transition-colors"
                >
                  <Plus className="h-4 w-4 text-blue-600" />
                  <span>Stock In Phone</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    openQuickExpense();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-[#E06349]/10 hover:text-[#E06349] transition-colors"
                >
                  <Plus className="h-4 w-4 text-rose-500" />
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
