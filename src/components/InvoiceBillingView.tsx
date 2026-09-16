import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PurchaseOrder } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { triggerPrintOrPdf, downloadElementAsPdf } from '../utils/exportPdf';
import { 
  FileText, 
  Printer, 
  Download, 
  Search, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Filter, 
  Trash2, 
  CreditCard, 
  Eye, 
  X, 
  Sparkles,
  ArrowUpDown,
  Edit3,
  Sliders,
  Package,
  Layers,
  Check,
  RotateCcw,
  Info,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export interface CalculatedInvoiceItem {
  index: number;
  namaPallet: string;
  tipeIspm: string;
  poQty: number;
  invoiceQty: number;
  sisaQty: number;
  hargaSatuan: number;
  subtotal: number;
  isPartial: boolean;
}

export interface CalculatedPOInvoice {
  po: PurchaseOrder;
  items: CalculatedInvoiceItem[];
  totalPoQty: number;
  totalInvoiceQty: number;
  totalSisaQty: number;
  subtotalDpp: number;
  ppnNominal: number;
  pphNominal: number;
  totalTagihan: number;
  invoicingStatus: 'LENGKAP' | 'PARSIAL' | 'BELUM_INVOICE';
  percentInvoiced: number;
}

export function calculatePOInvoiceDetails(po: PurchaseOrder): CalculatedPOInvoice {
  const items: CalculatedInvoiceItem[] = (po.item || []).map((item, index) => {
    const poQty = Number(item.jumlah) || 0;
    // If jumlahInvoice is defined, use it; otherwise default to poQty
    const invoiceQty = typeof item.jumlahInvoice === 'number' ? Math.max(0, Number(item.jumlahInvoice)) : poQty;
    const sisaQty = Math.max(0, poQty - invoiceQty);
    const hargaSatuan = Number(item.hargaSatuan) || 0;
    const subtotal = invoiceQty * hargaSatuan;
    const isPartial = invoiceQty < poQty;

    return {
      index,
      namaPallet: item.namaPallet || (item as any).namaItem || 'Pallet Kayu',
      tipeIspm: item.tipeIspm || 'Lokal',
      poQty,
      invoiceQty,
      sisaQty,
      hargaSatuan,
      subtotal,
      isPartial
    };
  });

  const totalPoQty = items.reduce((acc, i) => acc + i.poQty, 0);
  const totalInvoiceQty = items.reduce((acc, i) => acc + i.invoiceQty, 0);
  const totalSisaQty = items.reduce((acc, i) => acc + i.sisaQty, 0);
  const subtotalDpp = items.reduce((acc, i) => acc + i.subtotal, 0);

  const hasPpn = po.tipePajak === 'PPN' || po.tipePajak === 'PPN & PPh' || (po.ppnNominal !== undefined && po.ppnNominal > 0);
  const hasPph = po.tipePajak === 'PPh' || po.tipePajak === 'PPN & PPh' || (po.pphNominal !== undefined && po.pphNominal > 0);

  const ppnNominal = hasPpn ? Math.round(subtotalDpp * 0.11) : 0;
  const pphNominal = hasPph ? Math.round(subtotalDpp * 0.02) : 0;
  const totalTagihan = subtotalDpp + ppnNominal - pphNominal;

  let invoicingStatus: 'LENGKAP' | 'PARSIAL' | 'BELUM_INVOICE' = 'LENGKAP';
  if (totalInvoiceQty === 0) {
    invoicingStatus = 'BELUM_INVOICE';
  } else if (totalSisaQty > 0) {
    invoicingStatus = 'PARSIAL';
  }

  const percentInvoiced = totalPoQty > 0 ? Math.round((totalInvoiceQty / totalPoQty) * 100) : 100;

  return {
    po,
    items,
    totalPoQty,
    totalInvoiceQty,
    totalSisaQty,
    subtotalDpp,
    ppnNominal,
    pphNominal,
    totalTagihan,
    invoicingStatus,
    percentInvoiced
  };
}

export const InvoiceBillingView: React.FC = () => {
  const { purchaseOrders, updatePurchaseOrder, updateInvoiceStatus, deletePurchaseOrder, currentUser, customers } = useApp();
  
  // Filters & Period State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Lunas' | 'Belum Lunas' | 'Jatuh Tempo'>('Semua');
  const [invoicingFilter, setInvoicingFilter] = useState<'Semua' | 'LENGKAP' | 'PARSIAL' | 'BELUM_INVOICE'>('Semua');
  const [customerFilter, setCustomerFilter] = useState('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodPreset, setPeriodPreset] = useState<'all' | 'this_month' | 'last_month' | 'custom'>('this_month');

  // Preview & Action Modals
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [previewMode, setPreviewMode] = useState<'single' | 'summary' | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  const [paymentModalPO, setPaymentModalPO] = useState<PurchaseOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Transfer Bank Mandiri' | 'Cash / Tunai'>('Transfer Bank Mandiri');

  // Edit Qty Invoicing State
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [itemQtyDraft, setItemQtyDraft] = useState<{ [index: number]: number }>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Set default dates on preset change
  const handlePresetChange = (preset: 'all' | 'this_month' | 'last_month' | 'custom') => {
    setPeriodPreset(preset);
    const now = new Date();
    if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'last_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Initialize this month date
  React.useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  // Compute calculated invoice details for all purchase orders
  const calculatedPOs = useMemo(() => {
    return purchaseOrders.map(po => calculatePOInvoiceDetails(po));
  }, [purchaseOrders]);

  // Filtered Invoices
  const filteredCalculatedInvoices = useMemo(() => {
    return calculatedPOs.filter(calc => {
      const { po, invoicingStatus } = calc;
      // Search (supports Invoice No, PO No, JO No, Customer)
      const matchesSearch = 
        (po.nomorInvoice?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        po.nomorPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.nomorJO && po.nomorJO.toLowerCase().includes(searchTerm.toLowerCase())) ||
        po.pelanggan.toLowerCase().includes(searchTerm.toLowerCase());

      // Status Pembayaran
      const matchesStatus = 
        statusFilter === 'Semua' ? true :
        statusFilter === 'Lunas' ? po.statusInvoice === 'Lunas' :
        statusFilter === 'Belum Lunas' ? (po.statusInvoice === 'Belum Bayar' || (po.statusInvoice as string) === 'Belum Lunas') :
        po.statusInvoice === 'Jatuh Tempo';

      // Status Invoicing (Lengkap / Parsial / Belum)
      const matchesInvoicing = 
        invoicingFilter === 'Semua' ? true :
        invoicingStatus === invoicingFilter;

      // Customer
      const matchesCustomer = customerFilter === 'Semua' || po.pelanggan === customerFilter;

      // Date Period
      let matchesDate = true;
      const orderDate = po.tanggalInvoice || po.tanggal;
      if (startDate && orderDate) {
        matchesDate = matchesDate && orderDate >= startDate;
      }
      if (endDate && orderDate) {
        matchesDate = matchesDate && orderDate <= endDate;
      }

      return matchesSearch && matchesStatus && matchesInvoicing && matchesCustomer && matchesDate;
    });
  }, [calculatedPOs, searchTerm, statusFilter, invoicingFilter, customerFilter, startDate, endDate]);

  // Aggregated Summary Calculations
  const totalNilaiTagihan = useMemo(() => {
    return filteredCalculatedInvoices.reduce((acc, c) => acc + c.totalTagihan, 0);
  }, [filteredCalculatedInvoices]);

  const totalTerbayar = useMemo(() => {
    return filteredCalculatedInvoices
      .filter(c => c.po.statusInvoice === 'Lunas')
      .reduce((acc, c) => acc + c.totalTagihan, 0);
  }, [filteredCalculatedInvoices]);

  const totalBelumLunas = useMemo(() => {
    return filteredCalculatedInvoices
      .filter(c => c.po.statusInvoice !== 'Lunas')
      .reduce((acc, c) => acc + c.totalTagihan, 0);
  }, [filteredCalculatedInvoices]);

  const totalPoQtyAll = useMemo(() => {
    return filteredCalculatedInvoices.reduce((acc, c) => acc + c.totalPoQty, 0);
  }, [filteredCalculatedInvoices]);

  const totalInvoicedQtyAll = useMemo(() => {
    return filteredCalculatedInvoices.reduce((acc, c) => acc + c.totalInvoiceQty, 0);
  }, [filteredCalculatedInvoices]);

  const totalSisaQtyAll = useMemo(() => {
    return filteredCalculatedInvoices.reduce((acc, c) => acc + c.totalSisaQty, 0);
  }, [filteredCalculatedInvoices]);

  // Unique Customer list
  const uniqueCustomers = useMemo(() => {
    const set = new Set(purchaseOrders.map(p => p.pelanggan));
    return Array.from(set);
  }, [purchaseOrders]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Open Edit Qty Modal
  const handleOpenEditQty = (po: PurchaseOrder) => {
    const draft: { [index: number]: number } = {};
    (po.item || []).forEach((item, idx) => {
      draft[idx] = typeof item.jumlahInvoice === 'number' ? item.jumlahInvoice : item.jumlah;
    });
    setItemQtyDraft(draft);
    setEditingPO(po);
    setSaveSuccessMessage(null);
  };

  // Save customized QTY into PO
  const handleSaveEditedQty = (andPrint: boolean = false) => {
    if (!editingPO) return;

    const updatedItems = (editingPO.item || []).map((it, idx) => {
      const draftQty = typeof itemQtyDraft[idx] === 'number' ? Math.max(0, Math.min(it.jumlah, itemQtyDraft[idx])) : it.jumlah;
      return {
        ...it,
        jumlahInvoice: draftQty
      };
    });

    // Recalculate totals
    const subtotalDpp = updatedItems.reduce((acc, i) => acc + ((i.jumlahInvoice ?? i.jumlah) * i.hargaSatuan), 0);
    const hasPpn = editingPO.tipePajak === 'PPN' || editingPO.tipePajak === 'PPN & PPh' || (editingPO.ppnNominal !== undefined && editingPO.ppnNominal > 0);
    const hasPph = editingPO.tipePajak === 'PPh' || editingPO.tipePajak === 'PPN & PPh' || (editingPO.pphNominal !== undefined && editingPO.pphNominal > 0);
    const ppnNominal = hasPpn ? Math.round(subtotalDpp * 0.11) : 0;
    const pphNominal = hasPph ? Math.round(subtotalDpp * 0.02) : 0;
    const totalHarga = subtotalDpp + ppnNominal - pphNominal;

    const updatedPOData: Partial<PurchaseOrder> = {
      item: updatedItems,
      subtotalHarga: subtotalDpp,
      ppnNominal,
      pphNominal,
      totalHarga
    };

    updatePurchaseOrder(editingPO.id, updatedPOData);

    const savedPO: PurchaseOrder = {
      ...editingPO,
      ...updatedPOData
    };

    setSaveSuccessMessage('Kuantitas cetak invoice berhasil diperbarui & disimpan!');
    
    setTimeout(() => {
      setSaveSuccessMessage(null);
      if (andPrint) {
        setEditingPO(null);
        setSelectedPO(savedPO);
        setPreviewMode('single');
      } else {
        setEditingPO(null);
      }
    }, 600);
  };

  const handlePrintSingle = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setPreviewMode('single');
  };

  const handlePrintSummary = () => {
    setPreviewMode('summary');
  };

  // Get active calculation for selected PO preview
  const selectedPOCalc = useMemo(() => {
    if (!selectedPO) return null;
    return calculatePOInvoiceDetails(selectedPO);
  }, [selectedPO]);

  // Draft calculation for edit modal
  const editingDraftCalc = useMemo(() => {
    if (!editingPO) return null;
    const items = (editingPO.item || []).map((it, idx) => {
      const poQty = Number(it.jumlah) || 0;
      const invoiceQty = typeof itemQtyDraft[idx] === 'number' ? Math.max(0, itemQtyDraft[idx]) : poQty;
      const sisaQty = Math.max(0, poQty - invoiceQty);
      const hargaSatuan = Number(it.hargaSatuan) || 0;
      const subtotal = invoiceQty * hargaSatuan;
      return {
        namaPallet: it.namaPallet || (it as any).namaItem || 'Pallet Kayu',
        tipeIspm: it.tipeIspm || 'Lokal',
        poQty,
        invoiceQty,
        sisaQty,
        hargaSatuan,
        subtotal
      };
    });

    const totalPoQty = items.reduce((acc, i) => acc + i.poQty, 0);
    const totalInvoiceQty = items.reduce((acc, i) => acc + i.invoiceQty, 0);
    const totalSisaQty = items.reduce((acc, i) => acc + i.sisaQty, 0);
    const subtotalDpp = items.reduce((acc, i) => acc + i.subtotal, 0);

    const hasPpn = editingPO.tipePajak === 'PPN' || editingPO.tipePajak === 'PPN & PPh' || (editingPO.ppnNominal !== undefined && editingPO.ppnNominal > 0);
    const hasPph = editingPO.tipePajak === 'PPh' || editingPO.tipePajak === 'PPN & PPh' || (editingPO.pphNominal !== undefined && editingPO.pphNominal > 0);

    const ppnNominal = hasPpn ? Math.round(subtotalDpp * 0.11) : 0;
    const pphNominal = hasPph ? Math.round(subtotalDpp * 0.02) : 0;
    const totalTagihan = subtotalDpp + ppnNominal - pphNominal;

    return {
      items,
      totalPoQty,
      totalInvoiceQty,
      totalSisaQty,
      subtotalDpp,
      ppnNominal,
      pphNominal,
      totalTagihan
    };
  }, [editingPO, itemQtyDraft]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 dark:bg-red-950/50 rounded-xl text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Cetak Invoice & Kontrol Sisa QTY</h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Edit kuantitas penagihan cetak invoice, lacak sisa QTY PO yang belum dibuatkan invoice, dan kelola tagihan resmi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <button
            onClick={handlePrintSummary}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Rekap Periode PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Nilai Tagihan */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Nilai Tagihan</span>
            <FileText className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">{formatRupiah(totalNilaiTagihan)}</div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span>{filteredCalculatedInvoices.length} Faktur / PO</span>
            <span className="font-semibold text-zinc-600 dark:text-zinc-300">Akumulasi Periode</span>
          </div>
        </div>

        {/* Card 2: Kuantitas Cetak & Sisa QTY */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Monitoring Kuantitas (QTY)</span>
            <Package className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700 dark:text-blue-400">{totalInvoicedQtyAll.toLocaleString('id-ID')}</span>
            <span className="text-xs font-bold text-zinc-400">/ {totalPoQtyAll.toLocaleString('id-ID')} pcs</span>
          </div>
          <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Sisa: {totalSisaQtyAll.toLocaleString('id-ID')} pcs belum di-invoice
            </span>
            <span className="font-bold text-zinc-500">
              {totalPoQtyAll > 0 ? Math.round((totalInvoicedQtyAll / totalPoQtyAll) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 3: Sudah Lunas */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Sudah Lunas (Paid)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(totalTerbayar)}</div>
          <div className="text-xs text-zinc-400 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
            <span>{filteredCalculatedInvoices.filter(c => c.po.statusInvoice === 'Lunas').length} Faktur Lunas</span>
            <span className="font-bold text-emerald-600">Kas Masuk</span>
          </div>
        </div>

        {/* Card 4: Belum Lunas & Jatuh Tempo */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Belum Lunas & Jatuh Tempo</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatRupiah(totalBelumLunas)}</div>
          <div className="text-xs text-zinc-400 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
            <span>{filteredCalculatedInvoices.filter(c => c.po.statusInvoice !== 'Lunas').length} Faktur Berjalan</span>
            <span className="font-bold text-red-500">
              {filteredCalculatedInvoices.filter(c => c.po.statusInvoice === 'Jatuh Tempo').length} Overdue
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Period Toolbar */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Preset Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 uppercase mr-1">Periode:</span>
            <button
              onClick={() => handlePresetChange('this_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'this_month' 
                  ? 'bg-red-800 text-white shadow-sm' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => handlePresetChange('last_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'last_month' 
                  ? 'bg-red-800 text-white shadow-sm' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => handlePresetChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'all' 
                  ? 'bg-red-800 text-white shadow-sm' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Semua Periode
            </button>
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPeriodPreset('custom'); }}
                className="bg-transparent border-none text-zinc-800 dark:text-zinc-200 focus:outline-none text-xs"
              />
            </div>
            <span className="text-xs text-zinc-400 font-bold">s/d</span>
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPeriodPreset('custom'); }}
                className="bg-transparent border-none text-zinc-800 dark:text-zinc-200 focus:outline-none text-xs"
              />
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari No Invoice, No PO, Pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          {/* Status Penagihan / Qty Invoicing Filter */}
          <select
            value={invoicingFilter}
            onChange={(e) => setInvoicingFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Status QTY Invoice</option>
            <option value="LENGKAP">Lengkap (100% Di-Invoice)</option>
            <option value="PARSIAL">Parsial (Ada Sisa QTY Belum Ditagih)</option>
            <option value="BELUM_INVOICE">Belum Di-Invoice (0 pcs)</option>
          </select>

          {/* Status Pembayaran Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Status Pembayaran</option>
            <option value="Belum Lunas">Belum Lunas (Unpaid)</option>
            <option value="Lunas">Lunas (Paid)</option>
            <option value="Jatuh Tempo">Jatuh Tempo (Overdue)</option>
          </select>

          {/* Customer Filter */}
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Pelanggan / Buyer</option>
            {uniqueCustomers.map(cust => (
              <option key={cust} value={cust}>{cust}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-zinc-900 dark:text-white">Daftar Tagihan & Status Kuantitas PO</span>
            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-semibold">
              {filteredCalculatedInvoices.length}
            </span>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 100% Lengkap
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Parsial (Ada Sisa Qty)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-3.5">No. Invoice & PO</th>
                <th className="p-3.5">Pelanggan & No. JO</th>
                <th className="p-3.5">Rincian Item (PO vs Cetak Invoice)</th>
                <th className="p-3.5 text-center">Status QTY Tagihan</th>
                <th className="p-3.5 text-right">Nilai Tagihan Invoice</th>
                <th className="p-3.5 text-center">Status Bayar</th>
                <th className="p-3.5 text-center">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredCalculatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">
                    Tidak ada faktur invoice yang sesuai dengan filter atau periode yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredCalculatedInvoices.map((calc) => {
                  const { po, items, totalPoQty, totalInvoiceQty, totalSisaQty, totalTagihan, invoicingStatus, percentInvoiced } = calc;
                  const invoiceNo = po.nomorInvoice || `INV/MKN/2026/08/${po.id.slice(-3)}`;

                  return (
                    <tr key={po.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      {/* No. Invoice & PO */}
                      <td className="p-3.5">
                        <span className="font-bold text-red-700 dark:text-red-400 block font-mono text-xs">{invoiceNo}</span>
                        <span className="text-[11px] text-zinc-400">PO: {po.nomorPO}</span>
                        <div className="text-[10px] text-zinc-500 mt-0.5">Tgl: {po.tanggalInvoice || po.tanggal}</div>
                      </td>

                      {/* Pelanggan & JO */}
                      <td className="p-3.5">
                        <span className="font-bold text-zinc-900 dark:text-white block">{po.pelanggan}</span>
                        {po.nomorJO ? (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono font-bold rounded text-[10px]">
                            JO: {po.nomorJO}
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400">-</span>
                        )}
                      </td>

                      {/* Rincian Item: PO Qty, Invoiced Qty, Sisa Qty */}
                      <td className="p-3.5 max-w-xs">
                        <div className="space-y-1.5">
                          {items.map((it, idx) => (
                            <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/70 p-2 rounded-lg border border-zinc-100 dark:border-zinc-700/60 text-[11px]">
                              <div className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{it.namaPallet}</div>
                              <div className="flex items-center justify-between gap-2 mt-1 text-[10px]">
                                <span className="text-zinc-500">PO: <b>{it.poQty}</b> pcs</span>
                                <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                                  Cetak: <b>{it.invoiceQty}</b> pcs
                                </span>
                                {it.sisaQty > 0 ? (
                                  <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                    Sisa: <b>{it.sisaQty}</b> pcs
                                  </span>
                                ) : (
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    Sisa: 0
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Status QTY Tagihan */}
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {invoicingStatus === 'LENGKAP' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              Lengkap (100%)
                            </span>
                          ) : invoicingStatus === 'PARSIAL' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              <Clock className="h-3 w-3" />
                              Parsial ({percentInvoiced}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              Belum Ditagih (0%)
                            </span>
                          )}

                          {totalSisaQty > 0 && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                              Sisa {totalSisaQty.toLocaleString('id-ID')} pcs belum di-invoice
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Tagihan */}
                      <td className="p-3.5 text-right font-black text-zinc-900 dark:text-white">
                        <div className="text-xs">{formatRupiah(totalTagihan)}</div>
                        <div className="text-[10px] font-normal text-zinc-400 mt-0.5">
                          {totalInvoiceQty} pcs ditagihkan
                        </div>
                      </td>

                      {/* Status Bayar */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          po.statusInvoice === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : po.statusInvoice === 'Jatuh Tempo'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {po.statusInvoice === 'Lunas' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {po.statusInvoice}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit QTY Cetak Invoice Button */}
                          <button
                            onClick={() => handleOpenEditQty(po)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
                            title="Edit QTY Yang Akan Dicetak & Lacak Sisa"
                          >
                            <Sliders className="h-4 w-4" />
                          </button>

                          {/* Print Invoice Button */}
                          <button
                            onClick={() => handlePrintSingle(po)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded-lg transition-colors cursor-pointer border border-red-200 dark:border-red-900"
                            title="Pratinjau & Cetak Faktur Invoice PDF"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* Payment Button */}
                          {po.statusInvoice !== 'Lunas' && (
                            <button
                              onClick={() => setPaymentModalPO(po)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
                              title="Tandai Lunas & Rekam Kas"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => setPoToDelete(po)}
                            className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Data Invoice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: EDIT QTY INVOICE & SISA QTY MONITORING            */}
      {/* ========================================================= */}
      {editingPO && editingDraftCalc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Edit QTY Yang Akan Dicetak di Invoice
                  </h3>
                  <p className="text-xs text-zinc-400">
                    PO: <b className="text-white font-mono">{editingPO.nomorPO}</b> • {editingPO.pelanggan}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingPO(null)}
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
              {/* Informative banner */}
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <p className="font-bold">Panduan Penagihan Parsial / Bertahap:</p>
                  <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
                    Anda dapat mengatur jumlah QTY yang akan dicetak pada faktur invoice kali ini. Sistem secara otomatis menghitung <b>Sisa QTY PO</b> yang belum dibuatkan invoice serta mengkalkulasi ulang Subtotal, PPN (11%), PPh, dan Grand Total Tagihan.
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <span className="text-xs font-bold text-zinc-500 uppercase">Atur Cepat QTY:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allFull: { [idx: number]: number } = {};
                      (editingPO.item || []).forEach((it, idx) => {
                        allFull[idx] = it.jumlah;
                      });
                      setItemQtyDraft(allFull);
                    }}
                    className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    100% Penuh (Semua QTY PO)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const half: { [idx: number]: number } = {};
                      (editingPO.item || []).forEach((it, idx) => {
                        half[idx] = Math.floor(it.jumlah / 2);
                      });
                      setItemQtyDraft(half);
                    }}
                    className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    50% (Separuh)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const zero: { [idx: number]: number } = {};
                      (editingPO.item || []).forEach((it, idx) => {
                        zero[idx] = 0;
                      });
                      setItemQtyDraft(zero);
                    }}
                    className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Kosongkan (0)
                  </button>
                </div>
              </div>

              {/* Items QTY Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">
                    <tr>
                      <th className="p-3">Deskripsi Item Pallet</th>
                      <th className="p-3 text-center">Total QTY PO</th>
                      <th className="p-3 text-center bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200">
                        QTY Dicetak di Invoice
                      </th>
                      <th className="p-3 text-center bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
                        Sisa QTY Belum Di-Invoice
                      </th>
                      <th className="p-3 text-right">Harga Satuan</th>
                      <th className="p-3 text-right">Subtotal Tagihan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {(editingPO.item || []).map((item, idx) => {
                      const poQty = Number(item.jumlah) || 0;
                      const currentInvoiceQty = typeof itemQtyDraft[idx] === 'number' ? itemQtyDraft[idx] : poQty;
                      const sisaQty = Math.max(0, poQty - currentInvoiceQty);
                      const subtotal = currentInvoiceQty * item.hargaSatuan;

                      return (
                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="p-3">
                            <div className="font-bold text-zinc-900 dark:text-white">
                              {item.namaPallet || (item as any).namaItem}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-medium">
                              ISPM: {item.tipeIspm || 'Lokal'}
                            </div>
                          </td>

                          {/* Total QTY PO (Read-Only) */}
                          <td className="p-3 text-center font-bold text-zinc-700 dark:text-zinc-300">
                            {poQty} pcs
                          </td>

                          {/* QTY Yang Dicetak di Invoice (Editable) */}
                          <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/20">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={poQty}
                                value={currentInvoiceQty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setItemQtyDraft(prev => ({
                                    ...prev,
                                    [idx]: Math.max(0, Math.min(poQty, val))
                                  }));
                                }}
                                className="w-20 px-2.5 py-1.5 text-center font-black text-sm bg-white dark:bg-zinc-800 border-2 border-blue-400 dark:border-blue-600 rounded-lg text-blue-700 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                              />
                              <span className="text-[11px] font-bold text-zinc-500">pcs</span>
                            </div>
                          </td>

                          {/* Sisa QTY Belum Di-Invoice (Auto-calculated) */}
                          <td className="p-3 text-center bg-amber-50/30 dark:bg-amber-950/20">
                            <span className={`inline-block px-2.5 py-1 rounded-md font-black text-xs ${
                              sisaQty > 0 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700' 
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}>
                              {sisaQty} pcs
                            </span>
                          </td>

                          {/* Harga Satuan */}
                          <td className="p-3 text-right text-zinc-600 dark:text-zinc-400">
                            Rp {item.hargaSatuan.toLocaleString('id-ID')}
                          </td>

                          {/* Subtotal */}
                          <td className="p-3 text-right font-black text-zinc-900 dark:text-white">
                            Rp {subtotal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Recalculation Breakdown Summary */}
              <div className="bg-zinc-50 dark:bg-zinc-800/80 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2.5">
                <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-300">
                  <span>Total Kuantitas Pesanan PO:</span>
                  <span className="font-bold">{editingDraftCalc.totalPoQty} pcs</span>
                </div>
                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-400 font-bold">
                  <span>Total QTY Yang Dicetak di Invoice:</span>
                  <span>{editingDraftCalc.totalInvoiceQty} pcs</span>
                </div>
                <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400 font-bold">
                  <span>Total Sisa QTY Belum Di-Invoice:</span>
                  <span>{editingDraftCalc.totalSisaQty} pcs</span>
                </div>
                
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between text-xs text-zinc-600 dark:text-zinc-300">
                  <span>Subtotal DPP (Neto):</span>
                  <span className="font-mono font-bold">Rp {editingDraftCalc.subtotalDpp.toLocaleString('id-ID')}</span>
                </div>

                {editingDraftCalc.ppnNominal > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>PPN (11%):</span>
                    <span className="font-mono font-bold">+Rp {editingDraftCalc.ppnNominal.toLocaleString('id-ID')}</span>
                  </div>
                )}

                {editingDraftCalc.pphNominal > 0 && (
                  <div className="flex justify-between text-xs text-red-500 font-semibold">
                    <span>PPh (2% Potongan):</span>
                    <span className="font-mono font-bold">-Rp {editingDraftCalc.pphNominal.toLocaleString('id-ID')}</span>
                  </div>
                )}

                <div className="pt-2 border-t-2 border-zinc-300 dark:border-zinc-600 flex justify-between items-center text-sm font-black">
                  <span className="text-zinc-900 dark:text-white">Jumlah Total Tagihan Invoice Baru:</span>
                  <span className="text-red-700 dark:text-red-400 font-mono text-base">
                    Rp {editingDraftCalc.totalTagihan.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Success Message Banner */}
              {saveSuccessMessage && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditingPO(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveEditedQty(false)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Simpan Perubahan QTY</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEditedQty(true)}
                  className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Simpan & Langsung Cetak</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: Single Invoice PDF Preview Sheet                 */}
      {/* ========================================================= */}
      {previewMode === 'single' && selectedPO && selectedPOCalc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-red-400" />
                <div>
                  <span className="font-bold text-sm block">Pratinjau Faktur Invoice Penjualan</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {selectedPO.nomorInvoice || `INV/MKN/2026/08/${selectedPO.id.slice(-3)}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Quick Edit Qty from Print Preview */}
                <button
                  onClick={() => {
                    handleOpenEditQty(selectedPO);
                    setPreviewMode(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-blue-300 rounded-lg text-xs font-bold transition-all cursor-pointer border border-zinc-700 shadow-sm"
                  title="Edit Qty Tagihan"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Edit QTY Cetak</span>
                </button>

                <button
                  disabled={isDownloadingPdf}
                  onClick={async () => {
                    setIsDownloadingPdf(true);
                    await downloadElementAsPdf('single-invoice-print-sheet', `Invoice_${selectedPO.nomorInvoice || selectedPO.nomorPO}`);
                    setIsDownloadingPdf(false);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-md"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF (.pdf)'}</span>
                </button>
                <button
                  onClick={() => triggerPrintOrPdf('single-invoice-print-sheet', `Invoice_${selectedPO.nomorInvoice || selectedPO.nomorPO}`)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Cetak</span>
                </button>
                <button
                  onClick={() => { setPreviewMode(null); setSelectedPO(null); }}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Canvas */}
            <div className="p-4 md:p-8 overflow-y-auto bg-zinc-100 dark:bg-zinc-950 flex justify-center">
              <div
                id="single-invoice-print-sheet"
                className="p-8 md:p-12 bg-white text-black font-sans min-h-[600px] printable-sheet max-w-3xl w-full rounded-lg shadow-md border border-zinc-200"
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b border-zinc-200 pb-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-1 bg-white border border-zinc-200 rounded-xl flex items-center justify-center shrink-0">
                      <CompanyLogo size="md" className="h-14 w-14" />
                    </div>
                    <div>
                      <h1 className="font-extrabold text-xl tracking-tight text-[#2E7D32]">CV. Mustika Kayu Nusantara</h1>
                      <p className="text-xs font-bold text-zinc-900 mt-0.5">Supplier Kayu Olahan, Aneka Industri Kayu</p>
                      <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed">
                        Alamat : Jl. Raya Mutiara Gading City, Pulo Kendal Ds. Setia Asih Rt.001/003 Kec. Tarumajaya<br />
                        Kab. Bekasi Hp. 0812-8147-8689/0812-1060-3063, Email : mustikakayunusantara@gmail.com
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-black text-zinc-800 uppercase tracking-tight">INVOICE</h2>
                    <p className="text-xs font-mono font-bold text-red-750 mt-1">{selectedPO.nomorInvoice || (`INV/MKN/2026/08/${selectedPO.id.slice(-3)}`)}</p>
                    <p className="text-[11px] font-mono text-zinc-600 mt-0.5">Ref PO: <b>{selectedPO.nomorPO}</b></p>
                    {selectedPO.nomorJO && (
                      <p className="text-[11px] font-mono font-bold text-blue-700 mt-0.5">No. JO: {selectedPO.nomorJO}</p>
                    )}
                    <p className="text-[10px] text-zinc-500 mt-1">Tanggal: {selectedPO.tanggalInvoice || selectedPO.tanggal}</p>
                  </div>
                </div>

                {/* Addresses Block */}
                <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
                  <div>
                    <span className="block font-bold text-zinc-400 uppercase tracking-wider text-[9px] mb-1">DITAGIHKAN KEPADA:</span>
                    <p className="font-extrabold text-sm text-zinc-800">{selectedPO.pelanggan}</p>
                    <p className="text-zinc-500 mt-1 whitespace-pre-wrap">
                      {customers?.find(c => c.nama === selectedPO.pelanggan)?.alamat || (selectedPO as any).tujuanPengiriman || '-'}
                    </p>
                    {selectedPO.nomorJO && (
                      <p className="text-zinc-900 mt-2 font-mono font-bold text-[10px]">No Job Order (JO): {selectedPO.nomorJO}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-zinc-400 uppercase tracking-wider text-[9px] mb-1">METODE PEMBAYARAN:</span>
                    <p className="font-bold text-zinc-800">Transfer Bank Mandiri</p>
                    <p className="text-zinc-700 font-mono font-bold mt-0.5">No Rek Mandiri: 156-00-1909954-0</p>
                    <p className="text-zinc-600 mt-0.5">a.n CV MUSTIKA KAYU NUSANTARA</p>
                  </div>
                </div>

                {/* Status Notice if Partial Billing */}
                {selectedPOCalc.totalSisaQty > 0 && (
                  <div className="mb-6 p-2.5 bg-amber-50 border border-amber-300 rounded text-[11px] text-amber-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 font-black rounded text-[9px] uppercase tracking-wider">
                        TAGIHAN TAHAP / PARSIAL
                      </span>
                      <span>
                        Invoice ini menagihkan <b>{selectedPOCalc.totalInvoiceQty} pcs</b> dari total pesanan PO <b>{selectedPOCalc.totalPoQty} pcs</b>.
                      </span>
                    </div>
                    <span className="font-bold text-amber-800">
                      Sisa Belum Ditagih: {selectedPOCalc.totalSisaQty} pcs
                    </span>
                  </div>
                )}

                {/* Items Table */}
                <table className="w-full text-xs text-left border-collapse mb-8">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200">
                      <th className="p-3 font-bold uppercase text-[10px]">Deskripsi Barang / Item Pekerjaan</th>
                      <th className="p-3 text-center font-bold uppercase text-[10px]">Sertifikasi ISPM</th>
                      <th className="p-3 text-right font-bold uppercase text-[10px]">Kuantitas Tagihan</th>
                      <th className="p-3 text-right font-bold uppercase text-[10px]">Harga Satuan</th>
                      <th className="p-3 text-right font-bold uppercase text-[10px]">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {selectedPOCalc.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3">
                          <p className="font-bold text-zinc-800">{item.namaPallet}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Sertifikasi oven, anti-rayap terlapisi penuh</p>
                          {item.isPartial && (
                            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                              *Tagihan sebagian: {item.invoiceQty} dari {item.poQty} pcs (Sisa PO: {item.sisaQty} pcs)
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-center text-zinc-600 font-bold">{item.tipeIspm || 'Lokal'}</td>
                        <td className="p-3 text-right font-bold">
                          {item.invoiceQty} pcs
                          {item.isPartial && (
                            <span className="block text-[9px] font-normal text-zinc-400">(PO: {item.poQty})</span>
                          )}
                        </td>
                        <td className="p-3 text-right">Rp {item.hargaSatuan.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-right font-bold">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                    
                    {/* Subtotal Neto, PPN, PPh breakdowns */}
                    <tr className="border-t border-zinc-300">
                      <td colSpan={3} className="p-2 text-right text-[10px] uppercase text-zinc-400 font-bold">Neto Sebelum Pajak:</td>
                      <td colSpan={2} className="p-2 text-right font-mono text-zinc-800 font-bold">
                        Rp {selectedPOCalc.subtotalDpp.toLocaleString('id-ID')}
                      </td>
                    </tr>

                    {selectedPOCalc.ppnNominal > 0 ? (
                      <tr>
                        <td colSpan={3} className="p-2 text-right text-[10px] uppercase text-zinc-400 font-bold">PPN (11%):</td>
                        <td colSpan={2} className="p-2 text-right font-mono text-emerald-600 font-bold">
                          +Rp {selectedPOCalc.ppnNominal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ) : null}

                    {selectedPOCalc.pphNominal > 0 ? (
                      <tr>
                        <td colSpan={3} className="p-2 text-right text-[10px] uppercase text-zinc-400 font-bold">PPh (2% Potongan):</td>
                        <td colSpan={2} className="p-2 text-right font-mono text-red-500 font-bold">
                          -Rp {selectedPOCalc.pphNominal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ) : null}

                    <tr className="bg-zinc-50 font-bold border-t-2 border-zinc-300">
                      <td colSpan={3} className="p-3 text-right text-[10px] uppercase text-zinc-900 font-extrabold">Jumlah Total Tagihan:</td>
                      <td colSpan={2} className="p-3 text-right text-base text-red-800 font-extrabold font-mono">
                        Rp {selectedPOCalc.totalTagihan.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer Terms */}
                <div className="border-t border-dashed border-zinc-250 pt-6 text-[10px] text-zinc-500 leading-relaxed grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-bold uppercase text-[9px] text-zinc-400 mb-1">KETENTUAN PEMBAYARAN:</p>
                    <p>1. Invoice ini memiliki jatuh tempo pada tanggal: <span className="font-bold text-red-850">{selectedPO.tanggalJatuhTempo || '-'}</span>.</p>
                    <p>2. Mohon cantumkan nomor invoice pada berita transfer bank Anda.</p>
                    <p>3. Barang yang sudah dikirim dengan Surat Jalan resmi tidak dapat dibatalkan.</p>
                  </div>
                  <div className="text-center w-48 ml-auto">
                    <p className="font-sans">Hormat Kami,</p>
                    <div className="h-12"></div>
                    <p className="font-bold underline">Staf Keuangan</p>
                    <p className="text-[9px]">Bagian Finance & Kasir</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: Summary Report PDF Preview Sheet                 */}
      {/* ========================================================= */}
      {previewMode === 'summary' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-red-400" />
                <span className="font-bold text-sm">Rekapitulasi Laporan Invoice & Sisa QTY per Periode</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintOrPdf('summary-invoice-print-sheet', `Laporan_Rekap_Invoice_${startDate || 'all'}_sd_${endDate || 'all'}`)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download / Print PDF</span>
                </button>
                <button
                  onClick={() => setPreviewMode(null)}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-zinc-100 dark:bg-zinc-950 flex justify-center">
              <div
                id="summary-invoice-print-sheet"
                className="bg-white text-zinc-900 p-8 rounded-lg shadow-md max-w-3xl w-full text-xs font-sans border border-zinc-200"
              >
                {/* Official Letterhead */}
                <div className="flex items-start justify-between border-b border-zinc-250 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo size="md" className="h-10 w-10" />
                    <div>
                      <h2 className="font-extrabold text-base tracking-tight text-[#2E7D32]">CV. Mustika Kayu Nusantara</h2>
                      <p className="text-[10px] text-zinc-600">Supplier Kayu Olahan, Aneka Industri Kayu • Rekapitulasi Tagihan & Lacak Sisa QTY</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-600">
                    <p><b>Periode:</b> {startDate || 'Awal'} s/d {endDate || 'Sekarang'}</p>
                    <p><b>Dicetak Oleh:</b> {currentUser?.name || 'Finance Admin'}</p>
                    <p><b>Waktu:</b> {new Date().toLocaleDateString('id-ID')}</p>
                  </div>
                </div>

                {/* Metrics Summary */}
                <div className="grid grid-cols-4 gap-2 mb-4 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-center">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase font-bold block">Total Tagihan</span>
                    <span className="font-extrabold text-xs text-zinc-900">{formatRupiah(totalNilaiTagihan)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-blue-700 uppercase font-bold block">QTY Di-Invoice</span>
                    <span className="font-extrabold text-xs text-blue-700">{totalInvoicedQtyAll.toLocaleString('id-ID')} pcs</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-amber-700 uppercase font-bold block">Sisa QTY PO</span>
                    <span className="font-extrabold text-xs text-amber-700">{totalSisaQtyAll.toLocaleString('id-ID')} pcs</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-700 uppercase font-bold block">Sudah Lunas</span>
                    <span className="font-extrabold text-xs text-emerald-700">{formatRupiah(totalTerbayar)}</span>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full border-collapse text-[10px] mb-6">
                  <thead>
                    <tr className="bg-red-900 text-white font-bold">
                      <th className="p-2 text-left">No. Faktur</th>
                      <th className="p-2 text-left">Ref PO</th>
                      <th className="p-2 text-left">Pelanggan</th>
                      <th className="p-2 text-center">QTY PO</th>
                      <th className="p-2 text-center">QTY Cetak</th>
                      <th className="p-2 text-center">Sisa QTY</th>
                      <th className="p-2 text-right">Nilai Faktur</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 border-b border-zinc-200">
                    {filteredCalculatedInvoices.map((calc, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                        <td className="p-2 font-bold font-mono text-red-900">{calc.po.nomorInvoice || `INV-${calc.po.id.slice(-3)}`}</td>
                        <td className="p-2 font-mono">{calc.po.nomorPO}</td>
                        <td className="p-2 font-semibold">{calc.po.pelanggan}</td>
                        <td className="p-2 text-center">{calc.totalPoQty}</td>
                        <td className="p-2 text-center font-bold text-blue-800">{calc.totalInvoiceQty}</td>
                        <td className="p-2 text-center font-bold text-amber-700">{calc.totalSisaQty}</td>
                        <td className="p-2 text-right font-bold">{formatRupiah(calc.totalTagihan)}</td>
                        <td className="p-2 text-center font-bold">
                          <span className={calc.po.statusInvoice === 'Lunas' ? 'text-emerald-700' : 'text-amber-700'}>
                            {calc.po.statusInvoice}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-bold">
                      <td colSpan={3} className="p-2 text-right">TOTAL:</td>
                      <td className="p-2 text-center">{totalPoQtyAll}</td>
                      <td className="p-2 text-center text-blue-900">{totalInvoicedQtyAll}</td>
                      <td className="p-2 text-center text-amber-800">{totalSisaQtyAll}</td>
                      <td className="p-2 text-right font-black text-red-900">{formatRupiah(totalNilaiTagihan)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>

                {/* Sign-off */}
                <div className="flex justify-end pt-4">
                  <div className="text-center w-48">
                    <span className="text-[10px] text-zinc-500 block mb-12">Mengetahui & Menyetujui,</span>
                    <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                      Finance & Accounting Dept.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: Payment Record Dialog                            */}
      {/* ========================================================= */}
      {paymentModalPO && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2">Konfirmasi Pelunasan Invoice</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Tandai lunas invoice <b>{paymentModalPO.nomorInvoice || paymentModalPO.nomorPO}</b> dari <b>{paymentModalPO.pelanggan}</b> sebesar <b>{formatRupiah(paymentModalPO.totalHarga)}</b>. Sistem akan otomatis mencatat kas masuk & mutasi bank.
            </p>

            <div className="space-y-3 mb-6">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Pilih Rekening Tujuan:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri (156-00-1909954-0 - CV Mustika Kayu Nusantara)</option>
                <option value="Cash / Tunai">Kas Tunai / Kasir Pabrik</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setPaymentModalPO(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  updateInvoiceStatus(paymentModalPO.id, 'Lunas', paymentMethod);
                  setPaymentModalPO(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Konfirmasi Lunas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!poToDelete}
        title="Hapus Data Invoice"
        description={`Apakah Anda yakin ingin menghapus data invoice/PO "${poToDelete?.nomorInvoice || poToDelete?.nomorPO}" dari "${poToDelete?.pelanggan}"? Data yang dihapus tidak dapat dipulihkan.`}
        onConfirm={() => {
          if (poToDelete) {
            deletePurchaseOrder(poToDelete.id);
            setPoToDelete(null);
          }
        }}
        onCancel={() => setPoToDelete(null)}
      />
    </div>
  );
};
