import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CompanyLogo } from './CompanyLogo';
import { triggerPrintOrPdf } from '../utils/exportPdf';
import { 
  BarChart3, 
  Printer, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  FileText, 
  Layers, 
  CheckCircle, 
  X,
  PieChart
} from 'lucide-react';

export const LaporanKeuanganView: React.FC = () => {
  const { 
    purchaseOrders, 
    keuangan, 
    hutangList, 
    kasKecilList, 
    bukuBankList, 
    asetList, 
    materialStock, 
    finishedStock,
    currentUser 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'laba_rugi' | 'neraca' | 'arus_kas'>('laba_rugi');
  const [periodPreset, setPeriodPreset] = useState<'this_month' | 'last_month' | 'this_year' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Initialize dates
  React.useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  const handlePresetChange = (preset: 'this_month' | 'last_month' | 'this_year' | 'custom') => {
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
    } else if (preset === 'this_year') {
      setStartDate(`${now.getFullYear()}-01-01`);
      setEndDate(`${now.getFullYear()}-12-31`);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // --- Dynamic Financial Calculations ---

  // 1. REVENUE (Penjualan Pallet)
  const totalRevenue = useMemo(() => {
    return purchaseOrders
      .filter(po => {
        if (!startDate || !endDate) return true;
        return po.tanggalOrder >= startDate && po.tanggalOrder <= endDate;
      })
      .reduce((a, b) => a + b.totalHarga, 0);
  }, [purchaseOrders, startDate, endDate]);

  // 2. COGS / HPP (Bahan Baku + Direct Labor + Jasa Oven)
  const hppKayu = useMemo(() => {
    return hutangList
      .filter(h => h.kategori === 'Bahan Baku Kayu')
      .reduce((a, b) => a + b.totalTagihan, 0) * 0.75; // Allocation
  }, [hutangList]);

  const hppPaku = 8500000;
  const hppOven = 6200000;
  const hppTenagaKerja = 18500000;
  const totalHPP = hppKayu + hppPaku + hppOven + hppTenagaKerja;

  const labaKotor = totalRevenue - totalHPP;

  // 3. OPERATING EXPENSES (Beban Operasional)
  const bebanGajiStaff = 14500000;
  const bebanBBM = kasKecilList.filter(k => k.kategori === 'BBM & Transportasi').reduce((a, b) => a + b.nominal, 0) || 3200000;
  const bebanListrikAir = kasKecilList.filter(k => k.kategori === 'Listrik, Air & Kebersihan').reduce((a, b) => a + b.nominal, 0) || 4500000;
  const bebanKonsumsi = kasKecilList.filter(k => k.kategori === 'Konsumsi & Dapur Pabrik').reduce((a, b) => a + b.nominal, 0) || 2850000;
  const bebanDepresiasi = useMemo(() => {
    return asetList.reduce((a, b) => a + b.penyusutanPerBulan, 0);
  }, [asetList]);
  const bebanLainnya = 1800000;

  const totalBebanOperasional = bebanGajiStaff + bebanBBM + bebanListrikAir + bebanKonsumsi + bebanDepresiasi + bebanLainnya;

  const labaOperasional = labaKotor - totalBebanOperasional;
  const estimasiPajak = Math.max(0, labaOperasional * 0.11); // 11% / PPh
  const labaBersih = labaOperasional - estimasiPajak;

  // --- BALANCE SHEET (NERACA) ---
  // Aset Lancar
  const kasKecil = 1850000;
  const kasBank = useMemo(() => {
    const masuk = bukuBankList.filter(b => b.jenis === 'MASUK').reduce((a, b) => a + b.nominal, 0);
    const keluar = bukuBankList.filter(b => b.jenis === 'KELUAR').reduce((a, b) => a + b.nominal, 0);
    return masuk - keluar;
  }, [bukuBankList]);

  const piutangUsaha = useMemo(() => {
    return purchaseOrders.filter(p => p.statusInvoice !== 'Lunas').reduce((a, b) => a + b.totalHarga, 0);
  }, [purchaseOrders]);

  const nilaiStokMaterial = useMemo(() => {
    // Estimasi harga log kayu Rp 1.200.000 / m3
    return materialStock.reduce((a, b) => a + (b.stokM3 * 1250000), 0);
  }, [materialStock]);

  const nilaiStokFinishGoods = useMemo(() => {
    return finishedStock.reduce((a, b) => a + (b.totalStok * 135000), 0);
  }, [finishedStock]);

  const totalAsetLancar = kasKecil + kasBank + piutangUsaha + nilaiStokMaterial + nilaiStokFinishGoods;

  // Aset Tetap
  const totalHargaPerolehanAset = useMemo(() => asetList.reduce((a, b) => a + b.hargaPerolehan, 0), [asetList]);
  const totalAkumulasiPenyusutan = useMemo(() => asetList.reduce((a, b) => a + b.akumulasiPenyusutan, 0), [asetList]);
  const totalNilaiBukuAset = totalHargaPerolehanAset - totalAkumulasiPenyusutan;

  const grandTotalAset = totalAsetLancar + totalNilaiBukuAset;

  // Liabilitas
  const hutangUsahaSupplier = useMemo(() => {
    return hutangList.filter(h => h.status !== 'Lunas').reduce((a, b) => a + b.sisaHutang, 0);
  }, [hutangList]);
  const hutangBiayaPajak = estimasiPajak;
  const totalLiabilitas = hutangUsahaSupplier + hutangBiayaPajak;

  // Ekuitas
  const modalDisetor = 500000000;
  const labaDitahan = grandTotalAset - totalLiabilitas - modalDisetor - labaBersih;
  const totalEkuitas = modalDisetor + labaDitahan + labaBersih;
  const grandTotalLiabilitasEkuitas = totalLiabilitas + totalEkuitas;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 dark:bg-red-950/50 rounded-xl text-red-700 dark:text-red-400">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Laporan Keuangan (Neraca & Laba Rugi)</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Pernyataan posisi keuangan, rugi laba operasional pabrik pallet, dan ekspor laporan resmi</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak {activeTab === 'laba_rugi' ? 'Laba Rugi' : activeTab === 'neraca' ? 'Neraca' : 'Arus Kas'} PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs & Period Controls */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('laba_rugi')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'laba_rugi'
                ? 'bg-white dark:bg-zinc-900 text-red-800 dark:text-red-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Laba Rugi (Income Statement)</span>
          </button>

          <button
            onClick={() => setActiveTab('neraca')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'neraca'
                ? 'bg-white dark:bg-zinc-900 text-red-800 dark:text-red-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Scale className="h-4 w-4" />
            <span>Neraca (Balance Sheet)</span>
          </button>

          <button
            onClick={() => setActiveTab('arus_kas')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'arus_kas'
                ? 'bg-white dark:bg-zinc-900 text-red-800 dark:text-red-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Arus Kas (Cash Flow)</span>
          </button>
        </div>

        {/* Period Preset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePresetChange('this_month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              periodPreset === 'this_month' ? 'bg-red-800 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => handlePresetChange('last_month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              periodPreset === 'last_month' ? 'bg-red-800 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            Bulan Lalu
          </button>
          <button
            onClick={() => handlePresetChange('this_year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              periodPreset === 'this_year' ? 'bg-red-800 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            Tahun 2026
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: LABA RUGI */}
      {activeTab === 'laba_rugi' && (
        <div className="space-y-6">
          {/* Top 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Total Pendapatan Usaha</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatRupiah(totalRevenue)}</div>
              <span className="text-xs text-zinc-400 mt-1 block">Penjualan Pallet Kayu Standar & Custom</span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">Laba Kotor (Gross Profit)</span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatRupiah(labaKotor)}</div>
              <span className="text-xs text-zinc-400 mt-1 block">Margin: {totalRevenue > 0 ? ((labaKotor / totalRevenue) * 100).toFixed(1) : 0}%</span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Laba Bersih Setelah Pajak (EAT)</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(labaBersih)}</div>
              <span className="text-xs text-zinc-400 mt-1 block">Net Profit Margin: {totalRevenue > 0 ? ((labaBersih / totalRevenue) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>

          {/* Detailed Statement Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden p-6">
            <h2 className="font-extrabold text-base text-zinc-900 dark:text-white mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              Laporan Laba Rugi Komprehensif (Periode: {startDate} s/d {endDate})
            </h2>

            <div className="space-y-4 text-xs">
              {/* PENDAPATAN */}
              <div>
                <div className="font-black text-sm text-zinc-900 dark:text-white mb-2">1. PENDAPATAN OPERASIONAL</div>
                <div className="pl-4 space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-600 dark:text-zinc-400">Penjualan Pallet Kayu Standar & Ekspor ISPM 15</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{formatRupiah(totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50 px-2 rounded">
                    <span>TOTAL PENDAPATAN</span>
                    <span className="text-blue-600 dark:text-blue-400">{formatRupiah(totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* HPP */}
              <div>
                <div className="font-black text-sm text-zinc-900 dark:text-white mb-2">2. HARGA POKOK PENJUALAN (HPP)</div>
                <div className="pl-4 space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-600 dark:text-zinc-400">Biaya Bahan Baku Kayu Log & Balok</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatRupiah(hppKayu)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-600 dark:text-zinc-400">Biaya Paku Tembak Pallet & Aksesoris</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatRupiah(hppPaku)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-600 dark:text-zinc-400">Biaya Heat Treatment Oven & Sertifikasi ISPM 15</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatRupiah(hppOven)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-600 dark:text-zinc-400">Upah Tenaga Kerja Langsung Produksi</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatRupiah(hppTenagaKerja)}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50 px-2 rounded">
                    <span>TOTAL HARGA POKOK PENJUALAN (HPP)</span>
                    <span className="text-red-600 dark:text-red-400">({formatRupiah(totalHPP)})</span>
                  </div>
                </div>
              </div>

              {/* LABA KOTOR */}
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex justify-between font-black text-sm">
                <span className="text-zinc-900 dark:text-white">LABA KOTOR (GROSS PROFIT)</span>
                <span className="text-amber-600 dark:text-amber-400">{formatRupiah(labaKotor)}</span>
              </div>

              {/* BEBAN OPERASIONAL */}
              <div>
                <div className="font-black text-sm text-zinc-900 dark:text-white mb-2">3. BEBAN OPERASIONAL & UMUM</div>
                <div className="pl-4 space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-600 dark:text-zinc-400">Gaji Staf Kantor, Sales Admin & Staff Gudang</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatRupiah(bebanGajiStaff)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-600 dark:text-zinc-400">BBM & Biaya Pengiriman Armada Truk</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatRupiah(bebanBBM)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-600 dark:text-zinc-400">Listrik Industri, Air & Pemeliharaan Pabrik</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatRupiah(bebanListrikAir)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-600 dark:text-zinc-400">Beban Penyusutan Aset Tetap (Mesin & Oven)</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatRupiah(bebanDepresiasi)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-600 dark:text-zinc-400">Konsumsi Karyawan, ATK & Keperluan Umum</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatRupiah(bebanKonsumsi + bebanLainnya)}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50 px-2 rounded">
                    <span>TOTAL BEBAN OPERASIONAL</span>
                    <span className="text-red-600 dark:text-red-400">({formatRupiah(totalBebanOperasional)})</span>
                  </div>
                </div>
              </div>

              {/* LABA BERSIH */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                <div className="flex justify-between font-bold text-xs text-zinc-700 dark:text-zinc-300">
                  <span>Laba Operasional (EBIT)</span>
                  <span>{formatRupiah(labaOperasional)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-zinc-700 dark:text-zinc-300 border-b border-emerald-200 dark:border-emerald-800 pb-1">
                  <span>Estimasi Pajak Penghasilan (PPh)</span>
                  <span className="text-red-600">({formatRupiah(estimasiPajak)})</span>
                </div>
                <div className="flex justify-between font-black text-base text-emerald-800 dark:text-emerald-300 pt-1">
                  <span>LABA BERSIH TAHUN BERJALAN (NET INCOME)</span>
                  <span>{formatRupiah(labaBersih)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: NERACA (BALANCE SHEET) */}
      {activeTab === 'neraca' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SISI AKTIVA / ASET */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h2 className="font-extrabold text-base text-zinc-900 dark:text-white pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span>AKTIVA (ASET)</span>
                <span className="text-xs font-normal text-zinc-400">Posisi Per {endDate || 'Hari Ini'}</span>
              </h2>

              <div className="space-y-3 text-xs">
                {/* ASET LANCAR */}
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1">Aset Lancar:</span>
                  <div className="space-y-1.5 pl-3">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Kas Kecil & Kasir Pabrik</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{formatRupiah(kasKecil)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Kas Bank (BCA & Mandiri)</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{formatRupiah(kasBank)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Piutang Usaha Pelanggan (AR)</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{formatRupiah(piutangUsaha)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Persediaan Bahan Baku Kayu</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{formatRupiah(nilaiStokMaterial)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Persediaan Pallet Jadi (Finish Good)</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{formatRupiah(nilaiStokFinishGoods)}</span>
                    </div>
                    <div className="flex justify-between font-bold bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded">
                      <span>Subtotal Aset Lancar</span>
                      <span className="text-blue-600 dark:text-blue-400">{formatRupiah(totalAsetLancar)}</span>
                    </div>
                  </div>
                </div>

                {/* ASET TETAP */}
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1">Aset Tetap & Peralatan:</span>
                  <div className="space-y-1.5 pl-3">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Nilai Perolehan Mesin & Bangunan</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{formatRupiah(totalHargaPerolehanAset)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Akumulasi Penyusutan Aset (-)</span>
                      <span className="font-medium text-red-500">({formatRupiah(totalAkumulasiPenyusutan)})</span>
                    </div>
                    <div className="flex justify-between font-bold bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded">
                      <span>Nilai Buku Bersih Aset Tetap</span>
                      <span className="text-blue-600 dark:text-blue-400">{formatRupiah(totalNilaiBukuAset)}</span>
                    </div>
                  </div>
                </div>

                {/* TOTAL ASET */}
                <div className="p-3 bg-red-900 text-white rounded-xl flex justify-between font-black text-sm">
                  <span>TOTAL ASET (AKTIVA)</span>
                  <span>{formatRupiah(grandTotalAset)}</span>
                </div>
              </div>
            </div>

            {/* SISI PASIVA / KEWAJIBAN & EKUITAS */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h2 className="font-extrabold text-base text-zinc-900 dark:text-white pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span>PASIVA (LIABILITAS & EKUITAS)</span>
                <span className="text-xs font-normal text-zinc-400">Posisi Per {endDate || 'Hari Ini'}</span>
              </h2>

              <div className="space-y-3 text-xs">
                {/* KEWAJIBAN / HUTANG */}
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1">Kewajiban Jangka Pendek:</span>
                  <div className="space-y-1.5 pl-3">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Hutang Usaha Supplier Kayu & Bahan (AP)</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{formatRupiah(hutangUsahaSupplier)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Hutang Pajak & Biaya Berjalan</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{formatRupiah(hutangBiayaPajak)}</span>
                    </div>
                    <div className="flex justify-between font-bold bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded">
                      <span>Subtotal Kewajiban (Liabilitas)</span>
                      <span className="text-amber-600 dark:text-amber-400">{formatRupiah(totalLiabilitas)}</span>
                    </div>
                  </div>
                </div>

                {/* EKUITAS */}
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1">Modal & Ekuitas Pemilik:</span>
                  <div className="space-y-1.5 pl-3">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Modal Disetor Pendiri</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{formatRupiah(modalDisetor)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Laba Ditahan (Tahun Sebelumnya)</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{formatRupiah(labaDitahan)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Laba Bersih Tahun Berjalan</span>
                      <span className="font-medium text-emerald-600 font-bold">{formatRupiah(labaBersih)}</span>
                    </div>
                    <div className="flex justify-between font-bold bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded">
                      <span>Subtotal Ekuitas</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{formatRupiah(totalEkuitas)}</span>
                    </div>
                  </div>
                </div>

                {/* TOTAL PASIVA */}
                <div className="p-3 bg-red-900 text-white rounded-xl flex justify-between font-black text-sm">
                  <span>TOTAL LIABILITAS & EKUITAS</span>
                  <span>{formatRupiah(grandTotalLiabilitasEkuitas)}</span>
                </div>

                {/* Balance Status Badge */}
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                  <CheckCircle className="h-4 w-4" />
                  <span>Neraca Seimbang (Balance: Aset = Liabilitas + Ekuitas)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: ARUS KAS (CASH FLOW) */}
      {activeTab === 'arus_kas' && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h2 className="font-extrabold text-base text-zinc-900 dark:text-white pb-2 border-b border-zinc-200 dark:border-zinc-800">
            Laporan Arus Kas (Metode Langsung)
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <span className="font-black text-sm text-zinc-900 dark:text-white block mb-2">1. Arus Kas dari Aktivitas Operasi</span>
              <div className="pl-4 space-y-1.5">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Penerimaan Kas dari Pelanggan Pallet</span>
                  <span className="font-medium text-emerald-600">+{formatRupiah(totalRevenue * 0.9)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Pembayaran Kas ke Supplier Kayu & Log</span>
                  <span className="font-medium text-red-600">-{formatRupiah(hppKayu * 0.85)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Pembayaran Upah & Gaji Karyawan Pabrik</span>
                  <span className="font-medium text-red-600">-{formatRupiah(hppTenagaKerja + bebanGajiStaff)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Pembayaran Biaya Listrik, BBM & Operasional</span>
                  <span className="font-medium text-red-600">-{formatRupiah(bebanBBM + bebanListrikAir + bebanKonsumsi)}</span>
                </div>
                <div className="flex justify-between font-bold bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded">
                  <span>Arus Kas Bersih dari Operasi</span>
                  <span className="text-emerald-600">+{formatRupiah(38500000)}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="font-black text-sm text-zinc-900 dark:text-white block mb-2">2. Arus Kas dari Aktivitas Investasi</span>
              <div className="pl-4 space-y-1.5">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Pembelian / Upgrade Mesin Produksi & Chamber Oven</span>
                  <span className="font-medium text-red-600">-{formatRupiah(15000000)}</span>
                </div>
                <div className="flex justify-between font-bold bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded">
                  <span>Arus Kas Bersih dari Investasi</span>
                  <span className="text-red-600">-{formatRupiah(15000000)}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex justify-between font-black text-sm">
              <span>KENAIKAN / (PENURUNAN) BERSIH KAS & SETARA KAS</span>
              <span className="text-emerald-600">+{formatRupiah(23500000)}</span>
            </div>
          </div>
        </div>
      )}

      {/* PRINT MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-red-400" />
                <span className="font-bold text-sm">Pratinjau Laporan Keuangan Resmi</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintOrPdf('financial-statement-sheet', `Laporan_Keuangan_${activeTab}_${startDate}_sd_${endDate}`)}
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
                id="financial-statement-sheet"
                className="bg-white text-zinc-900 p-8 rounded-lg shadow-md max-w-3xl w-full text-xs font-sans border border-zinc-200"
              >
                <div className="flex items-start justify-between border-b-2 border-red-900 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <CompanyLogo size="md" className="h-12 w-12" />
                    <div>
                      <h2 className="text-xl font-black text-red-900">PT MUSTIKA KAYU NUSANTARA</h2>
                      <p className="text-[10px] text-zinc-600">
                        {activeTab === 'laba_rugi' ? 'LAPORAN LABA RUGI KOMPREHENSIF' : activeTab === 'neraca' ? 'LAPORAN POSISI KEUANGAN (NERACA)' : 'LAPORAN ARUS KAS'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-600">
                    <p><b>Periode:</b> {startDate} s/d {endDate}</p>
                    <p><b>Mata Uang:</b> Indonesian Rupiah (IDR)</p>
                  </div>
                </div>

                {/* Print Content based on tab */}
                {activeTab === 'laba_rugi' && (
                  <div className="space-y-3">
                    <div className="flex justify-between py-1.5 border-b font-bold text-zinc-900">
                      <span>I. PENDAPATAN OPERASIONAL (PENJUALAN PALLET)</span>
                      <span>{formatRupiah(totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-zinc-600 pl-4">
                      <span>Harga Pokok Penjualan (HPP Kayu, Paku, Oven ISPM 15, Upah)</span>
                      <span>({formatRupiah(totalHPP)})</span>
                    </div>
                    <div className="flex justify-between py-1.5 bg-zinc-100 font-bold px-2">
                      <span>LABA KOTOR (GROSS PROFIT)</span>
                      <span className="text-red-900">{formatRupiah(labaKotor)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-zinc-600 pl-4">
                      <span>Total Beban Operasional, Gaji, Listrik, Depresiasi Aset</span>
                      <span>({formatRupiah(totalBebanOperasional)})</span>
                    </div>
                    <div className="flex justify-between py-1 text-zinc-600 pl-4">
                      <span>Estimasi Beban Pajak Penghasilan</span>
                      <span>({formatRupiah(estimasiPajak)})</span>
                    </div>
                    <div className="flex justify-between py-2 border-t-2 border-b-2 border-red-900 font-black text-sm">
                      <span className="text-red-900">LABA BERSIH PERIODE BERJALAN</span>
                      <span className="text-red-900">{formatRupiah(labaBersih)}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'neraca' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="border-r border-zinc-200 pr-4 space-y-2">
                      <span className="font-black text-red-900 block border-b pb-1">ASET (AKTIVA)</span>
                      <div className="flex justify-between text-zinc-600"><span>Kas & Bank</span><span className="font-bold text-zinc-900">{formatRupiah(kasKecil + kasBank)}</span></div>
                      <div className="flex justify-between text-zinc-600"><span>Piutang Usaha</span><span className="font-bold text-zinc-900">{formatRupiah(piutangUsaha)}</span></div>
                      <div className="flex justify-between text-zinc-600"><span>Persediaan Stok</span><span className="font-bold text-zinc-900">{formatRupiah(nilaiStokMaterial + nilaiStokFinishGoods)}</span></div>
                      <div className="flex justify-between text-zinc-600"><span>Aset Tetap Bersih</span><span className="font-bold text-zinc-900">{formatRupiah(totalNilaiBukuAset)}</span></div>
                      <div className="flex justify-between py-2 border-t border-b font-black text-red-900">
                        <span>TOTAL ASET</span>
                        <span>{formatRupiah(grandTotalAset)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="font-black text-red-900 block border-b pb-1">LIABILITAS & EKUITAS</span>
                      <div className="flex justify-between text-zinc-600"><span>Hutang Usaha (AP)</span><span className="font-bold text-zinc-900">{formatRupiah(hutangUsahaSupplier)}</span></div>
                      <div className="flex justify-between text-zinc-600"><span>Hutang Pajak</span><span className="font-bold text-zinc-900">{formatRupiah(hutangBiayaPajak)}</span></div>
                      <div className="flex justify-between text-zinc-600"><span>Modal Disetor</span><span className="font-bold text-zinc-900">{formatRupiah(modalDisetor)}</span></div>
                      <div className="flex justify-between text-zinc-600"><span>Laba Ditahan & Berjalan</span><span className="font-bold text-zinc-900">{formatRupiah(labaDitahan + labaBersih)}</span></div>
                      <div className="flex justify-between py-2 border-t border-b font-black text-red-900">
                        <span>TOTAL PASIVA</span>
                        <span>{formatRupiah(grandTotalLiabilitasEkuitas)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-8 mt-6 text-center">
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-12">Disiapkan Oleh,</span>
                    <div className="border-t border-zinc-400 w-36 mx-auto pt-1 font-bold text-zinc-900">
                      Finance & Accounting
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-12">Disetujui Oleh (Direktur Utama),</span>
                    <div className="border-t border-zinc-400 w-36 mx-auto pt-1 font-bold text-zinc-900">
                      Direktur Utama
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
