import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SuratJalan, PurchaseOrder } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { Plus, Search, Truck, Eye, Printer, Trash2, CheckCircle2, ChevronRight, User, Download, X } from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';

export const SuratJalanView: React.FC = () => {
  const { 
    suratJalanList, 
    purchaseOrders, 
    addSuratJalan, 
    updateSuratJalan, 
    deleteSuratJalan, 
    updateSJStatus, 
    currentUser 
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('SEMUA');

  // Modal forms
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Detail/Kop Surat Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingSJ, setViewingSJ] = useState<SuratJalan | null>(null);

  // Form Fields
  const [selectedPOId, setSelectedPOId] = useState('');
  const [nomorSuratJalan, setNomorSuratJalan] = useState('');
  const [tanggalKirim, setTanggalKirim] = useState('');
  const [namaSopir, setNamaSopir] = useState('');
  const [platNomor, setPlatNomor] = useState('');
  const [jenisKendaraan, setJenisKendaraan] = useState<SuratJalan['jenisKendaraan']>('Colt Diesel');
  const [catatanKirim, setCatatanKirim] = useState('');

  // Status Change State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusingSJId, setStatusingSJId] = useState('');
  const [statusTarget, setStatusTarget] = useState<SuratJalan['statusPengiriman']>('Dalam Perjalanan');
  const [penerima, setPenerima] = useState('');

  const canModify = currentUser?.role === 'OWNER' || currentUser?.role === 'WAREHOUSE' || currentUser?.role === 'ADMIN_SALES';

  // Get eligible POs for delivering (PO having status Diterima, Diproduksi, or Siap Kirim)
  const eligiblePOs = purchaseOrders.filter(po => po.statusPO !== 'Selesai' && po.statusPO !== 'Dibatalkan');

  // Filter & Search
  const filteredSJ = suratJalanList.filter(sj => {
    const matchesSearch = sj.nomorSuratJalan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sj.pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sj.namaSopir.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sj.platNomor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'SEMUA' || sj.statusPengiriman === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    if (eligiblePOs.length === 0) {
      alert('Tidak ada Purchase Order aktif yang membutuhkan pengiriman saat ini.');
      return;
    }
    setEditingId(null);
    setSelectedPOId(eligiblePOs[0].id);
    setNomorSuratJalan('');
    setTanggalKirim(new Date().toISOString().split('T')[0]);
    setNamaSopir('');
    setPlatNomor('');
    setJenisKendaraan('Colt Diesel');
    setCatatanKirim('');
    setShowFormModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const po = purchaseOrders.find(p => p.id === selectedPOId);
    if (!po) return;

    // Create item list from PO items
    const items = po.item.map(i => ({
      namaPallet: i.namaPallet,
      jumlahKirim: i.jumlah,
      satuan: 'pcs'
    }));

    if (editingId) {
      updateSuratJalan(editingId, {
        tanggalKirim,
        namaSopir,
        platNomor,
        jenisKendaraan,
        catatanKirim
      });
    } else {
      addSuratJalan({
        nomorSuratJalan,
        purchaseOrderId: selectedPOId,
        nomorPO: po.nomorPO,
        pelanggan: po.pelanggan,
        tanggalKirim,
        namaSopir,
        platNomor,
        jenisKendaraan,
        itemKirim: items,
        statusPengiriman: 'Draf',
        catatanKirim
      });
    }

    setShowFormModal(false);
  };

  const handleOpenStatusModal = (sj: SuratJalan) => {
    setStatusingSJId(sj.id);
    setStatusTarget(sj.statusPengiriman === 'Draf' ? 'Dalam Perjalanan' : sj.statusPengiriman === 'Dalam Perjalanan' ? 'Tiba di Lokasi' : 'Diterima Pelanggan');
    setPenerima('');
    setShowStatusModal(true);
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSJStatus(statusingSJId, statusTarget, statusTarget === 'Diterima Pelanggan' ? penerima : undefined);
    setShowStatusModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data Surat Jalan ini?')) {
      deleteSuratJalan(id);
    }
  };

  const getSJStatusBadge = (status: SuratJalan['statusPengiriman']) => {
    switch (status) {
      case 'Draf': return 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400';
      case 'Dalam Perjalanan': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/45 dark:text-amber-400 animate-pulse';
      case 'Tiba di Lokasi': return 'bg-blue-100 text-blue-850 dark:bg-blue-950/45 dark:text-blue-300';
      case 'Diterima Pelanggan': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-300';
    }
  };

  const handleExportExcelSJ = () => {
    exportToExcel<SuratJalan>(
      suratJalanList,
      ['ID Surat Jalan', 'Nomor Surat Jalan', 'Nomor PO', 'Tanggal Kirim', 'Nama Sopir', 'Plat Nomor', 'Jenis Kendaraan', 'Nama Penerima', 'Status Pengiriman'],
      (sj) => [
        sj.id,
        sj.nomorSuratJalan,
        sj.nomorPO,
        sj.tanggalKirim,
        sj.namaSopir,
        sj.platNomor,
        sj.jenisKendaraan,
        sj.penerima || '-',
        sj.statusPengiriman
      ],
      `Database_Surat_Jalan`
    );
  };

  return (
    <div id="surat-jalan-view" className="p-4 md:p-6 space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Pengiriman & Surat Jalan Logistik</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Kelola ekspedisi pallet kayu, cetak surat pengantar sopir, dan lacak status terima.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-excel-sj"
            onClick={handleExportExcelSJ}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Download className="h-4.5 w-4.5" />
            Download Excel Surat Jalan
          </button>
          {canModify && (
            <button
              id="btn-tambah-sj"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              Cetak Surat Jalan Baru
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="search-sj-input"
            type="text"
            placeholder="Cari surat jalan, sopir, nopol, pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <span className="text-[10px] font-bold text-zinc-400 uppercase hidden sm:inline">Status Kirim</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full sm:w-auto px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-700 dark:text-zinc-300"
          >
            <option value="SEMUA">Semua Status Pengiriman</option>
            <option value="Draf">Draf / Belum Berangkat</option>
            <option value="Dalam Perjalanan">Dalam Perjalanan</option>
            <option value="Tiba di Lokasi">Tiba di Lokasi</option>
            <option value="Diterima Pelanggan">Diterima Pelanggan</option>
          </select>
        </div>

      </div>

      {/* Surat Jalan Grid / Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-zinc-200/80 dark:border-zinc-800/80">
                <th className="p-4">Tanggal Kirim</th>
                <th className="p-4">No. Surat Jalan</th>
                <th className="p-4">No. PO Referensi</th>
                <th className="p-4">Tujuan / Pelanggan</th>
                <th className="p-4">Armada / Sopir</th>
                <th className="p-4">Muatan Pallet</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-semibold text-zinc-700 dark:text-zinc-300">
              {filteredSJ.map((sj) => (
                <tr key={sj.id} id={`row-sj-${sj.id}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 whitespace-nowrap text-zinc-400 dark:text-zinc-500 font-bold">{sj.tanggalKirim}</td>
                  <td className="p-4 font-mono font-bold text-red-750 dark:text-red-400">{sj.nomorSuratJalan}</td>
                  <td className="p-4 font-mono text-[11px] text-zinc-500">{sj.nomorPO}</td>
                  <td className="p-4 font-extrabold text-zinc-900 dark:text-zinc-150">{sj.pelanggan}</td>
                  <td className="p-4">
                    <p className="font-extrabold text-zinc-800 dark:text-zinc-100">{sj.namaSopir}</p>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">{sj.jenisKendaraan} • {sj.platNomor}</p>
                  </td>
                  <td className="p-4">
                    {sj.itemKirim.map((it, idx) => (
                      <p key={idx} className="text-xs">
                        {it.namaPallet} <span className="font-bold text-red-600">({it.jumlahKirim} {it.satuan})</span>
                      </p>
                    ))}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${getSJStatusBadge(sj.statusPengiriman)}`}>
                      {sj.statusPengiriman}
                    </span>
                    {sj.penerima && (
                      <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Rcpt: {sj.penerima}</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* Printable View */}
                      <button
                        onClick={() => {
                          setViewingSJ(sj);
                          setShowDetailModal(true);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        title="Cetak Surat Jalan Resmi"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Expedite Workflow button */}
                      {canModify && sj.statusPengiriman !== 'Diterima Pelanggan' && (
                        <button
                          onClick={() => handleOpenStatusModal(sj)}
                          className="px-2 py-1 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 font-bold text-[10px] rounded hover:bg-red-100 flex items-center gap-0.5 cursor-pointer"
                          title="Lanjutkan Status"
                        >
                          Status <ChevronRight className="h-3 w-3" />
                        </button>
                      )}

                      {/* Delete */}
                      {canModify && (
                        <button
                          onClick={() => handleDelete(sj.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-650 rounded-lg cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                    </div>
                  </td>
                </tr>
              ))}

              {filteredSJ.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-400 dark:text-zinc-500">
                    Tidak ada Surat Jalan pengiriman yang aktif atau tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD / ISSUE SURAT JALAN FORM MODAL --- */}
      {showFormModal && (
        <div id="sj-form-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">Penerbitan Surat Jalan Baru</h3>
              <button onClick={() => setShowFormModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer text-xl">&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">PILIH PURCHASE ORDER AKTIF</label>
                <select
                  value={selectedPOId}
                  onChange={(e) => setSelectedPOId(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-red-500"
                >
                  {eligiblePOs.map(po => (
                    <option key={po.id} value={po.id}>
                      {po.pelanggan} - {po.nomorPO} ({po.item[0]?.jumlah} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">NOMOR SURAT JALAN</label>
                  <input
                    type="text"
                    required
                    value={nomorSuratJalan}
                    onChange={(e) => setNomorSuratJalan(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">TANGGAL KIRIM</label>
                  <input
                    type="date"
                    required
                    value={tanggalKirim}
                    onChange={(e) => setTanggalKirim(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Driver & Expedition details */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-850 space-y-3">
                <p className="text-[10px] font-extrabold text-zinc-400 uppercase">Detail Armada & Sopir Pengirim</p>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase">NAMA SOPIR</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Agus Santoso"
                      value={namaSopir}
                      onChange={(e) => setNamaSopir(e.target.value)}
                      className="block w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase">PLAT NOMOR</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., B 9821 TQ"
                      value={platNomor}
                      onChange={(e) => setPlatNomor(e.target.value)}
                      className="block w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono uppercase font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase">JENIS ARMADA</label>
                    <select
                      value={jenisKendaraan}
                      onChange={(e) => setJenisKendaraan(e.target.value as any)}
                      className="block w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                    >
                      <option value="Colt Diesel">Colt Diesel</option>
                      <option value="Fuso">Fuso</option>
                      <option value="Tronton">Tronton</option>
                      <option value="L300">L300 PickUp</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">CATATAN LOGISTIK / JALUR</label>
                <input
                  type="text"
                  placeholder="e.g., Lewat Tol Transjawa, harap bawa surat HT ISPM-15"
                  value={catatanKirim}
                  onChange={(e) => setCatatanKirim(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Penerbitan Surat Jalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- STATUS PROGRESSION MODAL --- */}
      {showStatusModal && (
        <div id="sj-status-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">Update Progres Pengiriman</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-5 space-y-4">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Perbarui status logistik perjalanan pengantaran pallet CV. Mustika Kayu Nusantara.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase font-sans">STATUS TARGET</label>
                <select
                  value={statusTarget}
                  onChange={(e) => setStatusTarget(e.target.value as any)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-red-500"
                >
                  <option value="Dalam Perjalanan">Dalam Perjalanan (Sopir Berangkat)</option>
                  <option value="Tiba di Lokasi">Tiba di Lokasi Pabrik Pembeli</option>
                  <option value="Diterima Pelanggan">Diterima Pelanggan (Serah Terima Selesai)</option>
                </select>
              </div>

              {/* Conditional receiver name if marking as Received */}
              {statusTarget === 'Diterima Pelanggan' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase font-sans">NAMA PENERIMA BARANG (GUDANG BUYER)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Pak Hendra (Staff Unilever)"
                    value={penerima}
                    onChange={(e) => setPenerima(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 font-medium">Melengkapi nama penerima akan otomatis menutup & menyelesaikan PO terkait.</p>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Simpan Status✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PRINTABLE SURAT JALAN MODAL --- */}
      {showDetailModal && viewingSJ && (
        <div id="sj-print-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-3xl rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 relative">
            
            {/* Floating Close Button X (Non-Printable) */}
            <button 
              onClick={() => setShowDetailModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer print:hidden z-10"
              title="Tutup Modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header controls (Non-printable) */}
            <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-red-600 animate-pulse" />
                <div>
                  <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 block">Surat Pengantar Jalan Logistik Resmi</span>
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">REVIEW SEBELUM CETAK</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-md"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Cetak
                </button>
                <button
                  onClick={() => {
                    if (confirm("Apakah Anda yakin ingin membatalkan proses cetak Surat Jalan ini?")) {
                      setShowDetailModal(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-200 rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Batalkan Cetak
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div id="print-area" className="p-8 md:p-12 bg-white text-black font-sans min-h-[600px]">
              
              {/* Header Letterhead */}
              <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-5 mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-1 bg-white border border-zinc-200 rounded-xl flex items-center justify-center shrink-0">
                    <CompanyLogo size="md" className="h-14 w-14" />
                  </div>
                  <div>
                    <h1 className="font-extrabold text-xl tracking-tight text-[#2E7D32]">CV. Mustika Kayu Nusantara</h1>
                    <p className="text-xs font-bold text-zinc-900 mt-0.5">Supplier Kayu Olahan, Aneka Industri Kayu</p>
                    <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed">
                      Alamat : Jl. Raya Mutiara Gading City, Pulo Kendal Ds. Setia Asih Rt.001/003 Kec. Tarumajaya<br />
                      Kab. Bekasi Hp. 0812-8147-8689/0812-1060-3063, Email : mustikakayunusantara@gmail.com
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-black text-zinc-850 uppercase tracking-tight">SURAT JALAN</h2>
                  <p className="text-xs font-mono font-bold text-red-750 mt-0.5">{viewingSJ.nomorSuratJalan}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Tanggal Kirim: {viewingSJ.tanggalKirim}</p>
                </div>
              </div>

              {/* Delivery and Vehicle info grid */}
              <div className="grid grid-cols-2 gap-8 mb-6 text-xs">
                <div>
                  <span className="block font-bold text-zinc-400 text-[9px] uppercase tracking-wider mb-1">ALAMAT PENGIRIMAN / TUJUAN:</span>
                  <p className="font-extrabold text-sm text-zinc-800">{viewingSJ.pelanggan}</p>
                  <p className="text-zinc-500 mt-0.5">Ref. Purchase Order: <span className="font-mono font-bold">{viewingSJ.nomorPO}</span></p>
                </div>
                <div>
                  <span className="block font-bold text-zinc-400 text-[9px] uppercase tracking-wider mb-1">ARMADA EKSPEDISI:</span>
                  <p className="font-extrabold text-zinc-800">Sopir: {viewingSJ.namaSopir}</p>
                  <p className="text-zinc-500 mt-0.5">Kendaraan: {viewingSJ.jenisKendaraan}</p>
                  <p className="text-zinc-500 mt-0.5">Plat Nomor Polisi: <span className="font-bold">{viewingSJ.platNomor}</span></p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left border-collapse mb-8 border border-zinc-250">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-250 font-bold uppercase text-[9px]">
                    <th className="p-3">Nama Pallet Kayu / Deskripsi Muatan</th>
                    <th className="p-3 text-center">Satuan</th>
                    <th className="p-3 text-right">Jumlah Muat</th>
                    <th className="p-3 text-center">Kondisi Fisik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {viewingSJ.itemKirim.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-bold text-zinc-800">
                        {item.namaPallet}
                      </td>
                      <td className="p-3 text-center text-zinc-600">pcs</td>
                      <td className="p-3 text-right font-black">{item.jumlahKirim} pcs</td>
                      <td className="p-3 text-center text-zinc-500">Baik / Baru Oven</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Notes */}
              {viewingSJ.catatanKirim && (
                <div className="mb-8 p-3 bg-zinc-55 border rounded text-xs text-zinc-600">
                  <span className="font-bold block text-[10px] uppercase text-zinc-400 mb-0.5">Catatan Logistik:</span>
                  {viewingSJ.catatanKirim}
                </div>
              )}

              {/* Three Signatures Block */}
              <div className="grid grid-cols-3 gap-4 text-center text-xs pt-12 border-t border-dashed border-zinc-250">
                <div>
                  <p>Pengirim (Sopir),</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">{viewingSJ.namaSopir}</p>
                  <p className="text-[10px] text-zinc-500">Ekspedisi CV. MKN</p>
                </div>
                <div>
                  <p>Petugas Gudang (MKN),</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">Staf Gudang</p>
                  <p className="text-[10px] text-zinc-500">Logistik Pallet</p>
                </div>
                <div>
                  <p>Penerima Pelanggan,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">{viewingSJ.penerima || '............................'}</p>
                  <p className="text-[10px] text-zinc-500">(Cap & Tanda Tangan)</p>
                </div>
              </div>

              {/* Standard text footer */}
              <div className="mt-8 text-center text-[9px] text-zinc-400 border-t pt-4">
                Surat Jalan ini sah dikeluarkan oleh sistem CV. Mustika Kayu Nusantara. Putih: Finance, Merah: Gudang, Kuning: Sopir.
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
