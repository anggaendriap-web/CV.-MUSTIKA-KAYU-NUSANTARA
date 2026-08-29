import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FinishGood } from '../types';
import { Plus, Search, Hammer, Pencil, Trash2, Box, Info, ArrowRight, CheckCircle, Printer, FileText, Download, X } from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';

export const FinishGoodView: React.FC = () => {
  const { 
    finishGoods, 
    materials, 
    addFinishGood, 
    updateFinishGood, 
    deleteFinishGood, 
    producePallets, 
    currentUser 
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('SEMUA');

  // Stock report PDF printing and period selection
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printStartDate, setPrintStartDate] = useState('2026-08-01');
  const [printEndDate, setPrintEndDate] = useState('2026-08-31');

  // General Form Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<FinishGood['tipe']>('Standard');
  const [dimensi, setDimensi] = useState('');
  const [stok, setStok] = useState(0);
  const [hargaJual, setHargaJual] = useState(0);
  const [minimalStok, setMinimalStok] = useState(0);
  const [deskripsi, setDeskripsi] = useState('');

  // Production Simulator Modal state
  const [showProdModal, setShowProdModal] = useState(false);
  const [prodPalletId, setProdPalletId] = useState('');
  const [prodQty, setProdQty] = useState(10);
  const [prodSuccess, setProdSuccess] = useState<string | null>(null);
  const [prodError, setProdError] = useState<string | null>(null);

  const palletTypes = ['SEMUA', 'Standard', 'Custom', 'Ekspor ISPM 15', 'Heavy Duty', 'Dua Arah'];

  // Check Permissions: Warehouse, Sales, Owner can view. Warehouse, Owner can edit/produce.
  const canModify = currentUser?.role === 'OWNER' || currentUser?.role === 'WAREHOUSE';

  // Filters logic
  const filteredGoods = finishGoods.filter(item => {
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.dimensi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'SEMUA' || item.tipe === selectedType;
    return matchesSearch && matchesType;
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setKode('');
    setNama('');
    setTipe('Standard');
    setDimensi('');
    setStok(0);
    setHargaJual(0);
    setMinimalStok(0);
    setDeskripsi('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (item: FinishGood) => {
    setEditingId(item.id);
    setKode(item.kode);
    setNama(item.nama);
    setTipe(item.tipe);
    setDimensi(item.dimensi);
    setStok(item.stok);
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
        stok,
        hargaJual,
        minimalStok,
        deskripsi
      });
    } else {
      addFinishGood({
        kode,
        nama,
        tipe,
        dimensi,
        stok,
        satuan: 'pcs',
        hargaJual,
        minimalStok,
        deskripsi
      });
    }
    setShowFormModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data tipe pallet ini dari gudang?')) {
      deleteFinishGood(id);
    }
  };

  // Setup Production Simulator Material Costs per Pallet Unit
  // We specify how many materials are needed to make ONE pallet of this type
  const getMaterialCosts = (goodId: string) => {
    // Return cost formula based on pallet ID or type
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
      setProdSuccess(`Berhasil memproduksi ${prodQty} unit pallet! Bahan baku telah dikurangi dan stok pallet jadi meningkat.`);
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
      ['ID Pallet', 'Kode', 'Nama Tipe Pallet', 'Kategori/Tipe', 'Ukuran/Dimensi', 'Stok', 'Satuan', 'Harga Jual', 'Minimal Stok', 'Pembaruan Terakhir'],
      (g) => [
        g.id,
        g.kode,
        g.nama,
        g.tipe,
        g.dimensi || '-',
        g.stok,
        g.satuan,
        g.hargaJual,
        g.minimalStok,
        g.terakhirDiperbarui ? g.terakhirDiperbarui.split('T')[0] : '-'
      ],
      `Laporan_Stok_Pallet_${start || 'all'}_sd_${end || 'all'}`
    );
  };

  return (
    <div id="finish-good-view" className="p-4 md:p-6 space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Gudang Penyimpanan Pallet (Finish Goods)</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Pantau jumlah pallet kayu standard, heavy duty, ekspor ISPM-15, dan custom tipe.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-excel-pallet-stok"
            onClick={() => handleExportExcelStok(printStartDate, printEndDate)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Download className="h-4.5 w-4.5" />
            Download Excel Stok
          </button>
          <button
            id="btn-cetak-pallet-stok"
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Printer className="h-4.5 w-4.5" />
            Cetak PDF Laporan Stok
          </button>
          {canModify && (
            <button
              id="btn-tambah-pallet"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <Plus className="h-4.5 w-4.5" />
              Tambah Tipe Pallet
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="search-pallet-input"
            type="text"
            placeholder="Cari kode, tipe, atau dimensi pallet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Pallet Types Filter */}
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

      </div>

      {/* Grid of Finished Pallets Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredGoods.map((item) => {
          const isLow = item.stok <= item.minimalStok;
          return (
            <div 
              key={item.id} 
              id={`card-pallet-${item.id}`}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Product Badge Header */}
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

              {/* Product Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 leading-snug">{item.nama}</h4>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1">Dimensi: {item.dimensi}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2.5 line-clamp-2 min-h-[32px]">{item.deskripsi || 'Tidak ada deskripsi.'}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Harga Jual / pcs</span>
                    <span className="text-sm font-black text-red-600 dark:text-red-400">Rp {item.hargaJual.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Stok Gudang</span>
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

              {/* Actions Footer */}
              <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-800/10 flex justify-between items-center">
                
                {/* Manufacturing trigger button */}
                {canModify ? (
                  <button
                    id={`btn-produce-${item.id}`}
                    onClick={() => handleOpenProductionModal(item)}
                    className="flex items-center gap-1 text-[11px] font-bold text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                  >
                    <Hammer className="h-3.5 w-3.5" />
                    Produksi Pallet
                  </button>
                ) : (
                  <span className="text-[10px] text-zinc-400 italic font-medium">Hanya Baca</span>
                )}

                {/* Edit & Delete */}
                {canModify && (
                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-edit-pallet-${item.id}`}
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-500 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
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

      {/* --- ADD / EDIT FINISHED PALLET FORM MODAL --- */}
      {showFormModal && (
        <div id="pallet-form-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                {editingId ? 'Edit Spesifikasi Pallet' : 'Tambah Tipe Pallet Baru'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer text-xl">&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
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
                    value={stok}
                    onChange={(e) => setStok(Number(e.target.value))}
                    disabled={!!editingId}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs disabled:opacity-50 focus:outline-none"
                    placeholder="Masukkan jumlah..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">LIMIT STOK MINIMAL</label>
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

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">DESKRIPSI PRODUK</label>
                <textarea
                  rows={3}
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
              
              {/* Product Target Display */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Produk Target</span>
                  <p className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150 mt-0.5">
                    {finishGoods.find(g => g.id === prodPalletId)?.nama}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Stok Gudang</span>
                  <p className="font-bold text-xs text-zinc-700 dark:text-zinc-300 mt-0.5">
                    {finishGoods.find(g => g.id === prodPalletId)?.stok} pcs
                  </p>
                </div>
              </div>

              {/* Quantity input */}
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

              {/* Material cost checklist preview */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">PREVIEW KEBUTUHAN BAHAN BAKU</label>
                
                <div className="bg-zinc-50/65 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-850 space-y-2.5">
                  {getMaterialCosts(prodPalletId).map((cost, i) => {
                    const totalNeeded = cost.amount * prodQty;
                    // Find actual material stock
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

              {/* Success / Error notification */}
              {prodSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 rounded-lg flex gap-2">
                  <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
                  <span>{prodSuccess}</span>
                </div>
              )}

              {prodError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 rounded-lg flex gap-2">
                  <Info className="h-4.5 w-4.5 shrink-0 text-red-600" />
                  <span>{prodError}</span>
                </div>
              )}

              {/* Action Buttons */}
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

      {/* --- STOCK REPORT PRINT MODAL --- */}
      {showPrintModal && (() => {
        // Filter goods by updated period if user inputs dates
        const filteredReportGoods = finishGoods.filter(g => {
          if (!printStartDate && !printEndDate) return true;
          if (!g.terakhirDiperbarui) return true; // Include if untracked to be safe
          const itemDate = g.terakhirDiperbarui.split('T')[0];
          let ok = true;
          if (printStartDate) ok = ok && itemDate >= printStartDate;
          if (printEndDate) ok = ok && itemDate <= printEndDate;
          return ok;
        });

        const totalTypes = filteredReportGoods.length;
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

        const handleTriggerPrint = () => {
          const originalTitle = document.title;
          document.title = `Laporan_Stok_Pallet_${printStartDate || 'all'}_sd_${printEndDate || 'all'}`;
          window.print();
          document.title = originalTitle;
        };

        return (
          <div id="stock-report-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 relative">
              
              {/* Floating Close Button X (Non-Printable) */}
              <button 
                onClick={() => setShowPrintModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer print:hidden z-10"
                title="Tutup Modal"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Controls bar (non-printed) */}
              <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden pr-12">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600 animate-pulse" />
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Laporan Stok Barang Jadi (PDF)</h3>
                    <p className="text-[10px] text-zinc-400">Pilih rentang tanggal terakhir diperbarui / diproduksi</p>
                  </div>
                </div>

                {/* Period filter inputs */}
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportExcelStok(printStartDate, printEndDate)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Unduh Excel
                  </button>
                  <button
                    onClick={handleTriggerPrint}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Cetak PDF / Print
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Apakah Anda yakin ingin membatalkan cetak laporan stok ini?")) {
                        setShowPrintModal(false);
                      }
                    }}
                    className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-200 rounded-lg text-xs font-bold cursor-pointer transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              {/* Printable sheet */}
              <div id="print-area" className="p-8 md:p-12 bg-white text-black min-h-[800px] font-sans">
                {/* Logo Letterhead */}
                <div className="flex justify-between items-center border-b-4 border-zinc-800 pb-5 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-zinc-800 text-white font-black rounded-lg flex items-center justify-center text-lg">
                      MKN
                    </div>
                    <div>
                      <h1 className="font-extrabold text-lg tracking-tight text-[#2E7D32]">CV. Mustika Kayu Nusantara</h1>
                      <p className="text-[10px] font-bold text-zinc-900">Supplier Kayu Olahan & Aneka Industri Pallet</p>
                      <p className="text-[9px] text-zinc-500 mt-0.5">Jl. Raya Mutiara Gading City, Kab. Bekasi • Hp. 0812-8147-8689</p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-emerald-800 text-xs uppercase tracking-wider">LAPORAN MUTASI & STOK PALLET</p>
                    <p className="mt-1 text-zinc-750 font-semibold text-[10px]">Periode: {formatDateIndo(printStartDate)} - {formatDateIndo(printEndDate)}</p>
                    <p className="text-[9px] text-zinc-400">Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
                  </div>
                </div>

                {/* Report Header Title */}
                <div className="text-center mb-6">
                  <h2 className="text-base font-extrabold uppercase underline tracking-wide">LAPORAN REKAPITULASI STOK BARANG JADI (FINISHED PALLETS)</h2>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Sistem ERP Gudang Penyimpanan Pallet CV. MKN</p>
                </div>

                {/* Mini Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-3 border border-zinc-200 bg-zinc-50/50 rounded-xl">
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">Varian Tipe Pallet</span>
                    <span className="text-base font-extrabold text-zinc-900 mt-0.5 block">{totalTypes} Model</span>
                  </div>
                  <div className="p-3 border border-zinc-200 bg-zinc-50/50 rounded-xl">
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">Total Volume Fisik</span>
                    <span className="text-base font-extrabold text-zinc-900 mt-0.5 block">{totalPcs} Pcs</span>
                  </div>
                  <div className="p-3 border border-zinc-200 bg-zinc-50/50 rounded-xl">
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">Estimasi Nilai Aset</span>
                    <span className="text-base font-extrabold text-emerald-700 mt-0.5 block">{formatIDR(totalValuation)}</span>
                  </div>
                </div>

                {/* Main Table */}
                <table className="w-full text-[11px] text-left border-collapse border border-zinc-200">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200 font-bold uppercase text-zinc-750">
                      <th className="p-2 border border-zinc-200">Kode</th>
                      <th className="p-2 border border-zinc-200">Nama Tipe Pallet</th>
                      <th className="p-2 border border-zinc-200">Kategori / Tipe</th>
                      <th className="p-2 border border-zinc-200">Ukuran / Dimensi</th>
                      <th className="p-2 border border-zinc-200 text-right">Stok Fisik</th>
                      <th className="p-2 border border-zinc-200 text-right">Harga Jual Satuan</th>
                      <th className="p-2 border border-zinc-200 text-right">Total Nilai Aset</th>
                      <th className="p-2 border border-zinc-200">Pembaruan Terakhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReportGoods.map((g) => (
                      <tr key={g.id} className="hover:bg-zinc-50/20">
                        <td className="p-2 border border-zinc-200 font-mono text-zinc-900 font-bold">{g.kode}</td>
                        <td className="p-2 border border-zinc-200 font-extrabold text-zinc-800">{g.nama}</td>
                        <td className="p-2 border border-zinc-200">{g.tipe}</td>
                        <td className="p-2 border border-zinc-200 text-zinc-600">{g.dimensi || '-'}</td>
                        <td className="p-2 border border-zinc-200 text-right font-extrabold text-zinc-900">{g.stok} pcs</td>
                        <td className="p-2 border border-zinc-200 text-right">{formatIDR(g.hargaJual)}</td>
                        <td className="p-2 border border-zinc-200 text-right font-bold text-emerald-800">{formatIDR(g.stok * g.hargaJual)}</td>
                        <td className="p-2 border border-zinc-200 text-zinc-500 text-[10px]">
                          {g.terakhirDiperbarui ? formatDateIndo(g.terakhirDiperbarui.split('T')[0]) : '-'}
                        </td>
                      </tr>
                    ))}
                    {filteredReportGoods.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-zinc-400 font-semibold bg-zinc-50">
                          Tidak ada data pallet yang diperbarui pada periode ini.
                        </td>
                      </tr>
                    )}
                    <tr className="bg-zinc-50 font-bold border-t-2 border-zinc-300">
                      <td colSpan={4} className="p-2 border border-zinc-200 text-right uppercase text-[9px]">Grand Total Aset Pallet:</td>
                      <td className="p-2 border border-zinc-200 text-right text-zinc-900 font-black">{totalPcs} pcs</td>
                      <td className="p-2 border border-zinc-200"></td>
                      <td className="p-2 border border-zinc-200 text-right text-emerald-800 text-xs font-black">{formatIDR(totalValuation)}</td>
                      <td className="p-2 border border-zinc-200"></td>
                    </tr>
                  </tbody>
                </table>

                {/* Signature verification block */}
                <div className="flex justify-between items-center text-xs mt-12 pt-8 border-t border-dashed border-zinc-300">
                  <div className="text-center w-40">
                    <p>Petugas Gudang,</p>
                    <p className="mt-14 font-extrabold underline">
                      {currentUser?.name || 'Staf Logistik'}
                    </p>
                    <p className="text-[10px] text-zinc-400">Divisi Logistik</p>
                  </div>
                  <div className="text-center w-40">
                    <p>Disetujui Oleh,</p>
                    <p className="mt-14 font-extrabold underline">Pimpinan Pabrik</p>
                    <p className="text-[10px] text-zinc-400">CV. Mustika Kayu Nusantara</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
