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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  const [paymentModalPO, setPaymentModalPO] = useState<PurchaseOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Transfer Bank Mandiri' | 'Cash / Tunai'>('Transfer Bank Mandiri');

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
      // Search (supports Invoice No, PO No, JO No, Customer)
      const matchesSearch = 
        (po.nomorInvoice?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        po.nomorPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.nomorJO && po.nomorJO.toLowerCase().includes(searchTerm.toLowerCase())) ||
        po.pelanggan.toLowerCase().includes(searchTerm.toLowerCase());

      // Status (No draft or belum terbit; invoices are immediately active)
      const matchesStatus = 
        statusFilter === 'Semua' ? true :
        statusFilter === 'Lunas' ? po.statusInvoice === 'Lunas' :
        statusFilter === 'Belum Lunas' ? (po.statusInvoice === 'Belum Bayar' || (po.statusInvoice as string) === 'Belum Lunas') :
        po.statusInvoice === 'Jatuh Tempo';

      // Customer
      const matchesCustomer = customerFilter === 'Semua' || po.pelanggan === customerFilter;

      // Date Period
      let matchesDate = true;
      const orderDate = po.tanggalOrder || po.tanggal;
      if (startDate && orderDate) {
        matchesDate = matchesDate && orderDate >= startDate;
      }
      if (endDate && orderDate) {
        matchesDate = matchesDate && orderDate <= endDate;
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
                <th className="p-3.5">Nomor JO (Job Order)</th>
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
                  <td colSpan={8} className="p-8 text-center text-zinc-400">
                    Tidak ada faktur invoice yang sesuai dengan filter atau periode yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((po) => {
                  const invoiceNo = po.nomorInvoice || `INV/MKN/2026/08/${po.id.slice(-3)}`;
                  return (
                    <tr key={po.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-red-700 dark:text-red-400 block font-mono">{invoiceNo}</span>
                        <span className="text-[11px] text-zinc-400">Ref PO: {po.nomorPO}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono font-bold rounded-lg text-[11px]">
                          {po.nomorJO || '-'}
                        </span>
                      </td>
                      <td className="p-3.5 text-zinc-600 dark:text-zinc-300 font-medium">
                        {po.tanggalOrder || po.tanggal}
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
                <span className="font-bold text-sm">Pratinjau Faktur Invoice Penjualan</span>
              </div>
              <div className="flex items-center gap-2">
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

            {/* Printable Document Canvas - Exact match with Purchase Order invoice template */}
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
                    {selectedPO.nomorJO && (
                      <p className="text-[11px] font-mono font-bold text-blue-700 mt-0.5">No. JO: {selectedPO.nomorJO}</p>
                    )}
                    <p className="text-[10px] text-zinc-500 mt-1">Tanggal: {selectedPO.tanggalOrder || selectedPO.tanggal}</p>
                  </div>
                </div>

                {/* Addresses Block */}
                <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
                  <div>
                    <span className="block font-bold text-zinc-400 uppercase tracking-wider text-[9px] mb-1">DITAGIHKAN KEPADA:</span>
                    <p className="font-extrabold text-sm text-zinc-800">{selectedPO.pelanggan}</p>
                    <p className="text-zinc-500 mt-1">{selectedPO.tujuanPengiriman || 'Gudang Logistik & Penerimaan Pembelian'}</p>
                    <p className="text-zinc-500 mt-0.5">Indonesia</p>
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

                {/* Items Table */}
                <table className="w-full text-xs text-left border-collapse mb-8">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200">
                      <th className="p-3 font-bold uppercase text-[10px]">Deskripsi Barang / Item Pekerjaan</th>
                      <th className="p-3 text-center font-bold uppercase text-[10px]">Sertifikasi ISPM</th>
                      <th className="p-3 text-right font-bold uppercase text-[10px]">Kuantitas</th>
                      <th className="p-3 text-right font-bold uppercase text-[10px]">Harga Satuan</th>
                      <th className="p-3 text-right font-bold uppercase text-[10px]">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {(selectedPO.item || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3">
                          <p className="font-bold text-zinc-800">{item.namaPallet || (item as any).namaItem}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Sertifikasi oven, anti-rayap terlapisi penuh</p>
                        </td>
                        <td className="p-3 text-center text-zinc-600 font-bold">{item.tipeIspm || 'Lokal'}</td>
                        <td className="p-3 text-right font-bold">{item.jumlah} pcs</td>
                        <td className="p-3 text-right">Rp {item.hargaSatuan.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-right font-bold">Rp {(item.subtotal || (item as any).total || (item.jumlah * item.hargaSatuan)).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                    
                    {/* Subtotal Neto, PPN, PPh breakdowns */}
                    <tr className="border-t border-zinc-300">
                      <td colSpan={3} className="p-2 text-right text-[10px] uppercase text-zinc-400 font-bold">Neto Sebelum Pajak:</td>
                      <td colSpan={2} className="p-2 text-right font-mono text-zinc-800 font-bold">
                        Rp {(selectedPO.subtotalHarga || (selectedPO.item || []).reduce((acc, c) => acc + (c.subtotal || (c as any).total || (c.jumlah * c.hargaSatuan)), 0)).toLocaleString('id-ID')}
                      </td>
                    </tr>

                    {selectedPO.ppnNominal && selectedPO.ppnNominal > 0 ? (
                      <tr>
                        <td colSpan={3} className="p-2 text-right text-[10px] uppercase text-zinc-400 font-bold">PPN (11%):</td>
                        <td colSpan={2} className="p-2 text-right font-mono text-emerald-600 font-bold">
                          +Rp {selectedPO.ppnNominal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ) : null}

                    {selectedPO.pphNominal && selectedPO.pphNominal > 0 ? (
                      <tr>
                        <td colSpan={3} className="p-2 text-right text-[10px] uppercase text-zinc-400 font-bold">PPh (2% Potongan):</td>
                        <td colSpan={2} className="p-2 text-right font-mono text-red-500 font-bold">
                          -Rp {selectedPO.pphNominal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ) : null}

                    <tr className="bg-zinc-50 font-bold border-t-2 border-zinc-300">
                      <td colSpan={3} className="p-3 text-right text-[10px] uppercase text-zinc-900 font-extrabold">Jumlah Total Tagihan:</td>
                      <td colSpan={2} className="p-3 text-right text-base text-red-800 font-extrabold font-mono">
                        Rp {selectedPO.totalHarga.toLocaleString('id-ID')}
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
                <div className="flex items-start justify-between border-b border-zinc-250 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo size="md" className="h-10 w-10" />
                    <div>
                      <h2 className="font-extrabold text-base tracking-tight text-[#2E7D32]">CV. Mustika Kayu Nusantara</h2>
                      <p className="text-[10px] text-zinc-600">Supplier Kayu Olahan, Aneka Industri Kayu • Rekapitulasi Tagihan & Faktur Invoice</p>
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
                      <th className="p-2 text-left">No. JO</th>
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
                        <td className="p-2 font-bold font-mono text-red-900">{po.nomorInvoice || `INV-${po.id.slice(-3)}`}</td>
                        <td className="p-2 font-mono font-bold text-blue-800">{po.nomorJO || '-'}</td>
                        <td className="p-2">{po.tanggalOrder || po.tanggal}</td>
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
                      <td colSpan={5} className="p-2 text-right">TOTAL NILAI FAKTUR PERIODE:</td>
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
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri (156-00-1909954-0 - CV Mustika Kayu Nusantara)</option>
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
