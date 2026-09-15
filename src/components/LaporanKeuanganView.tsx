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
  PieChart,
  Edit3,
  Info,
  HelpCircle
} from 'lucide-react';

export const LaporanKeuanganView: React.FC = () => {
  const { 
    purchaseOrders, 
    hutangList, 
    kasKecilList, 
    bukuBankList, 
    asetList, 
    materials, 
    finishGoods,
    currentUser,
    saldoAwalKasKecil,
    saldoAwalBukuBank,
    updateSaldoAwalKasKecil,
    updateSaldoAwalBukuBank,
    useOverrideHPP,
    overrideHPPValue,
    useOverrideBeban,
    overrideBebanValue,
    updateOverrideHPP,
    updateOverrideBeban,
    modalDisetor,
    labaDitahan,
    useOverrideLabaBersih,
    overrideLabaBersihValue,
    useOverridePenyeimbang,
    overridePenyeimbangValue,
    updateEquitySettings
  } = useApp();

  const [activeTab, setActiveTab] = useState<'laba_rugi' | 'neraca' | 'arus_kas'>('laba_rugi');
  const [periodPreset, setPeriodPreset] = useState<'this_month' | 'last_month' | 'this_year' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // HPP & Beban Edit Modals & Explanation Card States
  const [showEditHPPModal, setShowEditHPPModal] = useState(false);
  const [tempHPPValue, setTempHPPValue] = useState('');
  const [tempUseOverrideHPP, setTempUseOverrideHPP] = useState(false);

  const [showEditBebanModal, setShowEditBebanModal] = useState(false);
  const [tempBebanValue, setTempBebanValue] = useState('');
  const [tempUseOverrideBeban, setTempUseOverrideBeban] = useState(false);

  // Saldo Awal Edit States
  const [showEditSaldoAwalModal, setShowEditSaldoAwalModal] = useState(false);
  const [editingSaldoType, setEditingSaldoType] = useState<'kas_kecil' | 'buku_bank' | null>(null);
  const [tempSaldoAwal, setTempSaldoAwal] = useState('');

  // Equity Edit Modal State
  const [showEditEquityModal, setShowEditEquityModal] = useState(false);
  const [tempModalDisetor, setTempModalDisetor] = useState('');
  const [tempLabaDitahan, setTempLabaDitahan] = useState('');
  const [tempUseOverrideLabaBersih, setTempUseOverrideLabaBersih] = useState(false);
  const [tempOverrideLabaBersihValue, setTempOverrideLabaBersihValue] = useState('');
  const [tempUseOverridePenyeimbang, setTempUseOverridePenyeimbang] = useState(false);
  const [tempOverridePenyeimbangValue, setTempOverridePenyeimbangValue] = useState('');

  const [showExplanationCard, setShowExplanationCard] = useState(true);

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
        return po.tanggal >= startDate && po.tanggal <= endDate;
      })
      .reduce((a, b) => a + b.totalHarga, 0);
  }, [purchaseOrders, startDate, endDate]);

  // 2. COGS / HPP (Bahan Baku + Direct Labor + Jasa Oven)
  const hppKayu = useMemo(() => {
    return hutangList
      .filter(h => h.kategori === 'Bahan Baku Kayu')
      .reduce((a, b) => a + b.totalTagihan, 0) * 0.75; // Allocation
  }, [hutangList]);

  const hppPaku = useMemo(() => {
    return hutangList.filter(h => h.kategori === 'Bahan Pembantu (Paku, dll)').reduce((a, b) => a + b.totalTagihan, 0);
  }, [hutangList]);
  
  const hppOven = useMemo(() => {
    return hutangList.filter(h => h.kategori === 'Jasa Oven / Kiln Dry').reduce((a, b) => a + b.totalTagihan, 0);
  }, [hutangList]);

  const hppTenagaKerja = useMemo(() => {
    return bukuBankList.filter(b => b.kategori === 'Gaji Tukang & Staf' || b.kategori?.includes('Tukang')).reduce((a, b) => a + b.nominal, 0);
  }, [bukuBankList]);

  const calculatedTotalHPP = hppKayu + hppPaku + hppOven + hppTenagaKerja;
  const totalHPP = useOverrideHPP ? overrideHPPValue : calculatedTotalHPP;

  const labaKotor = totalRevenue - totalHPP;

  // 3. OPERATING EXPENSES (Beban Operasional)
  const bebanGajiStaff = useMemo(() => {
    return bukuBankList.filter(b => b.kategori === 'Gaji & Tunjangan Staf' || b.kategori?.includes('Staff')).reduce((a, b) => a + b.nominal, 0);
  }, [bukuBankList]);
  
  const bebanBBM = kasKecilList.filter(k => k.kategori === 'BBM & Parkir' || k.kategori === 'BBM & Transportasi').reduce((a, b) => a + b.nominal, 0);
  const bebanListrikAir = kasKecilList.filter(k => k.kategori === 'Listrik & Air' || k.kategori === 'Listrik, Air & Kebersihan').reduce((a, b) => a + b.nominal, 0);
  const bebanKonsumsi = kasKecilList.filter(k => k.kategori === 'Konsumsi Tukang' || k.kategori === 'Konsumsi & Dapur Pabrik').reduce((a, b) => a + b.nominal, 0);
  const bebanDepresiasi = useMemo(() => {
    return asetList.reduce((a, b) => a + b.penyusutanPerBulan, 0);
  }, [asetList]);
  const bebanLainnya = kasKecilList.filter(k => k.kategori === 'Lainnya' || k.kategori === 'Alat Kerja Ringan' || k.kategori === 'Kebersihan').reduce((a, b) => a + b.nominal, 0);

  const calculatedTotalBebanOperasional = bebanGajiStaff + bebanBBM + bebanListrikAir + bebanKonsumsi + bebanDepresiasi + bebanLainnya;
  const totalBebanOperasional = useOverrideBeban ? overrideBebanValue : calculatedTotalBebanOperasional;

  const labaOperasional = labaKotor - totalBebanOperasional;
  const estimasiPajak = Math.max(0, labaOperasional * 0.11); // 11% / PPh
  const labaBersihReal = labaOperasional - estimasiPajak;
  const labaBersih = useOverrideLabaBersih ? overrideLabaBersihValue : labaBersihReal;

  // --- BALANCE SHEET (NERACA) ---
  // Aset Lancar
  const kasKecil = useMemo(() => {
    const masuk = kasKecilList.filter(k => k.jenis === 'MASUK' || k.tipe === 'Masuk').reduce((a, b) => a + b.nominal, 0);
    const keluar = kasKecilList.filter(k => k.jenis === 'KELUAR' || k.tipe === 'Keluar').reduce((a, b) => a + b.nominal, 0);
    return (saldoAwalKasKecil || 0) + masuk - keluar;
  }, [kasKecilList, saldoAwalKasKecil]);
  
  const kasBank = useMemo(() => {
    const masuk = bukuBankList.filter(b => b.jenis === 'MASUK' || b.tipe === 'Masuk').reduce((a, b) => a + b.nominal, 0);
    const keluar = bukuBankList.filter(b => b.jenis === 'KELUAR' || b.tipe === 'Keluar').reduce((a, b) => a + b.nominal, 0);
    return (saldoAwalBukuBank || 0) + masuk - keluar;
  }, [bukuBankList, saldoAwalBukuBank]);

  const piutangUsaha = useMemo(() => {
    return purchaseOrders.filter(p => p.statusInvoice !== 'Lunas').reduce((a, b) => a + b.totalHarga, 0);
  }, [purchaseOrders]);

  const nilaiStokMaterial = useMemo(() => {
    // Estimasi harga log kayu Rp 1.200.000 / m3
    return materials.reduce((a, b) => a + (b.stokM3 * 1250000), 0);
  }, [materials]);

  const nilaiStokFinishGoods = useMemo(() => {
    return finishGoods.reduce((a, b) => a + (b.totalStok * 135000), 0);
  }, [finishGoods]);

  const cashFlowDetails = useMemo(() => {
    const totalAwal = (saldoAwalKasKecil || 0) + (saldoAwalBukuBank || 0);
    const totalAkhir = kasKecil + kasBank;
    const perubahanKasBersih = totalAkhir - totalAwal;

    // Filter transactions in date range if custom dates are specified
    const inRange = (dateStr: string) => {
      if (!startDate && !endDate) return true;
      const d = new Date(dateStr);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate)) return false;
      return true;
    };

    const bankItems = bukuBankList.filter(b => inRange(b.tanggal));
    const kasItems = kasKecilList.filter(k => inRange(k.tanggal));

    let penerimaanPelanggan = 0;
    let pembayaranSupplier = 0;
    let pembayaranGaji = 0;
    let pembayaranOperasional = 0;
    let pembelianAset = 0;
    let penerimaanModal = 0;

    bankItems.forEach(item => {
      const cat = (item.kategori || '').toLowerCase();
      const desc = (item.keterangan || '').toLowerCase();
      const isMasuk = item.jenis === 'MASUK' || item.tipe === 'Masuk';
      const nom = item.nominal || 0;

      if (isMasuk) {
        if (cat.includes('modal') || desc.includes('modal') || cat.includes('investor') || cat.includes('saham')) {
          penerimaanModal += nom;
        } else {
          penerimaanPelanggan += nom;
        }
      } else {
        if (cat.includes('supplier') || cat.includes('bahan baku') || cat.includes('kayu') || cat.includes('paku') || desc.includes('kayu') || desc.includes('paku')) {
          pembayaranSupplier += nom;
        } else if (cat.includes('gaji') || cat.includes('upah') || cat.includes('staff') || cat.includes('staf') || cat.includes('karyawan') || desc.includes('gaji')) {
          pembayaranGaji += nom;
        } else if (cat.includes('mesin') || cat.includes('oven') || cat.includes('chamber') || cat.includes('aset') || cat.includes('alat berat') || cat.includes('investasi')) {
          pembelianAset += nom;
        } else {
          pembayaranOperasional += nom;
        }
      }
    });

    kasItems.forEach(item => {
      const cat = (item.kategori || '').toLowerCase();
      const desc = (item.keterangan || '').toLowerCase();
      const isMasuk = item.jenis === 'MASUK' || item.tipe === 'Masuk';
      const nom = item.nominal || 0;

      if (isMasuk) {
        penerimaanPelanggan += nom;
      } else {
        if (cat.includes('supplier') || cat.includes('kayu') || cat.includes('paku') || desc.includes('kayu') || desc.includes('paku')) {
          pembayaranSupplier += nom;
        } else if (cat.includes('tukang') || cat.includes('gaji') || cat.includes('upah') || cat.includes('staf')) {
          pembayaranGaji += nom;
        } else if (cat.includes('mesin') || cat.includes('oven') || cat.includes('chamber') || cat.includes('aset')) {
          pembelianAset += nom;
        } else {
          pembayaranOperasional += nom;
        }
      }
    });

    // Make sure we dynamically map any initial setup or manually modified modal/retained equity to financing/retained cash flow too
    // Total Arus Kas Bersih
    const kasBersihOperasi = penerimaanPelanggan - pembayaranSupplier - pembayaranGaji - pembayaranOperasional;
    const kasBersihInvestasi = -pembelianAset;
    const kasBersihPendanaan = penerimaanModal;

    return {
      totalAwal,
      totalAkhir,
      perubahanKasBersih,
      penerimaanPelanggan,
      pembayaranSupplier,
      pembayaranGaji,
      pembayaranOperasional,
      pembelianAset,
      penerimaanModal,
      kasBersihOperasi,
      kasBersihInvestasi,
      kasBersihPendanaan
    };
  }, [bukuBankList, kasKecilList, saldoAwalKasKecil, saldoAwalBukuBank, kasKecil, kasBank, startDate, endDate]);

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

  // Ekuitas (Membaca dari Context dengan manual edit)
  const rawTotalEkuitas = modalDisetor + labaDitahan + labaBersih;
  const calculatedPenyeimbang = grandTotalAset - totalLiabilitas - rawTotalEkuitas;
  const penyeimbangNeraca = useOverridePenyeimbang ? overridePenyeimbangValue : calculatedPenyeimbang;
  const penyeimbangSistemAdjust = useOverridePenyeimbang ? (calculatedPenyeimbang - overridePenyeimbangValue) : 0;
  
  const totalEkuitas = rawTotalEkuitas + penyeimbangNeraca + penyeimbangSistemAdjust;
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
          {/* Explanation & Automatic Data Sources Panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowExplanationCard(!showExplanationCard)}
              className="w-full px-6 py-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-zinc-800 dark:text-zinc-200">
                <Info className="h-4 w-4 text-red-800 dark:text-red-400" />
                <span className="font-extrabold text-xs sm:text-sm">💡 Penjelasan & Sumber Rumus Otomatis Laba Rugi</span>
              </div>
              <span className="text-[11px] text-red-800 dark:text-red-400 font-black">
                {showExplanationCard ? 'Sembunyikan' : 'Tampilkan Penjelasan'}
              </span>
            </button>
            
            {showExplanationCard && (
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] leading-relaxed">
                <div className="space-y-3">
                  <h4 className="font-black text-xs text-zinc-900 dark:text-white flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-1.5 uppercase tracking-wider">
                    <span>🪵</span> 2. HARGA POKOK PENJUALAN (HPP)
                  </h4>
                  <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                    <li>
                      <strong className="text-zinc-800 dark:text-zinc-200">Bahan Baku Kayu:</strong> Otomatis dihitung dari <span className="font-semibold text-zinc-800 dark:text-zinc-200">75% dari total tagihan</span> PO pembelian dengan kategori <span className="underline">"Bahan Baku Kayu"</span> di modul <strong>Hutang Usaha (AP)</strong>.
                    </li>
                    <li>
                      <strong className="text-zinc-800 dark:text-zinc-200">Bahan Pembantu:</strong> Diambil dari total pembelian kategori <span className="underline">"Bahan Pembantu (Paku, dll)"</span> di modul <strong>Hutang Usaha (AP)</strong>.
                    </li>
                    <li>
                      <strong className="text-zinc-800 dark:text-zinc-200">Jasa Oven:</strong> Diambil dari total pembelian kategori <span className="underline">"Jasa Oven / Kiln Dry"</span> di modul <strong>Hutang Usaha (AP)</strong>.
                    </li>
                    <li>
                      <strong className="text-zinc-800 dark:text-zinc-200">Upah Tenaga Kerja:</strong> Diambil dari transaksi pengeluaran kategori <span className="underline">"Gaji Tukang & Staf"</span> atau nama transaksi mengandung kata <span className="underline">"Tukang"</span> pada <strong>Buku Bank Giro (Bank Mandiri)</strong>.
                    </li>
                  </ul>
                  <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl text-[10px] text-amber-800 dark:text-amber-300">
                    ℹ️ <em>HPP mencerminkan seluruh biaya langsung pabrik yang dikeluarkan untuk memproduksi pallet yang terjual.</em>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-black text-xs text-zinc-900 dark:text-white flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-1.5 uppercase tracking-wider">
                    <span>🏢</span> 3. BEBAN OPERASIONAL & UMUM
                  </h4>
                  <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                    <li>
                      <strong className="text-zinc-800 dark:text-zinc-200">Gaji Staff:</strong> Diambil dari pengeluaran kategori <span className="underline">"Gaji & Tunjangan Staf"</span> atau nama transaksi mengandung kata <span className="underline">"Staff"</span> pada <strong>Buku Bank Giro (Bank Mandiri)</strong>.
                    </li>
                    <li>
                      <strong className="text-zinc-800 dark:text-zinc-200">BBM & Armada Truk:</strong> Diambil dari pengeluaran kategori <span className="underline">"BBM & Parkir"</span> atau <span className="underline">"BBM & Transportasi"</span> di modul <strong>Kas Kecil</strong>.
                    </li>
                    <li>
                      <strong className="text-zinc-800 dark:text-zinc-200">Listrik & Air Pabrik:</strong> Diambil dari pengeluaran kategori <span className="underline">"Listrik & Air"</span> atau <span className="underline">"Listrik, Air & Kebersihan"</span> di modul <strong>Kas Kecil</strong>.
                    </li>
                    <li>
                      <strong className="text-zinc-800 dark:text-zinc-200">Beban Penyusutan Aset:</strong> Dihitung otomatis dari akumulasi penyusutan per bulan dari semua mesin & oven yang terdaftar di modul <strong>Aset Tetap</strong>.
                    </li>
                    <li>
                      <strong className="text-zinc-800 dark:text-zinc-200">Konsumsi & Lainnya:</strong> Diambil dari pengeluaran kategori <span className="underline">"Konsumsi Tukang"</span>, <span className="underline">"Konsumsi & Dapur Pabrik"</span>, <span className="underline">"Alat Kerja Ringan"</span>, <span className="underline">"Kebersihan"</span>, atau <span className="underline">"Lainnya"</span> di modul <strong>Kas Kecil</strong>.
                    </li>
                  </ul>
                  <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[10px] text-blue-800 dark:text-blue-300">
                    ℹ️ <em>Beban Operasional mencerminkan biaya tidak langsung untuk mendukung jalannya aktivitas operasional harian kantor & pabrik.</em>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                  <div className="flex justify-between items-center py-2 font-bold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50 px-2 rounded">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>TOTAL HARGA POKOK PENJUALAN (HPP)</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase ${useOverrideHPP ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400'}`}>
                        {useOverrideHPP ? 'Manual Override' : 'Kalkulasi Otomatis'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempUseOverrideHPP(useOverrideHPP);
                          setTempHPPValue(String(overrideHPPValue || calculatedTotalHPP));
                          setShowEditHPPModal(true);
                        }}
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1"
                        title="Edit / Set Nilai HPP"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span className="text-[9px] font-bold">Edit</span>
                      </button>
                    </div>
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
                  <div className="flex justify-between items-center py-2 font-bold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50 px-2 rounded">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>TOTAL BEBAN OPERASIONAL</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase ${useOverrideBeban ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400'}`}>
                        {useOverrideBeban ? 'Manual Override' : 'Kalkulasi Otomatis'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempUseOverrideBeban(useOverrideBeban);
                          setTempBebanValue(String(overrideBebanValue || calculatedTotalBebanOperasional));
                          setShowEditBebanModal(true);
                        }}
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1"
                        title="Edit / Set Nilai Beban"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span className="text-[9px] font-bold">Edit</span>
                      </button>
                    </div>
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
                    <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                      <span>Kas Kecil & Kasir Pabrik</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-zinc-900 dark:text-white">{formatRupiah(kasKecil)}</span>
                        <button
                          onClick={() => {
                            setEditingSaldoType('kas_kecil');
                            setTempSaldoAwal(String(saldoAwalKasKecil));
                            setShowEditSaldoAwalModal(true);
                          }}
                          className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                          title="Atur Saldo Awal Kas Kecil / Kasir Pabrik"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                      <span>Kas Bank Mandiri (156-00-1909954-0)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-zinc-900 dark:text-white">{formatRupiah(kasBank)}</span>
                        <button
                          onClick={() => {
                            setEditingSaldoType('buku_bank');
                            setTempSaldoAwal(String(saldoAwalBukuBank));
                            setShowEditSaldoAwalModal(true);
                          }}
                          className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                          title="Atur Saldo Awal Kas Bank Mandiri"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      </div>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block">Modal & Ekuitas Pemilik:</span>
                    <button
                      onClick={() => {
                        setTempModalDisetor(String(modalDisetor));
                        setTempLabaDitahan(String(labaDitahan));
                        setTempUseOverrideLabaBersih(useOverrideLabaBersih);
                        setTempOverrideLabaBersihValue(String(overrideLabaBersihValue));
                        setTempUseOverridePenyeimbang(useOverridePenyeimbang);
                        setTempOverridePenyeimbangValue(String(overridePenyeimbangValue));
                        setShowEditEquityModal(true);
                      }}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-red-700 dark:hover:text-red-400 rounded-lg transition-all cursor-pointer"
                      title="Edit Nilai Modal & Ekuitas Pemilik"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5 pl-3">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Modal Disetor Pendiri</span>
                      <span className="font-medium text-zinc-900 dark:text-white font-mono">{formatRupiah(modalDisetor)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Laba Ditahan (Tahun Sebelumnya)</span>
                      <span className="font-medium text-zinc-900 dark:text-white font-mono">{formatRupiah(labaDitahan)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Laba Bersih Tahun Berjalan</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                        {formatRupiah(labaBersih)} {useOverrideLabaBersih && <span className="text-[10px] text-amber-500 font-normal ml-1">(Override)</span>}
                      </span>
                    </div>
                    {(Math.abs(penyeimbangNeraca) > 1 || useOverridePenyeimbang) && (
                      <div className="flex justify-between text-zinc-400 dark:text-zinc-500 italic">
                        <span className="flex items-center gap-1">
                          Selisih Penyeimbang Neraca
                          {useOverridePenyeimbang && <span className="text-[9px] bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-bold px-1 rounded border border-amber-200">Manual</span>}
                        </span>
                        <span className="font-mono">{formatRupiah(penyeimbangNeraca)}</span>
                      </div>
                    )}
                    {Math.abs(penyeimbangSistemAdjust) > 1 && (
                      <div className="flex justify-between text-zinc-400/80 dark:text-zinc-500/80 italic text-[11px] pl-2 border-l border-zinc-200 dark:border-zinc-800">
                        <span>Penyelarasan Selisih (Penyeimbang Sistem)</span>
                        <span className="font-mono">{formatRupiah(penyeimbangSistemAdjust)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded">
                      <span>Subtotal Ekuitas</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatRupiah(totalEkuitas)}</span>
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
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 animate-in fade-in duration-150">
          <h2 className="font-extrabold text-base text-zinc-900 dark:text-white pb-2 border-b border-zinc-200 dark:border-zinc-800">
            Laporan Arus Kas (Metode Langsung)
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <span className="font-black text-sm text-zinc-900 dark:text-white block mb-2">1. Arus Kas dari Aktivitas Operasi</span>
              <div className="pl-4 space-y-1.5">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Penerimaan Kas dari Pelanggan & Piutang</span>
                  <span className="font-medium text-emerald-600 font-mono">+{formatRupiah(cashFlowDetails.penerimaanPelanggan)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Pembayaran Kas ke Supplier Kayu & Log</span>
                  <span className="font-medium text-red-600 font-mono">-{formatRupiah(cashFlowDetails.pembayaranSupplier)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Pembayaran Upah & Gaji Karyawan Pabrik</span>
                  <span className="font-medium text-red-600 font-mono">-{formatRupiah(cashFlowDetails.pembayaranGaji)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Pembayaran Biaya Listrik, BBM & Operasional</span>
                  <span className="font-medium text-red-600 font-mono">-{formatRupiah(cashFlowDetails.pembayaranOperasional)}</span>
                </div>
                <div className="flex justify-between font-bold bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded">
                  <span>Arus Kas Bersih dari Operasi</span>
                  <span className={`font-mono ${cashFlowDetails.kasBersihOperasi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {cashFlowDetails.kasBersihOperasi >= 0 ? '+' : ''}{formatRupiah(cashFlowDetails.kasBersihOperasi)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className="font-black text-sm text-zinc-900 dark:text-white block mb-2">2. Arus Kas dari Aktivitas Investasi</span>
              <div className="pl-4 space-y-1.5">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Pembelian / Upgrade Mesin Produksi & Chamber Oven</span>
                  <span className="font-medium text-red-600 font-mono">-{formatRupiah(cashFlowDetails.pembelianAset)}</span>
                </div>
                <div className="flex justify-between font-bold bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded">
                  <span>Arus Kas Bersih dari Investasi</span>
                  <span className="text-red-600 font-mono">-{formatRupiah(cashFlowDetails.pembelianAset)}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="font-black text-sm text-zinc-900 dark:text-white block mb-2">3. Arus Kas dari Aktivitas Pendanaan</span>
              <div className="pl-4 space-y-1.5">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Penerimaan Modal Disetor Pendiri / Investor</span>
                  <span className="font-medium text-emerald-600 font-mono">+{formatRupiah(cashFlowDetails.penerimaanModal)}</span>
                </div>
                <div className="flex justify-between font-bold bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded">
                  <span>Arus Kas Bersih dari Pendanaan</span>
                  <span className="text-emerald-600 font-mono">+{formatRupiah(cashFlowDetails.penerimaanModal)}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl space-y-1.5">
              <div className="flex justify-between font-black text-sm text-zinc-900 dark:text-white">
                <span>KENAIKAN / (PENURUNAN) BERSIH KAS & SETARA KAS</span>
                <span className={`font-mono ${cashFlowDetails.perubahanKasBersih >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {cashFlowDetails.perubahanKasBersih >= 0 ? '+' : ''}{formatRupiah(cashFlowDetails.perubahanKasBersih)}
                </span>
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-1.5 flex justify-between font-medium text-zinc-500 dark:text-zinc-400">
                <span>Saldo Kas Awal Periode (Kas Kecil + Bank Mandiri)</span>
                <span className="font-mono">{formatRupiah(cashFlowDetails.totalAwal)}</span>
              </div>
              <div className="flex justify-between font-bold text-zinc-900 dark:text-white">
                <span>Saldo Kas Akhir Periode (Neraca)</span>
                <span className="font-mono">{formatRupiah(cashFlowDetails.totalAkhir)}</span>
              </div>
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

      {/* Edit HPP Modal */}
      {showEditHPPModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
              <span className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-red-800 dark:text-red-400" />
                <span>Atur Nilai HPP (Harga Pokok Penjualan)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowEditHPPModal(false)}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const num = Number(tempHPPValue);
              if (!isNaN(num) && num >= 0) {
                updateOverrideHPP(tempUseOverrideHPP, num);
                setShowEditHPPModal(false);
              } else {
                alert("Nilai harus berupa angka positif.");
              }
            }} className="p-6 space-y-4 text-xs">
              
              {/* Radio Group / Toggle */}
              <div className="space-y-2">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block">Metode Nilai HPP:</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTempUseOverrideHPP(false);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      !tempUseOverrideHPP 
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 ring-1 ring-blue-600'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="font-extrabold text-xs">Otomatis (Sistem)</span>
                    <span className="text-[10px] text-zinc-500 mt-1">Dihitung otomatis dari data logistik & upah</span>
                    <span className="font-black text-xs mt-2 text-zinc-900 dark:text-white">{formatRupiah(calculatedTotalHPP)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTempUseOverrideHPP(true);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      tempUseOverrideHPP 
                        ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 ring-1 ring-amber-600'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="font-extrabold text-xs">Manual Override</span>
                    <span className="text-[10px] text-zinc-500 mt-1">Ganti dengan nilai input manual kustom</span>
                    <span className="font-black text-xs mt-2 text-zinc-900 dark:text-white">{formatRupiah(Number(tempHPPValue) || 0)}</span>
                  </button>
                </div>
              </div>

              {tempUseOverrideHPP && (
                <div className="space-y-1.5 pt-2 animate-in slide-in-from-top-2 duration-150">
                  <label className="font-bold text-zinc-600 dark:text-zinc-400 block">Nominal HPP Baru (Rp)</label>
                  <input
                    type="number"
                    value={tempHPPValue}
                    onChange={(e) => setTempHPPValue(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Masukkan nominal angka saja..."
                    required={tempUseOverrideHPP}
                  />
                  <span className="text-[10px] text-zinc-400 block">
                    Nilai ini akan menimpa seluruh kalkulasi HPP otomatis pada Laporan Laba Rugi & Neraca.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowEditHPPModal(false)}
                  className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Beban Modal */}
      {showEditBebanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
              <span className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-red-800 dark:text-red-400" />
                <span>Atur Nilai Beban Operasional & Umum</span>
              </span>
              <button
                type="button"
                onClick={() => setShowEditBebanModal(false)}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const num = Number(tempBebanValue);
              if (!isNaN(num) && num >= 0) {
                updateOverrideBeban(tempUseOverrideBeban, num);
                setShowEditBebanModal(false);
              } else {
                alert("Nilai harus berupa angka positif.");
              }
            }} className="p-6 space-y-4 text-xs">
              
              {/* Radio Group / Toggle */}
              <div className="space-y-2">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block">Metode Nilai Beban:</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTempUseOverrideBeban(false);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      !tempUseOverrideBeban 
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 ring-1 ring-blue-600'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="font-extrabold text-xs">Otomatis (Sistem)</span>
                    <span className="text-[10px] text-zinc-500 mt-1">Dihitung otomatis dari kas & penyusutan aset</span>
                    <span className="font-black text-xs mt-2 text-zinc-900 dark:text-white">{formatRupiah(calculatedTotalBebanOperasional)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTempUseOverrideBeban(true);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      tempUseOverrideBeban 
                        ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 ring-1 ring-amber-600'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="font-extrabold text-xs">Manual Override</span>
                    <span className="text-[10px] text-zinc-500 mt-1">Ganti dengan nilai input manual kustom</span>
                    <span className="font-black text-xs mt-2 text-zinc-900 dark:text-white">{formatRupiah(Number(tempBebanValue) || 0)}</span>
                  </button>
                </div>
              </div>

              {tempUseOverrideBeban && (
                <div className="space-y-1.5 pt-2 animate-in slide-in-from-top-2 duration-150">
                  <label className="font-bold text-zinc-600 dark:text-zinc-400 block">Nominal Beban Baru (Rp)</label>
                  <input
                    type="number"
                    value={tempBebanValue}
                    onChange={(e) => setTempBebanValue(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="Masukkan nominal angka saja..."
                    required={tempUseOverrideBeban}
                  />
                  <span className="text-[10px] text-zinc-400 block">
                    Nilai ini akan menimpa seluruh kalkulasi Beban Operasional otomatis pada Laporan Laba Rugi & Neraca.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowEditBebanModal(false)}
                  className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Saldo Awal Modal */}
      {showEditSaldoAwalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
              <span className="font-extrabold text-sm text-zinc-900 dark:text-white">
                {editingSaldoType === 'kas_kecil' ? 'Atur Saldo Awal Kas Kecil' : 'Atur Saldo Awal Bank Mandiri'}
              </span>
              <button
                onClick={() => {
                  setShowEditSaldoAwalModal(false);
                  setEditingSaldoType(null);
                }}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const num = Number(tempSaldoAwal);
              if (!isNaN(num)) {
                if (editingSaldoType === 'kas_kecil') {
                  updateSaldoAwalKasKecil(num);
                } else if (editingSaldoType === 'buku_bank') {
                  updateSaldoAwalBukuBank(num);
                }
                setShowEditSaldoAwalModal(false);
                setEditingSaldoType(null);
              } else {
                alert("Nilai harus berupa angka valid.");
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="font-bold text-xs text-zinc-600 dark:text-zinc-400 block mb-1.5">Saldo Awal Baru (Rp)</label>
                <input
                  type="number"
                  value={tempSaldoAwal}
                  onChange={(e) => setTempSaldoAwal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
                  placeholder="0"
                  required
                />
                {tempSaldoAwal && !isNaN(Number(tempSaldoAwal)) && (
                  <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    Format: {formatRupiah(Number(tempSaldoAwal))}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditSaldoAwalModal(false);
                    setEditingSaldoType(null);
                  }}
                  className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Simpan Saldo Awal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Equity Modal */}
      {showEditEquityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
              <span className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Edit Modal & Ekuitas Pemilik
              </span>
              <button
                onClick={() => setShowEditEquityModal(false)}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const mDisetor = Number(tempModalDisetor);
              const lDitahan = Number(tempLabaDitahan);
              const oLabaBersih = Number(tempOverrideLabaBersihValue);
              const oPenyeimbang = Number(tempOverridePenyeimbangValue);
              if (!isNaN(mDisetor) && !isNaN(lDitahan)) {
                updateEquitySettings(
                  mDisetor,
                  lDitahan,
                  tempUseOverrideLabaBersih,
                  isNaN(oLabaBersih) ? 0 : oLabaBersih,
                  tempUseOverridePenyeimbang,
                  isNaN(oPenyeimbang) ? 0 : oPenyeimbang
                );
                setShowEditEquityModal(false);
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="font-bold text-xs text-zinc-600 dark:text-zinc-400 block mb-1.5">Modal Disetor Pendiri (Rp)</label>
                <input
                  type="number"
                  value={tempModalDisetor}
                  onChange={(e) => setTempModalDisetor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
                  placeholder="500000000"
                  required
                />
                {tempModalDisetor && !isNaN(Number(tempModalDisetor)) && (
                  <p className="mt-1.5 text-xs font-bold text-zinc-500 font-mono">
                    Pratinjau: {formatRupiah(Number(tempModalDisetor))}
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-xs text-zinc-600 dark:text-zinc-400 block mb-1.5">Laba Ditahan / Tahun Sebelumnya (Rp)</label>
                <input
                  type="number"
                  value={tempLabaDitahan}
                  onChange={(e) => setTempLabaDitahan(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
                  placeholder="-499000000"
                  required
                />
                {tempLabaDitahan && !isNaN(Number(tempLabaDitahan)) && (
                  <p className="mt-1.5 text-xs font-bold text-zinc-500 font-mono">
                    Pratinjau: {formatRupiah(Number(tempLabaDitahan))}
                  </p>
                )}
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl space-y-3 border border-zinc-100 dark:border-zinc-800/80">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempUseOverrideLabaBersih}
                    onChange={(e) => setTempUseOverrideLabaBersih(e.target.checked)}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-zinc-300 rounded"
                  />
                  <div>
                    <span className="font-bold text-xs text-zinc-700 dark:text-zinc-300 block">Override Laba Bersih Berjalan</span>
                    <span className="text-[10px] text-zinc-500 block">Aktifkan untuk mengisi laba bersih berjalan secara manual (melewati kalkulasi sistem)</span>
                  </div>
                </label>

                {tempUseOverrideLabaBersih && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-[11px] text-zinc-600 dark:text-zinc-400 block">Nilai Laba Bersih Override (Rp)</label>
                    <input
                      type="number"
                      value={tempOverrideLabaBersihValue}
                      onChange={(e) => setTempOverrideLabaBersihValue(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
                      placeholder="145515000"
                      required={tempUseOverrideLabaBersih}
                    />
                    {tempOverrideLabaBersihValue && !isNaN(Number(tempOverrideLabaBersihValue)) && (
                      <p className="text-[10px] font-bold text-zinc-500 font-mono">
                        Pratinjau: {formatRupiah(Number(tempOverrideLabaBersihValue))}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl space-y-3 border border-zinc-100 dark:border-zinc-800/80">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempUseOverridePenyeimbang}
                    onChange={(e) => setTempUseOverridePenyeimbang(e.target.checked)}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-zinc-300 rounded"
                  />
                  <div>
                    <span className="font-bold text-xs text-zinc-700 dark:text-zinc-300 block">Override Selisih Penyeimbang Neraca</span>
                    <span className="text-[10px] text-zinc-500 block">Aktifkan untuk mengisi selisih penyeimbang secara manual (melewati kalkulasi sistem)</span>
                  </div>
                </label>

                {tempUseOverridePenyeimbang && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-[11px] text-zinc-600 dark:text-zinc-400 block">Nilai Penyeimbang Override (Rp)</label>
                    <input
                      type="number"
                      value={tempOverridePenyeimbangValue}
                      onChange={(e) => setTempOverridePenyeimbangValue(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
                      placeholder="-335500000"
                      required={tempUseOverridePenyeimbang}
                    />
                    {tempOverridePenyeimbangValue && !isNaN(Number(tempOverridePenyeimbangValue)) && (
                      <p className="text-[10px] font-bold text-zinc-500 font-mono">
                        Pratinjau: {formatRupiah(Number(tempOverridePenyeimbangValue))}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditEquityModal(false)}
                  className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
