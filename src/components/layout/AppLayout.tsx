import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from './Header';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { QuickSaleDrawer } from '../../features/sales/QuickSaleDrawer';
import { QuickPurchaseDrawer } from '../../features/purchases/QuickPurchaseDrawer';
import { QuickExpenseDrawer } from '../../features/expenses/QuickExpenseDrawer';
import { UnauthorizedScreen } from '../ui/UnauthorizedScreen';
import { QuickAddSpeedDial } from '../animation/QuickAddSpeedDial';

// Module Screens
import { DashboardScreen } from '../../features/dashboard/DashboardScreen';
import { InventoryScreen } from '../../features/inventory/InventoryScreen';
import { PurchasesScreen } from '../../features/purchases/PurchasesScreen';
import { SalesScreen } from '../../features/sales/SalesScreen';
import { ExpensesScreen } from '../../features/expenses/ExpensesScreen';
import { CashScreen } from '../../features/cash/CashScreen';
import { PartnersScreen } from '../../features/partners/PartnersScreen';
import { BudgetsScreen } from '../../features/budgets/BudgetsScreen';
import { ReportsScreen } from '../../features/reports/ReportsScreen';
import { SettingsScreen } from '../../features/settings/SettingsScreen';

export function AppLayout() {
  const { currentTab } = useAppStore();
  const { canAccessTab } = useAuthStore();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const renderActiveScreen = () => {
    // Security check: if user cannot access this tab, display unauthorized state
    if (!canAccessTab(currentTab)) {
      return <UnauthorizedScreen />;
    }

    switch (currentTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'purchases':
        return <PurchasesScreen />;
      case 'sales':
        return <SalesScreen />;
      case 'expenses':
        return <ExpensesScreen />;
      case 'cash':
        return <CashScreen />;
      case 'partners':
        return <PartnersScreen />;
      case 'budgets':
        return <BudgetsScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F8F8] font-sans text-[#141414] antialiased selection:bg-[#E06349] selection:text-white relative">
      {/* Desktop & Tablet Sidebar */}
      <DesktopSidebar />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <Header />

        {/* Dynamic Screen Viewport — instant swap, no heavy AnimatePresence */}
        <main className="flex-1 overflow-y-auto px-3 py-3 md:px-6 md:py-6 pb-28 md:pb-8 [-webkit-overflow-scrolling:touch]">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-150">
            {renderActiveScreen()}
          </div>
        </main>
      </div>

      {/* Mobile Floating Bottom Bar */}
      <MobileBottomNav />

      {/* Floating Speed Dial */}
      <QuickAddSpeedDial />

      {/* Quick Action Drawers */}
      <QuickSaleDrawer />
      <QuickPurchaseDrawer />
      <QuickExpenseDrawer />
    </div>
  );
}
