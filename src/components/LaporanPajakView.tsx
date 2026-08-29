import React, { useState, useMemo } from 'react';
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
  X
} from 'lucide-react';

export const LaporanPajakView: React.FC = () => {
  const { pajakList, addPajak, updatePajak, deletePajak, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [jenisPajakFilter, setJenisPajakFilter] = useState('Semua');
  const [statusLaporFilter, setStatusLaporFilter] = useState<'Semua' | 'Belum Lapor' | 'Sudah Lapor SPT' | 'Lunas Bayar'>('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PajakItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenisPajak: 'PPN Keluaran 11%' as PajakItem['jenisPajak'],
    nomorFaktur: '',
    lawanTransaksi: '',
    dpp: 0,
    tarifPersen: 11,
    statusBayarLapor: 'Belum Lapor' as PajakItem['statusBayarLapor'],
    masaPajak: 'Agustus 2026',
    keterangan: ''
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

  // Filtered Tax records
  const filteredPajak = useMemo(() => {
    return pajakList.filter(item => {
      const matchesSearch = 
        item.lawanTransaksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomorFaktur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.keterangan || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesJenis = jenisPajakFilter === 'Semua' || item.jenisPajak === jenisPajakFilter;
      const matchesStatus = statusLaporFilter === 'Semua' || item.statusBayarLapor === statusLaporFilter;

      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && item.tanggal >= startDate;
      if (endDate) matchesDate = matchesDate && item.tanggal <= endDate;

      return matchesSearch && matchesJenis && matchesStatus && matchesDate;
    });
  }, [pajakList, searchTerm, jenisPajakFilter, statusLaporFilter, startDate, endDate]);

  // Tax Calculations
  const ppnKeluaran = useMemo(() => {
    return pajakList.filter(p => p.jenisPajak.includes('Keluaran')).reduce((a, b) => a + b.nominalPajak, 0);
  }, [pajakList]);

  const ppnMasukan = useMemo(() => {
    return pajakList.filter(p => p.jenisPajak.includes('Masukan')).reduce((a, b) => a + b.nominalPajak, 0);
  }, [pajakList]);

  const netPpn = ppnKeluaran - ppnMasukan;

  const totalPPh = useMemo(() => {
    return pajakList.filter(p => p.jenisPajak.startsWith('PPh')).reduce((a, b) => a + b.nominalPajak, 0);
  }, [pajakList]);

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
      alert('Mohon isi nama lawan transaksi dan DPP nominal valid.');
      return;
    }

    const nominalPajak = Math.round((formData.dpp * formData.tarifPersen) / 100);
    const nomorFaktur = formData.nomorFaktur || `FP-010.004-26.${Math.floor(10000000 + Math.random() * 90000000)}`;

    addPajak({
      ...formData,
      nomorFaktur,
      nominalPajak
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
      masaPajak: 'Agustus 2026',
      keterangan: ''
    });
  };

  const toggleStatusLapor = (item: PajakItem) => {
    const nextStatus: PajakItem['statusBayarLapor'] = 
      item.statusBayarLapor === 'Belum Lapor' ? 'Sudah Lapor SPT' :
      item.statusBayarLapor === 'Sudah Lapor SPT' ? 'Lunas Bayar' : 'Belum Lapor';
    updatePajak(item.id, { statusBayarLapor: nextStatus });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 rounded-xl text-rose-700 dark:text-rose-400">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Laporan Pajak (PPN & PPh)</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Rekapitulasi Faktur Pajak Keluaran/Masukan, SPT Masa, dan Bukti Potong PPh</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Faktur Pajak</span>
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Rekap Pajak PDF</span>
          </button>
        </div>
      </div>

      {/* Tax Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">PPN Keluaran (Penjualan)</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatRupiah(ppnKeluaran)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Faktur pajak diterbitkan ke buyer</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">PPN Masukan (Pembelian)</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(ppnMasukan)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Kredit pajak pembelian supplier</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">Kurang / (Lebih) Bayar PPN</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatRupiah(netPpn)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Wajib disetor ke Kas Negara</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">Total PPh (21 / 23 / Final)</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatRupiah(totalPPh)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Bukti potong & PPh terhutang</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari Lawan Transaksi, No Faktur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <select
            value={jenisPajakFilter}
            onChange={(e) => setJenisPajakFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Jenis Pajak</option>
            <option value="PPN Keluaran 11%">PPN Keluaran 11%</option>
            <option value="PPN Masukan 11%">PPN Masukan 11%</option>
            <option value="PPh 21 (Upah/Gaji)">PPh 21 (Upah/Gaji)</option>
            <option value="PPh 23 (Jasa)">PPh 23 (Jasa)</option>
            <option value="PPh Final UMKM / Badan">PPh Final UMKM / Badan</option>
          </select>

          <select
            value={statusLaporFilter}
            onChange={(e) => setStatusLaporFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Status Lapor DJP</option>
            <option value="Belum Lapor">Belum Lapor</option>
            <option value="Sudah Lapor SPT">Sudah Lapor SPT</option>
            <option value="Lunas Bayar">Lunas Bayar</option>
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

      {/* Tax Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-bold text-sm text-zinc-900 dark:text-white">Daftar Faktur Pajak & Bukti Potong ({filteredPajak.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-3.5">Tanggal & No Faktur</th>
                <th className="p-3.5">Jenis Pajak</th>
                <th className="p-3.5">Lawan Transaksi</th>
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
                  <td colSpan={8} className="p-8 text-center text-zinc-400">
                    Tidak ada faktur pajak yang cocok dengan filter.
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
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[11px] font-semibold">
                        {item.jenisPajak}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-zinc-900 dark:text-white block">{item.lawanTransaksi}</span>
                      <span className="text-[10px] text-zinc-400">{item.keterangan || '-'}</span>
                    </td>
                    <td className="p-3.5 text-right font-medium text-zinc-800 dark:text-zinc-200">{formatRupiah(item.dpp)}</td>
                    <td className="p-3.5 text-center font-bold text-zinc-600 dark:text-zinc-400">{item.tarifPersen}%</td>
                    <td className="p-3.5 text-right font-black text-red-700 dark:text-red-400">{formatRupiah(item.nominalPajak)}</td>
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
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Pajak"
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

      {/* MODAL 1: Add Tax Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">Tambah Faktur Pajak / Bukti Potong</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
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
                    <option value="PPN Keluaran 11%">PPN Keluaran 11%</option>
                    <option value="PPN Masukan 11%">PPN Masukan 11%</option>
                    <option value="PPh 21 (Upah/Gaji)">PPh 21 (Upah/Gaji)</option>
                    <option value="PPh 23 (Jasa)">PPh 23 (Jasa)</option>
                    <option value="PPh Final UMKM / Badan">PPh Final UMKM / Badan</option>
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
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Lawan Transaksi (Nama PT / CV / NPWP) *</label>
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

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Keterangan Transaksi</label>
                <input
                  type="text"
                  placeholder="Contoh: Penyerahan 400 pcs Pallet ISPM 15"
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm"
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
                <span className="font-bold text-sm">Pratinjau Laporan Rekapitulasi Pajak Masa</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintOrPdf('tax-report-sheet', `Laporan_Pajak_Masa_${startDate || 'all'}_sd_${endDate || 'all'}`)}
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
                <div className="flex items-start justify-between border-b-2 border-red-900 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo size="md" className="h-10 w-10" />
                    <div>
                      <h2 className="text-lg font-black text-red-900">PT MUSTIKA KAYU NUSANTARA</h2>
                      <p className="text-[10px] text-zinc-600">Laporan Rekapitulasi Pajak PPN & PPh (Tax Summary Statement)</p>
                      <p className="text-[9px] text-zinc-500">NPWP: 01.892.381.2-412.000 | KPP Pratama Cikarang Selatan</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-600">
                    <p><b>Periode:</b> {startDate || 'Awal'} s/d {endDate || 'Sekarang'}</p>
                    <p><b>Dicetak Oleh:</b> {currentUser?.name || 'Tax Officer'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-center text-[10px]">
                  <div>
                    <span className="text-blue-700 block font-bold">Total PPN Keluaran:</span>
                    <span className="font-extrabold text-blue-700 text-sm">{formatRupiah(ppnKeluaran)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block font-bold">Total PPN Masukan:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{formatRupiah(ppnMasukan)}</span>
                  </div>
                  <div>
                    <span className="text-amber-700 block font-bold">Net PPN Disetor:</span>
                    <span className="font-extrabold text-amber-700 text-sm">{formatRupiah(netPpn)}</span>
                  </div>
                </div>

                <table className="w-full border-collapse text-[10px] mb-6">
                  <thead>
                    <tr className="bg-red-900 text-white font-bold">
                      <th className="p-2 text-left">No. Faktur / Bupot</th>
                      <th className="p-2 text-left">Jenis</th>
                      <th className="p-2 text-left">Lawan Transaksi</th>
                      <th className="p-2 text-right">DPP (Rp)</th>
                      <th className="p-2 text-center">Tarif</th>
                      <th className="p-2 text-right">Pajak (Rp)</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 border-b border-zinc-200">
                    {filteredPajak.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                        <td className="p-2 font-bold">{item.nomorFaktur}<br/><span className="text-[9px] text-zinc-400 font-normal">{item.tanggal}</span></td>
                        <td className="p-2 font-medium">{item.jenisPajak}</td>
                        <td className="p-2">{item.lawanTransaksi}</td>
                        <td className="p-2 text-right font-medium">{formatRupiah(item.dpp)}</td>
                        <td className="p-2 text-center">{item.tarifPersen}%</td>
                        <td className="p-2 text-right font-bold text-red-700">{formatRupiah(item.nominalPajak)}</td>
                        <td className="p-2 text-center font-bold text-emerald-700">{item.statusBayarLapor}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-bold">
                      <td colSpan={3} className="p-2 text-right">TOTAL PAJAK PERIODE:</td>
                      <td className="p-2 text-right">{formatRupiah(filteredPajak.reduce((a, b) => a + b.dpp, 0))}</td>
                      <td></td>
                      <td className="p-2 text-right font-black text-red-700">{formatRupiah(filteredPajak.reduce((a, b) => a + b.nominalPajak, 0))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>

                <div className="flex justify-end pt-4">
                  <div className="text-center w-48">
                    <span className="text-[10px] text-zinc-500 block mb-12">Disiapkan Oleh (Tax Officer),</span>
                    <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                      Tax & Accounting Dept.
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
