import React from 'react';
import { SaleRecord } from '../../types';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { formatPKR, formatDate, formatDateTime, getPtaLabel } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../../components/ui/toast';
import { Printer, Share2, Check, Smartphone, ShieldCheck } from 'lucide-react';

interface SaleReceiptModalProps {
  sale: SaleRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SaleReceiptModal({ sale, isOpen, onClose }: SaleReceiptModalProps) {
  const { settings } = useAppStore();
  const { success } = useToast();

  if (!sale) return null;

  const shopTitle = settings.businessName || settings.shopName || 'Yasir & Saad Mobile Trading';
  const snapshot = sale.phoneSnapshot || {
    brand: 'Mobile',
    model: 'Device',
    storage: 'Standard',
    color: 'Standard',
    ptaStatus: 'official_approved',
    imei1: 'N/A'
  };
  const ptaInfo = getPtaLabel(snapshot.ptaStatus);
  const effectiveSalePrice = sale.sellingPrice || sale.salePrice || 0;

  const handleCopyWhatsApp = () => {
    const text = `*${shopTitle.toUpperCase()}*\n${settings.tagline || ''}\nPh: ${settings.phone || ''}\n-----------------------------------\n*INVOICE: ${sale.invoiceNumber || 'INV-001'}*\nDate: ${formatDateTime(sale.date)}\nCustomer: ${sale.customerName} (${sale.customerPhone})\n-----------------------------------\n*DEVICE SOLD:*\n${snapshot.brand} ${snapshot.model} (${snapshot.storage})\nIMEI: ${snapshot.imei1}\nPTA Status: ${ptaInfo.short}\n-----------------------------------\n*PRICE & PAYMENT:*\nSale Price: ${formatPKR(effectiveSalePrice)}\n${sale.isExchange ? `Trade-In Deduction: -${formatPKR(sale.exchangeDeduction || 0)}\n` : ''}*Net Paid: ${formatPKR(sale.netCashReceived || effectiveSalePrice)}*\nPayment Mode: ${String(sale.paymentMethod).toUpperCase()}\n-----------------------------------\n*WARRANTY:* ${sale.warrantyDays || 7} Days Checking Warranty\nExpiry: ${formatDate(sale.warrantyExpiryDate)}\nSold by: ${sale.soldBy || 'Staff'}\n\n_Thank you for your business!_`;

    navigator.clipboard.writeText(text);
    success('Copied to Clipboard!', 'Ready to paste directly into customer WhatsApp chat.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Sales Invoice"
      description="Customer warranty receipt & verification slip"
      maxWidth="md"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button variant="secondary" onClick={onClose} size="sm">
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} size="sm">
              <Printer className="h-4 w-4 mr-1.5" />
              Print
            </Button>
            <Button variant="primary" onClick={handleCopyWhatsApp} size="sm">
              <Share2 className="h-4 w-4 mr-1.5" />
              WhatsApp Slip
            </Button>
          </div>
        </div>
      }
    >
      <div id="printable-receipt" className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 shadow-sm">
        {/* Header */}
        <div className="text-center pb-4 border-b border-dashed border-slate-200 dark:border-slate-800">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white mb-2">
            <Smartphone className="h-5 w-5" />
          </div>
          <h3 className="text-base font-black tracking-tight uppercase">{shopTitle}</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{settings.tagline}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{settings.address}, {settings.city}</p>
          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">📞 {settings.phone}</p>
        </div>

        {/* Invoice Meta */}
        <div className="py-3 border-b border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Invoice #</span>
            <span className="font-mono font-black text-slate-900 dark:text-white">{sale.invoiceNumber || 'INV-001'}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Date & Time</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">{formatDateTime(sale.date)}</span>
          </div>
        </div>

        {/* Customer Details */}
        <div className="py-2.5 border-b border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Info:</span>
          <div className="flex justify-between items-center mt-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">{sale.customerName}</span>
            <span className="text-slate-500 dark:text-slate-400">{sale.customerPhone}</span>
          </div>
        </div>

        {/* Phone Details */}
        <div className="py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
            Purchased Smartphone
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {snapshot.brand} {snapshot.model}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ptaInfo.bg} ${ptaInfo.color}`}>
                {ptaInfo.short}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3">
              <span>Storage: <b>{snapshot.storage}</b></span>
              <span>Color: <b>{snapshot.color}</b></span>
              {snapshot.batteryHealth && (
                <span>Battery: <b>{snapshot.batteryHealth}%</b></span>
              )}
            </div>
            <div className="font-mono text-[10px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
              IMEI: {snapshot.imei1}
            </div>
          </div>
        </div>

        {/* Trade In details if any */}
        {sale.isExchange && (sale.exchangeDetails || sale.exchangePhoneDetails) && (
          <div className="py-2.5 border-b border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Trade-In Exchange Device:</span>
            <div className="flex justify-between text-slate-700 dark:text-slate-300 mt-1">
              <span>
                {(sale.exchangeDetails || sale.exchangePhoneDetails)?.brand} {(sale.exchangeDetails || sale.exchangePhoneDetails)?.model} ({(sale.exchangeDetails || sale.exchangePhoneDetails)?.storage})
              </span>
              <span className="font-bold text-rose-600">-{formatPKR(sale.exchangeDeduction)}</span>
            </div>
          </div>
        )}

        {/* Financial Totals */}
        <div className="py-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal:</span>
            <span>{formatPKR(effectiveSalePrice)}</span>
          </div>
          {sale.isExchange && (
            <div className="flex justify-between text-rose-600 font-semibold">
              <span>Trade-In Credit:</span>
              <span>-{formatPKR(sale.exchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>Net Paid Amount:</span>
            <span className="text-emerald-600 dark:text-emerald-400">{formatPKR(sale.netCashReceived)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Payment Mode:</span>
            <span className="capitalize">{sale.paymentMethod === 'cash' ? 'Cash at Counter' : sale.paymentMethod === 'bank_transfer' ? `Bank Transfer (${sale.bankName})` : `Split (Cash: ${formatPKR(sale.cashAmount)} + Bank: ${formatPKR(sale.bankAmount)})`}</span>
          </div>
        </div>

        {/* Warranty Badge & Terms */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-3 dark:bg-emerald-950/20 text-center text-xs">
          <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>{sale.warrantyDays} Days Checking Warranty Active</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Valid until {formatDate(sale.warrantyExpiryDate)}. Waterpack seal tampering, physical damage, and display drops void warranty.
          </p>
        </div>
      </div>
    </Modal>
  );
}
