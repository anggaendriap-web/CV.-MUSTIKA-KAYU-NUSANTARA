import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { HutangUsaha } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { triggerPrintOrPdf } from '../utils/exportPdf';
import { 
  Building2, 
  Printer, 
  Download, 
  Search, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Trash2, 
  Edit3, 
  X,
  FileSpreadsheet
} from 'lucide-react';

export const LaporanAPView: React.FC = () => {
  const { hutangList, addHutang, updateHutang, deleteHutang, bayarHutang, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Belum Lunas' | 'Lunas' | 'Jatuh Tempo'>('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<HutangUsaha | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HutangUsaha | null>(null);

  // Add Form State
  const [formData, setFormData] = useState({
    nomorTagihan: '',
    supplier: '',
    tanggal: new Date().toISOString().split('T')[0],
    tanggalJatuhTempo: '',
    kategori: 'Bahan Baku Kayu' as HutangUsaha['kategori'],
    keterangan: '',
    totalTagihan: 0,
    sudahDibayar: 0
  });

  // Pay Form State
  const [payNominal, setPayNominal] = useState(0);
  const [payMetode, setPayMetode] = useState('Transfer Bank BCA');
  const [payCatatan, setPayCatatan] = useState('');

  // Initialize dates
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

  // Filtered AP
  const filteredAP = useMemo(() => {
    return hutangList.filter(ap => {
      const matchesSearch = 
        ap.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ap.nomorTagihan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ap.keterangan.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSupplier = supplierFilter === 'Semua' || ap.supplier === supplierFilter;

      const matchesStatus = 
        statusFilter === 'Semua' ? true :
        statusFilter === 'Lunas' ? ap.status === 'Lunas' :
        statusFilter === 'Belum Lunas' ? ap.status === 'Belum Lunas' :
        ap.status === 'Jatuh Tempo';

      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && ap.tanggal >= startDate;
      if (endDate) matchesDate = matchesDate && ap.tanggal <= endDate;

      return matchesSearch && matchesSupplier && matchesStatus && matchesDate;
    });
  }, [hutangList, searchTerm, supplierFilter, statusFilter, startDate, endDate]);

  // Calculations
  const totalHutangAktif = useMemo(() => {
    return hutangList.filter(ap => ap.status !== 'Lunas').reduce((a, b) => a + b.sisaHutang, 0);
  }, [hutangList]);

  const totalSudahDibayar = useMemo(() => {
    return hutangList.reduce((a, b) => a + b.sudahDibayar, 0);
  }, [hutangList]);

  const totalJatuhTempo = useMemo(() => {
    return hutangList.filter(ap => ap.status === 'Jatuh Tempo').reduce((a, b) => a + b.sisaHutang, 0);
  }, [hutangList]);

  const uniqueSuppliers = useMemo(() => {
    return Array.from(new Set(hutangList.map(h => h.supplier)));
  }, [hutangList]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier || !formData.totalTagihan || !formData.tanggalJatuhTempo) {
      alert('Mohon lengkapi data supplier, total tagihan, dan tanggal jatuh tempo.');
      return;
    }

    const nomorTagihan = formData.nomorTagihan || `AP/MKN/2026/08/${Math.floor(100 + Math.random() * 900)}`;
    addHutang({
      ...formData,
      nomorTagihan
    });

    setShowAddModal(false);
    setFormData({
      nomorTagihan: '',
      supplier: '',
      tanggal: new Date().toISOString().split('T')[0],
      tanggalJatuhTempo: '',
      kategori: 'Bahan Baku Kayu',
      keterangan: '',
      totalTagihan: 0,
      sudahDibayar: 0
    });
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal || payNominal <= 0) return;

    bayarHutang(showPayModal.id, payNominal, payMetode, payCatatan);
    setShowPayModal(null);
    setPayNominal(0);
    setPayCatatan('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-700 dark:text-amber-400">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Laporan Hutang Usaha (AP)</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Pencatatan faktur tagihan supplier kayu, paku, oven ISPM 15, dan jadwal pembayaran</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Hutang Supplier</span>
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Laporan AP PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">Total Sisa Hutang Aktif</span>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">{formatRupiah(totalHutangAktif)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Kewajiban berjalan ke supplier</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Total Sudah Dibayar</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(totalSudahDibayar)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Realisasi pembayaran kas</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1">Hutang Jatuh Tempo</span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">{formatRupiah(totalJatuhTempo)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Wajib diselesaikan segera</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">Supplier Aktif</span>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">{uniqueSuppliers.length} Mitra</div>
          <span className="text-xs text-zinc-400 mt-1 block">Vendor kayu & sparepart</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari Supplier, No Tagihan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Supplier</option>
            {uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Status</option>
            <option value="Belum Lunas">Belum Lunas</option>
            <option value="Jatuh Tempo">Jatuh Tempo</option>
            <option value="Lunas">Lunas</option>
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

      {/* AP Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-bold text-sm text-zinc-900 dark:text-white">Daftar Tagihan Hutang Supplier ({filteredAP.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-3.5">Supplier & Kategori</th>
                <th className="p-3.5">No. Faktur Tagihan</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Jatuh Tempo</th>
                <th className="p-3.5 text-right">Total Tagihan</th>
                <th className="p-3.5 text-right">Sudah Dibayar</th>
                <th className="p-3.5 text-right">Sisa Hutang</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredAP.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-400">
                    Tidak ada catatan hutang supplier yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredAP.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-bold text-zinc-900 dark:text-white block">{item.supplier}</span>
                      <span className="text-[11px] text-zinc-400">{item.kategori} - {item.keterangan}</span>
                    </td>
                    <td className="p-3.5 font-semibold text-zinc-700 dark:text-zinc-300">{item.nomorTagihan}</td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400">{item.tanggal}</td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400 font-medium">{item.tanggalJatuhTempo}</td>
                    <td className="p-3.5 text-right font-bold text-zinc-800 dark:text-zinc-200">{formatRupiah(item.totalTagihan)}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(item.sudahDibayar)}</td>
                    <td className="p-3.5 text-right font-black text-amber-600 dark:text-amber-400">{formatRupiah(item.sisaHutang)}</td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'Lunas'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : item.status === 'Jatuh Tempo'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.status !== 'Lunas' && (
                          <button
                            onClick={() => {
                              setShowPayModal(item);
                              setPayNominal(item.sisaHutang);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Bayar
                          </button>
                        )}
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Hutang"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add AP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">Tambah Tagihan Hutang Supplier</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Nama Supplier / Vendor *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: CV Sumber Rimba Makmur"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Nomor Tagihan / Faktur</label>
                  <input
                    type="text"
                    placeholder="AP/MKN/2026/..."
                    value={formData.nomorTagihan}
                    onChange={(e) => setFormData({ ...formData, nomorTagihan: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Kategori Biaya</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                  >
                    <option value="Bahan Baku Kayu">Bahan Baku Kayu</option>
                    <option value="Paku & Besi">Paku & Besi</option>
                    <option value="Jasa Oven & Sertifikasi">Jasa Oven & Sertifikasi</option>
                    <option value="Sparepart & Mesin">Sparepart & Mesin</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Tanggal Tagihan</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Tanggal Jatuh Tempo *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalJatuhTempo}
                    onChange={(e) => setFormData({ ...formData, tanggalJatuhTempo: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Total Nilai Tagihan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={formData.totalTagihan || ''}
                    onChange={(e) => setFormData({ ...formData, totalTagihan: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Sudah Dibayar / DP (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sudahDibayar || ''}
                    onChange={(e) => setFormData({ ...formData, sudahDibayar: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Keterangan / Deskripsi Barang</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pengiriman Kayu Log Albasia 40 m3"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold"
                >
                  Simpan Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2">Bayar Tagihan Hutang Supplier</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Pembayaran untuk <b>{showPayModal.supplier}</b> (No: {showPayModal.nomorTagihan}). Sisa Hutang: <b>{formatRupiah(showPayModal.sisaHutang)}</b>.
            </p>

            <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Nominal Bayar (Rp) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  max={showPayModal.sisaHutang}
                  value={payNominal}
                  onChange={(e) => setPayNominal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Metode Pembayaran</label>
                <select
                  value={payMetode}
                  onChange={(e) => setPayMetode(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                >
                  <option value="Transfer Bank BCA">Transfer Bank BCA (8820192831)</option>
                  <option value="Transfer Bank Mandiri">Transfer Bank Mandiri (1370092819201)</option>
                  <option value="Cash / Tunai">Kas Tunai Kasir Pabrik</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Catatan Pembayaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Pelunasan tahap 2 faktur kayu"
                  value={payCatatan}
                  onChange={(e) => setPayCatatan(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  className="px-4 py-2 rounded-xl text-zinc-500 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Konfirmasi Bayar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Print AP PDF */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-red-400" />
                <span className="font-bold text-sm">Pratinjau Laporan Hutang Usaha (AP)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintOrPdf('ap-report-sheet', `Laporan_AP_Hutang_${new Date().toISOString().split('T')[0]}`)}
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
                id="ap-report-sheet"
                className="bg-white text-zinc-900 p-8 rounded-lg shadow-md max-w-3xl w-full text-xs font-sans border border-zinc-200"
              >
                <div className="flex items-start justify-between border-b-2 border-red-900 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo size="md" className="h-10 w-10" />
                    <div>
                      <h2 className="text-lg font-black text-red-900">PT MUSTIKA KAYU NUSANTARA</h2>
                      <p className="text-[10px] text-zinc-600">Laporan Hutang Usaha & Tagihan Supplier (Accounts Payable Report)</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-600">
                    <p><b>Tanggal Cetak:</b> {new Date().toLocaleDateString('id-ID')}</p>
                    <p><b>Pencatat:</b> {currentUser?.name || 'Finance Dept'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-center text-[10px]">
                  <div>
                    <span className="text-zinc-500 block font-bold">Total Sisa Hutang:</span>
                    <span className="font-extrabold text-amber-700 text-sm">{formatRupiah(totalHutangAktif)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block font-bold">Total Realisasi Bayar:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{formatRupiah(totalSudahDibayar)}</span>
                  </div>
                  <div>
                    <span className="text-red-700 block font-bold">Jatuh Tempo:</span>
                    <span className="font-extrabold text-red-700 text-sm">{formatRupiah(totalJatuhTempo)}</span>
                  </div>
                </div>

                <table className="w-full border-collapse text-[10px] mb-6">
                  <thead>
                    <tr className="bg-red-900 text-white font-bold">
                      <th className="p-2 text-left">Supplier</th>
                      <th className="p-2 text-left">No. Tagihan</th>
                      <th className="p-2 text-left">Tgl Jatuh Tempo</th>
                      <th className="p-2 text-right">Total Tagihan</th>
                      <th className="p-2 text-right">Sudah Dibayar</th>
                      <th className="p-2 text-right">Sisa Hutang</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 border-b border-zinc-200">
                    {filteredAP.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                        <td className="p-2 font-bold">{item.supplier}</td>
                        <td className="p-2 text-zinc-700">{item.nomorTagihan}</td>
                        <td className="p-2">{item.tanggalJatuhTempo}</td>
                        <td className="p-2 text-right">{formatRupiah(item.totalTagihan)}</td>
                        <td className="p-2 text-right text-emerald-700 font-semibold">{formatRupiah(item.sudahDibayar)}</td>
                        <td className="p-2 text-right text-amber-700 font-bold">{formatRupiah(item.sisaHutang)}</td>
                        <td className="p-2 text-center font-bold">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-bold">
                      <td colSpan={5} className="p-2 text-right">TOTAL SISA KEWAJIBAN HUTANG:</td>
                      <td className="p-2 text-right font-black text-amber-700">{formatRupiah(filteredAP.reduce((a, b) => a + b.sisaHutang, 0))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>

                <div className="flex justify-end pt-4">
                  <div className="text-center w-48">
                    <span className="text-[10px] text-zinc-500 block mb-12">Disetujui Oleh,</span>
                    <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                      Finance & AP Manager
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        title="Hapus Data Hutang Supplier"
        description={`Apakah Anda yakin ingin menghapus catatan tagihan hutang "${itemToDelete?.nomorTagihan}" dari "${itemToDelete?.supplier}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={() => {
          if (itemToDelete) {
            deleteHutang(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
