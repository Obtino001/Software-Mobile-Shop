import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { useToast } from '../../components/ui/toast';
import { 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck,
  Smartphone
} from 'lucide-react';

export function SettingsScreen() {
  const { 
    settings, 
    updateSettings, 
    exportDatabaseJson, 
    importDatabaseJson, 
    resetAllData,
    fetchInitialData 
  } = useAppStore();

  const { success, error } = useToast();

  const [shopName, setShopName] = useState(settings.businessName || (settings as any).shopName || 'Yasir & Saad Mobile Trading');
  const [tagline, setTagline] = useState(settings.tagline || '');
  const [currency, setCurrency] = useState(settings.currency || 'PKR');
  const [monthlyExpenseTarget, setMonthlyExpenseTarget] = useState(settings.monthlyExpenseTarget || 55000);
  const [defaultPartnerSplit, setDefaultPartnerSplit] = useState(settings.defaultPartnerSplit || 50);
  const [phone, setPhone] = useState(settings.phone || '');
  const [address, setAddress] = useState(settings.address || '');
  const [city, setCity] = useState(settings.city || '');
  const [warrantyDays, setWarrantyDays] = useState(settings.defaultWarrantyDays || 7);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(settings.categoryBudgets || { Food: 6000, Water: 1500 });

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      businessName: shopName,
      tagline,
      currency,
      monthlyExpenseTarget: Number(monthlyExpenseTarget),
      defaultPartnerSplit: Number(defaultPartnerSplit),
      phone,
      address,
      city,
      defaultWarrantyDays: Number(warrantyDays),
      categoryBudgets,
    });
    success('Settings Saved', 'Business profile and financial parameters updated');
  };

  const handleExportBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PakMobile_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success('Backup Downloaded', 'Database exported as JSON');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importDatabaseJson(content)) {
        success('Backup Restored', 'Database restored successfully from file');
      } else {
        error('Invalid Backup File', 'Failed to parse the uploaded JSON database');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Shop Settings & Backup
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Invoice header details, data export/import & preferences
        </p>
      </div>

      {/* Shop Profile Form */}
      <Card className="p-5">
        <CardHeader>
          <CardTitle>Business Information (Printed on Invoices)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-3.5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Shop Business Name *"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
              />
              <Input
                label="Tagline / Subtitle"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="WhatsApp / Phone Contact *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <Input
                label="City & Market *"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>

            <Input
              label="Shop Physical Address *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Operational Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
              />
              <Input
                label="Monthly Expense Budget Target"
                type="number"
                value={monthlyExpenseTarget}
                onChange={(e) => setMonthlyExpenseTarget(Number(e.target.value))}
                prefixText="PKR"
                required
              />
              <Input
                label="Default Partner Split (%)"
                type="number"
                value={defaultPartnerSplit}
                onChange={(e) => setDefaultPartnerSplit(Number(e.target.value))}
                prefixText="%"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Default Checking Warranty"
                value={warrantyDays}
                onChange={(e) => setWarrantyDays(Number(e.target.value))}
                options={[
                  { label: '3 Days Checking', value: 3 },
                  { label: '7 Days Checking Warranty', value: 7 },
                  { label: '14 Days Checking Warranty', value: 14 },
                  { label: '30 Days Checking Warranty', value: 30 },
                ]}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary">
                Save Business Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Category Budgets */}
      <Card className="p-5">
        <CardHeader>
          <CardTitle>Category Monthly Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 pt-1">
            <p className="text-xs text-slate-500">Set limits for specific expense categories (used for dashboard warnings).</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Food', 'Water', 'Rent', 'Electricity', 'Internet', 'Transport', 'Packaging', 'Marketing'].map(cat => (
                <div key={cat}>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">{cat}</label>
                  <input
                    type="number"
                    value={categoryBudgets[cat] || ''}
                    onChange={(e) => setCategoryBudgets({ ...categoryBudgets, [cat]: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-black/[0.08] bg-[#FAFAFA] text-sm focus:border-[#E06349] focus:ring-1 focus:ring-[#E06349] transition-all"
                    placeholder="e.g. 5000"
                  />
                </div>
              ))}
            </div>
            <div className="pt-2 flex justify-end">
              <Button onClick={(e: any) => handleSaveProfile(e)} variant="primary">
                Save Category Budgets
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Firebase Cloud Connection Status */}
      <Card className="p-5 border-emerald-500/30 bg-emerald-950/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <CardTitle className="text-sm font-bold text-emerald-400">
                Firebase PostgreSQL Cloud Backend
              </CardTitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                fetchInitialData();
                success('Cloud Sync Triggered', 'Refreshing latest data from Firebase PostgreSQL...');
              }}
              className="text-xs h-8"
            >
              Sync Now
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Connected Project URL</span>
              <span className="font-mono text-emerald-400 text-[11px] truncate block">
                https://xmalyonlsdzmyfiswuvp.firebase.co
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Security Architecture</span>
              <span className="text-slate-300 text-[11px] block">
                Row Level Security (RLS) & Public Anon Key
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All records for inventory, sales, purchases, expenses, and partner capital are synchronized with Firebase PostgreSQL as the primary source of truth.
          </p>
        </CardContent>
      </Card>

      {/* Database Backup & Restore */}
      <Card className="p-5">
        <CardHeader>
          <CardTitle>Data Backup & Safety</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Your business records are stored locally in your browser storage. Download periodic backups to keep your data safe and transfer between devices.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleExportBackup}
              className="h-12 justify-start px-4 text-xs font-bold"
            >
              <Download className="h-4 w-4 mr-2 text-emerald-600" />
              Download Database Backup (JSON)
            </Button>

            <label className="flex h-12 items-center justify-start rounded-xl border border-slate-300 dark:border-slate-700 px-4 text-xs font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all select-none">
              <Upload className="h-4 w-4 mr-2 text-blue-600" />
              Restore Database from File
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset Demo Data */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Reset to Default Demo Data
              </h4>
              <p className="text-[11px] text-slate-400">
                Restores Yasir & Saad initial PKR 500,000 capital and sample phones.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsResetConfirmOpen(true)}
              className="text-xs shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          resetAllData();
          success('Data Reset', 'All records reset to initial PKR 500,000 state');
        }}
        title="Reset All Business Data?"
        message="This will overwrite current inventory and sales with initial PKR 500,000 sample records. Make sure to download a backup first if you have important data."
        confirmText="Yes, Reset"
      />
    </div>
  );
}
