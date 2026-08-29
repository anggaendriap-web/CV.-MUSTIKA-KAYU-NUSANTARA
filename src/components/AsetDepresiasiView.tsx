import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AsetTetap } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { triggerPrintOrPdf } from '../utils/exportPdf';
import { 
  Boxes, 
  Printer, 
  Download, 
  Search, 
  Plus, 
  Calendar, 
  Trash2, 
  X,
  Layers,
  Wrench,
  Truck,
  Building
} from 'lucide-react';

export const AsetDepresiasiView: React.FC = () => {
  const { asetList, addAset, deleteAset, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [kondisiFilter, setKondisiFilter] = useState('Semua');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AsetTetap | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    namaAset: '',
    kategori: 'Mesin & Peralatan Pabrik' as AsetTetap['kategori'],
    tanggalPerolehan: new Date().toISOString().split('T')[0],
    hargaPerolehan: 0,
    masaManfaatTahun: 5,
    nilaiResidu: 0,
    lokasi: 'Pabrik Utama Cikarang',
    kondisi: 'Baik' as 'Baik' | 'Perlu Perawatan' | 'Rusak'
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return asetList.filter(asset => {
      const matchesSearch = 
        asset.namaAset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.kodeAset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.lokasi.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesKategori = kategoriFilter === 'Semua' || asset.kategori === kategoriFilter;
      const matchesKondisi = kondisiFilter === 'Semua' || asset.kondisi === kondisiFilter;

      return matchesSearch && matchesKategori && matchesKondisi;
    });
  }, [asetList, searchTerm, kategoriFilter, kondisiFilter]);

  // Calculations
  const totalPerolehan = useMemo(() => asetList.reduce((a, b) => a + b.hargaPerolehan, 0), [asetList]);
  const totalAkumulasi = useMemo(() => asetList.reduce((a, b) => a + b.akumulasiPenyusutan, 0), [asetList]);
  const totalNilaiBuku = totalPerolehan - totalAkumulasi;
  const totalDepresiasiBulanan = useMemo(() => asetList.reduce((a, b) => a + b.penyusutanPerBulan, 0), [asetList]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaAset || formData.hargaPerolehan <= 0 || formData.masaManfaatTahun <= 0) {
      alert('Mohon lengkapi nama aset, harga perolehan, dan masa manfaat.');
      return;
    }

    // Straight-line formula: (Cost - Salvage) / (Years * 12)
    const penyusutanPerBulan = Math.round((formData.hargaPerolehan - formData.nilaiResidu) / (formData.masaManfaatTahun * 12));
    
    // Compute current accumulated depreciation
    const acquiDate = new Date(formData.tanggalPerolehan);
    const today = new Date();
    const monthsPassed = Math.max(0, (today.getFullYear() - acquiDate.getFullYear()) * 12 + (today.getMonth() - acquiDate.getMonth()));
    const akumulasiPenyusutan = Math.min(formData.hargaPerolehan - formData.nilaiResidu, monthsPassed * penyusutanPerBulan);
    const nilaiBukuSaatIni = formData.hargaPerolehan - akumulasiPenyusutan;

    addAset({
      ...formData,
      kodeAset: `AST-${Math.floor(100 + Math.random() * 900)}`,
      metodePenyusutan: 'Garis Lurus (Straight Line)',
      penyusutanPerBulan,
      akumulasiPenyusutan,
      nilaiBukuSaatIni
    });

    setShowAddModal(false);
    setFormData({
      namaAset: '',
      kategori: 'Mesin & Peralatan Pabrik',
      tanggalPerolehan: new Date().toISOString().split('T')[0],
      hargaPerolehan: 0,
      masaManfaatTahun: 5,
      nilaiResidu: 0,
      lokasi: 'Pabrik Utama Cikarang',
      kondisi: 'Baik'
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 dark:bg-orange-950/50 rounded-xl text-orange-700 dark:text-orange-400">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Aset Tetap & Jadwal Depresiasi</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Inventaris mesin pemotong, chamber oven ISPM 15, armada truk, dan jadwal penyusutan nilai</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Aset Tetap</span>
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Jadwal Depresiasi PDF</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Total Nilai Perolehan</span>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">{formatRupiah(totalPerolehan)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">{asetList.length} Item aset terdaftar</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1">Akumulasi Penyusutan</span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">{formatRupiah(totalAkumulasi)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Total depresiasi terhitung</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Nilai Buku Bersih (NBV)</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(totalNilaiBuku)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Nilai tercatat di Neraca</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">Depresiasi Bulanan</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatRupiah(totalDepresiasiBulanan)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Beban bulanan di Laba Rugi</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari Nama Aset, Kode, Lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Kategori Aset</option>
            <option value="Mesin & Peralatan Pabrik">Mesin & Peralatan Pabrik</option>
            <option value="Fasilitas Oven ISPM 15">Fasilitas Oven ISPM 15</option>
            <option value="Kendaraan Operasional">Kendaraan Operasional</option>
            <option value="Bangunan Pabrik & Gudang">Bangunan Pabrik & Gudang</option>
          </select>

          <select
            value={kondisiFilter}
            onChange={(e) => setKondisiFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Kondisi Fisik</option>
            <option value="Baik">Kondisi Baik (Beroperasi)</option>
            <option value="Perlu Perawatan">Perlu Perawatan</option>
            <option value="Rusak">Rusak / Tidak Aktif</option>
          </select>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-bold text-sm text-zinc-900 dark:text-white">Daftar Aktiva Tetap Pabrik ({filteredAssets.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-3.5">Kode & Nama Aset</th>
                <th className="p-3.5">Kategori & Lokasi</th>
                <th className="p-3.5">Tgl Perolehan</th>
                <th className="p-3.5 text-right">Harga Perolehan</th>
                <th className="p-3.5 text-center">Manfaat</th>
                <th className="p-3.5 text-right">Penyusutan / Bln</th>
                <th className="p-3.5 text-right">Akumulasi Depr</th>
                <th className="p-3.5 text-right">Nilai Buku Saat Ini</th>
                <th className="p-3.5 text-center">Kondisi</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-zinc-400">
                    Tidak ada aset tetap yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-bold text-zinc-900 dark:text-white block">{asset.namaAset}</span>
                      <span className="text-[11px] text-red-700 dark:text-red-400">{asset.kodeAset}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-zinc-800 dark:text-zinc-200 block font-medium">{asset.kategori}</span>
                      <span className="text-[10px] text-zinc-400">{asset.lokasi}</span>
                    </td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-300">{asset.tanggalPerolehan}</td>
                    <td className="p-3.5 text-right font-bold text-zinc-800 dark:text-zinc-200">{formatRupiah(asset.hargaPerolehan)}</td>
                    <td className="p-3.5 text-center font-semibold text-zinc-600 dark:text-zinc-400">{asset.masaManfaatTahun} Thn</td>
                    <td className="p-3.5 text-right font-medium text-blue-600 dark:text-blue-400">{formatRupiah(asset.penyusutanPerBulan)}</td>
                    <td className="p-3.5 text-right font-medium text-red-600 dark:text-red-400">{formatRupiah(asset.akumulasiPenyusutan)}</td>
                    <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(asset.nilaiBukuSaatIni)}</td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        asset.kondisi === 'Baik'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {asset.kondisi}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setItemToDelete(asset)}
                        className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Aset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">Tambah Aset Tetap Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Nama Aset / Mesin *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mesin Double Saw Blade Otomatis"
                  value={formData.namaAset}
                  onChange={(e) => setFormData({ ...formData, namaAset: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Kategori Aset</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                  >
                    <option value="Mesin & Peralatan Pabrik">Mesin & Peralatan Pabrik</option>
                    <option value="Fasilitas Oven ISPM 15">Fasilitas Oven ISPM 15</option>
                    <option value="Kendaraan Operasional">Kendaraan Operasional</option>
                    <option value="Bangunan Pabrik & Gudang">Bangunan Pabrik & Gudang</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Tanggal Perolehan</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalPerolehan}
                    onChange={(e) => setFormData({ ...formData, tanggalPerolehan: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Harga Perolehan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1000000"
                    value={formData.hargaPerolehan || ''}
                    onChange={(e) => setFormData({ ...formData, hargaPerolehan: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Masa Manfaat (Tahun) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="30"
                    value={formData.masaManfaatTahun}
                    onChange={(e) => setFormData({ ...formData, masaManfaatTahun: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Nilai Residu / Sisa (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.nilaiResidu || ''}
                    onChange={(e) => setFormData({ ...formData, nilaiResidu: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Kondisi Fisik</label>
                  <select
                    value={formData.kondisi}
                    onChange={(e) => setFormData({ ...formData, kondisi: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                  >
                    <option value="Baik">Baik (Beroperasi Normal)</option>
                    <option value="Perlu Perawatan">Perlu Perawatan</option>
                    <option value="Rusak">Rusak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Lokasi Aset</label>
                <input
                  type="text"
                  placeholder="Contoh: Line Produksi 1 - Pabrik Cikarang"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
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
                  className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Print PDF Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-red-400" />
                <span className="font-bold text-sm">Pratinjau Jadwal Penyusutan & Daftar Aset Tetap</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintOrPdf('asset-report-sheet', `Laporan_Aset_Depresiasi_${new Date().toISOString().split('T')[0]}`)}
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
                id="asset-report-sheet"
                className="bg-white text-zinc-900 p-8 rounded-lg shadow-md max-w-3xl w-full text-xs font-sans border border-zinc-200"
              >
                <div className="flex items-start justify-between border-b-2 border-red-900 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo size="md" className="h-10 w-10" />
                    <div>
                      <h2 className="text-lg font-black text-red-900">PT MUSTIKA KAYU NUSANTARA</h2>
                      <p className="text-[10px] text-zinc-600">Daftar Aktiva Tetap & Jadwal Penyusutan Depresiasi Garis Lurus</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-600">
                    <p><b>Tanggal Cetak:</b> {new Date().toLocaleDateString('id-ID')}</p>
                    <p><b>Pencatat:</b> {currentUser?.name || 'Finance Dept'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-center text-[10px]">
                  <div>
                    <span className="text-zinc-500 block font-bold">Total Nilai Perolehan:</span>
                    <span className="font-extrabold text-zinc-900 text-sm">{formatRupiah(totalPerolehan)}</span>
                  </div>
                  <div>
                    <span className="text-red-700 block font-bold">Akumulasi Penyusutan:</span>
                    <span className="font-extrabold text-red-700 text-sm">{formatRupiah(totalAkumulasi)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block font-bold">Nilai Buku Bersih (NBV):</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{formatRupiah(totalNilaiBuku)}</span>
                  </div>
                </div>

                <table className="w-full border-collapse text-[10px] mb-6">
                  <thead>
                    <tr className="bg-red-900 text-white font-bold">
                      <th className="p-2 text-left">Kode & Aset</th>
                      <th className="p-2 text-left">Kategori</th>
                      <th className="p-2 text-left">Tgl Perolehan</th>
                      <th className="p-2 text-right">Harga Perolehan</th>
                      <th className="p-2 text-right">Depresiasi / Bln</th>
                      <th className="p-2 text-right">Akumulasi</th>
                      <th className="p-2 text-right">Nilai Buku</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 border-b border-zinc-200">
                    {filteredAssets.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                        <td className="p-2 font-bold">{item.namaAset}<br/><span className="text-[9px] text-zinc-400 font-normal">{item.kodeAset}</span></td>
                        <td className="p-2">{item.kategori}</td>
                        <td className="p-2">{item.tanggalPerolehan}</td>
                        <td className="p-2 text-right font-semibold">{formatRupiah(item.hargaPerolehan)}</td>
                        <td className="p-2 text-right font-medium text-blue-700">{formatRupiah(item.penyusutanPerBulan)}</td>
                        <td className="p-2 text-right font-medium text-red-700">{formatRupiah(item.akumulasiPenyusutan)}</td>
                        <td className="p-2 text-right font-bold text-emerald-700">{formatRupiah(item.nilaiBukuSaatIni)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-bold">
                      <td colSpan={3} className="p-2 text-right">TOTAL KESELURUHAN ASET:</td>
                      <td className="p-2 text-right font-black">{formatRupiah(totalPerolehan)}</td>
                      <td className="p-2 text-right text-blue-700 font-black">{formatRupiah(totalDepresiasiBulanan)}</td>
                      <td className="p-2 text-right text-red-700 font-black">{formatRupiah(totalAkumulasi)}</td>
                      <td className="p-2 text-right text-emerald-700 font-black">{formatRupiah(totalNilaiBuku)}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="flex justify-end pt-4">
                  <div className="text-center w-48">
                    <span className="text-[10px] text-zinc-500 block mb-12">Disetujui Oleh,</span>
                    <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                      Asset & Finance Controller
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
        title="Hapus Aset Tetap"
        message={`Apakah Anda yakin ingin menghapus data aset "${itemToDelete?.kodeAset} - ${itemToDelete?.namaAset}"? Data depresiasi terkait akan dihapus.`}
        itemName={itemToDelete ? `${itemToDelete.kodeAset} - ${itemToDelete.namaAset} (Harga: ${formatRupiah(itemToDelete.hargaPerolehan)})` : ''}
        onConfirm={() => {
          if (itemToDelete) {
            deleteAset(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
};
