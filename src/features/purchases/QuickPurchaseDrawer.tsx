import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Drawer } from '../../components/ui/drawer';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { useToast } from '../../components/ui/toast';
import { Brand, PtaStatus, Condition, SimType, AccountType } from '../../types';
import { formatPKR } from '../../utils/formatters';
import { ArrowDownLeft, ChevronDown, ChevronUp } from 'lucide-react';

export function QuickPurchaseDrawer() {
  const { isQuickPurchaseOpen, closeQuickPurchase, recordPurchase } = useAppStore();
  const { success, error } = useToast();

  // Primary Simple Inputs
  const [model, setModel] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<AccountType>('cash');

  // Optional Advanced Details (Collapsed by default)
  const [showMore, setShowMore] = useState<boolean>(false);
  const [imei, setImei] = useState<string>('');
  const [storage, setStorage] = useState<string>('128GB');
  const [ptaStatus, setPtaStatus] = useState<PtaStatus>('official_approved');
  const [condition, setCondition] = useState<Condition>('mint_10_10');
  const [color, setColor] = useState<string>('Black');
  const [sellerName, setSellerName] = useState<string>('');

  const totalCost = Number(purchasePrice) || 0;

  // Auto-detect brand from model name
  const detectBrand = (name: string): Brand => {
    const lower = name.toLowerCase();
    if (lower.includes('iphone') || lower.includes('apple')) return 'Apple';
    if (lower.includes('samsung') || lower.includes('galaxy')) return 'Samsung';
    if (lower.includes('pixel') || lower.includes('google')) return 'Google';
    if (lower.includes('redmi') || lower.includes('xiaomi') || lower.includes('mi ')) return 'Xiaomi';
    if (lower.includes('oneplus')) return 'OnePlus';
    if (lower.includes('vivo')) return 'Vivo';
    if (lower.includes('oppo')) return 'Oppo';
    if (lower.includes('infinix')) return 'Infinix';
    if (lower.includes('tecno')) return 'Tecno';
    if (lower.includes('realme')) return 'Realme';
    return 'Other';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!model.trim()) {
      error('Please enter phone name or model');
      return;
    }
    if (!purchasePrice || Number(purchasePrice) <= 0) {
      error('Please enter purchase price');
      return;
    }

    const finalSellingPrice = sellingPrice ? Number(sellingPrice) : Number(purchasePrice);
    const brand = detectBrand(model);
    const finalImei = imei.trim() || `SN-${Date.now().toString().slice(-6)}`;

    const res = await recordPurchase({
      brand,
      model: model.trim(),
      storage,
      color,
      ptaStatus,
      simType: 'physical_esim',
      condition,
      imei1: finalImei,
      purchasePrice: Number(purchasePrice),
      refurbCost: 0,
      sellingPrice: finalSellingPrice,
      sellerName: sellerName.trim() || 'Walk-in Seller',
      sellerPhone: 'N/A',
      paymentMethod,
      purchasedBy: 'Yasir',
      accessories: [],
      notes: '',
    });

    if (!res.success) {
      error('Purchase Failed', res.error || "Couldn't save this entry. Please check connection.");
      return;
    }

    success(
      '✓ Mobile Added Successfully',
      `${model} added to stock • Cost: ${formatPKR(totalCost)}`
    );

    // Reset clean fields
    setModel('');
    setPurchasePrice('');
    setSellingPrice('');
    setImei('');
    setSellerName('');
    setShowMore(false);
  };

  return (
    <Drawer
      isOpen={isQuickPurchaseOpen}
      onClose={closeQuickPurchase}
      title="Stock In Phone"
      description="Quick entry: Just enter phone name and price"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between gap-3 select-none">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Total Cost
            </span>
            <p className="text-lg font-bold text-slate-900 font-mono">
              {formatPKR(totalCost)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={closeQuickPurchase} className="rounded-2xl text-xs h-10 px-4">
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              className="h-10 px-5 rounded-2xl bg-[#E06349] hover:bg-[#D05339] text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
            >
              <ArrowDownLeft className="h-4 w-4" />
              <span>Stock In Phone</span>
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 select-none pt-1">
        {/* 1. Phone Name / Model */}
        <Input
          label="Phone / Item Name *"
          placeholder="e.g. iPhone 13 Pro Max, Samsung S23, Redmi 12"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
          autoFocus
        />

        {/* 2. Prices (Purchase & Selling) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Purchase Cost (Khareed Price) *"
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
            prefixText="PKR"
            required
          />

          <Input
            label="Selling Price (Bechne ki Price)"
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
            prefixText="PKR"
            hint="Optional (can be set during sale)"
          />
        </div>

        {/* 3. Payment Source */}
        <Select
          label="Paid From Account *"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as AccountType)}
          options={[
            { label: 'Cash Counter (Galla)', value: 'cash' },
            { label: 'Bank Account (Raast / Online)', value: 'bank' },
          ]}
        />

        {/* Optional Collapsed Section for Extra Details */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1 text-xs font-semibold text-[#E06349] hover:underline"
          >
            {showMore ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Hide Optional Details</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>+ Add Optional Details (IMEI, Storage, PTA)</span>
              </>
            )}
          </button>

          {showMore && (
            <div className="mt-3 space-y-3 p-3.5 rounded-2xl bg-[#FAFAFA] border border-black/[0.06] animate-in fade-in duration-150">
              <Input
                label="IMEI Number (Optional)"
                placeholder="e.g. 3528471..."
                value={imei}
                onChange={(e) => setImei(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Storage"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  options={[
                    { label: '64 GB', value: '64GB' },
                    { label: '128 GB', value: '128GB' },
                    { label: '256 GB', value: '256GB' },
                    { label: '512 GB', value: '512GB' },
                    { label: '1 TB', value: '1TB' },
                  ]}
                />

                <Select
                  label="PTA Status"
                  value={ptaStatus}
                  onChange={(e) => setPtaStatus(e.target.value as PtaStatus)}
                  options={[
                    { label: 'Official Approved', value: 'official_approved' },
                    { label: 'Non-PTA', value: 'non_pta' },
                    { label: 'JV Sim', value: 'jv_sim' },
                    { label: 'Factory Unlock', value: 'factory_unlock' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Color"
                  placeholder="e.g. Blue, Black"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />

                <Input
                  label="Seller / Supplier Name"
                  placeholder="e.g. Hafeez Centre Dealer"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </Drawer>
  );
}
