import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Keuangan } from '../types';
import { Plus, Search, Filter, Wallet, ArrowDownLeft, ArrowUpRight, PlusCircle, MinusCircle, Trash2, Calendar, Printer, Download, X, FileText } from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';
import { exportToExcel } from '../utils/exportExcel';
import { downloadElementAsPdf, triggerPrintOrPdf, showPdfToast } from '../utils/exportPdf';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export const KeuanganView: React.FC = () => {
  const { keuanganList, addKeuangan, deleteKeuangan, currentUser } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tipeFilter, setTipeFilter] = useState<string>('SEMUA');
  const [kategoriFilter, setKategoriFilter] = useState<string>('SEMUA');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printStartDate, setPrintStartDate] = useState('2026-08-01');
  const [printEndDate, setPrintEndDate] = useState('2026-08-31');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Keuangan | null>(null);

  // Form Fields
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [tipe, setTipe] = useState<Keuangan['tipe']>('Pemasukan');
  const [kategori, setKategori] = useState<Keuangan['kategori']>('Penjualan Pallet');
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal] = useState(0);
  const [metodePembayaran, setMetodePembayaran] = useState<Keuangan['metodePembayaran']>('Transfer Bank BCA');

  const categoriesList = [
    'Penjualan Pallet',
    'Pembelian Material',
    'Gaji Karyawan',
    'Operasional Pabrik',
    'Transportasi',
    'Lainnya'
  ];

  // Calculations
  const totalPemasukan = keuanganList
    .filter(tx => tx.tipe === 'Pemasukan')
    .reduce((acc, curr) => acc + curr.nominal, 0);

  const totalPengeluaran = keuanganList
    .filter(tx => tx.tipe === 'Pengeluaran')
    .reduce((acc, curr) => acc + curr.nominal, 0);

  const saldoBersih = totalPemasukan - totalPengeluaran;

  // Filter transaction list
  const filteredTx = keuanganList.filter(tx => {
    const matchesSearch = tx.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.kodeTransaksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.kategori.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipe = tipeFilter === 'SEMUA' || tx.tipe === tipeFilter;
    const matchesKategori = kategoriFilter === 'SEMUA' || tx.kategori === kategoriFilter;

    return matchesSearch && matchesTipe && matchesKategori;
  });

  const handleOpenAddModal = () => {
    setTanggal(new Date().toISOString().split('T')[0]);
    setTipe('Pemasukan');
    setKategori('Penjualan Pallet');
    setKeterangan('');
    setNominal(0);
    setMetodePembayaran('Transfer Bank BCA');
    setShowAddModal(true);
  };

  const handleTipeChange = (newTipe: Keuangan['tipe']) => {
    setTipe(newTipe);
    // Set appropriate default category
    if (newTipe === 'Pemasukan') {
      setKategori('Penjualan Pallet');
    } else {
      setKategori('Pembelian Material');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addKeuangan({
      tanggal,
      tipe,
      kategori,
      keterangan,
      nominal,
      pencatat: currentUser?.name || 'Staf Keuangan',
      metodePembayaran
    });
    setShowAddModal(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteKeuangan(deleteTarget.id);
      showPdfToast(`Catatan transaksi "${deleteTarget.kodeTransaksi}" berhasil dihapus.`);
      setDeleteTarget(null);
    }
  };

  const handleExportExcelKeuangan = (start: string, end: string) => {
    const filtered = keuanganList.filter(tx => {
      if (!start && !end) return true;
      let ok = true;
      if (start) ok = ok && tx.tanggal >= start;
      if (end) ok = ok && tx.tanggal <= end;
      return ok;
    });

    exportToExcel<Keuangan>(
      filtered,
      ['Kode Transaksi', 'Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Nominal', 'Metode Pembayaran', 'Pencatat'],
      (tx) => [
        tx.kodeTransaksi,
        tx.tanggal,
        tx.tipe,
        tx.kategori,
        tx.keterangan,
        tx.nominal,
        tx.metodePembayaran,
        tx.pencatat
      ],
      `Laporan_Keuangan_Kas_${start || 'all'}_sd_${end || 'all'}`
    );
  };

  return (
    <div id="keuangan-view" className="p-4 md:p-6 space-y-6">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Arus Kas & Buku Kas Besar</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Kelola pencatatan pengeluaran operasional, bahan baku, gaji, dan penerimaan omset pallet.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-excel-kas"
            onClick={() => handleExportExcelKeuangan(printStartDate, printEndDate)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Download className="h-4.5 w-4.5" />
            Download Excel Kas
          </button>
          <button
            id="btn-cetak-kas-pdf"
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Printer className="h-4.5 w-4.5" />
            Cetak PDF Kas
          </button>
          <button
            id="btn-tambah-kas"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <Plus className="h-4.5 w-4.5" />
            Catat Transaksi Baru
          </button>
        </div>
      </div>

      {/* Cashflow Metrics Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Inflow */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">TOTAL PEMASUKAN (DEBET)</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
              + Rp {totalPemasukan.toLocaleString('id-ID')}
            </h3>
            <span className="text-[10px] text-zinc-400 block mt-1">Akumulasi penjualan pallet lunas</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-emerald-600 dark:text-emerald-400">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
        </div>

        {/* Total Outflow */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">TOTAL PENGELUARAN (KREDIT)</p>
            <h3 className="text-xl font-black text-red-650 dark:text-red-400 mt-1.5">
              - Rp {totalPengeluaran.toLocaleString('id-ID')}
            </h3>
            <span className="text-[10px] text-zinc-400 block mt-1">Operasional, logistik, gaji & material</span>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl text-red-600 dark:text-red-400">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>

        {/* Total Balance */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">SALDO KAS NETTO</p>
            <h3 className={`text-xl font-black mt-1.5 ${saldoBersih >= 0 ? 'text-zinc-900 dark:text-zinc-50' : 'text-red-600'}`}>
              Rp {saldoBersih.toLocaleString('id-ID')}
            </h3>
            <span className="text-[10px] text-zinc-400 block mt-1">Dana kas aktif di bank & brankas</span>
          </div>
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-650 dark:text-zinc-350">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="search-keuangan-input"
            type="text"
            placeholder="Cari keterangan, kode transaksi, kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Tipe Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-zinc-400 uppercase hidden sm:inline">Jenis</span>
            <select
              value={tipeFilter}
              onChange={(e) => setTipeFilter(e.target.value)}
              className="block w-full sm:w-auto px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-700 dark:text-zinc-300"
            >
              <option value="SEMUA">Semua Aliran Kas</option>
              <option value="Pemasukan">Pemasukan (Debet)</option>
              <option value="Pengeluaran">Pengeluaran (Kredit)</option>
            </select>
          </div>

          {/* Kategori Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-zinc-400 uppercase hidden sm:inline">Kategori</span>
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="block w-full sm:w-auto px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-700 dark:text-zinc-300"
            >
              <option value="SEMUA">Semua Kategori</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-zinc-200/80 dark:border-zinc-800/80">
                <th className="p-4">Tanggal</th>
                <th className="p-4">Kode Transaksi</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-left">Deskripsi / Keterangan</th>
                <th className="p-4">Metode Bayar</th>
                <th className="p-4 text-right">Debet (Masuk)</th>
                <th className="p-4 text-right">Kredit (Keluar)</th>
                <th className="p-4 text-center">Pencatat</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-semibold text-zinc-700 dark:text-zinc-300">
              {filteredTx.map((tx) => (
                <tr key={tx.id} id={`row-kas-${tx.id}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 whitespace-nowrap text-zinc-400 dark:text-zinc-500 font-bold">{tx.tanggal}</td>
                  <td className="p-4 font-mono font-bold text-red-750 dark:text-red-400">{tx.kodeTransaksi}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300">
                      {tx.kategori}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-850 dark:text-zinc-100 font-bold text-xs max-w-xs truncate" title={tx.keterangan}>
                    {tx.keterangan}
                  </td>
                  <td className="p-4 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">{tx.metodePembayaran}</td>
                  
                  {/* Debet (Pemasukan) */}
                  <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {tx.tipe === 'Pemasukan' ? `+ Rp ${tx.nominal.toLocaleString('id-ID')}` : '-'}
                  </td>

                  {/* Kredit (Pengeluaran) */}
                  <td className="p-4 text-right font-black text-red-650 dark:text-red-450 whitespace-nowrap">
                    {tx.tipe === 'Pengeluaran' ? `- Rp ${tx.nominal.toLocaleString('id-ID')}` : '-'}
                  </td>

                  <td className="p-4 text-center text-zinc-500 dark:text-zinc-400 font-bold text-[10px]">{tx.pencatat}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setDeleteTarget(tx)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer transition-all"
                      title="Hapus Catatan Transaksi"
                    >
                      <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-zinc-400 dark:text-zinc-500">
                    Tidak ada catatan aliran kas masuk atau keluar yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD TRANSACTION MODAL --- */}
      {showAddModal && (
        <div id="kas-form-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">Catat Transaksi Buku Kas</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-650 text-xl cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 font-semibold">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Tipe Transaksi selector */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">Tipe Aliran Kas</label>
                  <select
                    value={tipe}
                    onChange={(e) => handleTipeChange(e.target.value as Keuangan['tipe'])}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  >
                    <option value="Pemasukan">Pemasukan / Debet (+)</option>
                    <option value="Pengeluaran">Pengeluaran / Kredit (-)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">Kategori</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as Keuangan['kategori'])}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  >
                    {tipe === 'Pemasukan' ? (
                      <>
                        <option value="Penjualan Pallet">Penjualan Pallet</option>
                        <option value="Lainnya">Penerimaan Lainnya</option>
                      </>
                    ) : (
                      <>
                        <option value="Pembelian Material">Pembelian Material</option>
                        <option value="Gaji Karyawan">Gaji & Upah Tukang</option>
                        <option value="Operasional Pabrik">Operasional & Solar</option>
                        <option value="Transportasi">Pengantaran / Solar Logistik</option>
                        <option value="Lainnya">Biaya Lainnya</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">Metode Pembayaran</label>
                  <select
                    value={metodePembayaran}
                    onChange={(e) => setMetodePembayaran(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  >
                    <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                    <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                    <option value="Cash / Tunai">Cash / Tunai</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">NOMINAL (IDR)</label>
                <input
                  type="number"
                  required
                  min="500"
                  step="500"
                  value={nominal}
                  onChange={(e) => setNominal(Number(e.target.value))}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-black focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">DESKRIPSI / KETERANGAN</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g., Pembelian Solar Genset Pabrik, atau DP Pembelian Kayu"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:ring-2 focus:ring-red-500"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-650"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Simpan Aliran Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PRINTABLE KAS REPORT PERIOD MODAL --- */}
      {showPrintModal && (
        <div id="kas-report-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 relative">
            
            {/* Floating Close Button X (Non-Printable) */}
            <button 
              onClick={() => setShowPrintModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer print:hidden z-10"
              title="Tutup Laporan"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header controls (Non-printable) */}
            <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden pr-12">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Laporan Kas Periode</h3>
                  <span className="inline-block bg-yellow-100 text-yellow-850 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">REVIEW SEBELUM CETAK</span>
                </div>
              </div>

              {/* Period selection in modal header */}
              <div className="flex flex-wrap items-center gap-2 text-xs bg-zinc-150/50 dark:bg-zinc-800/30 p-2 rounded-xl">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500 font-extrabold text-[9px] uppercase">Mulai:</span>
                  <input 
                    type="date" 
                    value={printStartDate} 
                    onChange={(e) => setPrintStartDate(e.target.value)} 
                    className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-50 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500 font-extrabold text-[9px] uppercase">Selesai:</span>
                  <input 
                    type="date" 
                    value={printEndDate} 
                    onChange={(e) => setPrintEndDate(e.target.value)} 
                    className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-50 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => handleExportExcelKeuangan(printStartDate, printEndDate)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Excel
                </button>
                <button
                  disabled={isDownloadingPdf}
                  onClick={async () => {
                    setIsDownloadingPdf(true);
                    await downloadElementAsPdf('keuangan-print-area', `Laporan_Buku_Kas_${printStartDate}_sd_${printEndDate}`);
                    setIsDownloadingPdf(false);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF'}
                </button>
                <button
                  onClick={() => triggerPrintOrPdf('keuangan-print-area', `Laporan_Buku_Kas_${printStartDate}_sd_${printEndDate}`)}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-3.5 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Printable Report Content */}
            <div id="keuangan-print-area" className="p-8 md:p-12 bg-white text-black font-sans min-h-[600px] printable-sheet">
              
              {/* Header Kop Surat */}
              <div className="flex justify-between items-start border-b border-zinc-300 pb-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-1 bg-white border border-zinc-200 rounded-xl flex items-center justify-center shrink-0">
                    <CompanyLogo size="md" className="h-14 w-14" />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">CV. MUSTIKA KAYU</h1>
                    <p className="text-[10px] text-zinc-500 max-w-sm mt-0.5">
                      Industri Pengolahan Kayu & Pallet Kayu Berkualitas Tinggi (ISPM #15).<br />
                      Sragentoyoso, Sragen, Jawa Tengah, Indonesia.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-sm font-extrabold text-zinc-900 uppercase">LAPORAN BUKU KAS</h2>
                  <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase">
                    Periode: {printStartDate} s/d {printEndDate}
                  </p>
                </div>
              </div>

              {/* Filtering data & math inside print view */}
              {(() => {
                const list = keuanganList.filter(t => {
                  let ok = true;
                  if (printStartDate) ok = ok && t.tanggal >= printStartDate;
                  if (printEndDate) ok = ok && t.tanggal <= printEndDate;
                  return ok;
                });

                const totalIn = list.filter(t => t.tipe === 'Pemasukan').reduce((a, b) => a + b.nominal, 0);
                const totalOut = list.filter(t => t.tipe === 'Pengeluaran').reduce((a, b) => a + b.nominal, 0);
                const balance = totalIn - totalOut;

                return (
                  <div className="space-y-6">
                    {/* Summary statistics row */}
                    <div className="grid grid-cols-3 gap-4 border border-zinc-200 p-4 rounded-xl bg-zinc-50/50">
                      <div className="text-center border-r border-zinc-200">
                        <span className="text-[9px] uppercase font-black text-zinc-400 block">Total Pemasukan</span>
                        <span className="text-sm font-extrabold text-emerald-600">Rp {totalIn.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="text-center border-r border-zinc-200">
                        <span className="text-[9px] uppercase font-black text-zinc-400 block">Total Pengeluaran</span>
                        <span className="text-sm font-extrabold text-red-600">Rp {totalOut.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] uppercase font-black text-zinc-400 block">Saldo Bersih (Net)</span>
                        <span className={`text-sm font-extrabold ${balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                          Rp {balance.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-100 border-b border-zinc-200 font-extrabold text-zinc-700">
                            <th className="p-3">Kode</th>
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Tipe</th>
                            <th className="p-3">Kategori</th>
                            <th className="p-3">Keterangan</th>
                            <th className="p-3 text-right">Nominal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-150">
                          {list.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-zinc-400 font-medium">
                                Tidak ada catatan transaksi kas pada rentang periode ini.
                              </td>
                            </tr>
                          ) : (
                            list.map(tx => (
                              <tr key={tx.id} className="hover:bg-zinc-50/50">
                                <td className="p-3 font-mono font-bold text-zinc-650">{tx.kodeTransaksi}</td>
                                <td className="p-3">{tx.tanggal}</td>
                                <td className="p-3">
                                  <span className={`font-black ${tx.tipe === 'Pemasukan' ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {tx.tipe}
                                  </span>
                                </td>
                                <td className="p-3 font-medium text-zinc-600">{tx.kategori}</td>
                                <td className="p-3 text-zinc-800">{tx.keterangan}</td>
                                <td className="p-3 text-right font-mono font-bold">
                                  Rp {tx.nominal.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer Signs */}
                    <div className="pt-12 flex justify-between items-center text-xs text-center">
                      <div className="w-48">
                        <p>Dipersiapkan Oleh,</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">{currentUser?.name || 'Staf Administrasi'}</p>
                        <p className="text-[10px] text-zinc-400">Bagian Kasir / Finance</p>
                      </div>
                      <div className="w-48">
                        <p>Mengetahui / Menyetujui,</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">Direktur Utama</p>
                        <p className="text-[10px] text-zinc-400">CV. Mustika Kayu</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Sticky Bottom Action Bar (Non-Printable) */}
            <div className="sticky bottom-0 z-20 bg-zinc-50 dark:bg-zinc-900 px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 print:hidden shadow-lg">
              <div className="text-xs text-zinc-500 font-medium hidden sm:block">
                Laporan Kas: <strong className="text-zinc-800 dark:text-zinc-200">{printStartDate} s/d {printEndDate}</strong>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 sm:px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Tutup / Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleExportExcelKeuangan(printStartDate, printEndDate)}
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
                    await downloadElementAsPdf('keuangan-print-area', `Laporan_Buku_Kas_${printStartDate}_sd_${printEndDate}`);
                    setIsDownloadingPdf(false);
                  }}
                  className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF (.pdf)'}
                </button>
                <button
                  type="button"
                  onClick={() => triggerPrintOrPdf('keuangan-print-area', `Laporan_Buku_Kas_${printStartDate}_sd_${printEndDate}`)}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Cetak (Print)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Catatan Transaksi Keuangan"
        message="Apakah Anda yakin ingin menghapus catatan transaksi ini dari pembukuan kas?"
        itemName={deleteTarget ? `${deleteTarget.kodeTransaksi} - ${deleteTarget.kategori}: ${deleteTarget.tipe} (Rp ${deleteTarget.nominal.toLocaleString('id-ID')})` : ''}
      />

    </div>
  );
};
