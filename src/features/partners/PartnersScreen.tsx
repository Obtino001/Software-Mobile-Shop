import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatPKR, formatDate } from '../../utils/formatters';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { StatCard } from '../../components/ui/stat-card';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { useToast } from '../../components/ui/toast';
import { AccountType } from '../../types';
import { 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight, 
  Wallet, 
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export function PartnersScreen() {
  const { 
    partners, 
    drawings, 
    sales, 
    expenses, 
    getPartnerEquity, 
    getPartnerBalances,
    getTotalCapital,
    getNetProfit,
    recordPartnerDrawing,
    getCashInHand,
    getBankBalance 
  } = useAppStore();

  const { success, error } = useToast();

  const totalCapital = getTotalCapital();
  const netBusinessProfit = getNetProfit();
  const partnerBalances = getPartnerBalances();

  const yasirEquity = getPartnerEquity('Yasir');
  const saadEquity = getPartnerEquity('Saad');

  // Drawings modal state
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [partnerName, setPartnerName] = useState<'Yasir' | 'Saad'>('Yasir');
  const [drawingAmount, setDrawingAmount] = useState<number>(0);
  const [drawingReason, setDrawingReason] = useState<string>('Personal Drawing');
  const [paidFrom, setPaidFrom] = useState<AccountType>('cash');
  const [notes, setNotes] = useState<string>('');

  const handleRecordDrawing = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(drawingAmount) <= 0) {
      error('Please enter a valid drawing amount');
      return;
    }

    const available = paidFrom === 'cash' ? getCashInHand() : getBankBalance();
    if (Number(drawingAmount) > available) {
      error(`Insufficient funds in ${paidFrom === 'cash' ? 'Cash Counter' : 'Bank Account'}`);
      return;
    }

    recordPartnerDrawing({
      partnerName,
      amount: Number(drawingAmount),
      reason: drawingReason,
      paidFrom,
      notes,
    });

    success(
      '✓ Partner Drawing Recorded',
      `${partnerName} withdrew ${formatPKR(drawingAmount)} (${drawingReason})`
    );

    setIsDrawingModalOpen(false);
    setDrawingAmount(0);
    setNotes('');
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Partners & Capital Equity
          </h2>
          <p className="text-xs text-slate-400">
            Yasir (50%) & Saad (50%) • Equal Profit Split & Equity Tracking
          </p>
        </div>

        <Button
          onClick={() => setIsDrawingModalOpen(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-4"
        >
          <ArrowUpRight className="h-4 w-4 mr-1.5" />
          Record Partner Drawing
        </Button>
      </div>

      {/* Capital Benchmark Card */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 p-5 text-white border border-emerald-500/20 shadow-xl">
        <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="h-4 w-4" />
          <span>Partnership Structure</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
          <div>
            <span className="text-[11px] text-slate-400">Total Seed Capital</span>
            <p className="text-xl font-black text-white">PKR 500,000</p>
            <span className="text-[10px] text-slate-400">PKR 250K each (50:50)</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Net Business Profit to Date</span>
            <p className="text-xl font-black text-emerald-400">+{formatPKR(netBusinessProfit)}</p>
            <span className="text-[10px] text-slate-400">Revenue minus all expenses</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Total Partner Withdrawals</span>
            <p className="text-xl font-black text-rose-400">-{formatPKR(yasirEquity.drawingsTotal + saadEquity.drawingsTotal)}</p>
            <span className="text-[10px] text-slate-400">Combined personal draws</span>
          </div>
        </div>
      </div>

      {/* Individual Partner Equity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Partner 1: Yasir */}
        <Card className="p-5 border-emerald-500/30 bg-gradient-to-b from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-base shadow-md shadow-emerald-600/20">
                Y
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Yasir
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  50% Managing Partner
                </span>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 text-xs font-bold">
              Active
            </span>
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Initial Capital Contribution:</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatPKR(yasirEquity.initial)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>50% Profit Share:</span>
              <span>+{formatPKR(yasirEquity.profitShare)}</span>
            </div>
            <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
              <span>Total Personal Drawings (Withdrawals):</span>
              <span>-{formatPKR(yasirEquity.drawingsTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-3 border-t border-slate-200 dark:border-slate-800">
              <span>Current Net Equity:</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-base">
                {formatPKR(yasirEquity.currentEquity)}
              </span>
            </div>
          </div>
        </Card>

        {/* Partner 2: Saad */}
        <Card className="p-5 border-blue-500/30 bg-gradient-to-b from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/20">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-base shadow-md shadow-blue-600/20">
                S
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Saad
                </h3>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  50% Managing Partner
                </span>
              </div>
            </div>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2.5 py-1 text-xs font-bold">
              Active
            </span>
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Initial Capital Contribution:</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatPKR(saadEquity.initial)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>50% Profit Share:</span>
              <span>+{formatPKR(saadEquity.profitShare)}</span>
            </div>
            <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
              <span>Total Personal Drawings (Withdrawals):</span>
              <span>-{formatPKR(saadEquity.drawingsTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-3 border-t border-slate-200 dark:border-slate-800">
              <span>Current Net Equity:</span>
              <span className="text-blue-600 dark:text-blue-400 text-base">
                {formatPKR(saadEquity.currentEquity)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Drawings Ledger History */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Drawings & Withdrawals Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {drawings.map((draw) => (
              <div key={draw.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {draw.partnerName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(draw.date)}
                    </span>
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[9px] uppercase font-bold text-slate-500">
                      {draw.paidFrom}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {draw.reason} {draw.notes ? `• ${draw.notes}` : ''}
                  </p>
                </div>

                <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                  -{formatPKR(draw.amount)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Record Drawing Modal */}
      <Modal
        isOpen={isDrawingModalOpen}
        onClose={() => setIsDrawingModalOpen(false)}
        title="Record Partner Drawing"
        description="Withdraw personal cash or bank funds against profit share"
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setIsDrawingModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRecordDrawing}>
              Save Drawing
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRecordDrawing} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Partner *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPartnerName('Yasir')}
                className={`flex h-12 items-center justify-center rounded-xl border text-sm font-bold transition-all ${
                  partnerName === 'Yasir'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                Yasir
              </button>
              <button
                type="button"
                onClick={() => setPartnerName('Saad')}
                className={`flex h-12 items-center justify-center rounded-xl border text-sm font-bold transition-all ${
                  partnerName === 'Saad'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                Saad
              </button>
            </div>
          </div>

          <Input
            label="Withdrawal Amount (PKR) *"
            type="number"
            inputMode="numeric"
            value={drawingAmount || ''}
            onChange={(e) => setDrawingAmount(Number(e.target.value))}
            prefixText="PKR"
            required
          />

          <Select
            label="Withdrawn From Account *"
            value={paidFrom}
            onChange={(e) => setPaidFrom(e.target.value as AccountType)}
            options={[
              { label: `Cash Counter (${formatPKR(getCashInHand())})`, value: 'cash' },
              { label: `Bank Account (${formatPKR(getBankBalance())})`, value: 'bank' },
            ]}
          />

          <Input
            label="Reason / Purpose"
            placeholder="e.g. Monthly personal expense or emergency"
            value={drawingReason}
            onChange={(e) => setDrawingReason(e.target.value)}
          />

          <Input
            label="Notes"
            placeholder="e.g. Taken from evening shop counter"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
