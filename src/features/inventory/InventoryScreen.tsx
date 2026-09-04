import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { PhoneItem, Brand, PtaStatus, PhoneStatus } from '../../types';
import { formatPKR, formatDate, getPtaLabel, getConditionLabel, getPhoneStatusLabel } from '../../utils/formatters';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/modal';
import { EmptyState } from '../../components/ui/empty-state';
import { useToast } from '../../components/ui/toast';
import { 
  Search, 
  Plus, 
  Smartphone, 
  BatteryMedium, 
  ShieldCheck, 
  Zap, 
  Copy, 
  Trash2, 
  Edit3,
  Filter,
  Check
} from 'lucide-react';

export function InventoryScreen() {
  const { 
    phones, 
    openQuickPurchase, 
    openQuickSale, 
    updatePhone, 
    deletePhone,
    getStockCount,
    getSoldCount
  } = useAppStore();

  const { hasPermission } = useAuthStore();
  const canDelete = hasPermission('inventory:delete');
  const canEditPrice = hasPermission('records:edit');
  const canViewCosts = hasPermission('financials:view');

  const { success } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedPta, setSelectedPta] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('in_stock');
  const [selectedPhoneDetails, setSelectedPhoneDetails] = useState<PhoneItem | null>(null);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newSellingPrice, setNewSellingPrice] = useState<number>(0);

  // Filters
  const filteredPhones = phones.filter((p) => {
    // Search query matches model, brand, imei, color
    const q = searchQuery.toLowerCase().trim();
    const phoneImei = p.imei || (p as any).imei1 || '';
    const matchesQuery = 
      !q || 
      p.model.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) || 
      phoneImei.includes(q) || 
      p.color.toLowerCase().includes(q);

    // Brand filter
    const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;

    // PTA filter
    const matchesPta = selectedPta === 'all' || p.ptaStatus === selectedPta;

    // Status filter
    const isStatusInStock = p.status === 'In Stock' || (p.status as string) === 'in_stock';
    const isStatusSold = p.status === 'Sold' || (p.status as string) === 'sold';

    let matchesStatus = true;
    if (selectedStatus === 'in_stock') matchesStatus = isStatusInStock;
    else if (selectedStatus === 'sold') matchesStatus = isStatusSold;

    return matchesQuery && matchesBrand && matchesPta && matchesStatus;
  });

  const inStockCount = getStockCount();
  const soldCount = getSoldCount();

  const handleCopyImei = (imei: string) => {
    navigator.clipboard.writeText(imei);
    success('IMEI Copied', imei);
  };

  const handleSavePrice = () => {
    if (!selectedPhoneDetails) return;
    updatePhone(selectedPhoneDetails.id, { sellingPrice: Number(newSellingPrice) });
    setSelectedPhoneDetails({ ...selectedPhoneDetails, sellingPrice: Number(newSellingPrice) });
    setIsEditingPrice(false);
    success('Asking Price Updated', formatPKR(newSellingPrice));
  };

  const handleDeletePhone = (id: string) => {
    deletePhone(id);
    setSelectedPhoneDetails(null);
    success('Phone Removed from Inventory');
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header & Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Mobile Inventory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {inStockCount} Phones in stock • {soldCount} Sold this month
          </p>
        </div>

        <Button
          onClick={openQuickPurchase}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-4"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Stock In Phone
        </Button>
      </div>

      {/* Fast Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Model (iPhone 13, S23), IMEI, or Brand..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-10 pr-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Filter Chips (One-Thumb Mobile UX) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedStatus(selectedStatus === 'all' ? 'in_stock' : 'all')}
          className={`shrink-0 px-3 py-1.5 rounded-xl font-bold border transition-all ${
            selectedStatus === 'in_stock'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
          }`}
        >
          In Stock ({inStockCount})
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'sold' ? 'all' : 'sold')}
          className={`shrink-0 px-3 py-1.5 rounded-xl font-bold border transition-all ${
            selectedStatus === 'sold'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
          }`}
        >
          Sold Out ({soldCount})
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

        {/* Brand Filters */}
        {['all', 'Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus'].map((brand) => (
          <button
            key={brand}
            onClick={() => setSelectedBrand(brand)}
            className={`shrink-0 px-3 py-1.5 rounded-xl font-medium border transition-all ${
              selectedBrand === brand
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {brand === 'all' ? 'All Brands' : brand}
          </button>
        ))}

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

        {/* PTA Status Filters */}
        {[
          { id: 'all', label: 'All PTA' },
          { id: 'official_approved', label: 'Approved' },
          { id: 'non_pta', label: 'Non-PTA' },
          { id: 'jv_sim', label: 'JV Sim' },
        ].map((pta) => (
          <button
            key={pta.id}
            onClick={() => setSelectedPta(pta.id)}
            className={`shrink-0 px-3 py-1.5 rounded-xl font-medium border transition-all ${
              selectedPta === pta.id
                ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40 dark:text-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {pta.label}
          </button>
        ))}
      </div>

      {/* Phone Cards List */}
      {filteredPhones.length === 0 ? (
        <EmptyState
          title="No Phones Found"
          description="Try changing your search keywords or filter settings, or stock in new phones."
          actionText="Stock In Phone"
          onAction={openQuickPurchase}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPhones.map((phone) => {
            const pta = getPtaLabel(phone.ptaStatus);
            const cond = getConditionLabel(phone.condition);
            const status = getPhoneStatusLabel(phone.status);
            const isSold = phone.status === 'Sold' || (phone.status as string) === 'sold';

            return (
              <div
                key={phone.id}
                onClick={() => {
                  setSelectedPhoneDetails(phone);
                  setNewSellingPrice(phone.sellingPrice);
                  setIsEditingPrice(false);
                }}
                className={`rounded-2xl border p-4 bg-white dark:bg-slate-900 transition-all cursor-pointer select-none hover:shadow-md active:scale-[0.99] relative ${
                  isSold
                    ? 'border-slate-200/60 opacity-75 dark:border-slate-800/60'
                    : 'border-slate-200 hover:border-emerald-500/50 dark:border-slate-800'
                }`}
              >
                {/* Status & PTA Badges */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${pta.bg} ${pta.color}`}>
                      {pta.short}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${cond.color}`}>
                      {cond.badge}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Main Model & Variant */}
                <div className="mb-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    {phone.brand} {phone.model}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {phone.storage} • {phone.color}
                  </p>
                </div>

                {/* Specs Pill Row */}
                <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 mb-3 flex-wrap">
                  {phone.batteryHealth && (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      <BatteryMedium className="h-3.5 w-3.5" />
                      {phone.batteryHealth}% Battery
                    </span>
                  )}
                  <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                    IMEI: {(phone.imei || (phone as any).imei1 || '').slice(0, 8)}...
                  </span>
                </div>

                {/* Pricing & Quick Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Asking Price</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {formatPKR(phone.sellingPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Cost: {formatPKR(phone.totalCost)}
                    </span>
                  </div>

                  {!isSold && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openQuickSale(phone);
                      }}
                      className="h-10 px-4 text-xs font-bold shadow-sm"
                    >
                      <Zap className="h-3.5 w-3.5 mr-1 fill-current" />
                      Quick Sell
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phone Detailed View Modal */}
      {selectedPhoneDetails && (
        <Modal
          isOpen={!!selectedPhoneDetails}
          onClose={() => setSelectedPhoneDetails(null)}
          title={`${selectedPhoneDetails.brand} ${selectedPhoneDetails.model}`}
          description={`Stock Record: ${selectedPhoneDetails.storage} • ${selectedPhoneDetails.color}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              {canDelete ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeletePhone(selectedPhoneDetails.id)}
                  className="text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedPhoneDetails(null)}
                >
                  Close
                </Button>
                {(selectedPhoneDetails.status === 'In Stock' || (selectedPhoneDetails.status as string) === 'in_stock') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const p = selectedPhoneDetails;
                      setSelectedPhoneDetails(null);
                      openQuickSale(p);
                    }}
                  >
                    <Zap className="h-3.5 w-3.5 mr-1" />
                    Sell This Phone
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getPtaLabel(selectedPhoneDetails.ptaStatus).bg} ${getPtaLabel(selectedPhoneDetails.ptaStatus).color}`}>
                {getPtaLabel(selectedPhoneDetails.ptaStatus).label}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getConditionLabel(selectedPhoneDetails.condition).color}`}>
                {getConditionLabel(selectedPhoneDetails.condition).label}
              </span>
              {selectedPhoneDetails.batteryHealth && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedPhoneDetails.batteryHealth}% Battery Health
                </span>
              )}
            </div>

            {/* Pricing Details (Restricted to Owner) */}
            {canViewCosts && (
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
                <div>
                  <span className="text-[10px] text-slate-400">Purchase Cost</span>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{formatPKR(selectedPhoneDetails.purchasePrice)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Refurb/Glass</span>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{formatPKR(selectedPhoneDetails.refurbCost)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Total Net Cost</span>
                  <p className="font-bold text-slate-900 dark:text-white">{formatPKR(selectedPhoneDetails.totalCost)}</p>
                </div>
              </div>
            )}

            {/* Editable Asking Price */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20">
              <div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">Asking Selling Price</span>
                {isEditingPrice && canEditPrice ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={newSellingPrice}
                      onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                      className="w-32 rounded-lg border border-emerald-500 bg-white px-2 py-1 text-sm font-bold dark:bg-slate-900"
                    />
                    <Button size="sm" onClick={handleSavePrice}>Save</Button>
                  </div>
                ) : (
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {formatPKR(selectedPhoneDetails.sellingPrice)}
                  </p>
                )}
              </div>
              {!isEditingPrice && canEditPrice && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingPrice(true)}
                  className="text-xs border-emerald-400 text-emerald-700"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit Price
                </Button>
              )}
            </div>

            {/* IMEI details */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  IMEI 1: {selectedPhoneDetails.imei || (selectedPhoneDetails as any).imei1}
                </span>
                <button
                  onClick={() => handleCopyImei(selectedPhoneDetails.imei || (selectedPhoneDetails as any).imei1)}
                  className="p-1 text-slate-400 hover:text-emerald-600"
                  title="Copy IMEI"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {selectedPhoneDetails.imei2 && (
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    IMEI 2: {selectedPhoneDetails.imei2}
                  </span>
                  <button
                    onClick={() => handleCopyImei(selectedPhoneDetails.imei2!)}
                    className="p-1 text-slate-400 hover:text-emerald-600"
                    title="Copy IMEI 2"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Additional Specs */}
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
              <div>
                <span className="text-[10px] text-slate-400 block">SIM Type</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPhoneDetails.simType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Purchase Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(selectedPhoneDetails.purchaseDate)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Supplier / Source</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedPhoneDetails.purchaseSource || (selectedPhoneDetails as any).supplierName || 'Wholesale Market'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Accessories</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedPhoneDetails.accessories?.join(', ') || (selectedPhoneDetails as any).accessoriesIncluded?.join(', ') || 'None'}
                </span>
              </div>
            </div>

            {selectedPhoneDetails.notes && (
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="font-bold block mb-0.5">Notes:</span>
                {selectedPhoneDetails.notes}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
