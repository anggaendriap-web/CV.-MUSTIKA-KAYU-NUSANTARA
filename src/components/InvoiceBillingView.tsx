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
  ArrowUpDown
} from 'lucide-react';

export const InvoiceBillingView: React.FC = () => {
  const { purchaseOrders, updateInvoiceStatus, deletePurchaseOrder, currentUser } = useApp();
  
  // Filters & Period State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Lunas' | 'Belum Lunas' | 'Jatuh Tempo'>('Semua');
  const [customerFilter, setCustomerFilter] = useState('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodPreset, setPeriodPreset] = useState<'all' | 'this_month' | 'last_month' | 'custom'>('this_month');

  // Preview & Action Modals
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [previewMode, setPreviewMode] = useState<'single' | 'summary' | null>(null);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  const [paymentModalPO, setPaymentModalPO] = useState<PurchaseOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Transfer Bank BCA' | 'Transfer Bank Mandiri' | 'Cash / Tunai'>('Transfer Bank BCA');

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

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return purchaseOrders.filter(po => {
      // Search
      const matchesSearch = 
        (po.nomorInvoice?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        po.nomorPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.pelanggan.toLowerCase().includes(searchTerm.toLowerCase());

      // Status
      const matchesStatus = 
        statusFilter === 'Semua' ? true :
        statusFilter === 'Lunas' ? po.statusInvoice === 'Lunas' :
        statusFilter === 'Belum Lunas' ? po.statusInvoice === 'Belum Lunas' :
        po.statusInvoice === 'Jatuh Tempo';

      // Customer
      const matchesCustomer = customerFilter === 'Semua' || po.pelanggan === customerFilter;

      // Date Period
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && po.tanggalOrder >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && po.tanggalOrder <= endDate;
      }

      return matchesSearch && matchesStatus && matchesCustomer && matchesDate;
    });
  }, [purchaseOrders, searchTerm, statusFilter, customerFilter, startDate, endDate]);

  // Calculations
  const totalNilaiInvoice = useMemo(() => {
    return filteredInvoices.reduce((acc, po) => acc + po.totalHarga, 0);
  }, [filteredInvoices]);

  const totalTerbayar = useMemo(() => {
    return filteredInvoices.filter(po => po.statusInvoice === 'Lunas').reduce((acc, po) => acc + po.totalHarga, 0);
  }, [filteredInvoices]);

  const totalBelumLunas = useMemo(() => {
    return filteredInvoices.filter(po => po.statusInvoice !== 'Lunas').reduce((acc, po) => acc + po.totalHarga, 0);
  }, [filteredInvoices]);

  // Unique Customer list
  const uniqueCustomers = useMemo(() => {
    const set = new Set(purchaseOrders.map(p => p.pelanggan));
    return Array.from(set);
  }, [purchaseOrders]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handlePrintSingle = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setPreviewMode('single');
  };

  const handlePrintSummary = () => {
    setPreviewMode('summary');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 dark:bg-red-950/50 rounded-xl text-red-700 dark:text-red-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Cetak Invoice Penjualan</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Penerbitan faktur tagihan resmi, cetak dokumen PDF satuan dan rekap periode</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintSummary}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Rekap Periode PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Total Nilai Tagihan</span>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">{formatRupiah(totalNilaiInvoice)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">{filteredInvoices.length} Faktur terpilih</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Sudah Lunas (Paid)</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(totalTerbayar)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">{filteredInvoices.filter(p => p.statusInvoice === 'Lunas').length} Faktur lunas</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">Belum Lunas (Unpaid)</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatRupiah(totalBelumLunas)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">{filteredInvoices.filter(p => p.statusInvoice !== 'Lunas').length} Faktur berjalan</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1">Jatuh Tempo (Overdue)</span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {formatRupiah(filteredInvoices.filter(p => p.statusInvoice === 'Jatuh Tempo').reduce((a, b) => a + b.totalHarga, 0))}
          </div>
          <span className="text-xs text-zinc-400 mt-1 block">{filteredInvoices.filter(p => p.statusInvoice === 'Jatuh Tempo').length} Faktur jatuh tempo</span>
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
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => handlePresetChange('last_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'last_month' 
                  ? 'bg-red-800 text-white shadow-sm' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => handlePresetChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'all' 
                  ? 'bg-red-800 text-white shadow-sm' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Status Tagihan</option>
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
            <span className="font-bold text-sm text-zinc-900 dark:text-white">Daftar Tagihan & Invoice</span>
            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-semibold">
              {filteredInvoices.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-3.5">No. Invoice & PO</th>
                <th className="p-3.5">Tanggal Order</th>
                <th className="p-3.5">Pelanggan / Perusahaan</th>
                <th className="p-3.5">Item Pallet</th>
                <th className="p-3.5 text-right">Total Tagihan</th>
                <th className="p-3.5 text-center">Status Invoice</th>
                <th className="p-3.5 text-center">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">
                    Tidak ada faktur invoice yang sesuai dengan filter atau periode yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((po) => {
                  const invoiceNo = po.nomorInvoice || `INV/MKN/2026/08/${po.id.slice(-3)}`;
                  return (
                    <tr key={po.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-red-700 dark:text-red-400 block">{invoiceNo}</span>
                        <span className="text-[11px] text-zinc-400">Ref PO: {po.nomorPO}</span>
                      </td>
                      <td className="p-3.5 text-zinc-600 dark:text-zinc-300 font-medium">
                        {po.tanggalOrder}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-zinc-900 dark:text-white block">{po.pelanggan}</span>
                        <span className="text-[11px] text-zinc-400">{po.tujuanPengiriman}</span>
                      </td>
                      <td className="p-3.5 text-zinc-600 dark:text-zinc-300">
                        {po.item.map((it, idx) => (
                          <div key={idx} className="truncate max-w-[200px]">
                            {it.namaItem} <span className="font-bold">({it.jumlah} pcs)</span>
                          </div>
                        ))}
                      </td>
                      <td className="p-3.5 text-right font-black text-zinc-900 dark:text-white">
                        {formatRupiah(po.totalHarga)}
                      </td>
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
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handlePrintSingle(po)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded-lg transition-colors cursor-pointer"
                            title="Cetak Faktur Invoice PDF"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          {po.statusInvoice !== 'Lunas' && (
                            <button
                              onClick={() => setPaymentModalPO(po)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors cursor-pointer"
                              title="Tandai Lunas & Rekam Kas"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setPoToDelete(po)}
                            className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Invoice"
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

      {/* MODAL 1: Single Invoice PDF Preview Sheet */}
      {previewMode === 'single' && selectedPO && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-red-400" />
                <span className="font-bold text-sm">Pratinjau Dokumen Invoice Penjualan</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintOrPdf('single-invoice-print-sheet', `Invoice_${selectedPO.nomorInvoice || selectedPO.nomorPO}`)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download / Print PDF</span>
                </button>
                <button
                  onClick={() => { setPreviewMode(null); setSelectedPO(null); }}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Canvas */}
            <div className="p-6 overflow-y-auto bg-zinc-100 dark:bg-zinc-950 flex justify-center">
              <div
                id="single-invoice-print-sheet"
                className="bg-white text-zinc-900 p-8 rounded-lg shadow-md max-w-2xl w-full text-xs font-sans border border-zinc-200"
                style={{ minHeight: '280mm' }}
              >
                {/* Official Letterhead */}
                <div className="flex items-start justify-between border-b-2 border-red-900 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <CompanyLogo size="md" className="h-12 w-12" />
                    <div>
                      <h2 className="text-xl font-black text-red-900 tracking-tight">PT MUSTIKA KAYU NUSANTARA</h2>
                      <p className="text-[10px] text-zinc-600 font-medium">Produsen Pallet Kayu Standar Industri, Ekspor ISPM 15 & Custom</p>
                      <p className="text-[9px] text-zinc-500 mt-0.5">Kawasan Industri Cikarang, Blok B-12, Bekasi | Telp: (021) 8901234 | Email: finance@mustikakayu.co.id</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-zinc-900 block">FAKTUR INVOICE</span>
                    <span className="text-xs font-bold text-red-700 block">{selectedPO.nomorInvoice || `INV/MKN/2026/08/${selectedPO.id.slice(-3)}`}</span>
                  </div>
                </div>

                {/* Buyer & Order Details */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Ditagihkan Kepada:</span>
                    <div className="font-extrabold text-sm text-zinc-900">{selectedPO.pelanggan}</div>
                    <div className="text-[11px] text-zinc-600 mt-1">{selectedPO.tujuanPengiriman}</div>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Tanggal Faktur:</span>
                      <span className="font-bold text-zinc-900">{selectedPO.tanggalOrder}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Nomor PO Buyer:</span>
                      <span className="font-bold text-zinc-900">{selectedPO.nomorPO}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Status Tagihan:</span>
                      <span className={`font-bold ${selectedPO.statusInvoice === 'Lunas' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {selectedPO.statusInvoice}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Item List Table */}
                <table className="w-full border-collapse mb-6">
                  <thead>
                    <tr className="bg-red-900 text-white font-bold text-[11px]">
                      <th className="p-2.5 text-center w-10">No.</th>
                      <th className="p-2.5 text-left">Deskripsi Produk Pallet</th>
                      <th className="p-2.5 text-center w-20">Jumlah</th>
                      <th className="p-2.5 text-right w-28">Harga Satuan</th>
                      <th className="p-2.5 text-right w-32">Total Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 border-b border-zinc-200">
                    {selectedPO.item.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-center text-zinc-500">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-zinc-800">{item.namaItem}</td>
                        <td className="p-2.5 text-center font-bold">{item.jumlah} pcs</td>
                        <td className="p-2.5 text-right">{formatRupiah(item.hargaSatuan)}</td>
                        <td className="p-2.5 text-right font-bold">{formatRupiah(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} rowSpan={3} className="p-3 align-top bg-zinc-50 border-r border-zinc-200">
                        <span className="font-bold text-zinc-700 block mb-1">Instruksi Pembayaran Transfer Bank:</span>
                        <div className="text-[10px] text-zinc-600 space-y-0.5">
                          <p>• <b>Bank BCA:</b> 882-019-2831 a/n PT Mustika Kayu Nusantara</p>
                          <p>• <b>Bank Mandiri:</b> 137-00-9281920-1 a/n PT Mustika Kayu Nusantara</p>
                          <p className="text-[9px] text-zinc-400 mt-1 italic">* Harap mencantumkan nomor invoice pada berita transfer.</p>
                        </div>
                      </td>
                      <td className="p-2 text-right text-zinc-600 font-bold">Subtotal:</td>
                      <td className="p-2 text-right font-bold text-zinc-900">{formatRupiah(selectedPO.totalHarga)}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-right text-zinc-600 font-bold">PPN (11% DPP):</td>
                      <td className="p-2 text-right text-zinc-700">Sudah Termasuk PPN</td>
                    </tr>
                    <tr className="bg-zinc-100 font-black text-sm">
                      <td className="p-2.5 text-right text-red-900">Total Tagihan:</td>
                      <td className="p-2.5 text-right text-red-900">{formatRupiah(selectedPO.totalHarga)}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatures & Stamp */}
                <div className="grid grid-cols-2 gap-8 pt-8 mt-4 text-center">
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-12">Penerima Tagihan / Customer,</span>
                    <div className="border-t border-zinc-400 w-40 mx-auto pt-1 font-bold text-zinc-800">
                      ( {selectedPO.pelanggan.slice(0, 20)} )
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-12">Hormat Kami, PT Mustika Kayu Nusantara</span>
                    <div className="border-t border-zinc-400 w-40 mx-auto pt-1 font-bold text-zinc-900">
                      ( Bagian Keuangan / Finance )
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Summary Report PDF Preview Sheet */}
      {previewMode === 'summary' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-red-400" />
                <span className="font-bold text-sm">Rekapitulasi Laporan Invoice Penjualan per Periode</span>
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
                <div className="flex items-start justify-between border-b-2 border-red-900 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo size="md" className="h-10 w-10" />
                    <div>
                      <h2 className="text-lg font-black text-red-900">PT MUSTIKA KAYU NUSANTARA</h2>
                      <p className="text-[10px] text-zinc-600">Laporan Rekapitulasi Tagihan & Penerbitan Invoice</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-600">
                    <p><b>Periode:</b> {startDate || 'Awal'} s/d {endDate || 'Sekarang'}</p>
                    <p><b>Dicetak Oleh:</b> {currentUser?.name || 'Finance Admin'}</p>
                    <p><b>Waktu:</b> {new Date().toLocaleDateString('id-ID')}</p>
                  </div>
                </div>

                {/* Metrics Summary */}
                <div className="grid grid-cols-3 gap-3 mb-4 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-center">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total Tagihan</span>
                    <span className="font-extrabold text-sm text-zinc-900">{formatRupiah(totalNilaiInvoice)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">Sudah Lunas</span>
                    <span className="font-extrabold text-sm text-emerald-700">{formatRupiah(totalTerbayar)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-700 uppercase font-bold block">Belum Lunas</span>
                    <span className="font-extrabold text-sm text-amber-700">{formatRupiah(totalBelumLunas)}</span>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full border-collapse text-[10px] mb-6">
                  <thead>
                    <tr className="bg-red-900 text-white font-bold">
                      <th className="p-2 text-left">No. Faktur</th>
                      <th className="p-2 text-left">Tgl Order</th>
                      <th className="p-2 text-left">Pelanggan</th>
                      <th className="p-2 text-left">Item Ringkasan</th>
                      <th className="p-2 text-right">Nilai Faktur</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 border-b border-zinc-200">
                    {filteredInvoices.map((po, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                        <td className="p-2 font-bold text-red-900">{po.nomorInvoice || `INV-${po.id.slice(-3)}`}</td>
                        <td className="p-2">{po.tanggalOrder}</td>
                        <td className="p-2 font-semibold">{po.pelanggan}</td>
                        <td className="p-2">{po.item.map(i => `${i.namaItem} (${i.jumlah})`).join(', ')}</td>
                        <td className="p-2 text-right font-bold">{formatRupiah(po.totalHarga)}</td>
                        <td className="p-2 text-center font-bold">
                          <span className={po.statusInvoice === 'Lunas' ? 'text-emerald-700' : 'text-amber-700'}>
                            {po.statusInvoice}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-bold">
                      <td colSpan={4} className="p-2 text-right">TOTAL NILAI FAKTUR PERIODE:</td>
                      <td className="p-2 text-right font-black text-red-900">{formatRupiah(totalNilaiInvoice)}</td>
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

      {/* MODAL 3: Payment Record Dialog */}
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
                <option value="Transfer Bank BCA">Transfer Bank BCA (8820192831)</option>
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri (1370092819201)</option>
                <option value="Cash / Tunai">Kas Tunai / Kasir Pabrik</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setPaymentModalPO(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  updateInvoiceStatus(paymentModalPO.id, 'Lunas', paymentMethod);
                  setPaymentModalPO(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
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
