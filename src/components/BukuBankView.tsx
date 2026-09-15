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

  const [searchTerm, setSearchTerm] = useState('');
  const [jenisFilter, setJenisFilter] = useState<'Semua' | 'MASUK' | 'KELUAR'>('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BukuBankItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditSaldoAwalModal, setShowEditSaldoAwalModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [tempSaldoAwal, setTempSaldoAwal] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    bank: 'Bank Mandiri',
    nomorRekening: '156-00-1909954-0',
    jenis: 'MASUK' as 'MASUK' | 'KELUAR',
    kategori: 'Penerimaan Piutang Buyer',
    keterangan: '',
    nominal: 0,
    referensi: ''
  });

  const { 
    bukuBankList, 
    addBukuBank, 
    updateBukuBank, 
    deleteBukuBank, 
    clearAllBukuBank,
    currentUser,
    saldoAwalBukuBank,
    updateSaldoAwalBukuBank
  } = useApp();

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

      const matchesJenis = jenisFilter === 'Semua' || item.jenis === jenisFilter || (jenisFilter === 'MASUK' && item.tipe === 'Masuk') || (jenisFilter === 'KELUAR' && item.tipe === 'Keluar');

      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && item.tanggal >= startDate;
      if (endDate) matchesDate = matchesDate && item.tanggal <= endDate;

      return matchesSearch && matchesJenis && matchesDate;
    });
  }, [bukuBankList, searchTerm, jenisFilter, startDate, endDate]);

  // Bank Balances - Only Bank Mandiri
  const totalSaldoBank = useMemo(() => {
    const masuk = bukuBankList.filter(b => b.jenis === 'MASUK' || b.tipe === 'Masuk').reduce((a, b) => a + b.nominal, 0);
    const keluar = bukuBankList.filter(b => b.jenis === 'KELUAR' || b.tipe === 'Keluar').reduce((a, b) => a + b.nominal, 0);
    return saldoAwalBukuBank + masuk - keluar;
  }, [bukuBankList, saldoAwalBukuBank]);

  const totalMasukKumulatif = useMemo(() => {
    return bukuBankList.filter(b => b.jenis === 'MASUK' || b.tipe === 'Masuk').reduce((a, b) => a + b.nominal, 0);
  }, [bukuBankList]);

  const totalKeluarKumulatif = useMemo(() => {
    return bukuBankList.filter(b => b.jenis === 'KELUAR' || b.tipe === 'Keluar').reduce((a, b) => a + b.nominal, 0);
  }, [bukuBankList]);

  const totalMasukPeriode = useMemo(() => {
    return filteredList.filter(i => i.jenis === 'MASUK' || i.tipe === 'Masuk').reduce((a, b) => a + b.nominal, 0);
  }, [filteredList]);

  const totalKeluarPeriode = useMemo(() => {
    return filteredList.filter(i => i.jenis === 'KELUAR' || i.tipe === 'Keluar').reduce((a, b) => a + b.nominal, 0);
  }, [filteredList]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.keterangan || formData.nominal <= 0) {
      alert('Mohon isi keterangan dan nominal valid.');
      return;
    }

    if (editingId) {
      updateBukuBank(editingId, {
        ...formData,
        tipe: formData.jenis === 'MASUK' ? 'Masuk' : 'Keluar',
      });
    } else {
      addBukuBank({
        ...formData,
        bank: 'Bank Mandiri',
        nomorRekening: '156-00-1909954-0',
        namaBank: 'Mandiri (156-00-1909954-0)',
        tipe: formData.jenis === 'MASUK' ? 'Masuk' : 'Keluar',
        kodeMutasi: `BNK-${Math.floor(1000 + Math.random() * 9000)}`
      });
    }

    setShowAddModal(false);
    setEditingId(null);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      bank: 'Bank Mandiri',
      nomorRekening: '156-00-1909954-0',
      jenis: 'MASUK',
      kategori: 'Penerimaan Piutang Buyer',
      keterangan: '',
      nominal: 0,
      referensi: ''
    });
  };

  const handleEditClick = (item: BukuBankItem) => {
    setEditingId(item.id);
    setFormData({
      tanggal: item.tanggal,
      bank: item.bank,
      nomorRekening: item.nomorRekening,
      jenis: item.jenis || (item.tipe === 'Masuk' ? 'MASUK' : 'KELUAR'),
      kategori: item.kategori,
      keterangan: item.keterangan,
      nominal: item.nominal,
      referensi: item.referensi || ''
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-700 dark:text-amber-400">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Buku Bank (Bank Statement)</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Rekening Giro Resmi: Bank Mandiri 156-00-1909954-0 a.n CV MUSTIKA KAYU NUSANTARA</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setTempSaldoAwal(String(saldoAwalBukuBank));
              setShowEditSaldoAwalModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
            <span>Atur Saldo Awal Giro</span>
          </button>
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
            <span>Cetak Rekening Koran PDF</span>
          </button>
        </div>
      </div>

      {/* Account Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-zinc-900 flex justify-between items-start">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Bank Mandiri (156-00-1909954-0)</span>
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-white">{formatRupiah(totalSaldoBank)}</div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 block font-medium">a.n CV MUSTIKA KAYU NUSANTARA</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-zinc-500 font-bold">Saldo Awal: {formatRupiah(saldoAwalBukuBank)}</span>
              <button
                onClick={() => {
                  setTempSaldoAwal(String(saldoAwalBukuBank));
                  setShowEditSaldoAwalModal(true);
                }}
                className="text-[9px] font-extrabold text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
          <Building className="h-5 w-5 text-amber-600 shrink-0" />
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Penerimaan (Debet)</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(totalMasukKumulatif)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Akumulasi Masuk ke Rekening</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Total Pengeluaran (Kredit)</span>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">{formatRupiah(totalKeluarKumulatif)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Akumulasi Keluar dari Rekening</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Jenis Mutasi</option>
            <option value="MASUK">Debet / Masuk (Deposit)</option>
            <option value="KELUAR">Kredit / Keluar (Payment)</option>
          </select>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-xs flex-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-zinc-800 dark:text-zinc-200 focus:outline-none text-[11px] w-full"
              />
            </div>
            <span className="text-zinc-400 text-xs">s/d</span>
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-xs flex-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-zinc-800 dark:text-zinc-200 focus:outline-none text-[11px] w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">
          <span className="font-bold text-sm text-zinc-900 dark:text-white">Mutasi Rekening Koran ({filteredList.length})</span>
          {bukuBankList.length > 0 && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-white border border-red-200 dark:border-red-900/50 hover:bg-red-600 rounded-lg cursor-pointer transition-all"
            >
              Hapus Semua Mutasi Bank (Reset)
            </button>
          )}
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
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        Bank Mandiri
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">156-00-1909954-0</span>
                    </td>
                    <td className="p-3.5 font-medium text-zinc-700 dark:text-zinc-300">{item.kategori}</td>
                    <td className="p-3.5 text-zinc-800 dark:text-zinc-200 max-w-[280px]">
                      <span className="font-semibold block">{item.keterangan}</span>
                      {item.referensi && <span className="text-[10px] text-zinc-400">Ref: {item.referensi}</span>}
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {item.jenis === 'MASUK' || item.tipe === 'Masuk' ? formatRupiah(item.nominal) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-bold text-red-600 dark:text-red-400">
                      {item.jenis === 'KELUAR' || item.tipe === 'Keluar' ? formatRupiah(item.nominal) : '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                          title="Edit Catatan"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Mutasi"
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

      {/* MODAL 1: Add Bank Mutation */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                {editingId ? 'Edit Mutasi Bank Mandiri' : 'Catat Mutasi Bank Mandiri'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                }} 
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Rekening Bank</label>
                  <div className="w-full px-3 py-2 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-900 dark:text-amber-200 font-bold">
                    Mandiri 156-00-1909954-0
                  </div>
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
                  placeholder="Contoh: REF-MND-992812"
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm"
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
                  onClick={() => triggerPrintOrPdf('bank-report-sheet', `Rekening_Koran_Mandiri_${startDate || 'all'}_sd_${endDate || 'all'}`)}
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
                      <h2 className="text-lg font-black text-red-900">CV MUSTIKA KAYU NUSANTARA</h2>
                      <p className="text-[10px] text-zinc-600">Laporan Rekening Koran & Mutasi Buku Bank Perusahaan</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-600">
                    <p><b>Periode:</b> {startDate || 'Awal'} s/d {endDate || 'Sekarang'}</p>
                    <p><b>Rekening:</b> Bank Mandiri 156-00-1909954-0</p>
                    <p className="text-[9px] text-zinc-500">a.n CV MUSTIKA KAYU NUSANTARA</p>
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
                    <span className="text-amber-800 block font-bold">Saldo Akhir Kumulatif:</span>
                    <span className="font-extrabold text-amber-800 text-sm">{formatRupiah(totalSaldoBank)}</span>
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
                        <td className="p-2 font-semibold">Bank Mandiri</td>
                        <td className="p-2 font-medium">{item.keterangan}</td>
                        <td className="p-2 text-zinc-500">{item.referensi || '-'}</td>
                        <td className="p-2 text-right font-bold text-emerald-700">{item.jenis === 'MASUK' || item.tipe === 'Masuk' ? formatRupiah(item.nominal) : '-'}</td>
                        <td className="p-2 text-right font-bold text-red-700">{item.jenis === 'KELUAR' || item.tipe === 'Keluar' ? formatRupiah(item.nominal) : '-'}</td>
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

      {/* Edit Saldo Awal Modal */}
      {showEditSaldoAwalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
              <span className="font-extrabold text-sm text-zinc-900 dark:text-white">Edit Saldo Awal Bank Mandiri</span>
              <button
                onClick={() => setShowEditSaldoAwalModal(false)}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const num = Number(tempSaldoAwal);
              if (!isNaN(num)) {
                updateSaldoAwalBukuBank(num);
                setShowEditSaldoAwalModal(false);
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
                  onClick={() => setShowEditSaldoAwalModal(false)}
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

      {/* Reset Mutasi Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-red-50 dark:border-red-950 flex items-center justify-between bg-red-50/50 dark:bg-red-950/20">
              <span className="font-extrabold text-sm text-red-600 dark:text-red-400">Hapus Semua Mutasi Bank</span>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Apakah Anda yakin ingin <strong className="text-red-600">menghapus seluruh catatan transaksi/mutasi bank</strong>? Tindakan ini akan mengosongkan semua riwayat rekening koran Bank Mandiri Anda secara permanen di server dan tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    clearAllBukuBank();
                    setShowResetConfirm(false);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Ya, Hapus Semua Mutasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
