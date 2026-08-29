import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Material } from '../types';
import { Plus, Search, Filter, Pencil, Trash2, ShieldAlert, PlusCircle, MinusCircle, RefreshCcw, Printer, Download, X, FileText } from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';
import { exportToExcel } from '../utils/exportExcel';
import { downloadElementAsPdf, triggerPrintOrPdf, showPdfToast } from '../utils/exportPdf';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export const MaterialView: React.FC = () => {
  const { materials, addMaterial, updateMaterial, deleteMaterial, adjustMaterialStock, currentUser } = useApp();
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('SEMUA');
  
  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  
  // Form fields
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState<Material['kategori']>('Kayu Log');
  const [stok, setStok] = useState(0);
  const [satuan, setSatuan] = useState<Material['satuan']>('m3');
  const [hargaBeli, setHargaBeli] = useState(0);
  const [minimalStok, setMinimalStok] = useState(0);
  const [supplier, setSupplier] = useState('');

  // Stock Adjustment state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(1);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');

  const categories = ['SEMUA', 'Kayu Log', 'Papan', 'Balok', 'Paku', 'Cat/Pelapis', 'Lainnya'];

  // Check Role Permissions: Finance & Warehouse & Owner can read. Warehouse, Owner can edit/create.
  const canModify = currentUser?.role === 'OWNER' || currentUser?.role === 'WAREHOUSE';

  // Filter & Search Logic
  const filteredMaterials = materials.filter(item => {
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedKategori === 'SEMUA' || item.kategori === selectedKategori;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setKode('');
    setNama('');
    setKategori('Kayu Log');
    setStok(0);
    setSatuan('m3');
    setHargaBeli(0);
    setMinimalStok(0);
    setSupplier('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (item: Material) => {
    setEditingId(item.id);
    setKode(item.kode);
    setNama(item.nama);
    setKategori(item.kategori);
    setStok(item.stok);
    setSatuan(item.satuan);
    setHargaBeli(item.hargaBeli);
    setMinimalStok(item.minimalStok);
    setSupplier(item.supplier);
    setShowFormModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMaterial(editingId, {
        kode,
        nama,
        kategori,
        stok,
        satuan,
        hargaBeli,
        minimalStok,
        supplier
      });
    } else {
      addMaterial({
        kode,
        nama,
        kategori,
        stok,
        satuan,
        hargaBeli,
        minimalStok,
        supplier
      });
    }
    setShowFormModal(false);
  };

  const handleOpenAdjustModal = (item: Material) => {
    setAdjustingId(item.id);
    setAdjustAmount(1);
    setAdjustType('IN');
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustingId) {
      const amount = adjustType === 'IN' ? adjustAmount : -adjustAmount;
      adjustMaterialStock(adjustingId, amount);
    }
    setShowAdjustModal(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMaterial(deleteTarget.id);
      showPdfToast(`Data material "${deleteTarget.nama}" berhasil dihapus.`);
      setDeleteTarget(null);
    }
  };

  const handleExportExcelMaterials = () => {
    exportToExcel<Material>(
      materials,
      ['ID Material', 'Kode', 'Nama Material', 'Kategori', 'Stok', 'Satuan', 'Harga Beli (Rp)', 'Minimal Stok', 'Supplier'],
      (m) => [
        m.id,
        m.kode,
        m.nama,
        m.kategori,
        m.stok,
        m.satuan,
        m.hargaBeli,
        m.minimalStok,
        m.supplier
      ],
      `Database_Stok_Bahan_Baku`
    );
  };

  return (
    <div id="material-view" className="p-4 md:p-6 space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Daftar Bahan Baku & Logistik</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Kelola kuantitas kayu log, balok, papan, paku koil, dan pengawet pallet.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-excel-material"
            onClick={handleExportExcelMaterials}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Download className="h-4.5 w-4.5" />
            Download Excel Stok
          </button>
          <button
            id="btn-print-material-pdf"
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Printer className="h-4.5 w-4.5" />
            Cetak PDF Stok
          </button>
          {canModify && (
            <button
              id="btn-tambah-material"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <Plus className="h-4.5 w-4.5" />
              Tambah Bahan Baku
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
            id="search-material-input"
            type="text"
            placeholder="Cari kode, nama material, atau supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Categories Tab Selectors */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0 mr-1 hidden sm:inline" />
          {categories.map((cat) => (
            <button
              key={cat}
              id={`cat-filter-${cat}`}
              onClick={() => setSelectedKategori(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                selectedKategori === cat
                  ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-750'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Materials Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-zinc-200/80 dark:border-zinc-800/80">
                <th className="p-4">Kode</th>
                <th className="p-4">Nama Bahan</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-center">Stok Saat Ini</th>
                <th className="p-4 text-right">Harga Beli</th>
                <th className="p-4">Supplier Utama</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredMaterials.map((item) => {
                const isCriticalStock = item.stok <= item.minimalStok;
                return (
                  <tr 
                    key={item.id} 
                    id={`row-material-${item.id}`}
                    className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors ${isCriticalStock ? 'bg-amber-50/20 dark:bg-amber-950/5' : ''}`}
                  >
                    <td className="p-4 font-mono font-bold text-zinc-500 dark:text-zinc-400">{item.kode}</td>
                    <td className="p-4">
                      <p className="font-extrabold text-zinc-800 dark:text-zinc-150">{item.nama}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Minimal Stok: {item.minimalStok} {item.satuan}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`px-2.5 py-1 text-xs font-black rounded ${
                          isCriticalStock 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/65 dark:text-amber-300' 
                            : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                        }`}>
                          {item.stok} {item.satuan}
                        </span>
                        {isCriticalStock && (
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-1.5 flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            Butuh Reorder
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-zinc-800 dark:text-zinc-200">
                      Rp {item.hargaBeli.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400 font-medium">{item.supplier}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Quick Stock Adjust Button */}
                        {canModify && (
                          <button
                            onClick={() => handleOpenAdjustModal(item)}
                            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                            title="Penyesuaian Stok"
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </button>
                        )}

                        {/* Edit Button */}
                        {canModify && (
                          <button
                            id={`btn-edit-material-${item.id}`}
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                          title="Hapus Material"
                        >
                          <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                        </button>

                        {!canModify && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">Hanya Baca</span>
                        )}

                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-400 dark:text-zinc-500">
                    Tidak ada material bahan baku yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD / EDIT MATERIAL FORM MODAL --- */}
      {showFormModal && (
        <div id="material-form-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                {editingId ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
              </h3>
              <button 
                onClick={() => setShowFormModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">KODE MATERIAL</label>
                  <input
                    type="text"
                    required
                    value={kode}
                    onChange={(e) => setKode(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">KATEGORI</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as Material['kategori'])}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {categories.filter(c => c !== 'SEMUA').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">NAMA BAHAN BAKU</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Kayu Papan Mahoni 2x10x120"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">JUMLAH STOK</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stok}
                    onChange={(e) => setStok(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">SATUAN</label>
                  <select
                    value={satuan}
                    onChange={(e) => setSatuan(e.target.value as Material['satuan'])}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="m3">m3</option>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">MINIMAL STOK</label>
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
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">HARGA BELI (IDR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={hargaBeli}
                    onChange={(e) => setHargaBeli(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">SUPPLIER UTAMA</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Perhutani Kediri"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Bahan Baku'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QUICK STOCK ADJUSTMENT MODAL --- */}
      {showAdjustModal && (
        <div id="material-adjust-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">Penyesuaian Stok Cepat</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Lakukan penyesuaian cepat terhadap stok material terpilih tanpa mengubah data administrasi lainnya.
                </p>
              </div>

              {/* Tipe Penyesuaian */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Tipe Penyesuaian</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('IN')}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                      adjustType === 'IN' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600'
                    }`}
                  >
                    Barang Masuk (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('OUT')}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                      adjustType === 'OUT' 
                        ? 'border-red-600 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' 
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600'
                    }`}
                  >
                    Penyusutan / Keluar (-)
                  </button>
                </div>
              </div>

              {/* Nominal Penyesuaian */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Jumlah Penyesuaian</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(1, Number(e.target.value)))}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-650 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Terapkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PRINTABLE MATERIALS STOCK REPORT MODAL --- */}
      {showPrintModal && (
        <div id="material-print-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
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
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Laporan Stok Bahan Baku</h3>
                  <span className="inline-block bg-yellow-100 text-yellow-850 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">REVIEW SEBELUM CETAK</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
                <button
                  onClick={handleExportExcelMaterials}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Excel
                </button>
                <button
                  disabled={isDownloadingPdf}
                  onClick={async () => {
                    setIsDownloadingPdf(true);
                    await downloadElementAsPdf('material-print-area', `Laporan_Stok_Bahan_Baku_${new Date().toISOString().slice(0, 10)}`);
                    setIsDownloadingPdf(false);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF'}
                </button>
                <button
                  onClick={() => triggerPrintOrPdf('material-print-area', `Laporan_Stok_Bahan_Baku_${new Date().toISOString().slice(0, 10)}`)}
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
            <div id="material-print-area" className="p-8 md:p-12 bg-white text-black font-sans min-h-[600px] printable-sheet">
              
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
                  <h2 className="text-sm font-extrabold text-zinc-900 uppercase">LAPORAN STOK BAHAN BAKU</h2>
                  <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase">
                    Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Info summary table or warning */}
                <div className="p-3 border border-red-100 rounded-lg bg-red-50/25 text-[11px] text-red-800 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Laporan stok ini menyajikan kondisi logistik terkini secara real-time untuk kebutuhan audit internal dan penyesuaian produksi.</span>
                </div>

                {/* Table */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-200 font-extrabold text-zinc-700">
                        <th className="p-3">Kode</th>
                        <th className="p-3">Nama Bahan Baku</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3 text-right">Stok Aktual</th>
                        <th className="p-3 text-right">Harga Beli Rata-Rata</th>
                        <th className="p-3">Supplier Utama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150">
                      {materials.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-zinc-400 font-medium">
                            Tidak ada data material terdaftar.
                          </td>
                        </tr>
                      ) : (
                        materials.map(m => (
                          <tr key={m.id} className="hover:bg-zinc-50/50">
                            <td className="p-3 font-mono font-bold text-zinc-650">{m.kode}</td>
                            <td className="p-3 font-semibold text-zinc-900">{m.nama}</td>
                            <td className="p-3 text-zinc-600">{m.kategori}</td>
                            <td className="p-3 text-right font-mono font-black">
                              <span className={m.stok <= m.minimalStok ? 'text-red-600 font-black' : 'text-zinc-800'}>
                                {m.stok.toLocaleString('id-ID')} {m.satuan}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-zinc-650">
                              Rp {m.hargaBeli.toLocaleString('id-ID')}
                            </td>
                            <td className="p-3 text-zinc-500 font-medium">{m.supplier}</td>
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
                    <p className="font-bold underline">{currentUser?.name || 'Staf Gudang'}</p>
                    <p className="text-[10px] text-zinc-400">Logistik & Kepala Gudang</p>
                  </div>
                  <div className="w-48">
                    <p>Mengetahui / Menyetujui,</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline">Direktur Utama</p>
                    <p className="text-[10px] text-zinc-400">CV. Mustika Kayu</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Sticky Bottom Action Bar (Non-Printable) */}
            <div className="sticky bottom-0 z-20 bg-zinc-50 dark:bg-zinc-900 px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 print:hidden shadow-lg">
              <div className="text-xs text-zinc-500 font-medium hidden sm:block">
                Laporan Stok Bahan Baku: <strong className="text-zinc-800 dark:text-zinc-200">{filteredMaterials.length} Jenis Kayu</strong>
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
                  onClick={handleExportExcelMaterials}
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
                    await downloadElementAsPdf('material-print-area', `Laporan_Stok_Bahan_Baku_${new Date().toISOString().slice(0, 10)}`);
                    setIsDownloadingPdf(false);
                  }}
                  className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF (.pdf)'}
                </button>
                <button
                  type="button"
                  onClick={() => triggerPrintOrPdf('material-print-area', `Laporan_Stok_Bahan_Baku_${new Date().toISOString().slice(0, 10)}`)}
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
        title="Hapus Data Material Bahan Baku"
        message="Apakah Anda yakin ingin menghapus data material ini dari sistem inventaris pabrik?"
        itemName={deleteTarget ? `${deleteTarget.kode} - ${deleteTarget.nama} (Stok: ${deleteTarget.stok} ${deleteTarget.satuan})` : ''}
      />

    </div>
  );
};
