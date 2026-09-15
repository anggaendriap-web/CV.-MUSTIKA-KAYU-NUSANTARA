import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PajakItem } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { triggerPrintOrPdf } from '../utils/exportPdf';
import { 
  Receipt, 
  Printer, 
  Download, 
  Search, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  X,
  FileSpreadsheet,
  Filter,
  ArrowUpDown,
  FileText,
  Building2,
  DollarSign
} from 'lucide-react';

export const LaporanPajakView: React.FC = () => {
  const { pajakList, addPajak, updatePajak, deletePajak, currentUser, purchaseOrders, hutangList } = useApp();

  // Period filter states
  const [periodPreset, setPeriodPreset] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'SPECIFIC_MONTH' | 'CUSTOM'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Search & category filters
  const [searchTerm, setSearchTerm] = useState('');
  const [jenisPajakFilter, setJenisPajakFilter] = useState('Semua');
  const [statusLaporFilter, setStatusLaporFilter] = useState<'Semua' | 'Belum Lapor' | 'Sudah Lapor SPT' | 'Lunas Bayar'>('Semua');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PajakItem | null>(null);

  // Add Form State
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenisPajak: 'PPN Keluaran 11%' as PajakItem['jenisPajak'],
    nomorFaktur: '',
    lawanTransaksi: '',
    dpp: 0,
    tarifPersen: 11,
    statusBayarLapor: 'Belum Lapor' as PajakItem['statusBayarLapor'],
    masaPajak: '',
    keterangan: ''
  });

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Handle period preset changes
  useEffect(() => {
    const now = new Date();
    if (periodPreset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (periodPreset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (periodPreset === 'LAST_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (periodPreset === 'THIS_QUARTER') {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const firstDay = new Date(now.getFullYear(), quarterMonth, 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), quarterMonth + 3, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (periodPreset === 'THIS_YEAR') {
      const firstDay = `${now.getFullYear()}-01-01`;
      const lastDay = `${now.getFullYear()}-12-31`;
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (periodPreset === 'SPECIFIC_MONTH') {
      const firstDay = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  }, [periodPreset, selectedMonth, selectedYear]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // 1. Extract virtual tax items from Purchase Orders (Sales Invoices & PPN/PPh)
  const virtualPajakItems = useMemo(() => {
    const items: PajakItem[] = [];
    
    // Process Purchase Orders (Sales)
    purchaseOrders.forEach(po => {
      const usesPpn = po.tipePajak === 'PPN' || po.tipePajak === 'PPN & PPh' || (po.ppnNominal !== undefined && po.ppnNominal > 0);
      const usesPph = po.tipePajak === 'PPh' || po.tipePajak === 'PPN & PPh' || (po.pphNominal !== undefined && po.pphNominal > 0);
      
      const invDate = po.tanggalInvoice || po.tanggal || new Date().toISOString().split('T')[0];
      const tDate = new Date(invDate);
      const derivedMasa = isNaN(tDate.getTime()) ? 'Agustus 2026' : `${monthNames[tDate.getMonth()]} ${tDate.getFullYear()}`;

      if (usesPpn) {
        const dpp = po.subtotalHarga && po.subtotalHarga > 0 
          ? po.subtotalHarga 
          : (po.ppnNominal && po.ppnNominal > 0 ? Math.round(po.ppnNominal / 0.11) : Math.round(po.totalHarga / 1.11));
        
        const nominalPajak = po.ppnNominal && po.ppnNominal > 0 
          ? po.ppnNominal 
          : Math.round(dpp * 0.11);

        if (nominalPajak > 0) {
          items.push({
            id: `auto-ppn-${po.id}`,
            tanggal: invDate,
            nomorFaktur: po.nomorInvoice ? `FP-${po.nomorInvoice.replace(/\//g, '.')}` : `FP-010.004-26.${po.nomorPO.replace(/[^0-9]/g, '').padStart(8, '0')}`,
            jenisPajak: 'PPN Keluaran 11%',
            lawanTransaksi: po.pelanggan,
            dpp: dpp,
            tarifPersen: 11,
            nominalPajak: nominalPajak,
            statusBayarLapor: po.statusInvoice === 'Lunas' ? 'Lunas Bayar' : 'Belum Lapor',
            masaPajak: derivedMasa,
            keterangan: `Faktur PPN Keluaran PO ${po.nomorPO} (Inv: ${po.nomorInvoice || '-'})`
          });
        }
      }

      if (usesPph) {
        const dpp = po.subtotalHarga && po.subtotalHarga > 0 
          ? po.subtotalHarga 
          : (po.pphNominal && po.pphNominal > 0 ? Math.round(po.pphNominal / 0.02) : Math.round(po.totalHarga / 1.11));
        
        const nominalPajak = po.pphNominal && po.pphNominal > 0 
          ? po.pphNominal 
          : Math.round(dpp * 0.02);

        if (nominalPajak > 0) {
          items.push({
            id: `auto-pph-${po.id}`,
            tanggal: invDate,
            nomorFaktur: `BUPOT-23-${po.nomorPO}`,
            jenisPajak: 'PPh 23 (Jasa)',
            lawanTransaksi: po.pelanggan,
            dpp: dpp,
            tarifPersen: 2,
            nominalPajak: nominalPajak,
            statusBayarLapor: po.statusInvoice === 'Lunas' ? 'Lunas Bayar' : 'Belum Lapor',
            masaPajak: derivedMasa,
            keterangan: `Bukti Potong PPh 23 dari PO ${po.nomorPO} (${po.pelanggan})`
          });
        }
      }
    });

    return items;
  }, [purchaseOrders]);

  // Combined Pajak List (Manual + Auto PO)
  const combinedPajakList = useMemo(() => {
    return [...pajakList, ...virtualPajakItems];
  }, [pajakList, virtualPajakItems]);

  // Filtered Tax records based on search, category, status, and DATE/PERIOD
  const filteredPajak = useMemo(() => {
    return combinedPajakList.filter(item => {
      const matchesSearch = 
        item.lawanTransaksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomorFaktur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.keterangan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.masaPajak || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesJenis = jenisPajakFilter === 'Semua' || item.jenisPajak === jenisPajakFilter;
      const matchesStatus = statusLaporFilter === 'Semua' || item.statusBayarLapor === statusLaporFilter;

      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && item.tanggal >= startDate;
      if (endDate) matchesDate = matchesDate && item.tanggal <= endDate;

      return matchesSearch && matchesJenis && matchesStatus && matchesDate;
    });
  }, [combinedPajakList, searchTerm, jenisPajakFilter, statusLaporFilter, startDate, endDate]);

  // Dynamic Tax Calculations strictly based on the ACTIVE FILTERED PERIOD
  const ppnKeluaran = useMemo(() => {
    return filteredPajak.filter(p => p.jenisPajak.includes('Keluaran')).reduce((a, b) => a + b.nominalPajak, 0);
  }, [filteredPajak]);

  const ppnMasukan = useMemo(() => {
    return filteredPajak.filter(p => p.jenisPajak.includes('Masukan')).reduce((a, b) => a + b.nominalPajak, 0);
  }, [filteredPajak]);

  const netPpn = ppnKeluaran - ppnMasukan;

  const totalPPh = useMemo(() => {
    return filteredPajak.filter(p => p.jenisPajak.startsWith('PPh')).reduce((a, b) => a + b.nominalPajak, 0);
  }, [filteredPajak]);

  const totalDpp = useMemo(() => {
    return filteredPajak.reduce((a, b) => a + b.dpp, 0);
  }, [filteredPajak]);

  const handleJenisPajakChange = (jenis: PajakItem['jenisPajak']) => {
    let tarif = 11;
    if (jenis === 'PPh 21 (Upah/Gaji)') tarif = 5;
    if (jenis === 'PPh 23 (Jasa)') tarif = 2;
    if (jenis === 'PPh Final UMKM / Badan') tarif = 0.5;
    setFormData({ ...formData, jenisPajak: jenis, tarifPersen: tarif });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lawanTransaksi || formData.dpp <= 0) {
      alert('Mohon isi nama lawan transaksi dan nominal DPP yang valid.');
      return;
    }

    const nominalPajak = Math.round((formData.dpp * formData.tarifPersen) / 100);
    const nomorFaktur = formData.nomorFaktur || `FP-010.004-26.${Math.floor(10000000 + Math.random() * 90000000)}`;
    
    const tDate = new Date(formData.tanggal);
    const masaPajak = formData.masaPajak || (isNaN(tDate.getTime()) ? 'Agustus 2026' : `${monthNames[tDate.getMonth()]} ${tDate.getFullYear()}`);

    addPajak({
      ...formData,
      nomorFaktur,
      nominalPajak,
      masaPajak
    });

    setShowAddModal(false);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      jenisPajak: 'PPN Keluaran 11%',
      nomorFaktur: '',
      lawanTransaksi: '',
      dpp: 0,
      tarifPersen: 11,
      statusBayarLapor: 'Belum Lapor',
      masaPajak: '',
      keterangan: ''
    });
  };

  const toggleStatusLapor = (item: PajakItem) => {
    if (item.id.startsWith('auto-')) {
      alert("Faktur pajak otomatis ini tersinkronisasi langsung dari status PO / Invoice Penjualan.");
      return;
    }
    const nextStatus: PajakItem['statusBayarLapor'] = 
      item.statusBayarLapor === 'Belum Lapor' ? 'Sudah Lapor SPT' :
      item.statusBayarLapor === 'Sudah Lapor SPT' ? 'Lunas Bayar' : 'Belum Lapor';
    updatePajak(item.id, { statusBayarLapor: nextStatus });
  };

  // Label for current period display
  const getPeriodLabel = () => {
    if (periodPreset === 'ALL' && !startDate && !endDate) return 'Semua Masa Pajak (Akumulatif)';
    if (periodPreset === 'THIS_MONTH') return `Bulan Berjalan (${monthNames[new Date().getMonth()]} ${new Date().getFullYear()})`;
    if (periodPreset === 'LAST_MONTH') return 'Bulan Lalu';
    if (periodPreset === 'THIS_QUARTER') return 'Kuartal Ini';
    if (periodPreset === 'THIS_YEAR') return `Tahun ${new Date().getFullYear()}`;
    if (periodPreset === 'SPECIFIC_MONTH') return `Masa Pajak ${monthNames[selectedMonth]} ${selectedYear}`;
    if (startDate || endDate) return `${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`;
    return 'Semua Periode';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-2xl text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Laporan Pajak (PPN & PPh)</h1>
              <span className="px-2.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 text-[10px] font-extrabold rounded-full">
                SPT Masa & Faktur
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Rekapitulasi Faktur Pajak Keluaran/Masukan tersinkronisasi otomatis dari PO, Invoice, dan Bukti Potong PPh
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Faktur Pajak</span>
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Rekap Pajak PDF</span>
          </button>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Filter Periode / Masa Pajak:
            </span>
            <span className="text-xs font-extrabold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-lg">
              {getPeriodLabel()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setPeriodPreset('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'ALL'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              Semua Masa
            </button>
            <button
              onClick={() => setPeriodPreset('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'THIS_MONTH'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriodPreset('LAST_MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'LAST_MONTH'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => setPeriodPreset('THIS_QUARTER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'THIS_QUARTER'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              Kuartal Ini
            </button>
            <button
              onClick={() => setPeriodPreset('THIS_YEAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'THIS_YEAR'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              Tahun Ini
            </button>
            <button
              onClick={() => setPeriodPreset('SPECIFIC_MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'SPECIFIC_MONTH'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              Pilih Masa Bulan
            </button>
            <button
              onClick={() => setPeriodPreset('CUSTOM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'CUSTOM'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              Rentang Tanggal
            </button>
          </div>
        </div>

        {/* Dynamic Controls based on preset selection */}
        {periodPreset === 'SPECIFIC_MONTH' && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-white"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-white"
              >
                {[2024, 2025, 2026, 2027, 2028].map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {periodPreset === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-900 dark:text-white"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); setPeriodPreset('ALL'); }}
                className="text-xs text-red-600 hover:underline font-bold"
              >
                Reset Tanggal
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tax Metric Cards (Synchronized with selected period) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PPN Keluaran */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              PPN Keluaran (Penjualan)
            </span>
            <span className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
              11%
            </span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {formatRupiah(ppnKeluaran)}
          </div>
          <span className="text-xs text-zinc-400 mt-1 block">
            Faktur pajak diterbitkan ke buyer ({filteredPajak.filter(p => p.jenisPajak.includes('Keluaran')).length} faktur)
          </span>
        </div>

        {/* PPN Masukan */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              PPN Masukan (Pembelian)
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
              11%
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatRupiah(ppnMasukan)}
          </div>
          <span className="text-xs text-zinc-400 mt-1 block">
            Kredit pajak pembelian supplier ({filteredPajak.filter(p => p.jenisPajak.includes('Masukan')).length} faktur)
          </span>
        </div>

        {/* Kurang / Lebih Bayar PPN */}
        <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden ${
          netPpn > 0 
            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40' 
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              netPpn > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-zinc-600 dark:text-zinc-400'
            }`}>
              {netPpn >= 0 ? 'Kurang Bayar PPN' : 'Lebih Bayar PPN'}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              netPpn > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' : 'bg-zinc-100 text-zinc-700'
            }`}>
              Net PPN
            </span>
          </div>
          <div className={`text-2xl font-black ${
            netPpn > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-zinc-900 dark:text-white'
          }`}>
            {formatRupiah(Math.abs(netPpn))}
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 block">
            {netPpn > 0 ? 'Wajib disetor ke Kas Negara' : netPpn < 0 ? 'Dapat dikompensasikan ke masa berikutnya' : 'Nihil'}
          </span>
        </div>

        {/* Total PPh */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Total PPh (21 / 23 / Final)
            </span>
            <span className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold">
              Bupot
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatRupiah(totalPPh)}
          </div>
          <span className="text-xs text-zinc-400 mt-1 block">
            Bukti potong & PPh terhutang ({filteredPajak.filter(p => p.jenisPajak.startsWith('PPh')).length} transaksi)
          </span>
        </div>
      </div>

      {/* Filter Row: Search & Categories */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari Lawan Transaksi, No Faktur, PO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <select
            value={jenisPajakFilter}
            onChange={(e) => setJenisPajakFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600 font-medium"
          >
            <option value="Semua">Semua Jenis Pajak</option>
            <option value="PPN Keluaran 11%">PPN Keluaran 11% (Penjualan)</option>
            <option value="PPN Masukan 11%">PPN Masukan 11% (Pembelian)</option>
            <option value="PPh 21 (Upah/Gaji)">PPh 21 (Upah/Gaji)</option>
            <option value="PPh 23 (Jasa)">PPh 23 (Jasa)</option>
            <option value="PPh Final UMKM / Badan">PPh Final UMKM / Badan</option>
          </select>

          <select
            value={statusLaporFilter}
            onChange={(e) => setStatusLaporFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600 font-medium"
          >
            <option value="Semua">Semua Status DJP</option>
            <option value="Belum Lapor">Belum Lapor SPT</option>
            <option value="Sudah Lapor SPT">Sudah Lapor SPT</option>
            <option value="Lunas Bayar">Lunas Bayar</option>
          </select>
        </div>
      </div>

      {/* Tax Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-zinc-900 dark:text-white">
              Daftar Faktur Pajak & Bukti Potong
            </span>
            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-bold">
              {filteredPajak.length} data
            </span>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Total DPP: <span className="font-bold text-zinc-900 dark:text-white">{formatRupiah(totalDpp)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-3.5">Tanggal & No Faktur</th>
                <th className="p-3.5">Jenis Pajak</th>
                <th className="p-3.5">Lawan Transaksi</th>
                <th className="p-3.5">Masa Pajak</th>
                <th className="p-3.5 text-right">DPP (Dasar Pajak)</th>
                <th className="p-3.5 text-center">Tarif</th>
                <th className="p-3.5 text-right">Nominal Pajak</th>
                <th className="p-3.5 text-center">Status DJP</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredPajak.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-400">
                    Tidak ada faktur pajak atau bukti potong untuk periode dan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredPajak.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-bold text-red-700 dark:text-red-400 block">{item.nomorFaktur}</span>
                      <span className="text-[11px] text-zinc-400">{item.tanggal}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.jenisPajak.includes('Keluaran')
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : item.jenisPajak.includes('Masukan')
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {item.jenisPajak}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-zinc-900 dark:text-white block">{item.lawanTransaksi}</span>
                      <span className="text-[10px] text-zinc-400 truncate max-w-xs block">{item.keterangan || '-'}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-zinc-600 dark:text-zinc-300 text-[11px]">
                        {item.masaPajak || '-'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-medium text-zinc-800 dark:text-zinc-200">
                      {formatRupiah(item.dpp)}
                    </td>
                    <td className="p-3.5 text-center font-bold text-zinc-600 dark:text-zinc-400">
                      {item.tarifPersen}%
                    </td>
                    <td className="p-3.5 text-right font-black text-red-700 dark:text-red-400">
                      {formatRupiah(item.nominalPajak)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => toggleStatusLapor(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          item.statusBayarLapor === 'Lunas Bayar' || item.statusBayarLapor === 'Sudah Lapor SPT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-200'
                        }`}
                        title="Klik untuk ubah status lapor"
                      >
                        {item.statusBayarLapor === 'Belum Lapor' ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {item.statusBayarLapor}
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      {item.id.startsWith('auto-') ? (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold italic bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded">
                          Auto PO
                        </span>
                      ) : (
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Faktur Pajak"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredPajak.length > 0 && (
              <tfoot className="bg-zinc-100/70 dark:bg-zinc-800/80 font-bold border-t border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                <tr>
                  <td colSpan={4} className="p-3.5 text-right font-bold">TOTAL PERIODE TERPILIH:</td>
                  <td className="p-3.5 text-right font-black">{formatRupiah(totalDpp)}</td>
                  <td></td>
                  <td className="p-3.5 text-right font-black text-red-700 dark:text-red-400">
                    {formatRupiah(filteredPajak.reduce((a, b) => a + b.nominalPajak, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL 1: Add Tax Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">Tambah Faktur Pajak / Bukti Potong</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Jenis Pajak</label>
                  <select
                    value={formData.jenisPajak}
                    onChange={(e) => handleJenisPajakChange(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold"
                  >
                    <option value="PPN Keluaran 11%">PPN Keluaran 11% (Penjualan)</option>
                    <option value="PPN Masukan 11%">PPN Masukan 11% (Pembelian Supplier)</option>
                    <option value="PPh 21 (Upah/Gaji)">PPh 21 (Upah/Gaji)</option>
                    <option value="PPh 23 (Jasa)">PPh 23 (Jasa)</option>
                    <option value="PPh Final UMKM / Badan">PPh Final UMKM / Badan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Tanggal Faktur</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Nomor Faktur Pajak / Bukti Potong</label>
                <input
                  type="text"
                  placeholder="FP-010.004-26.XXXXXXXX"
                  value={formData.nomorFaktur}
                  onChange={(e) => setFormData({ ...formData, nomorFaktur: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Lawan Transaksi (Buyer / Supplier / Rekanan) *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Indofood Sukses Makmur Tbk"
                  value={formData.lawanTransaksi}
                  onChange={(e) => setFormData({ ...formData, lawanTransaksi: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Dasar Pengenaan Pajak (DPP) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={formData.dpp || ''}
                    onChange={(e) => setFormData({ ...formData, dpp: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Tarif Pajak (%)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={formData.tarifPersen}
                    onChange={(e) => setFormData({ ...formData, tarifPersen: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Estimasi Nominal Pajak:</span>
                <span className="font-black text-red-700 dark:text-red-400 text-sm">
                  {formatRupiah(Math.round((formData.dpp * formData.tarifPersen) / 100))}
                </span>
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Keterangan Transaksi</label>
                <input
                  type="text"
                  placeholder="Contoh: Pembelian Bahan Baku Kayu Balok Albasia"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-500 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  Simpan Pajak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Print Tax PDF Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-red-400" />
                <span className="font-bold text-sm">Pratinjau Laporan Rekapitulasi Pajak Masa (SPT PPN & PPh)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintOrPdf('tax-report-sheet', `Laporan_Pajak_Masa_${(getPeriodLabel()).replace(/[^a-zA-Z0-9]/g, '_')}`)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download / Print PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-zinc-100 dark:bg-zinc-950 flex justify-center">
              <div
                id="tax-report-sheet"
                className="bg-white text-zinc-900 p-8 rounded-lg shadow-md max-w-3xl w-full text-xs font-sans border border-zinc-200"
              >
                {/* Letterhead */}
                <div className="flex items-start justify-between border-b-2 border-red-900 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo size="md" className="h-10 w-10" />
                    <div>
                      <h2 className="text-lg font-black text-red-900 tracking-tight">PT MUSTIKA KAYU NUSANTARA</h2>
                      <p className="text-[10px] text-zinc-600 font-bold">Laporan Rekapitulasi Pajak PPN & PPh (Tax Summary Statement)</p>
                      <p className="text-[9px] text-zinc-500">NPWP: 01.892.381.2-412.000 | KPP Pratama Cikarang Selatan</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-600">
                    <p><b>Periode:</b> {getPeriodLabel()}</p>
                    <p><b>Tanggal Cetak:</b> {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p><b>Dicetak Oleh:</b> {currentUser?.name || 'Tax & Accounting Dept'}</p>
                  </div>
                </div>

                {/* Metric Boxes */}
                <div className="grid grid-cols-4 gap-2.5 mb-5 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-center text-[10px]">
                  <div>
                    <span className="text-blue-700 block font-bold">PPN Keluaran (11%):</span>
                    <span className="font-extrabold text-blue-700 text-xs">{formatRupiah(ppnKeluaran)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block font-bold">PPN Masukan (11%):</span>
                    <span className="font-extrabold text-emerald-700 text-xs">{formatRupiah(ppnMasukan)}</span>
                  </div>
                  <div>
                    <span className="text-amber-700 block font-bold">{netPpn >= 0 ? 'Kurang Bayar PPN:' : 'Lebih Bayar PPN:'}</span>
                    <span className="font-extrabold text-amber-700 text-xs">{formatRupiah(Math.abs(netPpn))}</span>
                  </div>
                  <div>
                    <span className="text-rose-700 block font-bold">Total PPh Terpotong:</span>
                    <span className="font-extrabold text-rose-700 text-xs">{formatRupiah(totalPPh)}</span>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full border-collapse text-[10px] mb-6">
                  <thead>
                    <tr className="bg-red-900 text-white font-bold">
                      <th className="p-2 text-left">No. Faktur / Bupot</th>
                      <th className="p-2 text-left">Jenis</th>
                      <th className="p-2 text-left">Lawan Transaksi</th>
                      <th className="p-2 text-left">Masa</th>
                      <th className="p-2 text-right">DPP (Rp)</th>
                      <th className="p-2 text-center">Tarif</th>
                      <th className="p-2 text-right">Pajak (Rp)</th>
                      <th className="p-2 text-center">Status DJP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 border-b border-zinc-200">
                    {filteredPajak.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-zinc-400">
                          Tidak ada data pajak pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredPajak.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                          <td className="p-2 font-bold text-zinc-900">
                            {item.nomorFaktur}<br/>
                            <span className="text-[9px] text-zinc-400 font-normal">{item.tanggal}</span>
                          </td>
                          <td className="p-2 font-medium">{item.jenisPajak}</td>
                          <td className="p-2">
                            <span className="font-bold block">{item.lawanTransaksi}</span>
                            <span className="text-[9px] text-zinc-400">{item.keterangan || '-'}</span>
                          </td>
                          <td className="p-2">{item.masaPajak || '-'}</td>
                          <td className="p-2 text-right font-medium">{formatRupiah(item.dpp)}</td>
                          <td className="p-2 text-center">{item.tarifPersen}%</td>
                          <td className="p-2 text-right font-bold text-red-700">{formatRupiah(item.nominalPajak)}</td>
                          <td className="p-2 text-center font-bold text-emerald-700">{item.statusBayarLapor}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredPajak.length > 0 && (
                    <tfoot>
                      <tr className="bg-zinc-100 font-bold text-zinc-900">
                        <td colSpan={4} className="p-2 text-right">TOTAL PAJAK PERIODE:</td>
                        <td className="p-2 text-right font-bold">{formatRupiah(totalDpp)}</td>
                        <td></td>
                        <td className="p-2 text-right font-black text-red-700">
                          {formatRupiah(filteredPajak.reduce((a, b) => a + b.nominalPajak, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                {/* Signature Box */}
                <div className="grid grid-cols-2 gap-8 pt-6">
                  <div className="text-center">
                    <span className="text-[10px] text-zinc-500 block mb-12">Disiapkan Oleh (Tax Officer),</span>
                    <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                      {currentUser?.name || 'Tax & Accounting Dept'}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-zinc-500 block mb-12">Mengetahui & Menyetujui,</span>
                    <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                      Direktur Utama
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        title="Hapus Faktur Pajak"
        message={`Apakah Anda yakin ingin menghapus data faktur pajak "${itemToDelete?.nomorFaktur}" lawan transaksi "${itemToDelete?.lawanTransaksi}"?`}
        itemName={itemToDelete ? `${itemToDelete.nomorFaktur} - ${itemToDelete.lawanTransaksi} (Nominal: ${formatRupiah(itemToDelete.nominalPajak)})` : ''}
        onConfirm={() => {
          if (itemToDelete) {
            deletePajak(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
};
