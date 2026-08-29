import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PurchaseOrder } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  TreePine, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  Users,
  RefreshCw,
  X
} from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';
import { downloadElementAsPdf, triggerPrintOrPdf } from '../utils/exportPdf';

export const DashboardView: React.FC = () => {
  const { purchaseOrders, materials, finishGoods, keuanganList, currentUser, resetDatabase } = useApp();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Helper formatting currency
  const formatIDR = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // --- BUSINESS METRICS CALCULATIONS ---
  // 1. Total PO Masuk
  const totalPOMasukCount = purchaseOrders.length;
  
  // 2. Total Invoices Terkirim (PO having invoice generated)
  const invoicesTerkirim = purchaseOrders.filter(po => po.nomorInvoice);
  const totalInvoicesTerkirimVal = invoicesTerkirim.reduce((acc, curr) => acc + curr.totalHarga, 0);

  // 3. Total Invoice Terbayar (Lunas)
  const invoicesTerbayar = purchaseOrders.filter(po => po.statusInvoice === 'Lunas');
  const totalInvoicesTerbayarVal = invoicesTerbayar.reduce((acc, curr) => acc + curr.totalHarga, 0);

  // 4. Total Invoice Belum Bayar
  const invoicesBelumBayar = purchaseOrders.filter(po => po.statusInvoice === 'Belum Bayar');
  const totalInvoicesBelumBayarVal = invoicesBelumBayar.reduce((acc, curr) => acc + curr.totalHarga, 0);

  // 5. Cashflow Balance Summary
  const totalPemasukan = keuanganList
    .filter(k => k.tipe === 'Pemasukan')
    .reduce((acc, curr) => acc + curr.nominal, 0);

  const totalPengeluaran = keuanganList
    .filter(k => k.tipe === 'Pengeluaran')
    .reduce((acc, curr) => acc + curr.nominal, 0);

  const kasNetto = totalPemasukan - totalPengeluaran;

  // 6. Stocks warning count
  const lowMaterials = materials.filter(m => m.stok <= m.minimalStok);
  const lowGoods = finishGoods.filter(g => g.stok <= g.minimalStok);

  // --- SVG CHART DATA CALCULATIONS ---
  // Distribution of Pallets Sold (Count items in completed / active POs)
  const palletSalesDistribution: Record<string, number> = {
    'Standard': 0,
    'Heavy Duty': 0,
    'Ekspor ISPM 15': 0,
    'Dua Arah': 0
  };

  purchaseOrders.forEach(po => {
    if (po.statusPO !== 'Dibatalkan') {
      po.item.forEach(i => {
        // Find corresponding finish good to know its type
        const match = finishGoods.find(g => g.nama === i.namaPallet || g.id === i.finishGoodId);
        const type = match ? match.tipe : 'Standard';
        palletSalesDistribution[type] = (palletSalesDistribution[type] || 0) + i.jumlah;
      });
    }
  });

  const totalPalletsSold = Object.values(palletSalesDistribution).reduce((a, b) => a + b, 0) || 1;

  // Custom Colors
  const chartColors = {
    'Standard': '#dc2626', // Red-600
    'Heavy Duty': '#16a34a', // Green-600
    'Ekspor ISPM 15': '#2563eb', // Blue-600
    'Dua Arah': '#d97706' // Amber-600
  };

  // Recent Activity Logs (Combined and sorted)
  const recentActivities = [
    ...purchaseOrders.map(po => ({
      tipe: 'PO',
      tanggal: po.tanggal,
      keterangan: `PO baru diajukan oleh ${po.pelanggan} senilai ${formatIDR(po.totalHarga)}`,
      status: po.statusPO,
      kategori: 'Penjualan'
    })),
    ...keuanganList.map(tx => ({
      tipe: 'CASH',
      tanggal: tx.tanggal,
      keterangan: `${tx.tipe}: ${tx.keterangan}`,
      status: tx.tipe === 'Pemasukan' ? 'Masuk' : 'Keluar',
      kategori: tx.kategori
    }))
  ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcelPOs = (start: string, end: string) => {
    const filtered = purchaseOrders.filter(po => {
      if (!start && !end) return true;
      let ok = true;
      if (start) ok = ok && po.tanggal >= start;
      if (end) ok = ok && po.tanggal <= end;
      return ok;
    });
    
    exportToExcel<PurchaseOrder>(
      filtered,
      ['ID PO', 'Nomor PO', 'Nomor Invoice', 'Tanggal', 'Pelanggan', 'Total Harga', 'Status PO', 'Status Invoice', 'Jatuh Tempo'],
      (po) => [
        po.id,
        po.nomorPO,
        po.nomorInvoice || '-',
        po.tanggal,
        po.pelanggan,
        po.totalHarga,
        po.statusPO,
        po.statusInvoice,
        po.tanggalJatuhTempo || '-'
      ],
      `Laporan_PO_${start || 'all'}_sd_${end || 'all'}`
    );
  };

  return (
    <div id="dashboard-view" className="p-4 md:p-6 space-y-6">
      
      {/* Banner / Welcome Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 transition-all">
        <div>
          <span className="text-red-600 dark:text-red-400 font-extrabold text-xs uppercase tracking-widest">Sistem Administrasi Terpadu</span>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mt-1">
            Selamat Datang!
          </h2>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Status pabrik hari ini terpantau <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Berjalan Lancar</span>. Seluruh stok dan transaksi telah diperbarui otomatis.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-excel-rekapan-main"
            onClick={() => handleExportExcelPOs(startDate, endDate)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download Excel Rekap
          </button>
          <button
            id="btn-cetak-rekapan"
            onClick={() => setShowPdfModal(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Cetak PDF Laporan Rekap
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: PO MASUK */}
        <div id="kpi-po" className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">TOTAL PO MASUK</p>
            <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1.5">{totalPOMasukCount} <span className="text-xs font-medium text-zinc-400">Pesanan</span></h3>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+18.5% dari bulan lalu</span>
            </div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl text-red-600 dark:text-red-400">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 2: INVOICE TERKIRIM / NILAI PENJUALAN */}
        <div id="kpi-invoice-terkirim" className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">INVOICE TERKIRIM</p>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-2 tracking-tight">{formatIDR(totalInvoicesTerkirimVal)}</h3>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
              <span>{invoicesTerkirim.length} Invoice diterbitkan</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-blue-600 dark:text-blue-400">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 3: INVOICE TERBAYAR */}
        <div id="kpi-invoice-terbayar" className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">INVOICE TERBAYAR</p>
            <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">{formatIDR(totalInvoicesTerbayarVal)}</h3>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{( (totalInvoicesTerbayarVal / (totalInvoicesTerkirimVal || 1)) * 100 ).toFixed(0)}% Tingkat Pelunasan</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 4: INVOICE BELUM TERBAYAR */}
        <div id="kpi-invoice-piutang" className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">PIUTANG BELUM BAYAR</p>
            <h3 className="text-lg font-black text-red-600 dark:text-red-400 mt-2 tracking-tight">{formatIDR(totalInvoicesBelumBayarVal)}</h3>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{invoicesBelumBayar.length} Menunggu Pembayaran</span>
            </div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl text-red-600 dark:text-red-400">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Stocks Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Material Stock Quick Overview */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 dark:bg-red-950/30 rounded-lg text-red-600 dark:text-red-400">
              <TreePine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">LAPORAN STOK MATERIAL</p>
              <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {materials.length} Jenis Bahan Baku Terdaftar
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${lowMaterials.length > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
            {lowMaterials.length > 0 ? `${lowMaterials.length} Butuh Order` : 'Stok Aman'}
          </span>
        </div>

        {/* Finish Goods Stock Quick Overview */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-600 dark:text-amber-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">LAPORAN STOK FINISH GOOD</p>
              <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {finishGoods.reduce((acc, curr) => acc + curr.stok, 0)} Pcs Pallet Siap Kirim
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${lowGoods.length > 0 ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
            {lowGoods.length > 0 ? `${lowGoods.length} Stok Tipis` : 'Gudang Penuh'}
          </span>
        </div>
      </div>

      {/* Visual Charts Grid (Bar Chart & Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Monthly Revenue Bar Chart (Custom SVG for maximum reliability) */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 lg:col-span-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Analitik Omset Penjualan Bulanan</h3>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Realisasi nominal invoice lunas & pending CV. Mustika Kayu Nusantara</p>
              </div>
              <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded">2026</span>
            </div>

            {/* Custom Interactive SVG Bar Chart */}
            <div className="relative h-64 w-full flex items-end justify-between pt-6 px-4">
              {/* Vertical Guide Lines */}
              <div className="absolute inset-x-0 bottom-0 h-[220px] flex flex-col justify-between pointer-events-none">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="w-full border-t border-dashed border-zinc-100 dark:border-zinc-800"></div>
                ))}
              </div>

              {/* Monthly Bar Pillars */}
              {[
                { bulan: 'Mei', paid: 12000000, unpaid: 3000000 },
                { bulan: 'Jun', paid: 24000000, unpaid: 4000000 },
                { bulan: 'Jul', paid: 35000000, unpaid: 10000000 },
                { bulan: 'Agu', paid: totalInvoicesTerbayarVal, unpaid: totalInvoicesBelumBayarVal }
              ].map((data, i) => {
                const totalMonth = data.paid + data.unpaid;
                const maxVal = 70000000; // Normalizer scale
                const paidHeight = (data.paid / maxVal) * 200;
                const unpaidHeight = (data.unpaid / maxVal) * 200;

                return (
                  <div key={i} className="flex flex-col items-center gap-2 group z-10 w-1/5 relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all bg-zinc-950 text-white text-[10px] p-2 rounded shadow-xl z-50 text-center pointer-events-none min-w-[120px]">
                      <p className="font-extrabold text-red-400">{data.bulan} 2026</p>
                      <p className="mt-0.5">Lunas: {formatIDR(data.paid)}</p>
                      <p>Piutang: {formatIDR(data.unpaid)}</p>
                    </div>

                    {/* Bar stack */}
                    <div className="w-12 flex flex-col justify-end h-[200px] gap-0.5 rounded-t-md overflow-hidden">
                      {/* Unpaid part (top) */}
                      {data.unpaid > 0 && (
                        <div 
                          style={{ height: `${unpaidHeight}px` }} 
                          className="w-full bg-red-400 dark:bg-red-500/80 hover:brightness-110 transition-all rounded-t-sm"
                          title={`Unpaid: ${formatIDR(data.unpaid)}`}
                        ></div>
                      )}
                      {/* Paid part (bottom) */}
                      {data.paid > 0 && (
                        <div 
                          style={{ height: `${paidHeight}px` }} 
                          className="w-full bg-red-700 dark:bg-red-600 hover:brightness-110 transition-all"
                          title={`Paid: ${formatIDR(data.paid)}`}
                        ></div>
                      )}
                    </div>

                    {/* Label */}
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{data.bulan}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-4 justify-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 bg-red-700 rounded-sm"></span>
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Terbayar (Lunas)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 bg-red-400 rounded-sm"></span>
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Piutang (Belum Bayar)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Pallet Type Sales Distribution (Donut / Pie Chart) */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 lg:col-span-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Distribusi Penjualan Pallet</h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Proporsi pesanan produk berdasarkan kategori pallet kayu</p>

            {/* Custom SVG Donut Chart */}
            <div className="relative h-44 flex items-center justify-center mt-6">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#e4e4e7"
                  strokeWidth="10"
                  className="dark:stroke-zinc-800"
                />
                
                {/* Dynamically drawing pie slices */}
                {(() => {
                  let accumulatedPercent = 0;
                  return Object.entries(palletSalesDistribution).map(([type, val], i) => {
                    const percent = (val / totalPalletsSold) * 100;
                    if (percent === 0) return null;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = 100 - accumulatedPercent + 25; // +25 to rotate to top start point
                    accumulatedPercent += percent;

                    return (
                      <circle
                        key={type}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={chartColors[type as keyof typeof chartColors] || '#333'}
                        strokeWidth="10"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 hover:stroke-[12px] cursor-pointer"
                        title={`${type}: ${val} pcs (${percent.toFixed(1)}%)`}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Inner Center Text */}
              <div className="absolute text-center">
                <span className="block text-xl font-black text-zinc-850 dark:text-zinc-100">{totalPalletsSold}</span>
                <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">UNIT PO</span>
              </div>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[10px]">
            {Object.entries(palletSalesDistribution).map(([type, val]) => {
              const percent = (val / totalPalletsSold) * 100;
              return (
                <div key={type} className="flex items-center gap-1.5 min-w-0">
                  <span 
                    className="h-2 w-2 rounded-full shrink-0" 
                    style={{ backgroundColor: chartColors[type as keyof typeof chartColors] }}
                  ></span>
                  <span className="text-zinc-600 dark:text-zinc-400 font-semibold truncate">{type}</span>
                  <span className="text-zinc-400 dark:text-zinc-500 font-bold">({percent.toFixed(0)}%)</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Low Stock Warning & Recent Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Low Stock Alerts Panels */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 lg:col-span-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Peringatan Kritis Stok Menipis</h3>
          </div>

          <div className="space-y-3">
            {/* Materials List */}
            {lowMaterials.map((m) => (
              <div key={m.id} className="p-3 bg-amber-50/60 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200">{m.nama}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Kategori: {m.kategori} • Supplier: {m.supplier}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block text-xs font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                    Sisa {m.stok} {m.satuan}
                  </span>
                  <p className="text-[9px] text-zinc-400 mt-1 font-semibold">Min: {m.minimalStok} {m.satuan}</p>
                </div>
              </div>
            ))}

            {/* Finished Goods List */}
            {lowGoods.map((g) => (
              <div key={g.id} className="p-3 bg-red-50/40 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/30 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200">{g.nama}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Tipe: {g.tipe} • Ukuran: {g.dimensi}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block text-xs font-black text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/50 px-2 py-0.5 rounded">
                    Sisa {g.stok} pcs
                  </span>
                  <p className="text-[9px] text-zinc-400 mt-1 font-semibold">Min: {g.minimalStok} pcs</p>
                </div>
              </div>
            ))}

            {lowMaterials.length === 0 && lowGoods.length === 0 && (
              <div className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-xs">
                <p>Seluruh stok material dan pallet terisi dengan aman di atas batas minimal!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 lg:col-span-7 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-4">Aktivitas Terakhir Pabrik</h3>
          
          <div className="space-y-4">
            {recentActivities.map((act, idx) => (
              <div key={idx} className="flex gap-3.5 items-start">
                <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                  act.tipe === 'PO' ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                }`}>
                  {act.tipe === 'PO' ? <FileSpreadsheet className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-150 truncate">{act.keterangan}</p>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">{act.tanggal}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold px-1.5 py-0.5 rounded">
                      {act.kategori}
                    </span>
                    <span className={`text-[10px] font-bold ${
                      act.status === 'Selesai' || act.status === 'Masuk' || act.status === 'Lunas' 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      • {act.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {recentActivities.length === 0 && (
              <div className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-xs">
                <p>Belum ada aktivitas tercatat.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- REPORT PRINT MODAL (Simulasi Cetak PDF Rekap) --- */}
      {showPdfModal && (() => {
        // Filter POs and Keuangan by selected date range
        const filteredReportPOs = purchaseOrders.filter(po => {
          if (!startDate && !endDate) return true;
          let ok = true;
          if (startDate) ok = ok && po.tanggal >= startDate;
          if (endDate) ok = ok && po.tanggal <= endDate;
          return ok;
        });

        const filteredReportKeuangan = keuanganList.filter(tx => {
          if (!startDate && !endDate) return true;
          let ok = true;
          if (startDate) ok = ok && tx.tanggal >= startDate;
          if (endDate) ok = ok && tx.tanggal <= endDate;
          return ok;
        });

        // Re-calculate statistics for the chosen period
        const periodPOMasukCount = filteredReportPOs.length;
        const periodInvoicesTerkirim = filteredReportPOs.filter(po => po.nomorInvoice);
        const periodInvoicesTerkirimVal = periodInvoicesTerkirim.reduce((acc, curr) => acc + curr.totalHarga, 0);
        const periodInvoicesTerbayar = filteredReportPOs.filter(po => po.statusInvoice === 'Lunas');
        const periodInvoicesTerbayarVal = periodInvoicesTerbayar.reduce((acc, curr) => acc + curr.totalHarga, 0);
        const periodInvoicesBelumBayar = filteredReportPOs.filter(po => po.statusInvoice === 'Belum Bayar');
        const periodInvoicesBelumBayarVal = periodInvoicesBelumBayar.reduce((acc, curr) => acc + curr.totalHarga, 0);

        const periodPemasukan = filteredReportKeuangan
          .filter(k => k.tipe === 'Pemasukan')
          .reduce((acc, curr) => acc + curr.nominal, 0);
        const periodPengeluaran = filteredReportKeuangan
          .filter(k => k.tipe === 'Pengeluaran')
          .reduce((acc, curr) => acc + curr.nominal, 0);
        const periodKasNetto = periodPemasukan - periodPengeluaran;

        const formatDateIndo = (dateStr: string) => {
          if (!dateStr) return '-';
          try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          } catch(e) {
            return dateStr;
          }
        };

        return (
          <div id="report-pdf-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 relative">
              
              {/* Floating Close Button X (Non-Printable) */}
              <button 
                onClick={() => setShowPdfModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer print:hidden z-10"
                title="Tutup Modal"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Header Controls (Non-Printable) */}
              <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden pr-12">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-600 animate-pulse" />
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Laporan Eksekutif & PO (Siap Cetak PDF)</h3>
                    <p className="text-[10px] text-zinc-400">Atur rentang waktu periode cetak di bawah ini</p>
                  </div>
                </div>

                {/* Periode / Date Picker */}
                <div className="flex flex-wrap items-center gap-2 text-xs bg-zinc-100 dark:bg-zinc-800/50 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 font-extrabold text-[9px] uppercase">Mulai:</span>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                      className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-50 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 font-extrabold text-[9px] uppercase">Selesai:</span>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                      className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-50 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 md:ml-auto w-full md:w-auto justify-end flex-wrap md:flex-nowrap">
                  <button
                    onClick={() => handleExportExcelPOs(startDate, endDate)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Excel
                  </button>
                  <button
                    disabled={isDownloadingPdf}
                    onClick={async () => {
                      setIsDownloadingPdf(true);
                      await downloadElementAsPdf('dashboard-print-area', `Laporan_Eksekutif_${startDate}_sd_${endDate}`);
                      setIsDownloadingPdf(false);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF'}
                  </button>
                  <button
                    onClick={() => triggerPrintOrPdf('dashboard-print-area', `Laporan_Eksekutif_${startDate}_sd_${endDate}`)}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </button>
                  <button
                    onClick={() => setShowPdfModal(false)}
                    className="px-3.5 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              {/* Printable Area */}
              <div id="dashboard-print-area" className="p-8 md:p-12 bg-white text-black min-h-[800px] font-sans printable-sheet">
                
                {/* Kop Surat (Company Letterhead) */}
                <div className="flex justify-between items-center border-b-4 border-zinc-800 pb-5 mb-8">
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
                  <div className="text-right text-xs text-zinc-500">
                    <p className="font-bold text-red-800 text-sm uppercase tracking-wide">LAPORAN REKAPITULASI RESMI</p>
                    <p className="mt-1 font-semibold text-zinc-800">Periode: {formatDateIndo(startDate)} s/d {formatDateIndo(endDate)}</p>
                    <p className="text-[10px]">Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
                  </div>
                </div>

                {/* Laporan Title */}
                <div className="text-center mb-8">
                  <h2 className="text-xl font-extrabold uppercase underline tracking-wide">LAPORAN REKAPITULASI ADMINISTRASI PABRIK & PO</h2>
                  <p className="text-xs text-zinc-500 mt-1">Dicetak secara sistematis oleh Sistem ERP Pabrik</p>
                </div>

                {/* Summary Stats Row for PDF */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">Total PO Masuk</span>
                    <span className="text-base font-extrabold text-zinc-900 mt-1 block">{periodPOMasukCount} Pesanan</span>
                  </div>
                  <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">Invoice Terbit</span>
                    <span className="text-base font-extrabold text-zinc-900 mt-1 block">{formatIDR(periodInvoicesTerkirimVal)}</span>
                  </div>
                  <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">Dana Masuk (Lunas)</span>
                    <span className="text-base font-extrabold text-emerald-700 mt-1 block">{formatIDR(periodInvoicesTerbayarVal)}</span>
                  </div>
                  <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">Dana Piutang</span>
                    <span className="text-base font-extrabold text-red-700 mt-1 block">{formatIDR(periodInvoicesBelumBayarVal)}</span>
                  </div>
                </div>

                {/* PO List Table */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold border-b border-zinc-300 pb-1 mb-2 text-red-800 uppercase tracking-wider">1. LAPORAN REKAPITULASI PURCHASE ORDER (PO) MASUK</h3>
                  <table className="w-full text-[11px] text-left border-collapse border border-zinc-200">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-700 uppercase font-bold">
                        <th className="p-2 border border-zinc-200">No PO</th>
                        <th className="p-2 border border-zinc-200">Tanggal</th>
                        <th className="p-2 border border-zinc-200">Pelanggan / Pembeli</th>
                        <th className="p-2 border border-zinc-200">Detail Item Pallet</th>
                        <th className="p-2 border border-zinc-200 text-right">Subtotal</th>
                        <th className="p-2 border border-zinc-200 text-center">Status PO</th>
                        <th className="p-2 border border-zinc-200 text-center">Status Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {filteredReportPOs.map((po) => (
                        <tr key={po.id} className="hover:bg-zinc-50/20">
                          <td className="p-2 border border-zinc-200 font-mono font-bold text-zinc-900">{po.nomorPO || 'DRAF'}</td>
                          <td className="p-2 border border-zinc-200">{po.tanggal}</td>
                          <td className="p-2 border border-zinc-200 font-bold">{po.pelanggan}</td>
                          <td className="p-2 border border-zinc-200">
                            {po.item.map((i, k) => (
                              <p key={k} className="text-[10px] text-zinc-600">
                                - {i.namaPallet} ({i.jumlah} pcs @ {formatIDR(i.hargaSatuan)})
                              </p>
                            ))}
                          </td>
                          <td className="p-2 border border-zinc-200 text-right font-bold text-red-800">{formatIDR(po.totalHarga)}</td>
                          <td className="p-2 border border-zinc-200 text-center font-bold text-zinc-700">{po.statusPO}</td>
                          <td className="p-2 border border-zinc-200 text-center font-bold">
                            <span className={po.statusInvoice === 'Lunas' ? 'text-emerald-700' : 'text-red-600'}>
                              {po.statusInvoice}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredReportPOs.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-zinc-400 font-medium bg-zinc-50">
                            Tidak ada Purchase Order (PO) masuk untuk periode yang dipilih.
                          </td>
                        </tr>
                      )}
                      <tr className="bg-zinc-100 font-bold">
                        <td colSpan={4} className="p-2 border border-zinc-200 text-right uppercase text-[10px]">Total Nilai PO Masuk:</td>
                        <td className="p-2 border border-zinc-200 text-right text-red-800 text-[12px]">{formatIDR(filteredReportPOs.reduce((s, p) => s + p.totalHarga, 0))}</td>
                        <td colSpan={2} className="p-2 border border-zinc-200"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Stocks Table in PDF */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold border-b border-zinc-300 pb-1 mb-2 text-red-800 uppercase tracking-wider">2. LAPORAN STOK MATERIAL (BAHAN BAKU)</h3>
                  <table className="w-full text-[11px] text-left border-collapse border border-zinc-200">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-700 uppercase font-bold">
                        <th className="p-2 border border-zinc-200">Kode</th>
                        <th className="p-2 border border-zinc-200">Nama Material</th>
                        <th className="p-2 border border-zinc-200">Kategori</th>
                        <th className="p-2 border border-zinc-200 text-right">Stok Saat Ini</th>
                        <th className="p-2 border border-zinc-200 text-right">Harga Beli Rata-Rata</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m) => (
                        <tr key={m.id}>
                          <td className="p-2 border border-zinc-200 font-mono">{m.kode}</td>
                          <td className="p-2 border border-zinc-200 font-bold">{m.nama}</td>
                          <td className="p-2 border border-zinc-200">{m.kategori}</td>
                          <td className="p-2 border border-zinc-200 text-right font-bold text-zinc-800">{m.stok} {m.satuan}</td>
                          <td className="p-2 border border-zinc-200 text-right">{formatIDR(m.hargaBeli)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Finish Goods Table in PDF */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold border-b border-zinc-300 pb-1 mb-2 text-red-800 uppercase tracking-wider">3. LAPORAN STOK BARANG JADI (PALLET SIAP KIRIM)</h3>
                  <table className="w-full text-[11px] text-left border-collapse border border-zinc-200">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-700 uppercase font-bold">
                        <th className="p-2 border border-zinc-200">Kode</th>
                        <th className="p-2 border border-zinc-200">Tipe Pallet</th>
                        <th className="p-2 border border-zinc-200">Ukuran / Dimensi</th>
                        <th className="p-2 border border-zinc-200 text-right">Stok Tersedia</th>
                        <th className="p-2 border border-zinc-200 text-right">Harga Jual Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finishGoods.map((g) => (
                        <tr key={g.id}>
                          <td className="p-2 border border-zinc-200 font-mono">{g.kode}</td>
                          <td className="p-2 border border-zinc-200 font-bold">{g.nama}</td>
                          <td className="p-2 border border-zinc-200">{g.dimensi}</td>
                          <td className="p-2 border border-zinc-200 text-right font-bold text-zinc-800">{g.stok} pcs</td>
                          <td className="p-2 border border-zinc-200 text-right">{formatIDR(g.hargaJual)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Finance Ledger Table in PDF */}
                <div className="mb-12">
                  <h3 className="text-xs font-bold border-b border-zinc-300 pb-1 mb-2 text-red-800 uppercase tracking-wider">4. BUKU ARUS KAS KEUANGAN (CASHFLOW)</h3>
                  <table className="w-full text-[11px] text-left border-collapse border border-zinc-200">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-700 uppercase font-bold">
                        <th className="p-2 border border-zinc-200">Tanggal</th>
                        <th className="p-2 border border-zinc-200">Transaksi</th>
                        <th className="p-2 border border-zinc-200">Metode</th>
                        <th className="p-2 border border-zinc-200 text-right">Debet (Masuk)</th>
                        <th className="p-2 border border-zinc-200 text-right">Kredit (Keluar)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReportKeuangan.map((tx) => (
                        <tr key={tx.id}>
                          <td className="p-2 border border-zinc-200">{tx.tanggal}</td>
                          <td className="p-2 border border-zinc-200 font-bold">{tx.keterangan}</td>
                          <td className="p-2 border border-zinc-200">{tx.metodePembayaran}</td>
                          <td className="p-2 border border-zinc-200 text-right font-bold text-emerald-800">
                            {tx.tipe === 'Pemasukan' ? formatIDR(tx.nominal) : '-'}
                          </td>
                          <td className="p-2 border border-zinc-200 text-right font-bold text-red-800">
                            {tx.tipe === 'Pengeluaran' ? formatIDR(tx.nominal) : '-'}
                          </td>
                        </tr>
                      ))}
                      {filteredReportKeuangan.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-zinc-400 font-medium bg-zinc-50">
                            Tidak ada arus kas tercatat untuk periode yang dipilih.
                          </td>
                        </tr>
                      )}
                      <tr className="bg-zinc-50 font-bold border-t-2 border-zinc-300">
                        <td colSpan={3} className="p-2 border border-zinc-200 text-right uppercase text-[10px]">Saldo Kas Bersih Bulanan:</td>
                        <td colSpan={2} className="p-2 border border-zinc-300 text-right text-sm text-red-850">
                          {formatIDR(periodKasNetto)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signature Block */}
                <div className="flex justify-between items-center text-xs mt-12 pt-8 border-t border-dashed border-zinc-300">
                  <div className="text-center w-40">
                    <p>Dibuat Oleh,</p>
                    <p className="mt-14 font-extrabold underline">
                      {currentUser?.role === 'OWNER' ? 'Owner / Pimpinan' : 
                       currentUser?.role === 'FINANCE' ? 'Staf Keuangan' : 
                       currentUser?.role === 'WAREHOUSE' ? 'Staf Logistik' : 'Staf Administrasi'}
                    </p>
                    <p className="text-[10px] text-zinc-500">Divisi Terkait</p>
                  </div>
                  <div className="text-center w-40">
                    <p>Disetujui Oleh,</p>
                    <p className="mt-14 font-extrabold underline">Pimpinan Pabrik</p>
                    <p className="text-[10px] text-zinc-500">Owner & Direktur</p>
                  </div>
                </div>

              </div>

              {/* Sticky Bottom Action Bar (Non-Printable) */}
              <div className="sticky bottom-0 z-20 bg-zinc-50 dark:bg-zinc-900 px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 print:hidden shadow-lg">
                <div className="text-xs text-zinc-500 font-medium hidden sm:block">
                  Laporan Rekap: <strong className="text-zinc-800 dark:text-zinc-200">{startDate} s/d {endDate}</strong>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setShowPdfModal(false)}
                    className="px-4 sm:px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Tutup / Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportExcelPOs(startDate, endDate)}
                    className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Unduh Excel
                  </button>
                  <button
                    type="button"
                    disabled={isDownloadingPdf}
                    onClick={async () => {
                      setIsDownloadingPdf(true);
                      await downloadElementAsPdf('dashboard-print-area', `Laporan_Eksekutif_${startDate}_sd_${endDate}`);
                      setIsDownloadingPdf(false);
                    }}
                    className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF (.pdf)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerPrintOrPdf('dashboard-print-area', `Laporan_Eksekutif_${startDate}_sd_${endDate}`)}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    Cetak (Print)
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
