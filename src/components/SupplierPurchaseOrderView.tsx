import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PurchaseOrderSupplier, POSupplierItem, SyaratPembayaran } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { triggerPrintOrPdf } from '../utils/exportPdf';
import { 
  PAYMENT_TERMS_OPTIONS, 
  calculateDueDateFromInvoice, 
  formatDateDisplay, 
  getTermsBadgeColor 
} from '../utils/paymentTerms';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Printer, 
  CheckCircle, 
  Clock, 
  Truck, 
  PackageCheck, 
  AlertCircle, 
  Building2, 
  Eye, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  X, 
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  Boxes,
  Phone,
  UserCheck
} from 'lucide-react';

interface SupplierPurchaseOrderViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const SupplierPurchaseOrderView: React.FC<SupplierPurchaseOrderViewProps> = ({ onNavigateTab }) => {
  const { 
    poSuppliers, 
    addPOSupplier, 
    updatePOSupplier, 
    deletePOSupplier, 
    updatePOSupplierStatus,
    terimaBarangPOSupplier,
    materials,
    hutangList,
    currentUser 
  } = useApp();

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusPOFilter, setStatusPOFilter] = useState<string>('Semua');
  const [statusAPFilter, setStatusAPFilter] = useState<string>('Semua');
  const [kategoriFilter, setKategoriFilter] = useState<string>('Semua');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<PurchaseOrderSupplier | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState<PurchaseOrderSupplier | null>(null);
  const [receiveNotes, setReceiveNotes] = useState('');
  const [editingPO, setEditingPO] = useState<PurchaseOrderSupplier | null>(null);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrderSupplier | null>(null);

  // Form state for Create / Edit PO
  const [formData, setFormData] = useState<{
    nomorPO: string;
    nomorRefSupplier: string;
    supplier: string;
    alamatSupplier: string;
    teleponSupplier: string;
    picSupplier: string;
    tanggal: string;
    tanggalPengiriman: string;
    syaratPembayaran: SyaratPembayaran;
    tanggalJatuhTempo: string;
    kategori: PurchaseOrderSupplier['kategori'];
    items: POSupplierItem[];
    tipePajak: 'Non PPN' | 'PPN 11%' | 'PPh 23' | 'PPN & PPh';
    biayaKirim: number;
    catatan: string;
  }>({
    nomorPO: '',
    nomorRefSupplier: '',
    supplier: '',
    alamatSupplier: '',
    teleponSupplier: '',
    picSupplier: '',
    tanggal: new Date().toISOString().split('T')[0],
    tanggalPengiriman: '',
    syaratPembayaran: 'Tempo 30 Hari',
    tanggalJatuhTempo: calculateDueDateFromInvoice(new Date().toISOString().split('T')[0], 'Tempo 30 Hari'),
    kategori: 'Bahan Baku Kayu',
    items: [
      {
        namaMaterial: '',
        ukuran: '',
        kategori: 'Kayu Log',
        jumlah: 1,
        satuan: 'm3',
        hargaSatuan: 0,
        subtotal: 0
      }
    ],
    tipePajak: 'PPN 11%',
    biayaKirim: 0,
    catatan: ''
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  // Generate automatic PO Number
  const generateNewPONumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const existingCount = poSuppliers.length + 1;
    const seq = String(existingCount).padStart(3, '0');
    return `PO-SUP/${year}/${month}/${seq}`;
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const terms: SyaratPembayaran = 'Tempo 30 Hari';
    setFormData({
      nomorPO: generateNewPONumber(),
      nomorRefSupplier: '',
      supplier: '',
      alamatSupplier: '',
      teleponSupplier: '',
      picSupplier: '',
      tanggal: todayStr,
      tanggalPengiriman: '',
      syaratPembayaran: terms,
      tanggalJatuhTempo: calculateDueDateFromInvoice(todayStr, terms),
      kategori: 'Bahan Baku Kayu',
      items: [
        {
          namaMaterial: '',
          ukuran: '',
          kategori: 'Kayu Log',
          jumlah: 1,
          satuan: 'm3',
          hargaSatuan: 0,
          subtotal: 0
        }
      ],
      tipePajak: 'PPN 11%',
      biayaKirim: 0,
      catatan: ''
    });
    setEditingPO(null);
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (po: PurchaseOrderSupplier) => {
    setEditingPO(po);
    setFormData({
      nomorPO: po.nomorPO,
      nomorRefSupplier: po.nomorRefSupplier || '',
      supplier: po.supplier,
      alamatSupplier: po.alamatSupplier || '',
      teleponSupplier: po.teleponSupplier || '',
      picSupplier: po.picSupplier || '',
      tanggal: po.tanggal,
      tanggalPengiriman: po.tanggalPengiriman || '',
      syaratPembayaran: po.syaratPembayaran,
      tanggalJatuhTempo: po.tanggalJatuhTempo,
      kategori: po.kategori,
      items: po.items.map(it => ({ ...it })),
      tipePajak: po.tipePajak || 'Non PPN',
      biayaKirim: po.biayaKirim || 0,
      catatan: po.catatan || ''
    });
    setShowCreateModal(true);
  };

  // Handle Item Row changes
  const handleItemChange = (index: number, field: keyof POSupplierItem, value: any) => {
    const updatedItems = [...formData.items];
    const current = { ...updatedItems[index], [field]: value };
    
    if (field === 'jumlah' || field === 'hargaSatuan') {
      const j = field === 'jumlah' ? Number(value) || 0 : current.jumlah;
      const h = field === 'hargaSatuan' ? Number(value) || 0 : current.hargaSatuan;
      current.subtotal = j * h;
    }
    
    updatedItems[index] = current;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  // Quick Select from existing materials inventory
  const handleSelectExistingMaterial = (index: number, materialId: string) => {
    const mat = materials.find(m => m.id === materialId);
    if (!mat) return;

    const updatedItems = [...formData.items];
    const current = updatedItems[index];
    current.materialId = mat.id;
    current.kodeMaterial = mat.kode;
    current.namaMaterial = mat.nama;
    current.ukuran = mat.ukuran || mat.dimensi || '';
    current.kategori = mat.kategori;
    current.satuan = mat.satuan || 'm3';
    current.hargaSatuan = mat.hargaPerUnit || 0;
    current.subtotal = current.jumlah * (mat.hargaPerUnit || 0);

    updatedItems[index] = current;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleAddItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          namaMaterial: '',
          ukuran: '',
          kategori: 'Kayu Log',
          jumlah: 1,
          satuan: 'm3',
          hargaSatuan: 0,
          subtotal: 0
        }
      ]
    }));
  };

  const handleRemoveItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Calculation for current form
  const formSubtotal = useMemo(() => {
    return formData.items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
  }, [formData.items]);

  const formPpnNominal = useMemo(() => {
    if (formData.tipePajak === 'PPN 11%' || formData.tipePajak === 'PPN & PPh') {
      return Math.round(formSubtotal * 0.11);
    }
    return 0;
  }, [formSubtotal, formData.tipePajak]);

  const formPphNominal = useMemo(() => {
    if (formData.tipePajak === 'PPh 23' || formData.tipePajak === 'PPN & PPh') {
      return Math.round(formSubtotal * 0.02);
    }
    return 0;
  }, [formSubtotal, formData.tipePajak]);

  const formTotalHarga = useMemo(() => {
    let total = formSubtotal + formPpnNominal + (Number(formData.biayaKirim) || 0);
    if (formData.tipePajak === 'PPh 23') {
      total -= formPphNominal; // Potong PPh 23
    }
    return Math.max(0, total);
  }, [formSubtotal, formPpnNominal, formPphNominal, formData.biayaKirim, formData.tipePajak]);

  // Submit Create or Edit PO
  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier.trim()) {
      alert('Nama Supplier wajib diisi!');
      return;
    }
    if (!formData.nomorPO.trim()) {
      alert('Nomor PO wajib diisi!');
      return;
    }
    if (formData.items.length === 0 || !formData.items[0].namaMaterial.trim()) {
      alert('Minimal masukkan 1 item material dengan nama barang yang jelas!');
      return;
    }

    if (editingPO) {
      updatePOSupplier(editingPO.id, {
        nomorPO: formData.nomorPO.trim(),
        nomorRefSupplier: formData.nomorRefSupplier.trim(),
        supplier: formData.supplier.trim(),
        alamatSupplier: formData.alamatSupplier.trim(),
        teleponSupplier: formData.teleponSupplier.trim(),
        picSupplier: formData.picSupplier.trim(),
        tanggal: formData.tanggal,
        tanggalPengiriman: formData.tanggalPengiriman,
        syaratPembayaran: formData.syaratPembayaran,
        tanggalJatuhTempo: formData.tanggalJatuhTempo,
        kategori: formData.kategori,
        items: formData.items,
        subtotal: formSubtotal,
        tipePajak: formData.tipePajak,
        ppnNominal: formPpnNominal,
        pphNominal: formPphNominal,
        biayaKirim: Number(formData.biayaKirim) || 0,
        totalHarga: formTotalHarga,
        catatan: formData.catatan
      });
      setShowCreateModal(false);
      setEditingPO(null);
    } else {
      addPOSupplier({
        nomorPO: formData.nomorPO.trim(),
        nomorRefSupplier: formData.nomorRefSupplier.trim(),
        supplier: formData.supplier.trim(),
        alamatSupplier: formData.alamatSupplier.trim(),
        teleponSupplier: formData.teleponSupplier.trim(),
        picSupplier: formData.picSupplier.trim(),
        tanggal: formData.tanggal,
        tanggalPengiriman: formData.tanggalPengiriman,
        syaratPembayaran: formData.syaratPembayaran,
        tanggalJatuhTempo: formData.tanggalJatuhTempo,
        kategori: formData.kategori,
        items: formData.items,
        subtotal: formSubtotal,
        tipePajak: formData.tipePajak,
        ppnNominal: formPpnNominal,
        pphNominal: formPphNominal,
        biayaKirim: Number(formData.biayaKirim) || 0,
        totalHarga: formTotalHarga,
        statusPO: 'Draf',
        catatan: formData.catatan,
        dibuatOleh: currentUser?.name || 'Sales Admin'
      });
      setShowCreateModal(false);
    }
  };

  // Confirm Penerimaan Barang di Gudang
  const handleConfirmReceive = () => {
    if (!showReceiveModal) return;
    const result = terimaBarangPOSupplier(showReceiveModal.id, receiveNotes);
    alert(result.message);
    setShowReceiveModal(null);
    setReceiveNotes('');
  };

  // Filtered PO Suppliers
  const filteredPOs = useMemo(() => {
    return poSuppliers.filter(po => {
      const matchSearch = 
        po.nomorPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.picSupplier && po.picSupplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (po.nomorRefSupplier && po.nomorRefSupplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        po.items.some(i => i.namaMaterial.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatusPO = statusPOFilter === 'Semua' || po.statusPO === statusPOFilter;
      const matchStatusAP = statusAPFilter === 'Semua' || po.statusAP === statusAPFilter;
      const matchKategori = kategoriFilter === 'Semua' || po.kategori === kategoriFilter;

      return matchSearch && matchStatusPO && matchStatusAP && matchKategori;
    });
  }, [poSuppliers, searchTerm, statusPOFilter, statusAPFilter, kategoriFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalCount = poSuppliers.length;
    const totalNilai = poSuppliers.reduce((acc, po) => acc + (po.totalHarga || 0), 0);
    const totalBelumLunas = poSuppliers
      .filter(po => po.statusAP !== 'Lunas')
      .reduce((acc, po) => {
        // Look up corresponding sisa hutang from hutangList
        const linkedHutang = hutangList.find(h => h.poSupplierId === po.id || (po.apId && h.id === po.apId));
        return acc + (linkedHutang ? linkedHutang.sisaHutang : po.totalHarga);
      }, 0);
    const countDiterima = poSuppliers.filter(po => po.statusPO === 'Diterima Gudang' || po.statusPO === 'Selesai').length;
    const countDalamPerjalanan = poSuppliers.filter(po => po.statusPO === 'Dikirim Supplier').length;

    return { totalCount, totalNilai, totalBelumLunas, countDiterima, countDalamPerjalanan };
  }, [poSuppliers, hutangList]);

  // Frequent Vendors list for quick auto-fill
  const frequentSuppliers = [
    { nama: 'PT Sumber Kayu Lestari', alamat: 'Jl. Raya Magelang KM 14, Sleman, DIY', telp: '0812-3456-7890', pic: 'Bpk. H. Sudirman', kat: 'Bahan Baku Kayu' },
    { nama: 'CV Log Makmur Abadi', alamat: 'Kutoarjo, Purworejo, Jawa Tengah', telp: '0857-8910-1122', pic: 'Ibu Ratna Susanti', kat: 'Bahan Baku Kayu' },
    { nama: 'PT Baja Paku Nusantara', alamat: 'Kawasan Industri Candi Blok 8, Semarang', telp: '024-7612345', pic: 'Bpk. Eko Wibowo', kat: 'Paku & Besi' },
    { nama: 'UD Rimba Sejahtera Wood', alamat: 'Temanggung, Jawa Tengah', telp: '0813-9876-5432', pic: 'Bpk. Bambang Sutrisno', kat: 'Bahan Baku Kayu' },
    { nama: 'PT Pelumas Prima Sentosa', alamat: 'Jl. Industri Sayung KM 12, Demak', telp: '024-6581122', pic: 'Bpk. Rudy Hartono', kat: 'Solar & Bahan Bakar' }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-700 via-red-800 to-zinc-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-red-600/30 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none">
          <ShoppingCart className="w-64 h-64 text-white" />
        </div>
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 bg-red-950/70 border border-red-500/40 px-3 py-1 rounded-full text-xs font-semibold text-red-200">
            <Building2 className="w-3.5 h-3.5" />
            <span>Admin Sales & Procurement Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Purchase Order ke Supplier (Pengadaan)
          </h1>
          <p className="text-xs sm:text-sm text-red-100/80 max-w-2xl leading-relaxed">
            Penerbitan dokumen resmi PO untuk pembelian kayu log, balok, papan, dan paku kepada vendor rekanan.
            Setiap PO yang dibuat <span className="font-bold text-white underline decoration-amber-400">otomatis terdaftar ke Laporan AP (Accounts Payable)</span> untuk proses pembayaran Finance.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat PO Supplier Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total PO Diterbitkan</div>
            <div className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">{stats.totalCount} PO</div>
            <div className="text-[11px] text-zinc-400">Semua vendor rekanan</div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Nilai Pengadaan</div>
            <div className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white mt-0.5">{formatRupiah(stats.totalNilai)}</div>
            <div className="text-[11px] text-zinc-400">Akumulasi seluruh PO</div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tagihan Hutang di AP</div>
            <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{formatRupiah(stats.totalBelumLunas)}</div>
            <div className="text-[11px] text-zinc-400">Belum lunas dibayar</div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Diterima di Gudang</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.countDiterima} PO</div>
            <div className="text-[11px] text-zinc-400">{stats.countDalamPerjalanan} PO dalam perjalanan</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari No. PO, Supplier, PIC, Material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div>
            <select
              value={statusPOFilter}
              onChange={(e) => setStatusPOFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="Semua">Semua Status PO</option>
              <option value="Draf">Draf</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Dikirim Supplier">Dikirim Supplier</option>
              <option value="Diterima Gudang">Diterima Gudang</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>

          <div>
            <select
              value={statusAPFilter}
              onChange={(e) => setStatusAPFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="Semua">Semua Status AP (Hutang)</option>
              <option value="Belum Lunas">Belum Lunas</option>
              <option value="Sebagian">Sebagian</option>
              <option value="Lunas">Lunas</option>
            </select>
          </div>

          <div>
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="Semua">Semua Kategori Bahan</option>
              <option value="Bahan Baku Kayu">Bahan Baku Kayu</option>
              <option value="Paku & Besi">Paku & Besi</option>
              <option value="Sewa / Perbaikan Mesin">Sewa / Perbaikan Mesin</option>
              <option value="Solar & Bahan Bakar">Solar & Bahan Bakar</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
              Daftar Purchase Order ke Supplier
            </span>
            <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {filteredPOs.length} Dokumen
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-3.5 whitespace-nowrap">No. PO & Tanggal</th>
                <th className="p-3.5">Supplier / Rekanan</th>
                <th className="p-3.5">Material & Kuantitas</th>
                <th className="p-3.5">Syarat Bayar & Jatuh Tempo</th>
                <th className="p-3.5 text-right">Total Nilai PO</th>
                <th className="p-3.5 text-center">Status PO</th>
                <th className="p-3.5 text-center">Status AP (Hutang)</th>
                <th className="p-3.5 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-zinc-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30 text-zinc-400" />
                    <p className="font-semibold">Belum ada data Purchase Order ke Supplier yang sesuai.</p>
                    <p className="text-[11px] mt-1">Klik tombol "+ Buat PO Supplier Baru" untuk memesan bahan baku ke vendor.</p>
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => {
                  // Check linked AP status from hutangList
                  const linkedHutang = hutangList.find(h => h.poSupplierId === po.id || (po.apId && h.id === po.apId));
                  const currentAPStatus = linkedHutang ? linkedHutang.status : po.statusAP;
                  const currentSisa = linkedHutang ? linkedHutang.sisaHutang : (po.statusAP === 'Lunas' ? 0 : po.totalHarga);

                  return (
                    <tr key={po.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-red-600 dark:text-red-400 block">{po.nomorPO}</span>
                        <span className="text-[11px] text-zinc-400">{po.tanggal}</span>
                        {po.nomorRefSupplier && (
                          <span className="block text-[10px] text-zinc-500 mt-0.5">Ref: {po.nomorRefSupplier}</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-zinc-900 dark:text-white block">{po.supplier}</span>
                        <span className="text-[11px] text-zinc-400 block">{po.kategori}</span>
                        {po.picSupplier && (
                          <span className="text-[10px] text-zinc-500">PIC: {po.picSupplier}</span>
                        )}
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="space-y-1">
                          {po.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-zinc-800 dark:text-zinc-200 font-medium">
                              • {item.namaMaterial} <span className="text-zinc-400 font-normal">({item.jumlah} {item.satuan})</span>
                            </div>
                          ))}
                          {po.items.length > 2 && (
                            <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold">
                              + {po.items.length - 2} material lainnya
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getTermsBadgeColor(po.syaratPembayaran)}`}>
                          {po.syaratPembayaran}
                        </span>
                        <div className="text-[11px] text-zinc-500 mt-1">
                          Jatuh Tempo: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{po.tanggalJatuhTempo}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-black text-zinc-900 dark:text-white">
                        {formatRupiah(po.totalHarga)}
                        {po.tipePajak && po.tipePajak !== 'Non PPN' && (
                          <span className="block text-[10px] text-zinc-400 font-normal">{po.tipePajak}</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <select
                          value={po.statusPO}
                          onChange={(e) => updatePOSupplierStatus(po.id, e.target.value as any)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            po.statusPO === 'Diterima Gudang' || po.statusPO === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : po.statusPO === 'Dikirim Supplier'
                              ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                              : po.statusPO === 'Disetujui'
                              ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                              : po.statusPO === 'Dibatalkan'
                              ? 'bg-zinc-200 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400'
                              : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                          }`}
                        >
                          <option value="Draf">Draf</option>
                          <option value="Disetujui">Disetujui</option>
                          <option value="Dikirim Supplier">Dikirim Supplier</option>
                          <option value="Diterima Gudang">Diterima Gudang</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Dibatalkan">Dibatalkan</option>
                        </select>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            currentAPStatus === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : currentAPStatus === 'Sebagian'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {currentAPStatus === 'Lunas' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {currentAPStatus}
                          </span>
                          {currentAPStatus !== 'Lunas' && currentSisa > 0 && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              Sisa: {formatRupiah(currentSisa)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Receive into Warehouse Button */}
                          {po.statusPO !== 'Diterima Gudang' && po.statusPO !== 'Selesai' && po.statusPO !== 'Dibatalkan' && (
                            <button
                              onClick={() => {
                                setShowReceiveModal(po);
                                setReceiveNotes(`Penerimaan barang dari PO ${po.nomorPO} - ${po.supplier}`);
                              }}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-lg transition-colors cursor-pointer"
                              title="Konfirmasi Terima Barang di Gudang"
                            >
                              <PackageCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Print / Detail Button */}
                          <button
                            onClick={() => setShowDetailModal(po)}
                            className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                            title="Detail & Cetak Dokumen PO"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit PO Button */}
                          <button
                            onClick={() => handleOpenEdit(po)}
                            className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                            title="Edit PO"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setPoToDelete(po)}
                            className="p-1.5 bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/50 text-zinc-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Hapus PO"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Buat / Edit PO Supplier */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-red-200 block">
                  FORM PENGADAAN MATERIAL & LOG KAYU
                </span>
                <h3 className="text-xl font-black text-white">
                  {editingPO ? 'Edit Purchase Order ke Supplier' : 'Buat Purchase Order ke Supplier Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Form */}
            <form onSubmit={handleSubmitPO} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Info Integration Banner */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Otomatis Terintegrasi ke Laporan Hutang (AP):</span>
                  <p className="mt-0.5 text-amber-700 dark:text-amber-300/90">
                    Menyimpan PO ini akan otomatis menambahkan tagihan baru pada modul <strong>Laporan Hutang (AP)</strong> dengan jatuh tempo sesuai syarat pembayaran. Tim Finance dapat langsung memantau dan mencatat pelunasan faktur.
                  </p>
                </div>
              </div>

              {/* Vendor & General Information */}
              <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                    1. Data Rekanan / Vendor Supplier
                  </h4>
                  <div className="text-[11px] text-zinc-500">
                    Pilih vendor cepat:
                    <select
                      onChange={(e) => {
                        const vendor = frequentSuppliers.find(s => s.nama === e.target.value);
                        if (vendor) {
                          setFormData(prev => ({
                            ...prev,
                            supplier: vendor.nama,
                            alamatSupplier: vendor.alamat,
                            teleponSupplier: vendor.telp,
                            picSupplier: vendor.pic,
                            kategori: vendor.kat as any
                          }));
                        }
                      }}
                      className="ml-2 px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-xs"
                      defaultValue=""
                    >
                      <option value="" disabled>-- Vendor Langganan --</option>
                      {frequentSuppliers.map(s => <option key={s.nama} value={s.nama}>{s.nama}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nama Supplier / Vendor *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: PT Sumber Kayu Lestari"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nama PIC / Kontak Vendor
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Bpk. H. Sudirman"
                      value={formData.picSupplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, picSupplier: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      No. Telepon / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 0812-3456-7890"
                      value={formData.teleponSupplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, teleponSupplier: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Alamat Pabrik / Gudang Vendor
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jl. Raya Magelang KM 14, Sleman, DI Yogyakarta"
                      value={formData.alamatSupplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, alamatSupplier: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      No. Ref / Penawaran Vendor
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: SPH-088/SKL/26"
                      value={formData.nomorRefSupplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, nomorRefSupplier: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Order & Payment Conditions */}
              <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  2. Parameter Pesanan & Syarat Pembayaran
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nomor PO Supplier *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nomorPO}
                      onChange={(e) => setFormData(prev => ({ ...prev, nomorPO: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Tanggal Pemesanan *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.tanggal}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        const newDue = calculateDueDateFromInvoice(newDate, formData.syaratPembayaran);
                        setFormData(prev => ({ ...prev, tanggal: newDate, tanggalJatuhTempo: newDue }));
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Syarat Pembayaran (TOP) *
                    </label>
                    <select
                      value={formData.syaratPembayaran}
                      onChange={(e) => {
                        const terms = e.target.value as SyaratPembayaran;
                        const newDue = calculateDueDateFromInvoice(formData.tanggal, terms);
                        setFormData(prev => ({ ...prev, syaratPembayaran: terms, tanggalJatuhTempo: newDue }));
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none"
                    >
                      {PAYMENT_TERMS_OPTIONS.map(term => (
                        <option key={term} value={term}>{term}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Tanggal Jatuh Tempo AP *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.tanggalJatuhTempo}
                      onChange={(e) => setFormData(prev => ({ ...prev, tanggalJatuhTempo: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white font-bold text-amber-600 dark:text-amber-400 focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Kategori Material *
                    </label>
                    <select
                      value={formData.kategori}
                      onChange={(e) => setFormData(prev => ({ ...prev, kategori: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                    >
                      <option value="Bahan Baku Kayu">Bahan Baku Kayu</option>
                      <option value="Paku & Besi">Paku & Besi</option>
                      <option value="Sewa / Perbaikan Mesin">Sewa / Perbaikan Mesin</option>
                      <option value="Solar & Bahan Bakar">Solar & Bahan Bakar</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Estimasi Tiba di Gudang
                    </label>
                    <input
                      type="date"
                      value={formData.tanggalPengiriman}
                      onChange={(e) => setFormData(prev => ({ ...prev, tanggalPengiriman: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                    3. Rincian Material yang Dipesan ({formData.items.length} Item)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Item</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                      <tr>
                        <th className="p-3">Pilih Dari Gudang</th>
                        <th className="p-3">Nama Material / Barang *</th>
                        <th className="p-3">Dimensi / Ukuran</th>
                        <th className="p-3 w-24">Jumlah</th>
                        <th className="p-3 w-24">Satuan</th>
                        <th className="p-3 w-36 text-right">Harga Satuan (Rp)</th>
                        <th className="p-3 w-36 text-right">Subtotal</th>
                        <th className="p-3 text-center w-12">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {formData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="p-2.5">
                            <select
                              value={item.materialId || ''}
                              onChange={(e) => handleSelectExistingMaterial(idx, e.target.value)}
                              className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
                            >
                              <option value="">-- Manual / Baru --</option>
                              {materials.map(m => (
                                <option key={m.id} value={m.id}>{m.kode} - {m.nama}</option>
                              ))}
                            </select>
                          </td>

                          <td className="p-2.5">
                            <input
                              type="text"
                              required
                              placeholder="Nama material kayu/paku"
                              value={item.namaMaterial}
                              onChange={(e) => handleItemChange(idx, 'namaMaterial', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
                            />
                          </td>

                          <td className="p-2.5">
                            <input
                              type="text"
                              placeholder="Ukuran / spesifikasi"
                              value={item.ukuran || ''}
                              onChange={(e) => handleItemChange(idx, 'ukuran', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
                            />
                          </td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              required
                              value={item.jumlah}
                              onChange={(e) => handleItemChange(idx, 'jumlah', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-bold"
                            />
                          </td>

                          <td className="p-2.5">
                            <select
                              value={item.satuan}
                              onChange={(e) => handleItemChange(idx, 'satuan', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs"
                            >
                              <option value="m3">m3</option>
                              <option value="lembar">lembar</option>
                              <option value="batang">batang</option>
                              <option value="dus">dus</option>
                              <option value="kg">kg</option>
                              <option value="liter">liter</option>
                              <option value="unit">unit</option>
                              <option value="pcs">pcs</option>
                            </select>
                          </td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              required
                              value={item.hargaSatuan}
                              onChange={(e) => handleItemChange(idx, 'hargaSatuan', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-right font-semibold"
                            />
                          </td>

                          <td className="p-2.5 text-right font-bold text-zinc-900 dark:text-white">
                            {formatRupiah(item.subtotal)}
                          </td>

                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              disabled={formData.items.length <= 1}
                              className="p-1 text-zinc-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-zinc-400 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total & Tax Calculation Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start bg-zinc-50 dark:bg-zinc-800/40 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Catatan / Instruksi Pengiriman Khusus
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Instruksi spesifikasi kayu, armada truk pengangkut, jam bongkar muat di pabrik Mustika Kencana Nusantara..."
                    value={formData.catatan}
                    onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                    className="w-full p-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-2.5 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Subtotal Barang:</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{formatRupiah(formSubtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Pengenaan Pajak:</span>
                    <select
                      value={formData.tipePajak}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipePajak: e.target.value as any }))}
                      className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="Non PPN">Non PPN (0%)</option>
                      <option value="PPN 11%">PPN 11%</option>
                      <option value="PPh 23">PPh 23 (-2%)</option>
                      <option value="PPN & PPh">PPN 11% & PPh 23</option>
                    </select>
                  </div>

                  {formPpnNominal > 0 && (
                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <span>PPN (11%):</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatRupiah(formPpnNominal)}</span>
                    </div>
                  )}

                  {formPphNominal > 0 && (
                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <span>PPh 23 (-2%):</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">-{formatRupiah(formPphNominal)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Biaya Pengiriman:</span>
                    <div className="w-36">
                      <input
                        type="number"
                        min="0"
                        value={formData.biayaKirim}
                        onChange={(e) => setFormData(prev => ({ ...prev, biayaKirim: Number(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-right font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-sm sm:text-base font-black">
                    <span className="text-zinc-900 dark:text-white">Total Tagihan PO:</span>
                    <span className="text-red-600 dark:text-red-400">{formatRupiah(formTotalHarga)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingPO ? 'Simpan Perubahan PO' : 'Terbitkan PO & Masuk ke Laporan AP'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail & Cetak Dokumen PO Supplier */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header with Print Action */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/60 shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-red-600" />
                <span className="font-bold text-sm text-zinc-900 dark:text-white">
                  Pratinjau Dokumen Purchase Order Supplier
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintOrPdf('supplier-po-print-area', `PO_Supplier_${showDetailModal.nomorPO.replace(/[/\\?%*:|"<>]/g, '_')}`)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={() => setShowDetailModal(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-zinc-900" id="supplier-po-print-area">
              {/* Formal Letterhead */}
              <div className="flex justify-between items-start border-b-2 border-red-700 pb-5 mb-6">
                <div className="flex items-center gap-3.5">
                  <CompanyLogo className="w-14 h-14" />
                  <div>
                    <h1 className="text-xl font-black text-red-700 tracking-tight leading-tight">
                      PT MUSTIKA KENCANA NUSANTARA
                    </h1>
                    <p className="text-[11px] text-zinc-600 font-medium">
                      Manufaktur Wood Working, Pallet Kayu Standar & Ekspor ISPM-15
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Kawasan Industri & Pergudangan, Jl. Raya Cangkringan KM 3, Sleman, Yogyakarta | Telp: (0274) 898-112
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-red-700 text-white text-xs font-black px-3 py-1 rounded">
                    SURAT PESANAN PEMBELIAN (PO)
                  </span>
                  <div className="text-xs font-bold text-zinc-800 mt-1.5">{showDetailModal.nomorPO}</div>
                  <div className="text-[11px] text-zinc-500">Tgl: {showDetailModal.tanggal}</div>
                </div>
              </div>

              {/* PO Info & Vendor Box */}
              <div className="grid grid-cols-2 gap-6 p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs mb-6">
                <div>
                  <span className="font-bold text-zinc-500 uppercase tracking-wider block text-[10px] mb-1">
                    Kepada Vendor / Supplier:
                  </span>
                  <div className="text-sm font-black text-zinc-900">{showDetailModal.supplier}</div>
                  {showDetailModal.alamatSupplier && <div className="text-zinc-600 mt-0.5">{showDetailModal.alamatSupplier}</div>}
                  {showDetailModal.picSupplier && <div className="text-zinc-600 mt-0.5">UP / PIC: {showDetailModal.picSupplier}</div>}
                  {showDetailModal.teleponSupplier && <div className="text-zinc-600">Kontak: {showDetailModal.teleponSupplier}</div>}
                </div>

                <div className="space-y-1 text-right">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Rincian Pembayaran & Pengiriman:</div>
                  <div>Syarat Pembayaran: <strong className="text-zinc-900">{showDetailModal.syaratPembayaran}</strong></div>
                  <div>Jatuh Tempo: <strong className="text-red-700">{showDetailModal.tanggalJatuhTempo}</strong></div>
                  {showDetailModal.tanggalPengiriman && <div>Estimasi Tiba: <strong className="text-zinc-800">{showDetailModal.tanggalPengiriman}</strong></div>}
                  {showDetailModal.nomorRefSupplier && <div>Ref Vendor: <strong className="text-zinc-800">{showDetailModal.nomorRefSupplier}</strong></div>}
                  <div>ID Tagihan AP: <strong className="text-amber-700">{showDetailModal.nomorTagihanAP || `AP-${showDetailModal.nomorPO}`}</strong></div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left border border-zinc-200 rounded-lg overflow-hidden mb-6">
                <thead className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-200">
                  <tr>
                    <th className="p-2.5 w-10 text-center">No</th>
                    <th className="p-2.5">Nama Material & Kategori</th>
                    <th className="p-2.5">Dimensi / Ukuran</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-center">Satuan</th>
                    <th className="p-2.5 text-right">Harga Satuan</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {showDetailModal.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 text-center font-bold text-zinc-500">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-zinc-900">{it.namaMaterial}</td>
                      <td className="p-2.5 text-zinc-600">{it.ukuran || '-'}</td>
                      <td className="p-2.5 text-center font-bold text-zinc-900">{it.jumlah}</td>
                      <td className="p-2.5 text-center text-zinc-600">{it.satuan}</td>
                      <td className="p-2.5 text-right font-semibold text-zinc-800">{formatRupiah(it.hargaSatuan)}</td>
                      <td className="p-2.5 text-right font-black text-zinc-900">{formatRupiah(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="flex justify-between items-start mb-8 text-xs">
                <div className="max-w-md p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-600">
                  <span className="font-bold text-zinc-800 block mb-1">Catatan & Ketentuan:</span>
                  <p>{showDetailModal.catatan || 'Harap konfirmasi waktu keberangkatan truk dan lampirkan Surat Jalan resmi vendor saat pengiriman barang ke pabrik Mustika Kencana Nusantara.'}</p>
                </div>

                <div className="w-72 space-y-1.5 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-zinc-900">{formatRupiah(showDetailModal.subtotal)}</span>
                  </div>
                  {showDetailModal.ppnNominal ? (
                    <div className="flex justify-between text-zinc-600">
                      <span>PPN (11%):</span>
                      <span className="font-semibold text-zinc-900">+{formatRupiah(showDetailModal.ppnNominal)}</span>
                    </div>
                  ) : null}
                  {showDetailModal.pphNominal ? (
                    <div className="flex justify-between text-zinc-600">
                      <span>PPh 23 (-2%):</span>
                      <span className="font-semibold text-red-600">-{formatRupiah(showDetailModal.pphNominal)}</span>
                    </div>
                  ) : null}
                  {showDetailModal.biayaKirim ? (
                    <div className="flex justify-between text-zinc-600">
                      <span>Ongkos Kirim:</span>
                      <span className="font-semibold text-zinc-900">+{formatRupiah(showDetailModal.biayaKirim)}</span>
                    </div>
                  ) : null}
                  <div className="pt-2 border-t border-zinc-300 flex justify-between font-black text-sm text-red-700">
                    <span>TOTAL PO:</span>
                    <span>{formatRupiah(showDetailModal.totalHarga)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 text-center text-xs mt-10 pt-4 border-t border-zinc-300">
                <div>
                  <div className="text-zinc-500 font-semibold mb-12">Dibuat Oleh (Admin Sales):</div>
                  <div className="font-bold text-zinc-900 underline">{showDetailModal.dibuatOleh}</div>
                  <div className="text-[10px] text-zinc-400">Sales & Procurement</div>
                </div>

                <div>
                  <div className="text-zinc-500 font-semibold mb-12">Disetujui Oleh (Direktur):</div>
                  <div className="font-bold text-zinc-900 underline">Direktur Operasional</div>
                  <div className="text-[10px] text-zinc-400">PT Mustika Kencana Nusantara</div>
                </div>

                <div>
                  <div className="text-zinc-500 font-semibold mb-12">Dikonfirmasi Oleh Vendor:</div>
                  <div className="font-bold text-zinc-900 underline">{showDetailModal.picSupplier || showDetailModal.supplier}</div>
                  <div className="text-[10px] text-zinc-400">Tanda Tangan & Cap Vendor</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Terima Barang di Gudang */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5" />
                <h3 className="font-bold text-base">Konfirmasi Penerimaan Barang</h3>
              </div>
              <button
                onClick={() => setShowReceiveModal(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 space-y-1">
                <div className="font-bold text-sm">{showReceiveModal.nomorPO}</div>
                <div>Supplier: <strong>{showReceiveModal.supplier}</strong></div>
                <div>Total Nilai: <strong>{formatRupiah(showReceiveModal.totalHarga)}</strong></div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block">
                  Material yang akan ditambahkan ke Stok Gudang:
                </span>
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 bg-zinc-50 dark:bg-zinc-800/40">
                  {showReceiveModal.items.map((it, idx) => (
                    <li key={idx} className="py-1.5 flex justify-between">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">• {it.namaMaterial}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">+{it.jumlah} {it.satuan}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Catatan Penerimaan / No. Polisi Truk / Kondisi Fisik:
                </label>
                <textarea
                  rows={3}
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  placeholder="Kondisi kayu log mulus grade A, plat truk pengantar AB 8122 XY..."
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReceive}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Update Stok & Tandai Diterima</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal Confirmation */}
      <DeleteConfirmModal
        isOpen={!!poToDelete}
        onClose={() => setPoToDelete(null)}
        onConfirm={() => {
          if (poToDelete) {
            deletePOSupplier(poToDelete.id);
            setPoToDelete(null);
          }
        }}
        title="Hapus Purchase Order Supplier"
        message={`Apakah Anda yakin ingin menghapus PO "${poToDelete?.nomorPO}" ke "${poToDelete?.supplier}"? Tindakan ini juga akan menghapus catatan tagihan AP terkait di Laporan Hutang.`}
      />
    </div>
  );
};
