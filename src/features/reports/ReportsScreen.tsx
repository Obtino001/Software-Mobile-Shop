import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatPKR, getExpenseCategoryLabel } from '../../utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { AnimatedNumber } from '../../components/animation/AnimatedNumber';

export function ReportsScreen() {
  const { 
    sales, 
    expenses, 
    phones, 
    getCashInHand, 
    getBankBalance, 
    getTotalStockCost, 
    getTotalStockExpectedValue,
    getTotalSales,
    getGrossProfit,
    getTotalExpenses,
    getNetProfit,
    getPartnerBalances
  } = useAppStore();

  const totalRevenue = getTotalSales();
  const grossProfit = getGrossProfit();
  const totalCogs = totalRevenue - grossProfit;
  const totalExpenses = getTotalExpenses();
  const netProfit = getNetProfit();

  const stockCost = getTotalStockCost();
  const stockPotentialValue = getTotalStockExpectedValue();
  const cash = getCashInHand();
  const bank = getBankBalance();
  const totalNetWorth = cash + bank + stockCost;
  const partnerBalances = getPartnerBalances();

  // Recharts data: Sales by Brand
  const brandSalesMap: Record<string, number> = {};
  sales.forEach((s) => {
    const brand = s.phoneSnapshot?.brand || 'Other';
    brandSalesMap[brand] = (brandSalesMap[brand] || 0) + s.sellingPrice;
  });

  const brandChartData = Object.entries(brandSalesMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Recharts data: Asset distribution
  const assetChartData = [
    { name: 'Stock Phones', value: stockCost, color: '#E06349' },
    { name: 'Cash Counter', value: cash, color: '#141414' },
    { name: 'Bank Balance', value: bank, color: '#0284c7' },
  ];

  // Expenses by Category
  const expenseCatMap: Record<string, number> = {};
  expenses.forEach((e) => {
    const cat = getExpenseCategoryLabel(e.category);
    expenseCatMap[cat] = (expenseCatMap[cat] || 0) + e.amount;
  });

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Financial Reports & Analytics
        </h2>
        <p className="text-xs text-slate-400">
          Executive performance summary and capital breakdown
        </p>
      </div>

      {/* P&L Executive Statement */}
      <Card className="p-5 rounded-3xl">
        <div className="border-b border-black/[0.06] pb-3 mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Profit & Loss Statement (P&L)
            </h3>
            <p className="text-xs text-slate-400">Trading results for current period</p>
          </div>
          <span className="text-xs font-bold text-[#E06349] bg-[#E06349]/10 px-2.5 py-1 rounded-xl">
            PKR Currency
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Revenue */}
          <div className="flex justify-between items-center text-slate-700 font-semibold">
            <span>Gross Sales Revenue ({sales.length} Phones)</span>
            <AnimatedNumber value={totalRevenue} className="font-bold text-slate-900" />
          </div>

          {/* COGS */}
          <div className="flex justify-between items-center text-slate-500">
            <span>Less: Cost of Goods Sold (Procurement + Refurb)</span>
            <span className="font-mono text-rose-600">-{formatPKR(totalCogs)}</span>
          </div>

          {/* Gross Profit */}
          <div className="flex justify-between items-center pt-2 border-t border-black/[0.06] font-bold text-slate-900">
            <span>Gross Trading Profit</span>
            <AnimatedNumber value={grossProfit} className="text-[#E06349] font-bold" />
          </div>

          {/* Operating Expenses */}
          <div className="pt-2 text-slate-500 space-y-1.5">
            <span className="font-bold text-slate-700 block mb-1">Operating Overheads:</span>
            {Object.entries(expenseCatMap).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between pl-3 text-[11px]">
                <span>• {cat}</span>
                <span className="text-rose-600">-{formatPKR(amt)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center font-bold text-slate-700 pt-1">
              <span>Total Operating Expenses</span>
              <span className="text-rose-600">-{formatPKR(totalExpenses)}</span>
            </div>
          </div>

          {/* Net Profit */}
          <div className="flex justify-between items-center pt-3 border-t-2 border-black/[0.08] text-sm font-bold text-slate-900">
            <span>Net Operating Profit</span>
            <AnimatedNumber value={netProfit} className="text-[#E06349] text-base font-bold" />
          </div>

          {/* Partner Distribution from Calculated Ownership */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-black/[0.06] text-center">
            {partnerBalances.map((pb) => (
              <div key={pb.partnerId} className="p-2.5 rounded-2xl bg-[#FAFAFA] border border-black/[0.04]">
                <span className="text-[10px] text-slate-400 font-medium">{pb.name} Profit Share ({pb.ownershipPercentage}%)</span>
                <div className="text-xs font-bold text-[#E06349]">
                  +<AnimatedNumber value={pb.profitShare} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sales by Brand Chart */}
        <Card className="p-5 rounded-3xl">
          <CardHeader>
            <CardTitle>Sales Revenue by Brand</CardTitle>
          </CardHeader>
          <CardContent>
            {brandChartData.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No sales data recorded yet.</p>
            ) : (
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brandChartData}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      formatter={(val: any) => [formatPKR(Number(val)), 'Sales']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#E06349" 
                      radius={[8, 8, 0, 0]} 
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Asset Distribution */}
        <Card className="p-5 rounded-3xl">
          <CardHeader>
            <CardTitle>Capital Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {assetChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [formatPKR(Number(val)), 'Asset Value']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex items-center gap-4 text-xs mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E06349]" />
                  <span className="text-slate-600 font-medium">Stock Phones</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#141414]" />
                  <span className="text-slate-600 font-medium">Cash Galla</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
                  <span className="text-slate-600 font-medium">Bank</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
