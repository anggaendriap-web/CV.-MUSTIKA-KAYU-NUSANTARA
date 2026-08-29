import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { KasKecilItem } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { triggerPrintOrPdf } from '../utils/exportPdf';
import { 
  Coins, 
  Printer, 
  Download, 
  Search, 
  Calendar, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  Trash2, 
  X,
  Tag
} from 'lucide-react';

export const KasKecilView: React.FC = () => {
  const { kasKecilList, addKasKecil, deleteKasKecil, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [jenisFilter, setJenisFilter] = useState<'Semua' | 'MASUK' | 'KELUAR'>('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<KasKecilItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Konsumsi & Dapur Pabrik' as KasKecilItem['kategori'],
    keterangan: '',
    jenis: 'KELUAR' as 'MASUK' | 'KELUAR',
    nominal: 0,
    penerima: ''
  });

  // Default dates
  React.useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return kasKecilList.filter(item => {
      const matchesSearch = 
        item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kodeTransaksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.penerima?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

      const matchesKategori = kategoriFilter === 'Semua' || item.kategori === kategoriFilter;
      const matchesJenis = jenisFilter === 'Semua' || item.jenis === jenisFilter;

      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && item.tanggal >= startDate;
      if (endDate) matchesDate = matchesDate && item.tanggal <= endDate;

      return matchesSearch && matchesKategori && matchesJenis && matchesDate;
    });
  }, [kasKecilList, searchTerm, kategoriFilter, jenisFilter, startDate, endDate]);

  // Calculations
  const totalMasuk = useMemo(() => {
    return kasKecilList.filter(i => i.jenis === 'MASUK').reduce((a, b) => a + b.nominal, 0);
  }, [kasKecilList]);

  const totalKeluar = useMemo(() => {
    return kasKecilList.filter(i => i.jenis === 'KELUAR').reduce((a, b) => a + b.nominal, 0);
  }, [kasKecilList]);

  const saldoKasKecil = totalMasuk - totalKeluar;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.keterangan || formData.nominal <= 0) {
      alert('Mohon isi keterangan dan nominal valid.');
      return;
    }

    addKasKecil({
      ...formData,
      kodeTransaksi: `KK-${Math.floor(1000 + Math.random() * 9000)}`
    });

    setShowAddModal(false);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      kategori: 'Konsumsi & Dapur Pabrik',
      keterangan: '',
      jenis: 'KELUAR',
      nominal: 0,
      penerima: ''
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-700 dark:text-emerald-400">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Kas Kecil (Petty Cash)</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Pencatatan pengeluaran harian operasional pabrik, dapur, BBM, dan reimburse kas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Kas Kecil</span>
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Rekap Kas Kecil PDF</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Saldo Kas Kecil Tersedia</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(saldoKasKecil)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Brankas kasir operasional</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">Total Pengisian Plafon (Masuk)</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatRupiah(totalMasuk)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Top up dari Bank</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1">Total Pengeluaran (Keluar)</span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">{formatRupiah(totalKeluar)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Biaya rutin operasional</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari Keterangan, Penerima, Kode..."
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
            <option value="Semua">Semua Kategori Kas</option>
            <option value="Konsumsi & Dapur Pabrik">Konsumsi & Dapur Pabrik</option>
            <option value="BBM & Transportasi">BBM & Transportasi</option>
            <option value="ATK & Keperluan Kantor">ATK & Keperluan Kantor</option>
            <option value="Listrik, Air & Kebersihan">Listrik, Air & Kebersihan</option>
            <option value="Maintenance & Alat Kerja Ringan">Maintenance & Alat Kerja</option>
            <option value="Pengisian Kas Kecil">Pengisian Kas Kecil</option>
            <option value="Lain-lain">Lain-lain</option>
          </select>

          <select
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Jenis Transaksi</option>
            <option value="MASUK">Pemasukan (Masuk)</option>
            <option value="KELUAR">Pengeluaran (Keluar)</option>
          </select>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-zinc-800 dark:text-zinc-200 focus:outline-none text-[11px] w-full"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-bold text-sm text-zinc-900 dark:text-white">Riwayat Mutasi Kas Kecil ({filteredList.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-3.5">Kode & Tanggal</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Keterangan / Keperluan</th>
                <th className="p-3.5">Penerima / Pemohon</th>
                <th className="p-3.5 text-right">Nominal Masuk</th>
                <th className="p-3.5 text-right">Nominal Keluar</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">
                    Tidak ada catatan transaksi kas kecil.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block">{item.kodeTransaksi}</span>
                      <span className="text-[11px] text-zinc-400">{item.tanggal}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[11px] font-medium">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-zinc-800 dark:text-zinc-200 max-w-[250px]">{item.keterangan}</td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400">{item.penerima || '-'}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {item.jenis === 'MASUK' ? formatRupiah(item.nominal) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-bold text-red-600 dark:text-red-400">
                      {item.jenis === 'KELUAR' ? formatRupiah(item.nominal) : '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Catatan"
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

      {/* MODAL 1: Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">Pencatatan Kas Kecil</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Jenis Transaksi</label>
                  <select
                    value={formData.jenis}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold"
                  >
                    <option value="KELUAR">Pengeluaran (Keluar)</option>
                    <option value="MASUK">Pengisian Plafon (Masuk)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Tanggal</label>
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
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Kategori</label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                >
                  <option value="Konsumsi & Dapur Pabrik">Konsumsi & Dapur Pabrik</option>
                  <option value="BBM & Transportasi">BBM & Transportasi</option>
                  <option value="ATK & Keperluan Kantor">ATK & Keperluan Kantor</option>
                  <option value="Listrik, Air & Kebersihan">Listrik, Air & Kebersihan</option>
                  <option value="Maintenance & Alat Kerja Ringan">Maintenance & Alat Kerja Ringan</option>
                  <option value="Pengisian Kas Kecil">Pengisian Kas Kecil (Plafon)</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  required
                  min="500"
                  value={formData.nominal || ''}
                  onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Keterangan / Keperluan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli air mineral galon & kopi shift malam"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Penerima / Pemohon</label>
                <input
                  type="text"
                  placeholder="Contoh: Bpk. Joko (Security / Dapur)"
                  value={formData.penerima}
                  onChange={(e) => setFormData({ ...formData, penerima: e.target.value })}
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
                  Simpan Transaksi
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
                <span className="font-bold text-sm">Pratinjau Laporan Kas Kecil (Petty Cash)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintOrPdf('kas-kecil-report-sheet', `Laporan_Kas_Kecil_${new Date().toISOString().split('T')[0]}`)}
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
                id="kas-kecil-report-sheet"
                className="bg-white text-zinc-900 p-8 rounded-lg shadow-md max-w-3xl w-full text-xs font-sans border border-zinc-200"
              >
                <div className="flex items-start justify-between border-b-2 border-red-900 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo size="md" className="h-10 w-10" />
                    <div>
                      <h2 className="text-lg font-black text-red-900">PT MUSTIKA KAYU NUSANTARA</h2>
                      <p className="text-[10px] text-zinc-600">Laporan Rekapitulasi Kas Kecil (Petty Cash Statement)</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-600">
                    <p><b>Periode:</b> {startDate || 'Awal'} s/d {endDate || 'Sekarang'}</p>
                    <p><b>Dicetak Oleh:</b> {currentUser?.name || 'Kasir Pabrik'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-center text-[10px]">
                  <div>
                    <span className="text-zinc-500 block font-bold">Total Masuk (Plafon):</span>
                    <span className="font-extrabold text-blue-700 text-sm">{formatRupiah(totalMasuk)}</span>
                  </div>
                  <div>
                    <span className="text-red-700 block font-bold">Total Pengeluaran:</span>
                    <span className="font-extrabold text-red-700 text-sm">{formatRupiah(totalKeluar)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block font-bold">Saldo Akhir:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{formatRupiah(saldoKasKecil)}</span>
                  </div>
                </div>

                <table className="w-full border-collapse text-[10px] mb-6">
                  <thead>
                    <tr className="bg-red-900 text-white font-bold">
                      <th className="p-2 text-left">Kode & Tgl</th>
                      <th className="p-2 text-left">Kategori</th>
                      <th className="p-2 text-left">Keterangan</th>
                      <th className="p-2 text-left">Penerima</th>
                      <th className="p-2 text-right">Masuk (Rp)</th>
                      <th className="p-2 text-right">Keluar (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 border-b border-zinc-200">
                    {filteredList.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                        <td className="p-2 font-bold">{item.kodeTransaksi} <br/><span className="text-[9px] text-zinc-500 font-normal">{item.tanggal}</span></td>
                        <td className="p-2">{item.kategori}</td>
                        <td className="p-2 font-medium">{item.keterangan}</td>
                        <td className="p-2">{item.penerima || '-'}</td>
                        <td className="p-2 text-right font-bold text-blue-700">{item.jenis === 'MASUK' ? formatRupiah(item.nominal) : '-'}</td>
                        <td className="p-2 text-right font-bold text-red-700">{item.jenis === 'KELUAR' ? formatRupiah(item.nominal) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-bold">
                      <td colSpan={4} className="p-2 text-right">TOTAL MUTASI PERIODE:</td>
                      <td className="p-2 text-right text-blue-700 font-black">{formatRupiah(totalMasuk)}</td>
                      <td className="p-2 text-right text-red-700 font-black">{formatRupiah(totalKeluar)}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <span className="text-[10px] text-zinc-500 block mb-12">Pemegang Kas Kecil,</span>
                    <div className="border-t border-zinc-400 w-36 mx-auto pt-1 font-bold text-zinc-900">
                      Kasir Operasional
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-zinc-500 block mb-12">Menyetujui (Manager),</span>
                    <div className="border-t border-zinc-400 w-36 mx-auto pt-1 font-bold text-zinc-900">
                      Finance & Accounting
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
        title="Hapus Catatan Kas Kecil"
        description={`Apakah Anda yakin ingin menghapus transaksi kas kecil "${itemToDelete?.kodeTransaksi} - ${itemToDelete?.keterangan}"?`}
        onConfirm={() => {
          if (itemToDelete) {
            deleteKasKecil(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
