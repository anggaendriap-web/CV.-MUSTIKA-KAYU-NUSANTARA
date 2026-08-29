import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BukuBankItem } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { triggerPrintOrPdf } from '../utils/exportPdf';
import { 
  Landmark, 
  Printer, 
  Download, 
  Search, 
  Calendar, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Trash2, 
  X,
  CreditCard,
  Building
} from 'lucide-react';

export const BukuBankView: React.FC = () => {
  const { bukuBankList, addBukuBank, deleteBukuBank, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [bankFilter, setBankFilter] = useState('Semua');
  const [jenisFilter, setJenisFilter] = useState<'Semua' | 'MASUK' | 'KELUAR'>('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BukuBankItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    bank: 'Bank BCA' as 'Bank BCA' | 'Bank Mandiri' | 'Bank Lainnya',
    nomorRekening: '8820192831',
    jenis: 'MASUK' as 'MASUK' | 'KELUAR',
    kategori: 'Penerimaan Piutang Buyer',
    keterangan: '',
    nominal: 0,
    referensi: ''
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
    return bukuBankList.filter(item => {
      const matchesSearch = 
        item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kodeMutasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.referensi?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

      const matchesBank = bankFilter === 'Semua' || item.bank === bankFilter;
      const matchesJenis = jenisFilter === 'Semua' || item.jenis === jenisFilter;

      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && item.tanggal >= startDate;
      if (endDate) matchesDate = matchesDate && item.tanggal <= endDate;

      return matchesSearch && matchesBank && matchesJenis && matchesDate;
    });
  }, [bukuBankList, searchTerm, bankFilter, jenisFilter, startDate, endDate]);

  // Bank Balances
  const saldoBCA = useMemo(() => {
    const masuk = bukuBankList.filter(b => b.bank === 'Bank BCA' && b.jenis === 'MASUK').reduce((a, b) => a + b.nominal, 0);
    const keluar = bukuBankList.filter(b => b.bank === 'Bank BCA' && b.jenis === 'KELUAR').reduce((a, b) => a + b.nominal, 0);
    return masuk - keluar;
  }, [bukuBankList]);

  const saldoMandiri = useMemo(() => {
    const masuk = bukuBankList.filter(b => b.bank === 'Bank Mandiri' && b.jenis === 'MASUK').reduce((a, b) => a + b.nominal, 0);
    const keluar = bukuBankList.filter(b => b.bank === 'Bank Mandiri' && b.jenis === 'KELUAR').reduce((a, b) => a + b.nominal, 0);
    return masuk - keluar;
  }, [bukuBankList]);

  const totalSaldoBank = saldoBCA + saldoMandiri;

  const totalMasukPeriode = useMemo(() => {
    return filteredList.filter(i => i.jenis === 'MASUK').reduce((a, b) => a + b.nominal, 0);
  }, [filteredList]);

  const totalKeluarPeriode = useMemo(() => {
    return filteredList.filter(i => i.jenis === 'KELUAR').reduce((a, b) => a + b.nominal, 0);
  }, [filteredList]);

  const handleBankChange = (bank: 'Bank BCA' | 'Bank Mandiri' | 'Bank Lainnya') => {
    const nomorRekening = bank === 'Bank BCA' ? '8820192831' : bank === 'Bank Mandiri' ? '1370092819201' : '000000000';
    setFormData({ ...formData, bank, nomorRekening });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.keterangan || formData.nominal <= 0) {
      alert('Mohon isi keterangan dan nominal valid.');
      return;
    }

    addBukuBank({
      ...formData,
      kodeMutasi: `BNK-${Math.floor(1000 + Math.random() * 9000)}`
    });

    setShowAddModal(false);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      bank: 'Bank BCA',
      nomorRekening: '8820192831',
      jenis: 'MASUK',
      kategori: 'Penerimaan Piutang Buyer',
      keterangan: '',
      nominal: 0,
      referensi: ''
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-700 dark:text-indigo-400">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Buku Bank (Bank Statement)</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Pencatatan mutasi rekening giro BCA & Mandiri, rekonsiliasi transfer, dan cetak rekening koran</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Mutasi Bank</span>
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Buku Bank PDF</span>
          </button>
        </div>
      </div>

      {/* Account Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Kas Bank</span>
            <Landmark className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">{formatRupiah(totalSaldoBank)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Gabungan Rekening Giro PT MKN</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Bank BCA (882-019-2831)</span>
            <Building className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatRupiah(saldoBCA)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Giro Operasional Utama</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Bank Mandiri (137-00-9281920)</span>
            <Building className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatRupiah(saldoMandiri)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Giro Pembayaran & Pajak</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari Keterangan, Referensi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Rekening Bank</option>
            <option value="Bank BCA">Bank BCA</option>
            <option value="Bank Mandiri">Bank Mandiri</option>
          </select>

          <select
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Jenis Mutasi</option>
            <option value="MASUK">Debet / Masuk (Deposit)</option>
            <option value="KELUAR">Kredit / Keluar (Payment)</option>
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

      {/* Transactions Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-bold text-sm text-zinc-900 dark:text-white">Mutasi Rekening Koran ({filteredList.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-3.5">Tanggal & Kode</th>
                <th className="p-3.5">Rekening Bank</th>
                <th className="p-3.5">Kategori Transaksi</th>
                <th className="p-3.5">Uraian / Keterangan</th>
                <th className="p-3.5 text-right">Debet / Masuk</th>
                <th className="p-3.5 text-right">Kredit / Keluar</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">
                    Tidak ada mutasi buku bank yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block">{item.kodeMutasi}</span>
                      <span className="text-[11px] text-zinc-400">{item.tanggal}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.bank === 'Bank BCA'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {item.bank}
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">{item.nomorRekening}</span>
                    </td>
                    <td className="p-3.5 font-medium text-zinc-700 dark:text-zinc-300">{item.kategori}</td>
                    <td className="p-3.5 text-zinc-800 dark:text-zinc-200 max-w-[280px]">
                      <span className="font-semibold block">{item.keterangan}</span>
                      {item.referensi && <span className="text-[10px] text-zinc-400">Ref: {item.referensi}</span>}
                    </td>
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
                        title="Hapus Mutasi"
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

      {/* MODAL 1: Add Bank Mutation */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">Catat Mutasi Bank</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Rekening Bank</label>
                  <select
                    value={formData.bank}
                    onChange={(e) => handleBankChange(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold"
                  >
                    <option value="Bank BCA">Bank BCA (8820192831)</option>
                    <option value="Bank Mandiri">Bank Mandiri (1370092819201)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Jenis Mutasi</label>
                  <select
                    value={formData.jenis}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold"
                  >
                    <option value="MASUK">Debet / Masuk (Deposit)</option>
                    <option value="KELUAR">Kredit / Keluar (Payment)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={formData.nominal || ''}
                    onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Kategori Transaksi</label>
                <input
                  type="text"
                  placeholder="Contoh: Pembayaran Supplier / Piutang Buyer / Bunga Bank"
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Uraian / Keterangan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penerimaan transfer pelunasan invoice PT Unilever"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Nomor Referensi Bank / Giro</label>
                <input
                  type="text"
                  placeholder="Contoh: REF-BCA-992812"
                  value={formData.referensi}
                  onChange={(e) => setFormData({ ...formData, referensi: e.target.value })}
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Mutasi
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
                <span className="font-bold text-sm">Pratinjau Rekening Koran / Buku Bank</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintOrPdf('bank-report-sheet', `Rekening_Koran_Bank_${startDate || 'all'}_sd_${endDate || 'all'}`)}
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
                id="bank-report-sheet"
                className="bg-white text-zinc-900 p-8 rounded-lg shadow-md max-w-3xl w-full text-xs font-sans border border-zinc-200"
              >
                <div className="flex items-start justify-between border-b-2 border-red-900 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo size="md" className="h-10 w-10" />
                    <div>
                      <h2 className="text-lg font-black text-red-900">PT MUSTIKA KAYU NUSANTARA</h2>
                      <p className="text-[10px] text-zinc-600">Laporan Rekening Koran & Mutasi Buku Bank Perusahaan</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-600">
                    <p><b>Periode:</b> {startDate || 'Awal'} s/d {endDate || 'Sekarang'}</p>
                    <p><b>Rekening:</b> {bankFilter === 'Semua' ? 'Semua Rekening Bank' : bankFilter}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-center text-[10px]">
                  <div>
                    <span className="text-zinc-500 block font-bold">Total Debet (Masuk):</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{formatRupiah(totalMasukPeriode)}</span>
                  </div>
                  <div>
                    <span className="text-red-700 block font-bold">Total Kredit (Keluar):</span>
                    <span className="font-extrabold text-red-700 text-sm">{formatRupiah(totalKeluarPeriode)}</span>
                  </div>
                  <div>
                    <span className="text-indigo-700 block font-bold">Saldo Akhir Kumulatif:</span>
                    <span className="font-extrabold text-indigo-700 text-sm">{formatRupiah(totalSaldoBank)}</span>
                  </div>
                </div>

                <table className="w-full border-collapse text-[10px] mb-6">
                  <thead>
                    <tr className="bg-red-900 text-white font-bold">
                      <th className="p-2 text-left">Tgl & Kode</th>
                      <th className="p-2 text-left">Bank</th>
                      <th className="p-2 text-left">Uraian Transaksi</th>
                      <th className="p-2 text-left">Referensi</th>
                      <th className="p-2 text-right">Debet (Masuk)</th>
                      <th className="p-2 text-right">Kredit (Keluar)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 border-b border-zinc-200">
                    {filteredList.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                        <td className="p-2 font-bold">{item.tanggal}<br/><span className="text-[9px] text-zinc-500 font-normal">{item.kodeMutasi}</span></td>
                        <td className="p-2 font-semibold">{item.bank}</td>
                        <td className="p-2 font-medium">{item.keterangan}</td>
                        <td className="p-2 text-zinc-500">{item.referensi || '-'}</td>
                        <td className="p-2 text-right font-bold text-emerald-700">{item.jenis === 'MASUK' ? formatRupiah(item.nominal) : '-'}</td>
                        <td className="p-2 text-right font-bold text-red-700">{item.jenis === 'KELUAR' ? formatRupiah(item.nominal) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-bold">
                      <td colSpan={4} className="p-2 text-right">TOTAL MUTASI PERIODE:</td>
                      <td className="p-2 text-right text-emerald-700 font-black">{formatRupiah(totalMasukPeriode)}</td>
                      <td className="p-2 text-right text-red-700 font-black">{formatRupiah(totalKeluarPeriode)}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="flex justify-between pt-4 text-center">
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-12">Staff Rekonsiliasi Bank,</span>
                    <div className="border-t border-zinc-400 w-36 mx-auto pt-1 font-bold text-zinc-900">
                      Finance Staff
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-12">Disetujui Oleh (CFO / Direktur),</span>
                    <div className="border-t border-zinc-400 w-44 mx-auto pt-1 font-bold text-zinc-900">
                      Direktur Keuangan
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
        title="Hapus Catatan Mutasi Bank"
        description={`Apakah Anda yakin ingin menghapus transaksi buku bank "${itemToDelete?.kodeMutasi} - ${itemToDelete?.keterangan}"?`}
        onConfirm={() => {
          if (itemToDelete) {
            deleteBukuBank(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
