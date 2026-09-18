import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FinishGood, FinishGoodMutasiItem } from '../types';
import { 
  Plus, Search, Hammer, Pencil, Trash2, Printer, FileText, Download, X, 
  ClipboardCheck, History, ArrowDownRight, ArrowUpRight, CheckCircle2, 
  Layers, Boxes, ShieldAlert, AlertTriangle, Calendar, UserCheck, RefreshCw,
  Eye, Filter
} from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';
import { exportToExcel } from '../utils/exportExcel';
import { downloadElementAsPdf, triggerPrintOrPdf, showPdfToast } from '../utils/exportPdf';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export const FinishGoodView: React.FC = () => {
  const { 
    finishGoods, 
    materials, 
    addFinishGood, 
    updateFinishGood, 
    deleteFinishGood, 
    producePallets, 
    recordFinishGoodMutation,
    updateFinishGoodOpname,
    currentUser 
  } = useApp();

  // Navigation Tabs: 'tabel_opname' | 'riwayat_mutasi' | 'katalog_grid'
  const [activeTab, setActiveTab] = useState<'tabel_opname' | 'riwayat_mutasi' | 'katalog_grid'>('tabel_opname');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('SEMUA');
  const [filterMutasiPallet, setFilterMutasiPallet] = useState<string>('SEMUA');
  const [filterMutasiTipe, setFilterMutasiTipe] = useState<string>('SEMUA');

  // Stock report PDF printing and period selection
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printStartDate, setPrintStartDate] = useState('2026-08-01');
  const [printEndDate, setPrintEndDate] = useState('2026-08-31');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FinishGood | null>(null);

  // General Form Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<FinishGood['tipe']>('Standard');
  const [dimensi, setDimensi] = useState('');
  const [stokAwal, setStokAwal] = useState(0);
  const [stok, setStok] = useState(0);
  const [tanggalMasukProduksi, setTanggalMasukProduksi] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalKeluarTerakhir, setTanggalKeluarTerakhir] = useState('');
  const [hargaJual, setHargaJual] = useState(0);
  const [minimalStok, setMinimalStok] = useState(0);
  const [deskripsi, setDeskripsi] = useState('');

  // Stock Opname Modal state
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [opnameTarget, setOpnameTarget] = useState<FinishGood | null>(null);
  const [opnameFisik, setOpnameFisik] = useState<number>(0);
  const [opnameTanggal, setOpnameTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [opnamePetugas, setOpnamePetugas] = useState<string>(currentUser?.name || 'Petugas Gudang');
  const [opnameKeterangan, setOpnameKeterangan] = useState<string>('Sesuai fisik gudang');

  // Manual Mutation Modal state
  const [showMutasiModal, setShowMutasiModal] = useState(false);
  const [mutasiTargetId, setMutasiTargetId] = useState<string>('');
  const [mutasiTipe, setMutasiTipe] = useState<'MASUK_PRODUKSI' | 'KELUAR_PENGIRIMAN'>('MASUK_PRODUKSI');
  const [mutasiJumlah, setMutasiJumlah] = useState<number>(10);
  const [mutasiTanggal, setMutasiTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mutasiNomorBukti, setMutasiNomorBukti] = useState<string>('');
  const [mutasiTujuan, setMutasiTujuan] = useState<string>('');
  const [mutasiSopir, setMutasiSopir] = useState<string>('');
  const [mutasiNoKendaraan, setMutasiNoKendaraan] = useState<string>('');
  const [mutasiKeterangan, setMutasiKeterangan] = useState<string>('');

  // Production Simulator Modal state
  const [showProdModal, setShowProdModal] = useState(false);
  const [prodPalletId, setProdPalletId] = useState('');
  const [prodQty, setProdQty] = useState(10);
  const [prodSuccess, setProdSuccess] = useState<string | null>(null);
  const [prodError, setProdError] = useState<string | null>(null);

  const palletTypes = ['SEMUA', 'Standard', 'Custom', 'Ekspor ISPM 15', 'Heavy Duty', 'Dua Arah'];

  // Check Permissions: Warehouse, Sales, Owner can view. Warehouse, Owner can edit/produce.
  const canModify = currentUser?.role === 'OWNER' || currentUser?.role === 'WAREHOUSE';

  // Filters logic for finish goods
  const filteredGoods = finishGoods.filter(item => {
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.dimensi && item.dimensi.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'SEMUA' || item.tipe === selectedType;
    return matchesSearch && matchesType;
  });

  // Flat list of all Finish Good mutations (Produksi masuk, Surat Jalan keluar, Opname)
  const allMutasiList: (FinishGoodMutasiItem & { palletNama: string; palletKode: string; palletTipe: string; palletDimensi?: string })[] = [];
  finishGoods.forEach(fg => {
    if (fg.riwayatMutasiFG && fg.riwayatMutasiFG.length > 0) {
      fg.riwayatMutasiFG.forEach(m => {
        allMutasiList.push({
          ...m,
          palletNama: fg.nama,
          palletKode: fg.kode,
          palletTipe: fg.tipe,
          palletDimensi: fg.dimensi
        });
      });
    }
  });
  allMutasiList.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime() || b.id.localeCompare(a.id));

  const filteredMutasiList = allMutasiList.filter(mut => {
    const matchesPallet = filterMutasiPallet === 'SEMUA' || mut.palletKode === filterMutasiPallet;
    const matchesTipe = filterMutasiTipe === 'SEMUA' || mut.tipe === filterMutasiTipe;
    const matchesSearch = mut.palletNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mut.palletKode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (mut.nomorBukti && mut.nomorBukti.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (mut.tujuanPengiriman && mut.tujuanPengiriman.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (mut.sopir && mut.sopir.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (mut.keterangan && mut.keterangan.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesPallet && matchesTipe && matchesSearch;
  });

  // Summary counters
  const totalItemCount = finishGoods.length;
  const totalStokAwal = finishGoods.reduce((sum, g) => sum + (g.stokAwal !== undefined ? g.stokAwal : g.stok), 0);
  const totalStokIn = finishGoods.reduce((sum, g) => sum + (g.stokMasukProduksi || 0), 0);
  const totalStokOut = finishGoods.reduce((sum, g) => sum + (g.stokKeluarPengiriman || 0), 0);
  const totalStokTersedia = finishGoods.reduce((sum, g) => sum + g.stok, 0);
  const totalNilaiAset = finishGoods.reduce((sum, g) => sum + (g.stok * g.hargaJual), 0);
  const totalLowStock = finishGoods.filter(g => g.stok <= g.minimalStok).length;

  const handleOpenAddModal = () => {
    setEditingId(null);
    setKode(`PLT-${Math.floor(100 + Math.random() * 900)}`);
    setNama('');
    setTipe('Standard');
    setDimensi('1000 x 1200 x 130 mm');
    setStokAwal(0);
    setStok(0);
    setTanggalMasukProduksi(new Date().toISOString().split('T')[0]);
    setTanggalKeluarTerakhir('');
    setHargaJual(85000);
    setMinimalStok(20);
    setDeskripsi('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (item: FinishGood) => {
    setEditingId(item.id);
    setKode(item.kode);
    setNama(item.nama);
    setTipe(item.tipe);
    setDimensi(item.dimensi);
    setStokAwal(item.stokAwal !== undefined ? item.stokAwal : item.stok);
    setStok(item.stok);
    setTanggalMasukProduksi(item.tanggalMasukProduksi || new Date().toISOString().split('T')[0]);
    setTanggalKeluarTerakhir(item.tanggalKeluarTerakhir || '');
    setHargaJual(item.hargaJual);
    setMinimalStok(item.minimalStok);
    setDeskripsi(item.deskripsi);
    setShowFormModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateFinishGood(editingId, {
        kode,
        nama,
        tipe,
        dimensi,
        stokAwal,
        stok,
        tanggalMasukProduksi,
        tanggalKeluarTerakhir,
        hargaJual,
        minimalStok,
        deskripsi
      });
      showPdfToast(`Data tipe pallet "${nama}" berhasil diperbarui.`);
    } else {
      addFinishGood({
        kode,
        nama,
        tipe,
        dimensi,
        stokAwal,
        stok,
        stokMasukProduksi: 0,
        stokKeluarPengiriman: 0,
        satuan: 'pcs',
        tanggalMasukProduksi,
        tanggalKeluarTerakhir,
        hargaJual,
        minimalStok,
        deskripsi
      });
      showPdfToast(`Tipe pallet baru "${nama}" berhasil ditambahkan ke gudang.`);
    }
    setShowFormModal(false);
  };

  // Open Stock Opname Modal
  const handleOpenOpnameModal = (item: FinishGood) => {
    setOpnameTarget(item);
    setOpnameFisik(item.stok);
    setOpnameTanggal(new Date().toISOString().split('T')[0]);
    setOpnamePetugas(currentUser?.name || 'Petugas Gudang');
    setOpnameKeterangan(item.keteranganOpname || 'Pemeriksaan rutin stock opname fisik gudang');
    setShowOpnameModal(true);
  };

  const handleSaveOpname = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opnameTarget) return;

    updateFinishGoodOpname(
      opnameTarget.id, 
      Number(opnameFisik), 
      `${opnameKeterangan} (Pemeriksa: ${opnamePetugas})`
    );
    showPdfToast(`Stock Opname ${opnameTarget.nama} berhasil disimpan! Stok sistem disesuaikan ke ${opnameFisik} pcs.`);
    setShowOpnameModal(false);
    setOpnameTarget(null);
  };

  // Open Quick Mutasi Modal
  const handleOpenMutasiModal = (item?: FinishGood) => {
    if (item) {
      setMutasiTargetId(item.id);
    } else if (finishGoods.length > 0) {
      setMutasiTargetId(finishGoods[0].id);
    }
    setMutasiTipe('MASUK_PRODUKSI');
    setMutasiJumlah(10);
    setMutasiTanggal(new Date().toISOString().split('T')[0]);
    setMutasiNomorBukti(`MUT-FG-${Math.floor(1000 + Math.random() * 9000)}`);
    setMutasiTujuan('');
    setMutasiSopir('');
    setMutasiNoKendaraan('');
    setMutasiKeterangan('');
    setShowMutasiModal(true);
  };

  const handleSaveMutasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutasiTargetId) return;

    recordFinishGoodMutation(mutasiTargetId, {
      tanggal: mutasiTanggal,
      tipe: mutasiTipe,
      jumlah: Number(mutasiJumlah),
      nomorBukti: mutasiNomorBukti,
      tujuanPengiriman: mutasiTujuan,
      sopir: mutasiSopir,
      noKendaraan: mutasiNoKendaraan,
      keterangan: mutasiKeterangan || (mutasiTipe === 'MASUK_PRODUKSI' ? 'Barang Masuk dari Produksi' : 'Barang Keluar Pengiriman'),
      dicatatOleh: currentUser?.name || 'Warehouse Staff'
    });

    showPdfToast(`Mutasi ${mutasiTipe === 'MASUK_PRODUKSI' ? 'Masuk' : 'Keluar'} sebanyak ${mutasiJumlah} pcs berhasil dicatat.`);
    setShowMutasiModal(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteFinishGood(deleteTarget.id);
      showPdfToast(`Data tipe pallet "${deleteTarget.nama}" berhasil dihapus.`);
      setDeleteTarget(null);
    }
  };

  // Setup Production Simulator Material Costs per Pallet Unit
  const getMaterialCosts = (goodId: string) => {
    const good = finishGoods.find(g => g.id === goodId);
    if (!good) return [];

    switch (good.tipe) {
      case 'Standard':
        return [
          { materialId: 'mat-2', nama: 'Kayu Papan Mahoni 2x10x120', amount: 8, satuan: 'pcs' },
          { materialId: 'mat-3', nama: 'Balok Kayu Alba 8x8x100', amount: 2, satuan: 'pcs' },
          { materialId: 'mat-4', nama: 'Paku Coil 2.5 Inch', amount: 0.5, satuan: 'kg' }
        ];
      case 'Heavy Duty':
        return [
          { materialId: 'mat-1', nama: 'Kayu Log Albasia Sengon', amount: 0.15, satuan: 'm3' },
          { materialId: 'mat-4', nama: 'Paku Coil 2.5 Inch', amount: 0.8, satuan: 'kg' },
          { materialId: 'mat-5', nama: 'Cairan Pengawet Anti-Rayap', amount: 0.2, satuan: 'liter' }
        ];
      case 'Ekspor ISPM 15':
        return [
          { materialId: 'mat-2', nama: 'Kayu Papan Mahoni 2x10x120', amount: 10, satuan: 'pcs' },
          { materialId: 'mat-4', nama: 'Paku Coil 2.5 Inch', amount: 0.6, satuan: 'kg' },
          { materialId: 'mat-5', nama: 'Cairan Pengawet Anti-Rayap', amount: 0.3, satuan: 'liter' }
        ];
      case 'Dua Arah':
      default:
        return [
          { materialId: 'mat-2', nama: 'Kayu Papan Mahoni 2x10x120', amount: 6, satuan: 'pcs' },
          { materialId: 'mat-3', nama: 'Balok Kayu Alba 8x8x100', amount: 1.5, satuan: 'pcs' },
          { materialId: 'mat-4', nama: 'Paku Coil 2.5 Inch', amount: 0.4, satuan: 'kg' }
        ];
    }
  };

  const handleOpenProductionModal = (item: FinishGood) => {
    setProdPalletId(item.id);
    setProdQty(20);
    setProdSuccess(null);
    setProdError(null);
    setShowProdModal(true);
  };

  const handleExecuteProduction = (e: React.FormEvent) => {
    e.preventDefault();
    setProdSuccess(null);
    setProdError(null);

    const costs = getMaterialCosts(prodPalletId);
    if (costs.length === 0) {
      setProdError('Formula produksi untuk pallet ini tidak tersedia.');
      return;
    }

    const payload = costs.map(c => ({
      materialId: c.materialId,
      amount: c.amount
    }));

    const result = producePallets(prodPalletId, prodQty, payload);
    if (result.success) {
      setProdSuccess(`Berhasil memproduksi ${prodQty} unit pallet! Bahan baku dikurangi, stok masuk bertambah, dan tanggal masuk produksi otomatis tercatat.`);
    } else {
      setProdError(result.error || 'Terjadi kesalahan saat memproduksi pallet.');
    }
  };

  const handleExportExcelStok = (start: string, end: string) => {
    const filtered = finishGoods.filter(g => {
      if (!start && !end) return true;
      if (!g.terakhirDiperbarui) return true;
      const itemDate = g.terakhirDiperbarui.split('T')[0];
      let ok = true;
      if (start) ok = ok && itemDate >= start;
      if (end) ok = ok && itemDate <= end;
      return ok;
    });

    exportToExcel<FinishGood>(
      filtered,
      [
        'Kode Pallet', 
        'Nama Tipe Pallet', 
        'Kategori / Tipe', 
        'Dimensi Ukuran', 
        'Stok Awal (Pcs)', 
        'Stok Masuk In Produksi (Pcs)', 
        'Stok Keluar Out Surat Jalan (Pcs)', 
        'Stok Tersedia Sistem (Pcs)', 
        'Tanggal Masuk dari Produksi', 
        'Tanggal Keluar Barang (SJ)', 
        'Stok Fisik Opname', 
        'Selisih Opname', 
        'Tanggal Terakhir Opname', 
        'Harga Jual (IDR)', 
        'Total Nilai Aset (IDR)'
      ],
      (g) => [
        g.kode,
        g.nama,
        g.tipe,
        g.dimensi || '-',
        g.stokAwal !== undefined ? g.stokAwal : g.stok,
        g.stokMasukProduksi || 0,
        g.stokKeluarPengiriman || 0,
        g.stok,
        g.tanggalMasukProduksi || '-',
        g.tanggalKeluarTerakhir || '-',
        g.stokFisikOpname !== undefined ? g.stokFisikOpname : g.stok,
        g.selisihOpname !== undefined ? g.selisihOpname : 0,
        g.tanggalOpnameTerakhir || '-',
        g.hargaJual,
        g.stok * g.hargaJual
      ],
      `Laporan_Stok_Opname_Pallet_${start || 'all'}_sd_${end || 'all'}`
    );
  };

  return (
    <div id="finish-good-view" className="p-4 md:p-6 space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Gudang Barang Jadi (Finish Goods)</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              Terintegrasi Surat Jalan & Opname
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Format inventaris pallet kayu lengkap: Stok Awal, Masuk dari Produksi, Keluar Pemotongan Surat Jalan, Stok Tersedia, dan Rekonsiliasi Stock Opname.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-excel-pallet-stok"
            onClick={() => handleExportExcelStok(printStartDate, printEndDate)}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download Excel
          </button>
          <button
            id="btn-cetak-pallet-stok"
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Cetak PDF Opname
          </button>
          {canModify && (
            <>
              <button
                id="btn-catat-mutasi-fg"
                onClick={() => handleOpenMutasiModal()}
                className="px-3.5 py-2.5 bg-zinc-700 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Catat In / Out
              </button>
              <button
                id="btn-tambah-pallet"
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md cursor-pointer dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                <Plus className="h-4.5 w-4.5" />
                Tambah Tipe Pallet
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Varian</span>
          <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 mt-1 block">{totalItemCount} Model</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Stok Qty Awal</span>
          <span className="text-lg font-black text-zinc-700 dark:text-zinc-300 mt-1 block">{totalStokAwal.toLocaleString('id-ID')} pcs</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Masuk (In)</span>
            <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-1 block">+{totalStokIn.toLocaleString('id-ID')} pcs</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Keluar (Surat Jalan)</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <span className="text-lg font-black text-blue-700 dark:text-blue-400 mt-1 block">-{totalStokOut.toLocaleString('id-ID')} pcs</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs border-l-4 border-l-zinc-900 dark:border-l-zinc-100">
          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Stok Tersedia (Aktif)</span>
          <span className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-1 block">{totalStokTersedia.toLocaleString('id-ID')} pcs</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Estimasi Nilai Aset</span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 block truncate">
            Rp {totalNilaiAset.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-4">
        <button
          onClick={() => setActiveTab('tabel_opname')}
          className={`pb-3 px-2 text-xs font-black transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'tabel_opname'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Boxes className="h-4 w-4" />
          Master Stok & Stock Opname
          <span className="ml-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {filteredGoods.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('riwayat_mutasi')}
          className={`pb-3 px-2 text-xs font-black transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'riwayat_mutasi'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <History className="h-4 w-4" />
          Riwayat In / Out & Surat Jalan
          <span className="ml-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {allMutasiList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('katalog_grid')}
          className={`pb-3 px-2 text-xs font-black transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'katalog_grid'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          Tampilan Katalog Card
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="search-pallet-input"
            type="text"
            placeholder={
              activeTab === 'riwayat_mutasi'
                ? "Cari nama pallet, no surat jalan, atau pelanggan..."
                : "Cari kode, tipe, atau dimensi pallet..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
          />
        </div>

        {/* Pallet Types Filter or Mutation Filter */}
        {activeTab === 'riwayat_mutasi' ? (
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Pallet:</span>
              <select
                value={filterMutasiPallet}
                onChange={(e) => setFilterMutasiPallet(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="SEMUA">Semua Pallet</option>
                {finishGoods.map(g => (
                  <option key={g.id} value={g.kode}>{g.kode} - {g.nama}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Tipe Gerak:</span>
              <select
                value={filterMutasiTipe}
                onChange={(e) => setFilterMutasiTipe(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="SEMUA">Semua Pergerakan</option>
                <option value="MASUK_PRODUKSI">Masuk Produksi (+ In)</option>
                <option value="KELUAR_PENGIRIMAN">Keluar Surat Jalan (- Out)</option>
                <option value="PENYESUAIAN_OPNAME">Penyesuaian Opname</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {palletTypes.map((t) => (
              <button
                key={t}
                id={`plt-filter-${t}`}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  selectedType === t
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-750'
                }`}
              >
                {t === 'SEMUA' ? 'Semua Tipe' : t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- TAB 1: MASTER STOK & STOCK OPNAME TABLE --- */}
      {activeTab === 'tabel_opname' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-zinc-50/50 dark:bg-zinc-850/20">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <ClipboardCheck className="h-4.5 w-4.5 text-red-600" />
                Daftar Inventaris Pallet & Stock Opname
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Data real-time: Surat Jalan otomatis memotong kolom Stok Keluar dan memperbarui Tanggal Keluar Barang.
              </p>
            </div>
            <span className="text-[11px] font-bold text-zinc-400">
              Total {filteredGoods.length} Tipe Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-850/60 font-bold uppercase text-[10px] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-3 px-3">Kode</th>
                  <th className="py-3 px-3">Nama & Spesifikasi Pallet</th>
                  <th className="py-3 px-2">Kategori</th>
                  <th className="py-3 px-2 text-right">Stok Awal</th>
                  <th className="py-3 px-2 text-right text-emerald-600">In (Produksi)</th>
                  <th className="py-3 px-2 text-right text-blue-600">Out (Surat Jalan)</th>
                  <th className="py-3 px-3 text-right bg-zinc-200/40 dark:bg-zinc-800/40 font-black">Stok Tersedia</th>
                  <th className="py-3 px-2 text-center">Tgl Masuk Produksi</th>
                  <th className="py-3 px-2 text-center">Tgl Keluar (SJ)</th>
                  <th className="py-3 px-3 text-right bg-amber-50/50 dark:bg-amber-950/20">Fisik Opname</th>
                  <th className="py-3 px-2 text-center">Selisih</th>
                  <th className="py-3 px-3 text-right">Harga Jual</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredGoods.map((item) => {
                  const initialQty = item.stokAwal !== undefined ? item.stokAwal : item.stok;
                  const inQty = item.stokMasukProduksi || 0;
                  const outQty = item.stokKeluarPengiriman || 0;
                  const isLow = item.stok <= item.minimalStok;
                  const selisih = item.selisihOpname !== undefined ? item.selisihOpname : 0;
                  const fisik = item.stokFisikOpname !== undefined ? item.stokFisikOpname : item.stok;

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {item.kode}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-zinc-900 dark:text-zinc-100">{item.nama}</div>
                        <div className="text-[10px] text-zinc-400 font-semibold mt-0.5">Dimensi: {item.dimensi || '-'}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          item.tipe === 'Ekspor ISPM 15' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/45 dark:text-blue-300' 
                            : item.tipe === 'Heavy Duty' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-300' 
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}>
                          {item.tipe}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-zinc-600 dark:text-zinc-400">
                        {initialQty} pcs
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        +{inQty} pcs
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-blue-600 dark:text-blue-400">
                        -{outQty} pcs
                      </td>
                      <td className="py-3 px-3 text-right bg-zinc-200/30 dark:bg-zinc-800/30">
                        <span className={`inline-block px-2.5 py-1 rounded text-xs font-black ${
                          isLow 
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 animate-pulse' 
                            : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                        }`}>
                          {item.stok} pcs
                        </span>
                        {isLow && (
                          <span className="block text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                            Buffer Min: {item.minimalStok}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        {item.tanggalMasukProduksi ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-emerald-600" />
                            {item.tanggalMasukProduksi}
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        {item.tanggalKeluarTerakhir ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                            <Calendar className="h-3 w-3" />
                            {item.tanggalKeluarTerakhir}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic text-[10px]">Belum Keluar</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right bg-amber-50/30 dark:bg-amber-950/10 font-bold text-zinc-900 dark:text-zinc-100">
                        {fisik} pcs
                        {item.tanggalOpnameTerakhir && (
                          <span className="block text-[9px] text-zinc-400 font-normal mt-0.5">
                            {item.tanggalOpnameTerakhir}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          selisih === 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : selisih < 0
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        }`}>
                          {selisih > 0 ? `+${selisih}` : selisih}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-red-600 dark:text-red-400">
                        Rp {item.hargaJual.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canModify && (
                            <>
                              <button
                                onClick={() => handleOpenOpnameModal(item)}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Input Hasil Stock Opname Fisik"
                              >
                                <ClipboardCheck className="h-3 w-3" />
                                Opname
                              </button>
                              <button
                                onClick={() => handleOpenProductionModal(item)}
                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Simulasi Manufaktur / Produksi"
                              >
                                <Hammer className="h-3 w-3" />
                                Produksi
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                title="Edit Pallet"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                            title="Hapus Pallet"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500 hover:text-red-700" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredGoods.length === 0 && (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                      Tidak ada tipe pallet kayu di gudang yang cocok dengan kriteria pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: RIWAYAT MUTASI IN/OUT & SURAT JALAN --- */}
      {activeTab === 'riwayat_mutasi' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-850/20">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-blue-600" />
                Kartu Riwayat Keluar - Masuk Barang Jadi & Pemotongan Surat Jalan
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Mencatat kronologi pallet masuk dari divisi perakitan pabrik, pengiriman ke pelanggan via Surat Jalan, dan penyesuaian audit opname.
              </p>
            </div>
            {canModify && (
              <button
                onClick={() => handleOpenMutasiModal()}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Catat Mutasi Manual
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-850/60 font-bold uppercase text-[10px] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Tipe Gerakan</th>
                  <th className="py-3 px-3">Pallet Item</th>
                  <th className="py-3 px-2 text-right">Jumlah (Pcs)</th>
                  <th className="py-3 px-2 text-right">Sisa Stok</th>
                  <th className="py-3 px-3">No. Bukti / Surat Jalan</th>
                  <th className="py-3 px-3">Tujuan Pelanggan / Sopir</th>
                  <th className="py-3 px-3">Keterangan</th>
                  <th className="py-3 px-3">Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredMutasiList.map((m) => {
                  const isMasuk = m.tipe === 'MASUK_PRODUKSI';
                  const isKeluar = m.tipe === 'KELUAR_PENGIRIMAN';

                  return (
                    <tr key={m.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        {m.tanggal}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                          isMasuk 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : isKeluar
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {isMasuk && <ArrowDownRight className="h-3 w-3" />}
                          {isKeluar && <ArrowUpRight className="h-3 w-3" />}
                          {!isMasuk && !isKeluar && <ClipboardCheck className="h-3 w-3" />}
                          {isMasuk ? 'MASUK PRODUKSI' : isKeluar ? 'KELUAR SURAT JALAN' : 'OPNAME FISIK'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-zinc-900 dark:text-zinc-100">{m.palletNama}</div>
                        <div className="text-[10px] text-zinc-400 font-mono font-semibold">{m.palletKode} • {m.palletTipe}</div>
                      </td>
                      <td className="py-3 px-2 text-right font-black">
                        <span className={isMasuk ? 'text-emerald-600 dark:text-emerald-400' : isKeluar ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600'}>
                          {isMasuk ? `+${m.jumlah}` : isKeluar ? `-${m.jumlah}` : m.jumlah} pcs
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-extrabold text-zinc-800 dark:text-zinc-200">
                        {m.sisaStokSetelahnya !== undefined ? `${m.sisaStokSetelahnya} pcs` : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {m.nomorBukti || '-'}
                      </td>
                      <td className="py-3 px-3">
                        {m.tujuanPengiriman ? (
                          <div>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{m.tujuanPengiriman}</span>
                            {(m.sopir || m.noKendaraan) && (
                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                Sopir: {m.sopir || '-'} {m.noKendaraan ? `(${m.noKendaraan})` : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 max-w-xs">
                        {m.keterangan || '-'}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                        {m.dicatatOleh || 'Gudang'}
                      </td>
                    </tr>
                  );
                })}

                {filteredMutasiList.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                      Belum ada catatan mutasi keluar-masuk pallet finish good.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: KATALOG GRID VIEW --- */}
      {activeTab === 'katalog_grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredGoods.map((item) => {
            const isLow = item.stok <= item.minimalStok;
            return (
              <div 
                key={item.id} 
                id={`card-pallet-${item.id}`}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-800/10 flex justify-between items-center">
                  <span className="font-mono text-[10px] font-bold text-zinc-400 dark:text-zinc-500">{item.kode}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    item.tipe === 'Ekspor ISPM 15' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/45 dark:text-blue-300' 
                      : item.tipe === 'Heavy Duty' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-300' 
                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}>
                    {item.tipe}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 leading-snug">{item.nama}</h4>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1">Dimensi: {item.dimensi}</p>
                    
                    <div className="mt-3 p-2.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 text-[11px] space-y-1">
                      <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                        <span>Stok Awal:</span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.stokAwal !== undefined ? item.stokAwal : item.stok} pcs</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>In (Produksi):</span>
                        <span className="font-bold">+{item.stokMasukProduksi || 0} pcs</span>
                      </div>
                      <div className="flex justify-between text-blue-600 dark:text-blue-400">
                        <span>Out (Surat Jalan):</span>
                        <span className="font-bold">-{item.stokKeluarPengiriman || 0} pcs</span>
                      </div>
                      <div className="flex justify-between text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200/40 dark:border-zinc-800/40 text-[10px]">
                        <span>Tgl Masuk Produksi:</span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.tanggalMasukProduksi || '-'}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500 dark:text-zinc-400 text-[10px]">
                        <span>Tgl Keluar (SJ):</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{item.tanggalKeluarTerakhir || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Harga Jual</span>
                      <span className="text-sm font-black text-red-600 dark:text-red-400">Rp {item.hargaJual.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Stok Tersedia</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-black ${
                        isLow 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 animate-pulse' 
                          : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                      }`}>
                        {item.stok} pcs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-800/10 flex justify-between items-center">
                  {canModify ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenOpnameModal(item)}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        Opname
                      </button>
                      <button
                        onClick={() => handleOpenProductionModal(item)}
                        className="text-[11px] font-bold text-red-700 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Hammer className="h-3.5 w-3.5" />
                        Produksi
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-400 italic">Hanya Baca</span>
                  )}

                  <div className="flex items-center gap-1">
                    {canModify && (
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1 text-zinc-400 hover:text-blue-600 cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                      title="Hapus Pallet"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500 hover:text-red-700" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredGoods.length === 0 && (
            <div className="col-span-full text-center py-16 text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-xl border">
              <p className="text-sm">Tidak ada tipe pallet kayu di gudang yang cocok dengan kriteria pencarian Anda.</p>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL: STOCK OPNAME RECORDING --- */}
      {showOpnameModal && opnameTarget && (
        <div id="pallet-opname-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/20">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-amber-600" />
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Formulir Stock Opname Fisik Gudang
                </h3>
              </div>
              <button onClick={() => setShowOpnameModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer text-xl">&times;</button>
            </div>

            <form onSubmit={handleSaveOpname} className="p-6 space-y-4">
              {/* Pallet Target Spec Display */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/70 dark:border-zinc-800 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-zinc-400">{opnameTarget.kode}</span>
                    <h4 className="font-black text-sm text-zinc-900 dark:text-zinc-100">{opnameTarget.nama}</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Dimensi: {opnameTarget.dimensi}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {opnameTarget.tipe}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 text-center">
                  <div className="p-1.5 bg-white dark:bg-zinc-900 rounded border border-zinc-200/50 dark:border-zinc-800">
                    <span className="text-[9px] text-zinc-400 font-bold block uppercase">Stok Awal</span>
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {opnameTarget.stokAwal !== undefined ? opnameTarget.stokAwal : opnameTarget.stok}
                    </span>
                  </div>
                  <div className="p-1.5 bg-white dark:bg-zinc-900 rounded border border-zinc-200/50 dark:border-zinc-800">
                    <span className="text-[9px] text-emerald-600 font-bold block uppercase">In (Produksi)</span>
                    <span className="text-xs font-bold text-emerald-600">+{opnameTarget.stokMasukProduksi || 0}</span>
                  </div>
                  <div className="p-1.5 bg-white dark:bg-zinc-900 rounded border border-zinc-200/50 dark:border-zinc-800">
                    <span className="text-[9px] text-blue-600 font-bold block uppercase">Out (Surat Jalan)</span>
                    <span className="text-xs font-bold text-blue-600">-{opnameTarget.stokKeluarPengiriman || 0}</span>
                  </div>
                  <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">
                    <span className="text-[9px] text-zinc-900 dark:text-zinc-100 font-black block uppercase">Sistem Saat Ini</span>
                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">{opnameTarget.stok} pcs</span>
                  </div>
                </div>
              </div>

              {/* Opname Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                    STOK FISIK AKTUAL DI GUDANG (PCS)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={opnameFisik}
                    onChange={(e) => setOpnameFisik(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-amber-50/40 dark:bg-amber-950/20 border-2 border-amber-400 dark:border-amber-600 rounded-lg text-sm font-black text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-zinc-400">Hasil hitung fisik riil di lantai gudang</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                    SELISIH HASIL OPNAME
                  </label>
                  <div className={`px-3 py-2 rounded-lg border flex items-center justify-between font-black text-sm ${
                    opnameFisik - opnameTarget.stok === 0
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                      : opnameFisik - opnameTarget.stok < 0
                        ? 'bg-red-50 border-red-300 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300'
                        : 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
                  }`}>
                    <span>
                      {opnameFisik - opnameTarget.stok > 0 ? `+${opnameFisik - opnameTarget.stok}` : opnameFisik - opnameTarget.stok} pcs
                    </span>
                    <span className="text-[10px] font-bold uppercase">
                      {opnameFisik - opnameTarget.stok === 0 ? 'Sesuai ✓' : opnameFisik - opnameTarget.stok < 0 ? 'Kurang ✗' : 'Lebih +'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Fisik ({opnameFisik}) - Sistem ({opnameTarget.stok})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">TANGGAL OPNAME</label>
                  <input
                    type="date"
                    required
                    value={opnameTanggal}
                    onChange={(e) => setOpnameTanggal(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">PETUGAS PEMERIKSA / AUDITOR</label>
                  <input
                    type="text"
                    required
                    value={opnamePetugas}
                    onChange={(e) => setOpnamePetugas(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">KETERANGAN / PENJELASAN SELISIH</label>
                <textarea
                  rows={2}
                  value={opnameKeterangan}
                  onChange={(e) => setOpnameKeterangan(e.target.value)}
                  placeholder="Contoh: Sesuai hasil hitung rak A, terdapat 2 pallet rusak tidak terhitung..."
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Menyimpan formulir ini akan <strong>menyesuaikan stok sistem menjadi {opnameFisik} pcs</strong> dan mencatat riwayat rekonsiliasi opname secara permanen.
                </span>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOpnameModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Simpan & Sesuaikan Stok Sistem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: MANUAL IN / OUT MUTATION RECORDING --- */}
      {showMutasiModal && (
        <div id="pallet-mutasi-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/20">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-red-600" />
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Pencatatan Mutasi Pallet (In / Out Gudang)
                </h3>
              </div>
              <button onClick={() => setShowMutasiModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer text-xl">&times;</button>
            </div>

            <form onSubmit={handleSaveMutasi} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">PILIH TIPE PALLET</label>
                <select
                  value={mutasiTargetId}
                  onChange={(e) => setMutasiTargetId(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {finishGoods.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.kode} - {g.nama} (Stok Saat Ini: {g.stok} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">ARAH PERGERAKAN</label>
                  <select
                    value={mutasiTipe}
                    onChange={(e) => setMutasiTipe(e.target.value as 'MASUK_PRODUKSI' | 'KELUAR_PENGIRIMAN')}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="MASUK_PRODUKSI">Masuk dari Produksi (+ In)</option>
                    <option value="KELUAR_PENGIRIMAN">Keluar Pengiriman (- Out)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">JUMLAH (PCS)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={mutasiJumlah}
                    onChange={(e) => setMutasiJumlah(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-black focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">TANGGAL PERGERAKAN</label>
                  <input
                    type="date"
                    required
                    value={mutasiTanggal}
                    onChange={(e) => setMutasiTanggal(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">NO. BUKTI / SURAT JALAN</label>
                  <input
                    type="text"
                    placeholder="e.g. SJ/MKN/2026/08/012"
                    value={mutasiNomorBukti}
                    onChange={(e) => setMutasiNomorBukti(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {mutasiTipe === 'KELUAR_PENGIRIMAN' && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/50 dark:border-blue-900/30 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">PELANGGAN / TUJUAN PENGIRIMAN</label>
                    <input
                      type="text"
                      placeholder="e.g. PT. Indofood Sukses Makmur Tbk"
                      value={mutasiTujuan}
                      onChange={(e) => setMutasiTujuan(e.target.value)}
                      className="block w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">NAMA SOPIR</label>
                      <input
                        type="text"
                        placeholder="e.g. Pak Joko"
                        value={mutasiSopir}
                        onChange={(e) => setMutasiSopir(e.target.value)}
                        className="block w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">NO. POLISI KENDARAAN</label>
                      <input
                        type="text"
                        placeholder="e.g. B 9123 KYN"
                        value={mutasiNoKendaraan}
                        onChange={(e) => setMutasiNoKendaraan(e.target.value)}
                        className="block w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">CATATAN / KETERANGAN</label>
                <textarea
                  rows={2}
                  value={mutasiKeterangan}
                  onChange={(e) => setMutasiKeterangan(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMutasiModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT FINISHED PALLET FORM MODAL --- */}
      {showFormModal && (
        <div id="pallet-form-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-850/20">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                {editingId ? 'Edit Spesifikasi Pallet' : 'Tambah Tipe Pallet Baru ke Gudang'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer text-xl">&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">KODE PRODUK</label>
                  <input
                    type="text"
                    required
                    value={kode}
                    onChange={(e) => setKode(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">TIPE PALLET</label>
                  <select
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value as FinishGood['tipe'])}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {palletTypes.filter(t => t !== 'SEMUA').map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">NAMA PALLET</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Pallet Kayu Standard 100x120 cm"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 font-semibold">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">DIMENSI / UKURAN (mm)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 1000 x 1200 x 130 mm"
                    value={dimensi}
                    onChange={(e) => setDimensi(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">HARGA JUAL UNIT (IDR)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={hargaJual}
                    onChange={(e) => setHargaJual(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">STOK AWAL (PCS)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stokAwal}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setStokAwal(val);
                      if (!editingId) setStok(val);
                    }}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">LIMIT MINIMAL BUFFER</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={minimalStok}
                    onChange={(e) => setMinimalStok(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">TGL MASUK DARI PRODUKSI</label>
                  <input
                    type="date"
                    value={tanggalMasukProduksi}
                    onChange={(e) => setTanggalMasukProduksi(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">TGL KELUAR BARANG (SJ)</label>
                  <input
                    type="date"
                    value={tanggalKeluarTerakhir}
                    onChange={(e) => setTanggalKeluarTerakhir(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">DESKRIPSI PRODUK</label>
                <textarea
                  rows={2}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Keterangan mengenai kekuatan, entry forklift, atau sertifikasi oven..."
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Pallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PRODUCTION SIMULATOR MODAL --- */}
      {showProdModal && (
        <div id="pallet-production-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Hammer className="h-5 w-5 text-red-600" />
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">Simulasi Produksi Pallet Kayu</h3>
              </div>
              <button onClick={() => setShowProdModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleExecuteProduction} className="p-5 space-y-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Produk Target</span>
                  <p className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150 mt-0.5">
                    {finishGoods.find(g => g.id === prodPalletId)?.nama}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Stok Saat Ini</span>
                  <p className="font-bold text-xs text-zinc-700 dark:text-zinc-300 mt-0.5">
                    {finishGoods.find(g => g.id === prodPalletId)?.stok} pcs
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">JUMLAH YANG AKAN DIPRODUKSI (PCS)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={prodQty}
                  onChange={(e) => {
                    setProdQty(Math.max(1, Number(e.target.value)));
                    setProdSuccess(null);
                    setProdError(null);
                  }}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-black focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">PREVIEW KEBUTUHAN BAHAN BAKU</label>
                <div className="bg-zinc-50/65 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-850 space-y-2.5">
                  {getMaterialCosts(prodPalletId).map((cost, i) => {
                    const totalNeeded = cost.amount * prodQty;
                    const currentStock = materials.find(m => m.id === cost.materialId)?.stok || 0;
                    const isSufficient = currentStock >= totalNeeded;

                    return (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-750 dark:text-zinc-300">{cost.nama}</span>
                          <span className="text-[10px] text-zinc-400 mt-0.5">
                            Kebutuhan: {cost.amount} {cost.satuan}/unit • Total: {totalNeeded} {cost.satuan}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                            isSufficient 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                              : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                          }`}>
                            Stok: {currentStock} {cost.satuan}
                          </span>
                          <span className={`block text-[10px] font-bold mt-1 ${isSufficient ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isSufficient ? 'Sufisien ✓' : 'Kurang ✗'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {prodSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 rounded-lg flex gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
                  <span>{prodSuccess}</span>
                </div>
              )}

              {prodError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 rounded-lg flex gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-red-600" />
                  <span>{prodError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProdModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
                {!prodSuccess && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Hammer className="h-3.5 w-3.5" />
                    Proses Manufaktur
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- STOCK REPORT PRINT MODAL (PDF / CETAK) --- */}
      {showPrintModal && (() => {
        const filteredReportGoods = finishGoods.filter(g => {
          if (!printStartDate && !printEndDate) return true;
          if (!g.terakhirDiperbarui) return true;
          const itemDate = g.terakhirDiperbarui.split('T')[0];
          let ok = true;
          if (printStartDate) ok = ok && itemDate >= printStartDate;
          if (printEndDate) ok = ok && itemDate <= printEndDate;
          return ok;
        });

        const totalTypes = filteredReportGoods.length;
        const totalPcsAwal = filteredReportGoods.reduce((sum, g) => sum + (g.stokAwal !== undefined ? g.stokAwal : g.stok), 0);
        const totalPcsIn = filteredReportGoods.reduce((sum, g) => sum + (g.stokMasukProduksi || 0), 0);
        const totalPcsOut = filteredReportGoods.reduce((sum, g) => sum + (g.stokKeluarPengiriman || 0), 0);
        const totalPcs = filteredReportGoods.reduce((sum, g) => sum + g.stok, 0);
        const totalValuation = filteredReportGoods.reduce((sum, g) => sum + (g.stok * g.hargaJual), 0);

        const formatIDR = (num: number) => {
          return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
        };

        const formatDateIndo = (dateStr: string) => {
          if (!dateStr) return '-';
          try {
            return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          } catch(e) {
            return dateStr;
          }
        };

        return (
          <div id="stock-report-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-zinc-950 w-full max-w-5xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 relative">
              <button 
                onClick={() => setShowPrintModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer print:hidden z-10"
                title="Tutup Modal"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden pr-12">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600 animate-pulse" />
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Laporan Rekapitulasi Stok & Opname Pallet (PDF)</h3>
                    <p className="text-[10px] text-zinc-400">Termasuk rincian Stok Awal, Masuk Produksi, Keluar Surat Jalan, dan Rekonsiliasi Opname</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => handleExportExcelStok(printStartDate, printEndDate)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Excel
                  </button>
                  <button
                    disabled={isDownloadingPdf}
                    onClick={async () => {
                      setIsDownloadingPdf(true);
                      await downloadElementAsPdf('finishgood-print-area', `Laporan_Stok_Opname_Pallet_${printStartDate || 'all'}_sd_${printEndDate || 'all'}`);
                      setIsDownloadingPdf(false);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF'}
                  </button>
                  <button
                    onClick={() => triggerPrintOrPdf('finishgood-print-area', `Laporan_Stok_Opname_Pallet_${printStartDate || 'all'}_sd_${printEndDate || 'all'}`)}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </button>
                </div>
              </div>

              {/* Printable sheet */}
              <div id="finishgood-print-area" className="p-8 md:p-12 bg-white text-black min-h-[800px] font-sans printable-sheet">
                {/* Logo Letterhead */}
                <div className="flex justify-between items-center border-b-4 border-zinc-800 pb-5 mb-8">
                  <div className="flex items-center gap-3">
                    <CompanyLogo className="h-12 w-12 object-contain" />
                    <div>
                      <h1 className="font-extrabold text-lg tracking-tight text-[#2E7D32]">CV. Mustika Kayu Nusantara</h1>
                      <p className="text-[10px] font-bold text-zinc-900">Supplier Kayu Olahan & Aneka Industri Pallet</p>
                      <p className="text-[9px] text-zinc-500 mt-0.5">Jl. Raya Mutiara Gading City, Kab. Bekasi • Hp. 0812-8147-8689</p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-emerald-800 text-xs uppercase tracking-wider">BERITA ACARA STOK OPNAME PALLET</p>
                    <p className="mt-1 text-zinc-750 font-semibold text-[10px]">Periode: {formatDateIndo(printStartDate)} - {formatDateIndo(printEndDate)}</p>
                    <p className="text-[9px] text-zinc-400">Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-base font-extrabold uppercase underline tracking-wide">
                    LAPORAN MUTASI, KELUAR MASUK & STOCK OPNAME BARANG JADI
                  </h2>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Gudang Penyimpanan Pallet Selesai CV. Mustika Kayu Nusantara
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="p-3 border border-zinc-200 bg-zinc-50/50 rounded-xl">
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">Total Varian</span>
                    <span className="text-sm font-extrabold text-zinc-900 mt-0.5 block">{totalTypes} Model</span>
                  </div>
                  <div className="p-3 border border-zinc-200 bg-zinc-50/50 rounded-xl">
                    <span className="text-[9px] font-bold text-emerald-700 block uppercase">Total Masuk (In)</span>
                    <span className="text-sm font-extrabold text-emerald-800 mt-0.5 block">+{totalPcsIn} pcs</span>
                  </div>
                  <div className="p-3 border border-zinc-200 bg-zinc-50/50 rounded-xl">
                    <span className="text-[9px] font-bold text-blue-700 block uppercase">Total Keluar (SJ)</span>
                    <span className="text-sm font-extrabold text-blue-800 mt-0.5 block">-{totalPcsOut} pcs</span>
                  </div>
                  <div className="p-3 border border-zinc-200 bg-zinc-50/50 rounded-xl">
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">Nilai Aset Fisik</span>
                    <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">{formatIDR(totalValuation)}</span>
                  </div>
                </div>

                <table className="w-full text-[10px] text-left border-collapse border border-zinc-200">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200 font-bold uppercase text-zinc-750">
                      <th className="p-2 border border-zinc-200">Kode</th>
                      <th className="p-2 border border-zinc-200">Nama & Dimensi</th>
                      <th className="p-2 border border-zinc-200">Tipe</th>
                      <th className="p-2 border border-zinc-200 text-right">Stok Awal</th>
                      <th className="p-2 border border-zinc-200 text-right">In (Prod)</th>
                      <th className="p-2 border border-zinc-200 text-right">Out (SJ)</th>
                      <th className="p-2 border border-zinc-200 text-right font-black">Stok Akhir</th>
                      <th className="p-2 border border-zinc-200 text-center">Tgl Masuk</th>
                      <th className="p-2 border border-zinc-200 text-center">Tgl Keluar</th>
                      <th className="p-2 border border-zinc-200 text-right">Fisik Opname</th>
                      <th className="p-2 border border-zinc-200 text-center">Selisih</th>
                      <th className="p-2 border border-zinc-200 text-right">Harga Jual</th>
                      <th className="p-2 border border-zinc-200 text-right">Total Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReportGoods.map((g) => {
                      const awal = g.stokAwal !== undefined ? g.stokAwal : g.stok;
                      const selisih = g.selisihOpname !== undefined ? g.selisihOpname : 0;
                      const fisik = g.stokFisikOpname !== undefined ? g.stokFisikOpname : g.stok;

                      return (
                        <tr key={g.id} className="hover:bg-zinc-50/20">
                          <td className="p-2 border border-zinc-200 font-mono text-zinc-900 font-bold">{g.kode}</td>
                          <td className="p-2 border border-zinc-200 font-extrabold text-zinc-800">
                            {g.nama}
                            <span className="block text-[8px] text-zinc-500 font-normal">{g.dimensi}</span>
                          </td>
                          <td className="p-2 border border-zinc-200">{g.tipe}</td>
                          <td className="p-2 border border-zinc-200 text-right">{awal}</td>
                          <td className="p-2 border border-zinc-200 text-right font-bold text-emerald-800">+{g.stokMasukProduksi || 0}</td>
                          <td className="p-2 border border-zinc-200 text-right font-bold text-blue-800">-{g.stokKeluarPengiriman || 0}</td>
                          <td className="p-2 border border-zinc-200 text-right font-black text-zinc-900">{g.stok} pcs</td>
                          <td className="p-2 border border-zinc-200 text-center">{g.tanggalMasukProduksi || '-'}</td>
                          <td className="p-2 border border-zinc-200 text-center">{g.tanggalKeluarTerakhir || '-'}</td>
                          <td className="p-2 border border-zinc-200 text-right font-bold">{fisik} pcs</td>
                          <td className="p-2 border border-zinc-200 text-center font-bold">
                            {selisih > 0 ? `+${selisih}` : selisih}
                          </td>
                          <td className="p-2 border border-zinc-200 text-right">{formatIDR(g.hargaJual)}</td>
                          <td className="p-2 border border-zinc-200 text-right font-bold text-emerald-800">
                            {formatIDR(g.stok * g.hargaJual)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-zinc-50 font-bold border-t-2 border-zinc-300">
                      <td colSpan={3} className="p-2 border border-zinc-200 text-right uppercase text-[9px]">Grand Total:</td>
                      <td className="p-2 border border-zinc-200 text-right">{totalPcsAwal}</td>
                      <td className="p-2 border border-zinc-200 text-right text-emerald-800">+{totalPcsIn}</td>
                      <td className="p-2 border border-zinc-200 text-right text-blue-800">-{totalPcsOut}</td>
                      <td className="p-2 border border-zinc-200 text-right font-black">{totalPcs} pcs</td>
                      <td colSpan={5} className="p-2 border border-zinc-200"></td>
                      <td className="p-2 border border-zinc-200 text-right text-emerald-800 font-black text-xs">
                        {formatIDR(totalValuation)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="flex justify-between items-center text-xs mt-12 pt-8 border-t border-dashed border-zinc-300">
                  <div className="text-center w-40">
                    <p>Petugas Gudang / Auditor,</p>
                    <p className="mt-14 font-extrabold underline">
                      {currentUser?.name || 'Staf Logistik'}
                    </p>
                    <p className="text-[10px] text-zinc-400">Pemeriksa Opname Fisik</p>
                  </div>
                  <div className="text-center w-40">
                    <p>Kepala Divisi Gudang,</p>
                    <p className="mt-14 font-extrabold underline">Supervisor Warehouse</p>
                    <p className="text-[10px] text-zinc-400">CV. Mustika Kayu Nusantara</p>
                  </div>
                  <div className="text-center w-40">
                    <p>Disetujui Oleh,</p>
                    <p className="mt-14 font-extrabold underline">Pimpinan Pabrik</p>
                    <p className="text-[10px] text-zinc-400">Direksi CV. MKN</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Data Tipe Pallet Kayu"
        message="Apakah Anda yakin ingin menghapus data tipe pallet ini dari katalog gudang?"
        itemName={deleteTarget ? `${deleteTarget.kode} - ${deleteTarget.nama} (Tipe: ${deleteTarget.tipe}, Stok: ${deleteTarget.stok} pcs)` : ''}
      />

    </div>
  );
};
