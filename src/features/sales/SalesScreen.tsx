import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatPKR, formatDate, formatDateTime, getPtaLabel } from '../../utils/formatters';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StatCard } from '../../components/ui/stat-card';
import { EmptyState } from '../../components/ui/empty-state';
import { SaleReceiptModal } from './SaleReceiptModal';
import { SaleRecord } from '../../types';
import { 
  Zap, 
  Search, 
  Share2, 
  TrendingUp, 
  CheckCircle2,
  Trash2,
  Edit3,
  Smartphone
} from 'lucide-react';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';

export function SalesScreen() {
  const { sales, openQuickSale, getTotalSales, getGrossProfit } = useAppStore();
  const { hasPermission, partnerName } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<SaleRecord | null>(null);
  const { success, error: toastError } = useToast();

  const canEditRecords = hasPermission('records:edit');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<SaleRecord | null>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<SaleRecord | null>(null);

  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    sellingPrice: '',
    notes: ''
  });

  const canViewFinancials = hasPermission('financials:view');
  const totalRevenue = getTotalSales();
  const totalProfit = getGrossProfit();
  const avgProfit = sales.length > 0 ? Math.round(totalProfit / sales.length) : 0;

  const filteredSales = sales.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const inv = s.invoiceNumber || '';
    const snap = s.phoneSnapshot;
    return (
      !q ||
      inv.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      (snap && snap.model.toLowerCase().includes(q)) ||
      (snap && snap.brand.toLowerCase().includes(q)) ||
      (snap && snap.imei1 && snap.imei1.includes(q))
    );
  });

  const handleEditClick = (e: React.MouseEvent, sale: SaleRecord) => {
    e.stopPropagation();
    setSaleToEdit(sale);
    setEditForm({
      customerName: sale.customerName || '',
      customerPhone: sale.customerPhone || '',
      sellingPrice: (sale.sellingPrice || sale.salePrice)?.toString() || '',
      notes: sale.notes || ''
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToEdit) return;
    
    const res = await useAppStore.getState().updateSale(saleToEdit.id, {
      customerName: editForm.customerName,
      customerPhone: editForm.customerPhone,
      sellingPrice: Number(editForm.sellingPrice),
      notes: editForm.notes
    });

    if (res.success) {
      success('Sale updated successfully');
      setIsEditOpen(false);
    } else {
      toastError(res.error || 'Failed to update sale');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, sale: SaleRecord) => {
    e.stopPropagation();
    setSaleToDelete(sale);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!saleToDelete) return;
    const res = await useAppStore.getState().deleteSale(saleToDelete.id);
    
    if (res.success) {
      success('Sale deleted completely');
      setIsDeleteOpen(false);
      setSaleToDelete(null);
    } else {
      toastError(res.error || 'Failed to delete sale');
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Sales & Invoices (POS)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Completed smartphone sales, customer warranty slips & transactions
          </p>
        </div>

        <Button
          onClick={() => openQuickSale()}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-4"
        >
          <Zap className="h-4 w-4 mr-1.5 fill-current" />
          New Quick Sale
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          title="Total Sales Revenue"
          value={formatPKR(totalRevenue)}
          subtitle={`${sales.length} invoices issued`}
          icon={<Smartphone className="h-5 w-5" />}
          color="emerald"
        />

        {canViewFinancials ? (
          <>
            <StatCard
              title="Total Gross Profit"
              value={formatPKR(totalProfit)}
              subtitle="Net sales margin"
              icon={<TrendingUp className="h-5 w-5" />}
              color="amber"
              highlight
            />
            <StatCard
              title="Avg Profit / Device"
              value={formatPKR(avgProfit)}
              subtitle="Average margin per unit"
              icon={<CheckCircle2 className="h-5 w-5" />}
              color="blue"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Units Sold"
              value={`${sales.length} Phones`}
              subtitle="All time realized sales"
              icon={<CheckCircle2 className="h-5 w-5" />}
              color="blue"
            />
            <StatCard
              title="Active Counter"
              value={partnerName}
              subtitle="Logged in sales user"
              icon={<Zap className="h-5 w-5" />}
              color="amber"
            />
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Invoice #, Customer, Model, or IMEI..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-10 pr-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Sales Invoices List */}
      {filteredSales.length === 0 ? (
        <EmptyState
          title="No Sales Invoices Found"
          description="Issue your first mobile phone warranty invoice using Quick Sale POS."
          actionText="New Quick Sale"
          onAction={() => openQuickSale()}
        />
      ) : (
        <div className="space-y-3">
          {filteredSales.map((sale) => {
            const snap = sale.phoneSnapshot;
            const pta = getPtaLabel(snap?.ptaStatus);

            return (
              <Card
                key={sale.id}
                onClick={() => setSelectedReceipt(sale)}
                className="p-4 hover:border-emerald-500/40 cursor-pointer select-none active:scale-[0.99]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {sale.invoiceNumber || 'INV-001'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(sale.date)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${pta.bg} ${pta.color}`}>
                        {pta.short}
                      </span>
                      <span className="rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 text-[9px] font-bold">
                        {sale.warrantyDays || 7}d Warranty
                      </span>

                      {canEditRecords && (
                        <div className="flex gap-1 ml-auto sm:ml-2">
                          <button onClick={(e) => handleEditClick(e, sale)} className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => handleDeleteClick(e, sale)} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {snap ? `${snap.brand} ${snap.model} (${snap.storage})` : 'Sold Device'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Customer: <b className="text-slate-700 dark:text-slate-300">{sale.customerName}</b> ({sale.customerPhone})
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400">Sale Amount</span>
                    <p className="text-base font-black text-slate-900 dark:text-white">
                      {formatPKR(sale.sellingPrice || sale.salePrice)}
                    </p>
                    {canViewFinancials && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatPKR(sale.profit || 0)} profit
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    <span>Sold by: <b className="text-slate-700 dark:text-slate-300">{sale.soldBy}</b></span>
                    <span>Paid: <b className="capitalize">{sale.paymentMethod}</b></span>
                    {sale.isExchange && (
                      <span className="text-amber-600 font-semibold">(Trade-in included)</span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReceipt(sale);
                    }}
                    className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-300 dark:text-emerald-400"
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Receipt
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SaleReceiptModal
        sale={selectedReceipt}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Sale Record"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Customer Name"
            value={editForm.customerName}
            onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
            required
          />
          <Input
            label="Customer Phone"
            value={editForm.customerPhone}
            onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
          />
          <Input
            label="Selling Price"
            type="number"
            value={editForm.sellingPrice}
            onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })}
            required
          />
          <Input
            label="Notes (Optional)"
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
          />
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Sale Record?"
        message="This will permanently delete the sale and any associated cash inflow. Are you absolutely sure?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setIsDeleteOpen(false)}
        variant="danger"
      />
    </div>
  );
}
