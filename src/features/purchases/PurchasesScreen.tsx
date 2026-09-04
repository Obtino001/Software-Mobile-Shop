import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatPKR, formatDate } from '../../utils/formatters';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StatCard } from '../../components/ui/stat-card';
import { EmptyState } from '../../components/ui/empty-state';
import { Plus, Search, ArrowDownLeft, ShieldCheck, User, Smartphone, CheckCircle, Trash2, Edit3 } from 'lucide-react';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/toast';
import { Purchase } from '../../types';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';

export function PurchasesScreen() {
  const { purchases, openQuickPurchase, getTotalPurchases, getStockCount } = useAppStore();
  const { hasPermission, partnerName } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const { success, error: toastError } = useToast();
  
  const canEditRecords = hasPermission('records:edit');
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  
  const [editForm, setEditForm] = useState({
    supplier: '',
    amount: '',
    notes: ''
  });

  const canViewFinancials = hasPermission('financials:view');
  const totalSpent = getTotalPurchases();
  const inStockCount = getStockCount();
  const avgCost = purchases.length > 0 ? Math.round(totalSpent / purchases.length) : 0;

  const filteredPurchases = purchases.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const supplierName = p.supplier || (p as any).sellerName || '';
    const imeiStr = p.imei || (p as any).imei1 || '';
    return (
      !q ||
      (p.model && p.model.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      supplierName.toLowerCase().includes(q) ||
      imeiStr.includes(q)
    );
  });

  const handleEditClick = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setEditForm({
      supplier: purchase.supplier || '',
      amount: purchase.amount?.toString() || '',
      notes: purchase.notes || ''
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;
    
    const res = await useAppStore.getState().updatePurchase(selectedPurchase.id, {
      supplier: editForm.supplier,
      amount: Number(editForm.amount),
      notes: editForm.notes
    });

    if (res.success) {
      success('Purchase updated successfully');
      setIsEditOpen(false);
    } else {
      toastError(res.error || 'Failed to update purchase');
    }
  };

  const handleDeleteClick = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!purchaseToDelete) return;
    const res = await useAppStore.getState().deletePurchase(purchaseToDelete.id);
    
    if (res.success) {
      success('Purchase deleted completely');
      setIsDeleteOpen(false);
      setPurchaseToDelete(null);
    } else {
      toastError(res.error || 'Failed to delete purchase');
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Purchases & Stock In
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log of phones acquired from dealers and walk-in customers
          </p>
        </div>

        <Button
          onClick={openQuickPurchase}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-4"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Stock In Phone
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          title="Total Stock Purchases"
          value={purchases.length}
          subtitle="Phones logged into inventory"
          icon={<ArrowDownLeft className="h-5 w-5" />}
          color="blue"
        />

        {canViewFinancials ? (
          <>
            <StatCard
              title="Total Capital Deployed"
              value={formatPKR(totalSpent)}
              subtitle="Cash & Bank outflow"
              icon={<ShieldCheck className="h-5 w-5" />}
              color="slate"
            />
            <StatCard
              title="Avg Unit Cost"
              value={formatPKR(avgCost)}
              subtitle="Average phone procurement"
              icon={<User className="h-5 w-5" />}
              color="emerald"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Currently In Stock"
              value={`${inStockCount} Phones`}
              subtitle="Available for sale"
              icon={<Smartphone className="h-5 w-5" />}
              color="emerald"
            />
            <StatCard
              title="Procurement Officer"
              value={partnerName}
              subtitle="Logged in user"
              icon={<CheckCircle className="h-5 w-5" />}
              color="slate"
            />
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Purchase #, Model, Seller, or IMEI..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-10 pr-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Purchases List */}
      {filteredPurchases.length === 0 ? (
        <EmptyState
          title="No Purchases Found"
          description="Record your phone stock purchases from suppliers or customers."
          actionText="Stock In Phone"
          onAction={openQuickPurchase}
        />
      ) : (
        <div className="space-y-3">
          {filteredPurchases.map((purchase) => {
            const supplierName = purchase.supplier || (purchase as any).sellerName || 'Market Trader';
            const imeiVal = purchase.imei || (purchase as any).imei1;

            return (
              <Card key={purchase.id} className="p-4 select-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {purchase.purchaseNumber || 'PUR-001'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(purchase.date)}
                      </span>
                      <span className="rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 text-[9px] font-bold">
                        {purchase.purchaseType || 'Stock In'}
                      </span>
                      
                      {canEditRecords && (
                        <div className="flex gap-1 ml-auto sm:ml-2">
                          <button onClick={() => handleEditClick(purchase)} className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteClick(purchase)} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {purchase.brand} {purchase.model} {purchase.storage ? `(${purchase.storage})` : ''}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Seller: <b className="text-slate-700 dark:text-slate-300">{supplierName}</b>
                      {purchase.sellerPhone ? ` (${purchase.sellerPhone})` : ''}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400">Purchase Cost</span>
                    <p className="text-base font-black text-slate-900 dark:text-white">
                      {canViewFinancials 
                        ? formatPKR(purchase.amount || purchase.purchasePrice || 0)
                        : '• • • • • •'}
                    </p>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                      Via {purchase.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    {imeiVal && <span>IMEI: <b className="font-mono text-slate-700 dark:text-slate-300">{imeiVal}</b></span>}
                    {purchase.color && <span>Color: <b>{purchase.color}</b></span>}
                    {(purchase as any).condition && <span>Condition: <b>{(purchase as any).condition}</b></span>}
                  </div>

                  {purchase.notes && (
                    <span className="text-[10px] text-slate-400 italic line-clamp-1 max-w-xs">
                      {purchase.notes}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Purchase Record"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Supplier / Seller Name"
            value={editForm.supplier}
            onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
            required
          />
          <Input
            label="Purchase Amount (Cost)"
            type="number"
            value={editForm.amount}
            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
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
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Purchase Record?"
        message="This will permanently delete the purchase and any associated cash outflow. The phone will remain in inventory unless deleted separately. Are you absolutely sure?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setIsDeleteOpen(false)}
        variant="danger"
      />
    </div>
  );
}
