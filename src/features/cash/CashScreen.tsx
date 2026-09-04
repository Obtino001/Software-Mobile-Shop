import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatPKR, formatDateTime } from '../../utils/formatters';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StatCard } from '../../components/ui/stat-card';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { useToast } from '../../components/ui/toast';
import { AccountType } from '../../types';
import { 
  Wallet, 
  Landmark, 
  ArrowLeftRight, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { CashTransaction } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';

export function CashScreen() {
  const { 
    transactions, 
    getCashInHand, 
    getBankBalance, 
    transferFunds,
    updateCashTransaction,
    deleteCashTransaction
  } = useAppStore();

  const { success, error } = useToast();
  const { hasPermission } = useAuthStore();
  const canEditRecords = hasPermission('records:edit');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<CashTransaction | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: ''
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<CashTransaction | null>(null);

  const cashInHand = getCashInHand();
  const bankBalance = getBankBalance();
  const totalLiquid = cashInHand + bankBalance;

  const [selectedAccount, setSelectedAccount] = useState<'all' | 'cash' | 'bank'>('all');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Transfer form
  const [fromAccount, setFromAccount] = useState<AccountType>('cash');
  const [toAccount, setToAccount] = useState<AccountType>('bank');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [recordedBy, setRecordedBy] = useState<'Yasir' | 'Saad'>('Yasir');

  const filteredTransactions = transactions.filter((t) => {
    if (selectedAccount === 'all') return true;
    return t.account === selectedAccount;
  });

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccount === toAccount) {
      error('Source and destination accounts must be different');
      return;
    }
    if (Number(transferAmount) <= 0) {
      error('Please enter a valid transfer amount');
      return;
    }

    const available = fromAccount === 'cash' ? cashInHand : bankBalance;
    if (Number(transferAmount) > available) {
      error(`Insufficient funds in ${fromAccount === 'cash' ? 'Cash Counter' : 'Bank Account'}`);
      return;
    }

    transferFunds({
      from: fromAccount,
      to: toAccount,
      amount: Number(transferAmount),
      notes: transferNotes || 'Internal Shop Fund Transfer',
      recordedBy,
    });

    success(
      'Funds Transferred',
      `${formatPKR(transferAmount)} moved from ${fromAccount === 'cash' ? 'Cash' : 'Bank'} to ${toAccount === 'cash' ? 'Cash' : 'Bank'}`
    );

    setIsTransferModalOpen(false);
    setTransferAmount(0);
    setTransferNotes('');
  };

  const handleEditClick = (e: React.MouseEvent, tx: CashTransaction) => {
    e.stopPropagation();
    setTransactionToEdit(tx);
    setEditForm({
      description: tx.description || '',
      amount: tx.amount.toString()
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionToEdit) return;

    const res = await updateCashTransaction(transactionToEdit.id, {
      description: editForm.description,
      amount: Number(editForm.amount)
    });

    if (res.success) {
      success('Transaction updated successfully');
      setIsEditOpen(false);
    } else {
      error(res.error || 'Failed to update transaction');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, tx: CashTransaction) => {
    e.stopPropagation();
    setTransactionToDelete(tx);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    const res = await deleteCashTransaction(transactionToDelete.id);
    if (res.success) {
      success('Transaction deleted');
      setIsDeleteOpen(false);
      setTransactionToDelete(null);
    } else {
      error(res.error || 'Failed to delete transaction');
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Cash & Bank Register
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time liquid cash, bank accounts & transaction ledger
          </p>
        </div>

        <Button
          onClick={() => setIsTransferModalOpen(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-4"
        >
          <ArrowLeftRight className="h-4 w-4 mr-1.5" />
          Transfer Cash / Bank
        </Button>
      </div>

      {/* Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          title="Cash in Hand (Galla)"
          value={formatPKR(cashInHand)}
          subtitle="Shop cash counter"
          icon={<Wallet className="h-5 w-5" />}
          color="emerald"
          highlight={selectedAccount === 'cash'}
          onClick={() => setSelectedAccount(selectedAccount === 'cash' ? 'all' : 'cash')}
        />
        <StatCard
          title="Bank / Raast"
          value={formatPKR(bankBalance)}
          subtitle="Meezan & SadaPay accounts"
          icon={<Landmark className="h-5 w-5" />}
          color="blue"
          highlight={selectedAccount === 'bank'}
          onClick={() => setSelectedAccount(selectedAccount === 'bank' ? 'all' : 'bank')}
        />
        <StatCard
          title="Total Liquid Funds"
          value={formatPKR(totalLiquid)}
          subtitle="Available for stock buying"
          icon={<ArrowLeftRight className="h-5 w-5" />}
          color="slate"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setSelectedAccount('all')}
          className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
            selectedAccount === 'all'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
              : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
          }`}
        >
          All Accounts ({transactions.length})
        </button>
        <button
          onClick={() => setSelectedAccount('cash')}
          className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
            selectedAccount === 'cash'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
          }`}
        >
          Cash Counter Only
        </button>
        <button
          onClick={() => setSelectedAccount('bank')}
          className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
            selectedAccount === 'bank'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
          }`}
        >
          Bank / Digital Only
        </button>
      </div>

      {/* Transactions Passbook Ledger */}
      <Card>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTransactions.map((tx) => {
            const isInflow = 
              tx.type === 'Sale Income' || 
              tx.type === 'Partner Investment' || 
              tx.type === 'Other Income' || 
              (tx.type as string) === 'in';

            const isTransfer = 
              tx.category === 'Internal Fund Transfer' || 
              (tx.type as string) === 'transfer';

            return (
              <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                    isInflow 
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                      : isTransfer
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                      : 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                  }`}>
                    {isInflow ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : isTransfer ? (
                      <ArrowLeftRight className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {tx.description}
                      </h4>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        tx.account === 'cash' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {tx.account || 'cash'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                        {tx.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDateTime(tx.date)} • {tx.recordedBy ? `Logged by ${tx.recordedBy}` : tx.category}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-black ${
                    isInflow 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : isTransfer 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {isInflow ? '+' : '-'}{formatPKR(tx.amount)}
                  </span>
                  {canEditRecords && (
                    <div className="flex gap-1 mt-1 justify-end">
                      <button onClick={(e) => handleEditClick(e, tx)} className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => handleDeleteClick(e, tx)} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Transfer Funds Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Funds"
        description="Shift money between Cash Counter and Bank Account"
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleTransfer}>
              Execute Transfer
            </Button>
          </div>
        }
      >
        <form onSubmit={handleTransfer} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="From Account *"
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value as AccountType)}
              options={[
                { label: `Cash (${formatPKR(cashInHand)})`, value: 'cash' },
                { label: `Bank (${formatPKR(bankBalance)})`, value: 'bank' },
              ]}
            />
            <Select
              label="To Account *"
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value as AccountType)}
              options={[
                { label: 'Bank Account', value: 'bank' },
                { label: 'Cash Counter', value: 'cash' },
              ]}
            />
          </div>

          <Input
            label="Transfer Amount (PKR) *"
            type="number"
            inputMode="numeric"
            value={transferAmount || ''}
            onChange={(e) => setTransferAmount(Number(e.target.value))}
            prefixText="PKR"
            required
          />

          <Input
            label="Memo / Reason"
            placeholder="e.g. Bank deposit from evening sales"
            value={transferNotes}
            onChange={(e) => setTransferNotes(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Authorized Partner *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRecordedBy('Yasir')}
                className={`flex h-11 items-center justify-center rounded-xl border text-xs font-bold transition-all ${
                  recordedBy === 'Yasir'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                Yasir
              </button>
              <button
                type="button"
                onClick={() => setRecordedBy('Saad')}
                className={`flex h-11 items-center justify-center rounded-xl border text-xs font-bold transition-all ${
                  recordedBy === 'Saad'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                Saad
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Transaction"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            required
          />
          <Input
            label="Amount (PKR)"
            type="number"
            value={editForm.amount}
            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
            required
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
        title="Delete Transaction?"
        message="This will permanently delete this cash transaction. This may affect your cash/bank balances. Are you absolutely sure?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setIsDeleteOpen(false)}
        variant="danger"
      />
    </div>
  );
}
