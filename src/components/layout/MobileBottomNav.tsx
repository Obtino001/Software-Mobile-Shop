import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Smartphone, 
  Zap, 
  Wallet, 
  Menu,
  ArrowDownLeft 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { NavigationTab } from '../../types';
import { MoreMenuDrawer } from './MoreMenuDrawer';

export function MobileBottomNav() {
  const { currentTab, setCurrentTab, openQuickSale, getStockCount } = useAppStore();
  const { canAccessTab } = useAuthStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const inStockCount = getStockCount();
  const canViewCash = canAccessTab('cash');

  const isMoreActive = [
    'purchases', 
    'expenses', 
    'partners', 
    'budgets', 
    'reports', 
    'settings'
  ].includes(currentTab);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-black/[0.06] shadow-[0_-2px_16px_rgba(0,0,0,0.04)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-end justify-around h-[68px] max-w-md mx-auto px-1">
          {/* 1. Home */}
          <NavItem
            isActive={currentTab === 'dashboard'}
            label="Home"
            icon={<LayoutDashboard className="h-[22px] w-[22px]" />}
            onClick={() => setCurrentTab('dashboard')}
          />

          {/* 2. Stock */}
          <NavItem
            isActive={currentTab === 'inventory'}
            label="Stock"
            icon={<Smartphone className="h-[22px] w-[22px]" />}
            onClick={() => setCurrentTab('inventory')}
            badge={inStockCount > 0 ? inStockCount : undefined}
          />

          {/* 3. Center POS Button */}
          <div className="flex flex-col items-center justify-end pb-1.5 -mt-5">
            <button
              onClick={() => openQuickSale()}
              className="relative flex h-[54px] w-[54px] items-center justify-center rounded-full bg-gradient-to-br from-[#E06349] to-[#D04A35] text-white shadow-[0_4px_20px_rgba(224,99,73,0.45)] active:scale-90 transition-all border-[3px] border-white"
              title="Quick Sale"
            >
              <Zap className="h-6 w-6 fill-current" />
              {/* Subtle glow ring */}
              <span className="absolute inset-0 rounded-full border-2 border-[#E06349]/20 animate-pulse" />
            </button>
            <span className="text-[10px] font-bold text-[#E06349] mt-1">
              Sell
            </span>
          </div>

          {/* 4. Cash or Stock In */}
          {canViewCash ? (
            <NavItem
              isActive={currentTab === 'cash'}
              label="Cash"
              icon={<Wallet className="h-[22px] w-[22px]" />}
              onClick={() => setCurrentTab('cash')}
            />
          ) : (
            <NavItem
              isActive={currentTab === 'purchases'}
              label="Stock In"
              icon={<ArrowDownLeft className="h-[22px] w-[22px]" />}
              onClick={() => setCurrentTab('purchases')}
            />
          )}

          {/* 5. More */}
          <NavItem
            isActive={isMoreActive}
            label="More"
            icon={<Menu className="h-[22px] w-[22px]" />}
            onClick={() => setIsMoreOpen(true)}
          />
        </div>
      </nav>

      {/* Drawer */}
      <MoreMenuDrawer
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
      />
    </>
  );
}

// ─── Nav Item Sub-component ───
function NavItem({ 
  isActive, 
  label, 
  icon, 
  onClick, 
  badge 
}: { 
  isActive: boolean; 
  label: string; 
  icon: React.ReactNode; 
  onClick: () => void; 
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-end flex-1 pb-1.5 pt-2 transition-all active:scale-90 relative ${
        isActive
          ? 'text-[#E06349]'
          : 'text-slate-400'
      }`}
    >
      {/* Active pill background */}
      {isActive && (
        <span className="absolute top-1 left-1/2 -translate-x-1/2 h-[34px] w-[52px] rounded-2xl bg-[#E06349]/10" />
      )}
      <div className="relative z-10">
        {icon}
        {badge !== undefined && (
          <span className="absolute -top-1.5 -right-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E06349] px-1 text-[9px] font-extrabold text-white shadow-sm">
            {badge}
          </span>
        )}
      </div>
      <span className={`text-[11px] mt-1 relative z-10 ${isActive ? 'font-bold' : 'font-medium'}`}>
        {label}
      </span>
    </button>
  );
}

