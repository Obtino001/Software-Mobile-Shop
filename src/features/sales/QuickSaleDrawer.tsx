import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Drawer } from '../../components/ui/drawer';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { formatPKR, getPtaLabel } from '../../utils/formatters';
import { useToast } from '../../components/ui/toast';
import { Brand, PaymentMethod } from '../../types';
import { Zap, ArrowLeftRight, Check, UserCheck, ShieldCheck } from 'lucide-react';

export function QuickSaleDrawer() {
  const { 
    isQuickSaleOpen, 
    closeQuickSale, 
    selectedPhoneForSale, 
    phones, 
    recordSale 
  } = useAppStore();

  const { success, error } = useToast();

  const inStockPhones = phones.filter((p) => p.status === 'In Stock' || (p.status as string) === 'in_stock');

  // Form states
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [salePrice, setSalePrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [bankAmount, setBankAmount] = useState<number>(0);
  const [bankName, setBankName] = useState<string>('Meezan Bank Raast');
  const [warrantyDays, setWarrantyDays] = useState<number>(7);
  const [soldBy, setSoldBy] = useState<'Yasir' | 'Saad'>('Yasir');
  const [notes, setNotes] = useState<string>('');

  // Exchange Phone feature
  const [isExchange, setIsExchange] = useState<boolean>(false);
  const [exchangeBrand, setExchangeBrand] = useState<Brand>('Apple');
  const [exchangeModel, setExchangeModel] = useState<string>('');
  const [exchangeStorage, setExchangeStorage] = useState<string>('128GB');
  const [exchangeImei, setExchangeImei] = useState<string>('');
  const [tradeInValue, setTradeInValue] = useState<number>(0);

  // Sync state when opened with pre-selected phone or first available
  useEffect(() => {
    if (selectedPhoneForSale) {
      setSelectedPhoneId(selectedPhoneForSale.id);
      setSalePrice(selectedPhoneForSale.sellingPrice);
      setCashAmount(selectedPhoneForSale.sellingPrice);
      setBankAmount(0);
    } else if (inStockPhones.length > 0 && !selectedPhoneId) {
      setSelectedPhoneId(inStockPhones[0].id);
      setSalePrice(inStockPhones[0].sellingPrice);
      setCashAmount(inStockPhones[0].sellingPrice);
      setBankAmount(0);
    }
  }, [selectedPhoneForSale, inStockPhones, isQuickSaleOpen]);

  const currentPhone = phones.find((p) => p.id === selectedPhoneId);

  const handlePhoneChange = (id: string) => {
    setSelectedPhoneId(id);
    const phone = phones.find((p) => p.id === id);
    if (phone) {
      setSalePrice(phone.sellingPrice);
      recalculatePayments(phone.sellingPrice, isExchange ? tradeInValue : 0, paymentMethod);
    }
  };

  const recalculatePayments = (total: number, exchangeVal: number, method: PaymentMethod) => {
    const netPayable = Math.max(0, total - exchangeVal);
    if (method === 'cash') {
      setCashAmount(netPayable);
      setBankAmount(0);
    } else if (method === 'bank_transfer') {
      setCashAmount(0);
      setBankAmount(netPayable);
    } else {
      // Split default 50/50
      const half = Math.round(netPayable / 2);
      setCashAmount(half);
      setBankAmount(netPayable - half);
    }
  };

  const netCashDue = Math.max(0, Number(salePrice) - (isExchange ? Number(tradeInValue) : 0));
  const estimatedProfit = currentPhone 
    ? Number(salePrice) - (currentPhone.totalCost || currentPhone.purchasePrice || 0) 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPhone) {
      error('Please select a phone from inventory');
      return;
    }
    if (!customerName.trim()) {
      error('Please enter customer name');
      return;
    }
    if (Number(salePrice) <= 0) {
      error('Please enter a valid sale price');
      return;
    }

    const totalPaid = Number(cashAmount) + Number(bankAmount);
    if (totalPaid !== netCashDue) {
      error(`Total payment (${formatPKR(totalPaid)}) must match net due (${formatPKR(netCashDue)})`);
      return;
    }

    const res = await recordSale({
      phoneId: currentPhone.id,
      customerName,
      customerPhone: customerPhone || 'Walk-in',
      salePrice: Number(salePrice),
      paymentMethod,
      cashAmount: Number(cashAmount),
      bankAmount: Number(bankAmount),
      bankName: paymentMethod !== 'cash' ? bankName : undefined,
      warrantyDays,
      isExchange,
      exchangeDetails: isExchange
        ? {
            brand: exchangeBrand,
            model: exchangeModel || 'Customer Old Phone',
            storage: exchangeStorage,
            imei: exchangeImei || 'EXCHANGE-DEVICE',
            tradeInValue: Number(tradeInValue),
          }
        : undefined,
      exchangeDeduction: isExchange ? Number(tradeInValue) : 0,
      soldBy,
      notes,
    });

    if (!res.success) {
      error('Sale Failed', res.error || "Couldn't save this entry. Please check your internet connection and try again.");
      return;
    }

    const profit = Math.max(0, Number(salePrice) - (currentPhone?.totalCost || 0));
    success(
      '✓ Sale Recorded',
      `${currentPhone.brand} ${currentPhone.model} sold to ${customerName} • Profit: ${formatPKR(profit)}`
    );

    // Reset fields
    setCustomerName('');
    setCustomerPhone('');
    setIsExchange(false);
    setTradeInValue(0);
  };

  const ptaInfo = currentPhone ? getPtaLabel(currentPhone.ptaStatus) : null;

  return (
    <Drawer
      isOpen={isQuickSaleOpen}
      onClose={closeQuickSale}
      title="Point of Sale (Quick Sale)"
      description="Create invoice, adjust stock, and record revenue"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Net Amount Due
            </span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {formatPKR(netCashDue)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={closeQuickSale}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} className="px-5">
              <Zap className="h-4 w-4 mr-1.5" />
              Complete Sale
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Phone Selection */}
        {inStockPhones.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            No phones currently in stock. Please add purchases or stock in phones first.
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Phone from Stock *
            </label>
            <select
              value={selectedPhoneId}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {inStockPhones.map((phone) => (
                <option key={phone.id} value={phone.id}>
                  {phone.brand} {phone.model} ({phone.storage}) - {phone.color} | Cost: {formatPKR(phone.totalCost)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selected Phone Specs Summary Badge Card */}
        {currentPhone && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-3.5 dark:bg-emerald-950/20 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {currentPhone.brand} {currentPhone.model}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  IMEI: {currentPhone.imei || (currentPhone as any).imei1} • {currentPhone.storage} • {currentPhone.color}
                </p>
              </div>
              {ptaInfo && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${ptaInfo.bg} ${ptaInfo.color}`}>
                  {ptaInfo.short}
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-emerald-500/20 pt-2 text-center">
              <div>
                <span className="text-[10px] text-slate-400">Total Cost</span>
                <p className="font-bold text-slate-700 dark:text-slate-300">{formatPKR(currentPhone.totalCost)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Asking Price</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatPKR(currentPhone.sellingPrice)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Est. Profit</span>
                <p className="font-bold text-teal-600 dark:text-teal-400">{formatPKR(estimatedProfit)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Customer Name *"
            placeholder="e.g. Bilal Ahmed"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
          <Input
            label="Customer Phone (WhatsApp)"
            placeholder="0300-1234567"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>

        {/* Price & Deal Maker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Agreed Selling Price (PKR) *"
            type="number"
            inputMode="numeric"
            value={salePrice || ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSalePrice(val);
              recalculatePayments(val, isExchange ? tradeInValue : 0, paymentMethod);
            }}
            prefixText="PKR"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sold By Partner *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSoldBy('Yasir')}
                className={`flex h-12 items-center justify-center rounded-xl border text-sm font-bold transition-all ${
                  soldBy === 'Yasir'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                Yasir
              </button>
              <button
                type="button"
                onClick={() => setSoldBy('Saad')}
                className={`flex h-12 items-center justify-center rounded-xl border text-sm font-bold transition-all ${
                  soldBy === 'Saad'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                Saad
              </button>
            </div>
          </div>
        </div>

        {/* Exchange / Trade-In Section */}
        <div className="rounded-2xl border border-slate-200 p-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Customer Trade-in (Exchange)</p>
                <p className="text-[10px] text-slate-400">Accept customer's old phone & deduct value</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isExchange}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsExchange(checked);
                recalculatePayments(salePrice, checked ? tradeInValue : 0, paymentMethod);
              }}
              className="h-5 w-5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {isExchange && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Exchange Brand"
                  value={exchangeBrand}
                  onChange={(e) => setExchangeBrand(e.target.value as Brand)}
                  options={[
                    { label: 'Apple', value: 'Apple' },
                    { label: 'Samsung', value: 'Samsung' },
                    { label: 'Google Pixel', value: 'Google' },
                    { label: 'Xiaomi / Redmi', value: 'Xiaomi' },
                    { label: 'OnePlus', value: 'OnePlus' },
                    { label: 'Vivo', value: 'Vivo' },
                    { label: 'Oppo', value: 'Oppo' },
                    { label: 'Infinix', value: 'Infinix' },
                    { label: 'Other', value: 'Other' },
                  ]}
                />
                <Input
                  label="Model & Variant"
                  placeholder="e.g. iPhone 11 64GB"
                  value={exchangeModel}
                  onChange={(e) => setExchangeModel(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Trade-in Value (PKR)"
                  type="number"
                  inputMode="numeric"
                  value={tradeInValue || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTradeInValue(val);
                    recalculatePayments(salePrice, val, paymentMethod);
                  }}
                  prefixText="PKR"
                />
                <Input
                  label="Exchange Phone IMEI"
                  placeholder="35..."
                  value={exchangeImei}
                  onChange={(e) => setExchangeImei(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Payment Method & Split */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Payment Mode *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cash', label: 'Cash Only' },
              { id: 'bank_transfer', label: 'Bank / Raast' },
              { id: 'split', label: 'Cash + Bank Split' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setPaymentMethod(m.id as PaymentMethod);
                  recalculatePayments(salePrice, isExchange ? tradeInValue : 0, m.id as PaymentMethod);
                }}
                className={`flex h-11 items-center justify-center rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === m.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Payment Inputs */}
        {paymentMethod === 'split' ? (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <Input
              label="Cash Amount (PKR)"
              type="number"
              inputMode="numeric"
              value={cashAmount || ''}
              onChange={(e) => {
                const c = Number(e.target.value);
                setCashAmount(c);
                setBankAmount(Math.max(0, netCashDue - c));
              }}
              prefixText="PKR"
            />
            <Input
              label="Bank / Digital (PKR)"
              type="number"
              inputMode="numeric"
              value={bankAmount || ''}
              onChange={(e) => {
                const b = Number(e.target.value);
                setBankAmount(b);
                setCashAmount(Math.max(0, netCashDue - b));
              }}
              prefixText="PKR"
            />
          </div>
        ) : paymentMethod === 'bank_transfer' ? (
          <Select
            label="Receiving Bank Account"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            options={[
              { label: 'Meezan Bank (Shop Raast ID)', value: 'Meezan Bank Raast' },
              { label: 'SadaPay Business', value: 'SadaPay' },
              { label: 'NayaPay Business', value: 'NayaPay' },
              { label: 'HBL Islamic Counter', value: 'HBL' },
              { label: 'Bank Alfalah', value: 'Bank Alfalah' },
            ]}
          />
        ) : null}

        {/* Checking Warranty & Notes */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Checking Warranty"
            value={warrantyDays}
            onChange={(e) => setWarrantyDays(Number(e.target.value))}
            options={[
              { label: '3 Days Checking', value: 3 },
              { label: '7 Days Checking (Standard)', value: 7 },
              { label: '14 Days Checking', value: 14 },
              { label: '1 Month Warranty', value: 30 },
              { label: 'No Warranty / As Is', value: 0 },
            ]}
          />
          <Input
            label="Notes / Special Terms"
            placeholder="e.g. Screen protector applied"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Drawer>
  );
}
