import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Material, MaterialMutasiItem, TandaTerimaPengambilanMaterial, TandaTerimaMaterialItem } from '../types';
import { 
  Plus, Search, Filter, Pencil, Trash2, ShieldAlert, PlusCircle, MinusCircle, 
  Printer, Download, X, FileText, ClipboardList, History, CheckCircle2, 
  Calendar, Layers, ArrowDownRight, ArrowUpRight, UserCheck, PackageOpen, 
  Boxes, FileCheck, Eye
} from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';
import { exportToExcel } from '../utils/exportExcel';
import { downloadElementAsPdf, triggerPrintOrPdf, showPdfToast } from '../utils/exportPdf';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export const MaterialView: React.FC = () => {
  const { 
    materials, 
    addMaterial, 
    updateMaterial, 
    deleteMaterial, 
    adjustMaterialStock, 
    recordMaterialMutation,
    tandaTerimaMaterialList,
    addTandaTerimaMaterial,
    deleteTandaTerimaMaterial,
    currentUser 
  } = useApp();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'stok' | 'mutasi' | 'tanda_terima'>('stok');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('SEMUA');
  const [filterMaterialMutasi, setFilterMaterialMutasi] = useState<string>('SEMUA');
  const [filterTipeMutasi, setFilterTipeMutasi] = useState<string>('SEMUA');
  
  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showMutasiModal, setShowMutasiModal] = useState(false);
  const [showTandaTerimaModal, setShowTandaTerimaModal] = useState(false);
  const [selectedBonForPrint, setSelectedBonForPrint] = useState<TandaTerimaPengambilanMaterial | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [deleteBonTarget, setDeleteBonTarget] = useState<TandaTerimaPengambilanMaterial | null>(null);
  
  // Form fields for Material Add / Edit
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState<string>('Kayu Log');
  const [ukuran, setUkuran] = useState('');
  const [dimensi, setDimensi] = useState('');
  const [tanggalMasukWarehouse, setTanggalMasukWarehouse] = useState(new Date().toISOString().split('T')[0]);
  const [stokAwal, setStokAwal] = useState<number>(0);
  const [stok, setStok] = useState<number>(0);
  const [satuan, setSatuan] = useState<Material['satuan']>('m3');
  const [hargaBeli, setHargaBeli] = useState<number>(0);
  const [minimalStok, setMinimalStok] = useState<number>(0);
  const [lokasiGudang, setLokasiGudang] = useState('');
  const [supplier, setSupplier] = useState('');

  // Quick Mutasi Modal State
  const [mutasiMaterialId, setMutasiMaterialId] = useState<string>('');
  const [mutasiTipe, setMutasiTipe] = useState<'MASUK_WAREHOUSE' | 'KELUAR_PRODUKSI'>('KELUAR_PRODUKSI');
  const [mutasiJumlah, setMutasiJumlah] = useState<number>(1);
  const [mutasiTanggal, setMutasiTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mutasiNomorBukti, setMutasiNomorBukti] = useState<string>('');
  const [mutasiPengambil, setMutasiPengambil] = useState<string>('');
  const [mutasiPenyerah, setMutasiPenyerah] = useState<string>(currentUser?.name || 'Staff Gudang');
  const [mutasiKeperluan, setMutasiKeperluan] = useState<string>('Produksi Pallet Standar');
  const [mutasiKeterangan, setMutasiKeterangan] = useState<string>('');

  // Tanda Terima Form State
  const [bonNomor, setBonNomor] = useState<string>('');
  const [bonTanggal, setBonTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bonDivisi, setBonDivisi] = useState<string>('Produksi Assembling Pallet');
  const [bonPengambil, setBonPengambil] = useState<string>('');
  const [bonPenyerah, setBonPenyerah] = useState<string>(currentUser?.name || 'Warehouse Staff');
  const [bonTargetProduk, setBonTargetProduk] = useState<string>('');
  const [bonNomorSPK, setBonNomorSPK] = useState<string>('');
  const [bonCatatan, setBonCatatan] = useState<string>('');
  const [bonItems, setBonItems] = useState<TandaTerimaMaterialItem[]>([
    { materialId: '', namaMaterial: '', kategori: '', ukuran: '', jumlah: 1, satuan: 'm3', keterangan: '' }
  ]);

  const categories = ['SEMUA', 'Kayu Log', 'Papan', 'Balok', 'Paku', 'Cat/Pelapis', 'Lainnya'];

  // Check Role Permissions: Warehouse & Owner can edit/create.
  const canModify = currentUser?.role === 'OWNER' || currentUser?.role === 'WAREHOUSE';
  const isWarehouse = currentUser?.role === 'WAREHOUSE';

  // Filter & Search Logic for Materials
  const filteredMaterials = materials.filter(item => {
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.ukuran && item.ukuran.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (item.dimensi && item.dimensi.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedKategori === 'SEMUA' || item.kategori === selectedKategori;
    return matchesSearch && matchesCategory;
  });

  // Flat list of all material mutations across all items
  const allMutasiList: (MaterialMutasiItem & { materialNama: string; materialKode: string; materialSatuan: string; materialUkuran?: string })[] = [];
  materials.forEach(m => {
    if (m.riwayatMutasi && m.riwayatMutasi.length > 0) {
      m.riwayatMutasi.forEach(mut => {
        allMutasiList.push({
          ...mut,
          materialNama: m.nama,
          materialKode: m.kode,
          materialSatuan: m.satuan,
          materialUkuran: m.ukuran
        });
      });
    }
  });
  // Sort latest first
  allMutasiList.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime() || b.id.localeCompare(a.id));

  const filteredMutasiList = allMutasiList.filter(mut => {
    const matchesMaterial = filterMaterialMutasi === 'SEMUA' || mut.materialKode === filterMaterialMutasi;
    const matchesTipe = filterTipeMutasi === 'SEMUA' || mut.tipe === filterTipeMutasi;
    const matchesSearch = mut.materialNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (mut.nomorBukti && mut.nomorBukti.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (mut.pengambil && mut.pengambil.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (mut.keperluan && mut.keperluan.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (mut.keterangan && mut.keterangan.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesMaterial && matchesTipe && matchesSearch;
  });

  const filteredTandaTerimaList = tandaTerimaMaterialList.filter(bon => {
    return bon.nomorBon.toLowerCase().includes(searchTerm.toLowerCase()) ||
           bon.namaPengambil.toLowerCase().includes(searchTerm.toLowerCase()) ||
           bon.divisiPemohon.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (bon.targetProduk && bon.targetProduk.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (bon.nomorSPK && bon.nomorSPK.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // --- Handlers for Material CRUD ---
  const handleOpenAddModal = () => {
    setEditingId(null);
    setKode(`MAT-${Math.floor(100 + Math.random() * 900)}`);
    setNama('');
    setKategori('Kayu Log');
    setUkuran('');
    setDimensi('');
    setTanggalMasukWarehouse(new Date().toISOString().split('T')[0]);
    setStokAwal(0);
    setStok(0);
    setSatuan('m3');
    setHargaBeli(0);
    setMinimalStok(5);
    setLokasiGudang('Gudang Bahan Baku A');
    setSupplier('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (item: Material) => {
    setEditingId(item.id);
    setKode(item.kode);
    setNama(item.nama);
    setKategori(item.kategori);
    setUkuran(item.ukuran || '');
    setDimensi(item.dimensi || '');
    setTanggalMasukWarehouse(item.tanggalMasukWarehouse || new Date().toISOString().split('T')[0]);
    setStokAwal(item.stokAwal !== undefined ? item.stokAwal : item.stok);
    setStok(item.stok);
    setSatuan(item.satuan);
    setHargaBeli(item.hargaBeli);
    setMinimalStok(item.minimalStok);
    setLokasiGudang(item.lokasiGudang || '');
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
        ukuran,
        dimensi,
        tanggalMasukWarehouse,
        stokAwal: Number(stokAwal),
        stok: Number(stok),
        satuan,
        hargaBeli: Number(hargaBeli),
        minimalStok: Number(minimalStok),
        lokasiGudang,
        supplier
      });
      showPdfToast(`Bahan baku "${nama}" berhasil diperbarui.`);
    } else {
      addMaterial({
        kode,
        nama,
        kategori,
        ukuran,
        dimensi,
        tanggalMasukWarehouse,
        stokAwal: Number(stokAwal),
        stok: Number(stok),
        satuan,
        hargaBeli: Number(hargaBeli),
        minimalStok: Number(minimalStok),
        lokasiGudang,
        supplier
      });
      showPdfToast(`Bahan baku "${nama}" berhasil ditambahkan ke inventaris.`);
    }
    setShowFormModal(false);
  };

  // --- Handlers for Mutasi ---
  const handleOpenMutasiModal = (matId?: string, defaultTipe: 'MASUK_WAREHOUSE' | 'KELUAR_PRODUKSI' = 'KELUAR_PRODUKSI') => {
    setMutasiMaterialId(matId || (materials.length > 0 ? materials[0].id : ''));
    setMutasiTipe(defaultTipe);
    setMutasiJumlah(1);
    setMutasiTanggal(new Date().toISOString().split('T')[0]);
    setMutasiNomorBukti(`MUT-${Date.now().toString().slice(-4)}`);
    setMutasiPengambil('');
    setMutasiPenyerah(currentUser?.name || 'Staff Warehouse');
    setMutasiKeperluan(defaultTipe === 'KELUAR_PRODUKSI' ? 'Pemakaian Produksi Assembling Pallet' : 'Penerimaan Bahan Masuk Supplier');
    setMutasiKeterangan('');
    setShowMutasiModal(true);
  };

  const handleMutasiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutasiMaterialId) return;
    const targetMat = materials.find(m => m.id === mutasiMaterialId);
    if (!targetMat) return;

    if (mutasiTipe === 'KELUAR_PRODUKSI' && targetMat.stok < mutasiJumlah) {
      alert(`Stok tidak mencukupi! Sisa stok ${targetMat.nama} hanya ${targetMat.stok} ${targetMat.satuan}.`);
      return;
    }

    recordMaterialMutation(mutasiMaterialId, {
      tanggal: mutasiTanggal,
      nomorBukti: mutasiNomorBukti,
      tipe: mutasiTipe,
      jumlah: Number(mutasiJumlah),
      sisaStokSetelahnya: 0, // will be auto calculated
      pengambil: mutasiPengambil,
      penyerah: mutasiPenyerah,
      keperluan: mutasiKeperluan,
      keterangan: mutasiKeterangan || `${mutasiTipe === 'MASUK_WAREHOUSE' ? 'Stok Masuk Warehouse' : 'Dipakai Produksi'} (${targetMat.nama})`,
      dicatatOleh: currentUser?.name || 'Staff Logistik'
    });

    showPdfToast(`Mutasi material ${targetMat.nama} sebesar ${mutasiJumlah} ${targetMat.satuan} berhasil dicatat.`);
    setShowMutasiModal(false);
  };

  // --- Handlers for Tanda Terima Pengambilan Material ---
  const handleOpenTandaTerimaModal = () => {
    const defaultBon = `BON-MAT/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;
    setBonNomor(defaultBon);
    setBonTanggal(new Date().toISOString().split('T')[0]);
    setBonDivisi('Produksi Assembling Pallet');
    setBonPengambil('');
    setBonPenyerah(currentUser?.name || 'Staff Logistik');
    setBonTargetProduk('Pallet Standar 120x100 cm');
    setBonNomorSPK(`SPK-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
    setBonCatatan('');
    
    // Set initial row
    if (materials.length > 0) {
      const firstMat = materials[0];
      setBonItems([{
        materialId: firstMat.id,
        namaMaterial: firstMat.nama,
        kategori: firstMat.kategori,
        ukuran: firstMat.ukuran || '',
        jumlah: 1,
        satuan: firstMat.satuan,
        keterangan: 'Untuk perakitan pallet'
      }]);
    } else {
      setBonItems([]);
    }
    setShowTandaTerimaModal(true);
  };

  const handleAddBonItemRow = () => {
    if (materials.length === 0) return;
    const firstMat = materials[0];
    setBonItems([
      ...bonItems,
      {
        materialId: firstMat.id,
        namaMaterial: firstMat.nama,
        kategori: firstMat.kategori,
        ukuran: firstMat.ukuran || '',
        jumlah: 1,
        satuan: firstMat.satuan,
        keterangan: ''
      }
    ]);
  };

  const handleRemoveBonItemRow = (index: number) => {
    setBonItems(bonItems.filter((_, idx) => idx !== index));
  };

  const handleBonItemChange = (index: number, field: keyof TandaTerimaMaterialItem, value: any) => {
    const updated = [...bonItems];
    if (field === 'materialId') {
      const mat = materials.find(m => m.id === value);
      if (mat) {
        updated[index] = {
          ...updated[index],
          materialId: mat.id,
          namaMaterial: mat.nama,
          kategori: mat.kategori,
          ukuran: mat.ukuran || '',
          satuan: mat.satuan
        };
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
    }
    setBonItems(updated);
  };

  const handleTandaTerimaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bonItems.length === 0) {
      alert('Tambahkan minimal 1 item material yang diambil.');
      return;
    }

    // Validate stocks
    for (const item of bonItems) {
      const mat = materials.find(m => m.id === item.materialId);
      if (!mat) {
        alert(`Bahan "${item.namaMaterial}" tidak ditemukan di sistem.`);
        return;
      }
      if (mat.stok < item.jumlah) {
        alert(`Stok tidak mencukupi untuk "${mat.nama}". Sisa stok hanya ${mat.stok} ${mat.satuan}, permintaan ${item.jumlah} ${mat.satuan}.`);
        return;
      }
    }

    const createdId = addTandaTerimaMaterial({
      nomorBon: bonNomor,
      tanggal: bonTanggal,
      namaPengambil: bonPengambil,
      divisiPemohon: bonDivisi,
      namaPenyerah: bonPenyerah,
      targetProduk: bonTargetProduk,
      nomorSPK: bonNomorSPK,
      items: bonItems,
      catatan: bonCatatan,
      status: 'DISETUJUI'
    });

    showPdfToast(`Tanda Terima ${bonNomor} berhasil dibuat dan stok material otomatis dipotong.`);
    setShowTandaTerimaModal(false);

    // Optionally trigger print preview directly
    const createdBon = tandaTerimaMaterialList.find(b => b.id === createdId) || {
      id: createdId,
      nomorBon: bonNomor,
      tanggal: bonTanggal,
      namaPengambil: bonPengambil,
      divisiPemohon: bonDivisi,
      namaPenyerah: bonPenyerah,
      targetProduk: bonTargetProduk,
      nomorSPK: bonNomorSPK,
      items: bonItems,
      catatan: bonCatatan,
      status: 'DISETUJUI' as const,
      createdAt: new Date().toISOString()
    };
    setSelectedBonForPrint(createdBon);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMaterial(deleteTarget.id);
      showPdfToast(`Data material "${deleteTarget.nama}" berhasil dihapus.`);
      setDeleteTarget(null);
    }
  };

  const handleDeleteBonConfirm = () => {
    if (deleteBonTarget) {
      deleteTandaTerimaMaterial(deleteBonTarget.id);
      showPdfToast(`Tanda terima "${deleteBonTarget.nomorBon}" berhasil dihapus.`);
      setDeleteBonTarget(null);
    }
  };

  const handleExportExcelMaterials = () => {
    exportToExcel<Material>(
      materials,
      [
        'ID Material', 
        'Kode', 
        'Nama Item', 
        'Kategori Jenis', 
        'Ukuran', 
        'Dimensi', 
        'Tgl Masuk Warehouse', 
        'Stok Qty Awal', 
        'Stok Masuk', 
        'Keluar (Produksi)', 
        'Sisa Stok Akhir', 
        'Satuan', 
        ...(!isWarehouse ? ['Harga Beli (Rp)'] : []), 
        'Minimal Buffer', 
        'Lokasi Gudang', 
        'Supplier Utama'
      ],
      (m) => [
        m.id,
        m.kode,
        m.nama,
        m.kategori,
        m.ukuran || '-',
        m.dimensi || '-',
        m.tanggalMasukWarehouse || '-',
        m.stokAwal !== undefined ? m.stokAwal : m.stok,
        m.stokMasuk || 0,
        m.stokKeluar || 0,
        m.stok,
        m.satuan,
        ...(!isWarehouse ? [m.hargaBeli] : []),
        m.minimalStok,
        m.lokasiGudang || '-',
        m.supplier
      ],
      `Database_Stok_Material_CV_Mustika_Kayunusa`
    );
  };

  return (
    <div id="material-view" className="p-4 md:p-6 space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
              <Boxes className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Logistik & Stok Bahan Baku (Raw Material)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Pencatatan kondisi stok awal, ukuran, dimensi, tanggal masuk warehouse, keluar masuk pemakaian produksi, serta form tanda terima.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-excel-material"
            onClick={handleExportExcelMaterials}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Excel Stok
          </button>
          
          <button
            id="btn-print-material-pdf"
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Cetak PDF Stok
          </button>

          {canModify && (
            <>
              <button
                id="btn-catat-mutasi-quick"
                onClick={() => handleOpenMutasiModal()}
                className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <History className="h-4 w-4" />
                Catat Keluar-Masuk
              </button>

              <button
                id="btn-form-tanda-terima"
                onClick={handleOpenTandaTerimaModal}
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <FileCheck className="h-4 w-4" />
                Form Tanda Terima
              </button>

              <button
                id="btn-tambah-material"
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                <Plus className="h-4 w-4" />
                Tambah Bahan Baku
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modern Tab Bar */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <button
          id="tab-stok-material"
          onClick={() => setActiveTab('stok')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeTab === 'stok'
              ? 'border-red-600 text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-950/20 rounded-t-xl'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Boxes className="h-4 w-4" />
          Master Stok & Spesifikasi ({materials.length})
        </button>

        <button
          id="tab-mutasi-material"
          onClick={() => setActiveTab('mutasi')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeTab === 'mutasi'
              ? 'border-red-600 text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-950/20 rounded-t-xl'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <History className="h-4 w-4" />
          Kartu Riwayat Keluar-Masuk ({allMutasiList.length})
        </button>

        <button
          id="tab-tanda-terima-material"
          onClick={() => setActiveTab('tanda_terima')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeTab === 'tanda_terima'
              ? 'border-red-600 text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-950/20 rounded-t-xl'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          Tanda Terima Pengambilan Produksi ({tandaTerimaMaterialList.length})
        </button>
      </div>

      {/* ===================== TAB 1: MASTER STOK & SPESIFIKASI ===================== */}
      {activeTab === 'stok' && (
        <div className="space-y-4">
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
                placeholder="Cari kode, nama item, ukuran, dimensi, supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
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

          {/* Materials Table Card with All Requested Fields */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <th className="p-3.5 whitespace-nowrap">Kode Item</th>
                    <th className="p-3.5 whitespace-nowrap">Nama Item</th>
                    <th className="p-3.5 whitespace-nowrap">Kategori Jenis</th>
                    <th className="p-3.5 whitespace-nowrap">Ukuran & Dimensi</th>
                    <th className="p-3.5 whitespace-nowrap">Tgl Masuk WH</th>
                    <th className="p-3.5 text-center whitespace-nowrap bg-zinc-100/50 dark:bg-zinc-800/30">Stock Qty Awal</th>
                    <th className="p-3.5 text-center whitespace-nowrap text-emerald-700 dark:text-emerald-400">Stok Masuk</th>
                    <th className="p-3.5 text-center whitespace-nowrap text-red-700 dark:text-red-400">Keluar (Produksi)</th>
                    <th className="p-3.5 text-center whitespace-nowrap bg-zinc-100/80 dark:bg-zinc-800/60 font-black">Sisa Stok Akhir</th>
                    {!isWarehouse && (
                      <th className="p-3.5 text-right whitespace-nowrap">Harga Beli</th>
                    )}
                    <th className="p-3.5 whitespace-nowrap">Supplier</th>
                    <th className="p-3.5 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredMaterials.map((item) => {
                    const isCriticalStock = item.stok <= item.minimalStok;
                    const stockAwalVal = item.stokAwal !== undefined ? item.stokAwal : item.stok;
                    return (
                      <tr 
                        key={item.id} 
                        id={`row-material-${item.id}`}
                        className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors ${isCriticalStock ? 'bg-amber-50/20 dark:bg-amber-950/5' : ''}`}
                      >
                        <td className="p-3.5 font-mono font-bold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {item.kode}
                        </td>
                        <td className="p-3.5">
                          <p className="font-black text-zinc-900 dark:text-zinc-100">{item.nama}</p>
                          {item.lokasiGudang && (
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Lokasi: {item.lokasiGudang}</p>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350">
                            {item.kategori}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <p className="font-bold text-zinc-800 dark:text-zinc-200">{item.ukuran || '-'}</p>
                          {item.dimensi && (
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{item.dimensi}</p>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {item.tanggalMasukWarehouse || '-'}
                        </td>
                        <td className="p-3.5 text-center font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-50/50 dark:bg-zinc-850/30 whitespace-nowrap">
                          {stockAwalVal} {item.satuan}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            +{item.stokMasuk || 0} {item.satuan}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="text-xs font-bold text-red-600 dark:text-red-400">
                            -{item.stokKeluar || 0} {item.satuan}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap bg-zinc-50 dark:bg-zinc-850">
                          <div className="flex flex-col items-center">
                            <span className={`px-2.5 py-1 text-xs font-black rounded ${
                              isCriticalStock 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/65 dark:text-amber-300' 
                                : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                            }`}>
                              {item.stok} {item.satuan}
                            </span>
                            {isCriticalStock && (
                              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-1 flex items-center gap-0.5">
                                <ShieldAlert className="h-3 w-3" /> Min: {item.minimalStok}
                              </span>
                            )}
                          </div>
                        </td>
                        {!isWarehouse && (
                          <td className="p-3.5 text-right font-bold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                            Rp {item.hargaBeli.toLocaleString('id-ID')}
                          </td>
                        )}
                        <td className="p-3.5 text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap">
                          {item.supplier || '-'}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Catat Mutasi Keluar/Masuk Button */}
                            {canModify && (
                              <button
                                onClick={() => handleOpenMutasiModal(item.id, 'KELUAR_PRODUKSI')}
                                className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-all cursor-pointer"
                                title="Catat Mutasi / Pemakaian Produksi"
                              >
                                <History className="h-4 w-4" />
                              </button>
                            )}

                            {/* Edit Button */}
                            {canModify && (
                              <button
                                id={`btn-edit-material-${item.id}`}
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                title="Edit Spesifikasi & Stok"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}

                            {/* Delete Button */}
                            {canModify && (
                              <button
                                onClick={() => setDeleteTarget(item)}
                                className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                                title="Hapus Material"
                              >
                                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredMaterials.length === 0 && (
                    <tr>
                      <td colSpan={12} className="text-center py-12 text-zinc-400 dark:text-zinc-500">
                        Tidak ada material bahan baku yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: KARTU RIWAYAT MUTASI KELUAR-MASUK ===================== */}
      {activeTab === 'mutasi' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              {/* Filter Material */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Pilih Bahan Baku</label>
                <select
                  value={filterMaterialMutasi}
                  onChange={(e) => setFilterMaterialMutasi(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-800 dark:text-zinc-200"
                >
                  <option value="SEMUA">Semua Bahan Baku</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.kode}>{m.kode} - {m.nama} ({m.ukuran || m.satuan})</option>
                  ))}
                </select>
              </div>

              {/* Filter Tipe Mutasi */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Tipe Mutasi</label>
                <select
                  value={filterTipeMutasi}
                  onChange={(e) => setFilterTipeMutasi(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-800 dark:text-zinc-200"
                >
                  <option value="SEMUA">Semua Pergerakan</option>
                  <option value="MASUK_WAREHOUSE">Masuk Warehouse (+)</option>
                  <option value="KELUAR_PRODUKSI">Keluar (Dipakai Produksi) (-)</option>
                  <option value="PENYESUAIAN_OPNAME">Penyesuaian Opname</option>
                </select>
              </div>
            </div>

            {canModify && (
              <button
                onClick={() => handleOpenMutasiModal()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Input Mutasi Baru
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5">Tipe Pergerakan</th>
                    <th className="p-3.5">Nama Item / Ukuran</th>
                    <th className="p-3.5 text-center">Jumlah Qty</th>
                    <th className="p-3.5 text-center">Sisa Stok</th>
                    <th className="p-3.5">No. Bukti / SPK</th>
                    <th className="p-3.5">Pengambil / Penyerah</th>
                    <th className="p-3.5">Keperluan & Keterangan</th>
                    <th className="p-3.5 text-right">Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredMutasiList.map((mut) => {
                    const isMasuk = mut.tipe === 'MASUK_WAREHOUSE';
                    const isKeluar = mut.tipe === 'KELUAR_PRODUKSI';
                    return (
                      <tr key={mut.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="p-3.5 font-mono text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {mut.tanggal}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                            isMasuk 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : isKeluar
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                          }`}>
                            {isMasuk && <ArrowDownRight className="h-3 w-3" />}
                            {isKeluar && <ArrowUpRight className="h-3 w-3" />}
                            {isMasuk ? 'Masuk Warehouse' : isKeluar ? 'Keluar Produksi' : 'Opname Stock'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <p className="font-extrabold text-zinc-900 dark:text-zinc-100">{mut.materialNama}</p>
                          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                            {mut.materialKode} {mut.materialUkuran ? `• Ukuran: ${mut.materialUkuran}` : ''}
                          </p>
                        </td>
                        <td className="p-3.5 text-center font-black whitespace-nowrap">
                          <span className={isMasuk ? 'text-emerald-600' : isKeluar ? 'text-red-600' : 'text-zinc-700'}>
                            {isMasuk ? '+' : isKeluar ? '-' : ''}{mut.jumlah} {mut.materialSatuan}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-50/50 dark:bg-zinc-850/30">
                          {mut.sisaStokSetelahnya} {mut.materialSatuan}
                        </td>
                        <td className="p-3.5 font-mono text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {mut.nomorBukti || mut.nomorSPK || '-'}
                        </td>
                        <td className="p-3.5">
                          {mut.pengambil ? (
                            <div>
                              <p className="font-bold text-zinc-800 dark:text-zinc-200">Diambil: {mut.pengambil}</p>
                              <p className="text-[10px] text-zinc-400">Penyerah: {mut.penyerah || '-'}</p>
                            </div>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="p-3.5 max-w-xs">
                          {mut.keperluan && (
                            <p className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">{mut.keperluan}</p>
                          )}
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{mut.keterangan || '-'}</p>
                        </td>
                        <td className="p-3.5 text-right font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {mut.dicatatOleh || 'Admin'}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredMutasiList.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-zinc-400 dark:text-zinc-500">
                        Belum ada riwayat pergerakan / mutasi material yang tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: TANDA TERIMA PENGAMBILAN MATERIAL ===================== */}
      {activeTab === 'tanda_terima' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                Daftar Dokumen Bon Tanda Terima Pengambilan Bahan Baku
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Dokumen serah terima bahan baku dari Gudang ke Divisi Produksi Assembling / Sawmill.
              </p>
            </div>

            {canModify && (
              <button
                onClick={handleOpenTandaTerimaModal}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Buat Bon Pengambilan Baru
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTandaTerimaList.map((bon) => (
              <div 
                key={bon.id} 
                className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                      {bon.nomorBon}
                    </span>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3" /> {bon.tanggal}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {bon.status || 'DISETUJUI'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Divisi Pemohon:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{bon.divisiPemohon}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Pengambil (Penerima):</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{bon.namaPengambil}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Penyerah (Warehouse):</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{bon.namaPenyerah}</span>
                  </div>
                  {bon.targetProduk && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Target Produk / SPK:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{bon.targetProduk} {bon.nomorSPK ? `(${bon.nomorSPK})` : ''}</span>
                    </div>
                  )}
                </div>

                {/* Items Summary */}
                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-100 dark:border-zinc-850 space-y-1.5">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Item Bahan Baku Diambil ({bon.items.length}):</p>
                  <ul className="space-y-1 text-xs">
                    {bon.items.map((it, idx) => (
                      <li key={idx} className="flex justify-between items-center">
                        <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[180px]">
                          • {it.namaMaterial} {it.ukuran ? `(${it.ukuran})` : ''}
                        </span>
                        <span className="font-black text-red-600 dark:text-red-400 shrink-0">
                          {it.jumlah} {it.satuan}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="pt-2 flex justify-between items-center gap-2">
                  <button
                    onClick={() => setSelectedBonForPrint(bon)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 dark:text-indigo-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Cetak Bon Tanda Terima
                  </button>

                  {canModify && (
                    <button
                      onClick={() => setDeleteBonTarget(bon)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
                      title="Hapus Dokumen Bon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredTandaTerimaList.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 p-8">
                <FileCheck className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="font-bold text-zinc-700 dark:text-zinc-300">Belum Ada Tanda Terima Pengambilan Material</p>
                <p className="text-xs text-zinc-400 mt-1">Klik tombol "Buat Bon Pengambilan Baru" untuk mencatat serah terima bahan baku ke divisi produksi.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODAL: TAMBAH / EDIT MATERIAL ===================== */}
      {showFormModal && (
        <div id="material-form-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-850/50">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-red-600" />
                <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                  {editingId ? 'Edit Data & Spesifikasi Bahan Baku' : 'Tambah Bahan Baku / Material Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setShowFormModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">NAMA ITEM MATERIAL</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Kayu Papan Mahoni Oven / Kayu Log Sengon"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">KATEGORI JENIS (BISA KETIK MANUAL)</label>
                  <input
                    type="text"
                    list="kategori-list"
                    required
                    placeholder="Pilih atau ketik kategori..."
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <datalist id="kategori-list">
                    {categories.filter(c => c !== 'SEMUA').map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">UKURAN (STANDARD)</label>
                  <input
                    type="text"
                    placeholder="e.g., 2 x 10 x 120 cm / Dia. 30 cm"
                    value={ukuran}
                    onChange={(e) => setUkuran(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">DIMENSI LENGKAP</label>
                  <input
                    type="text"
                    placeholder="e.g., T: 2cm, L: 10cm, P: 120cm"
                    value={dimensi}
                    onChange={(e) => setDimensi(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">TANGGAL MASUK WAREHOUSE</label>
                  <input
                    type="date"
                    required
                    value={tanggalMasukWarehouse}
                    onChange={(e) => setTanggalMasukWarehouse(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">STOCK QTY AWAL</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={stokAwal}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setStokAwal(val);
                      if (!editingId) setStok(val);
                    }}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">SATUAN</label>
                  <select
                    value={satuan}
                    onChange={(e) => setSatuan(e.target.value as Material['satuan'])}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="m3">m3 (Meter Kubik)</option>
                    <option value="pcs">pcs (Batang / Lembar)</option>
                    <option value="kg">kg (Kilogram)</option>
                    <option value="liter">liter</option>
                  </select>
                </div>
              </div>

              <div className={`grid grid-cols-1 ${!isWarehouse ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                {!isWarehouse && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">HARGA BELI (RP)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="500"
                      value={hargaBeli}
                      onChange={(e) => setHargaBeli(Number(e.target.value))}
                      className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">MINIMAL BUFFER STOK</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={minimalStok}
                    onChange={(e) => setMinimalStok(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">LOKASI GUDANG / RAK</label>
                  <input
                    type="text"
                    placeholder="e.g., Gudang Kayu B / Rak 3"
                    value={lokasiGudang}
                    onChange={(e) => setLokasiGudang(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">SUPPLIER UTAMA</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Perhutani KPH Surakarta / Supplier Paku Mitra Abadi"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Bahan Baku'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: QUICK CATAT MUTASI MATERIAL ===================== */}
      {showMutasiModal && (
        <div id="mutasi-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-850/50">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-amber-600" />
                <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                  Catat Pergerakan Keluar/Masuk Bahan Baku
                </h3>
              </div>
              <button onClick={() => setShowMutasiModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleMutasiSubmit} className="p-6 space-y-4">
              {/* Tipe Mutasi Picker */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Jenis Pergerakan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMutasiTipe('MASUK_WAREHOUSE')}
                    className={`py-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      mutasiTipe === 'MASUK_WAREHOUSE'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <ArrowDownRight className="h-4 w-4 text-emerald-600" />
                    Masuk Warehouse (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMutasiTipe('KELUAR_PRODUKSI')}
                    className={`py-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      mutasiTipe === 'KELUAR_PRODUKSI'
                        ? 'border-red-600 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4 text-red-600" />
                    Keluar (Produksi) (-)
                  </button>
                </div>
              </div>

              {/* Material Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Pilih Bahan Baku</label>
                <select
                  value={mutasiMaterialId}
                  onChange={(e) => setMutasiMaterialId(e.target.value)}
                  required
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.kode} - {m.nama} (Sisa Stok: {m.stok} {m.satuan}) {m.ukuran ? `• ${m.ukuran}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">Jumlah (Qty)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={mutasiJumlah}
                    onChange={(e) => setMutasiJumlah(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">Tanggal Mutasi</label>
                  <input
                    type="date"
                    required
                    value={mutasiTanggal}
                    onChange={(e) => setMutasiTanggal(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">Nama Pengambil (Operator)</label>
                  <input
                    type="text"
                    placeholder="e.g., Supriyanto (Mandor)"
                    value={mutasiPengambil}
                    onChange={(e) => setMutasiPengambil(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">Nama Penyerah (Gudang)</label>
                  <input
                    type="text"
                    placeholder="e.g., Slamet Warehouse"
                    value={mutasiPenyerah}
                    onChange={(e) => setMutasiPenyerah(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Keperluan Produksi / Target Pallet</label>
                <input
                  type="text"
                  placeholder="e.g., Assembling 150 pcs Pallet Standar EPAL 120x80"
                  value={mutasiKeperluan}
                  onChange={(e) => setMutasiKeperluan(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Keterangan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan..."
                  value={mutasiKeterangan}
                  onChange={(e) => setMutasiKeterangan(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMutasiModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-650 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: FORM TANDA TERIMA PENGAMBILAN MATERIAL ===================== */}
      {showTandaTerimaModal && (
        <div id="tanda-terima-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-950/30">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                    Form Tanda Terima Pengambilan Material Bahan Baku
                  </h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Dokumen serah terima bahan dari logistik ke operator produksi (otomatis memotong stok gudang)
                  </p>
                </div>
              </div>
              <button onClick={() => setShowTandaTerimaModal(false)} className="text-zinc-400 hover:text-zinc-650 text-lg cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleTandaTerimaSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">NOMOR BON TANDA TERIMA</label>
                  <input
                    type="text"
                    required
                    value={bonNomor}
                    onChange={(e) => setBonNomor(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">TANGGAL PENGAMBILAN</label>
                  <input
                    type="date"
                    required
                    value={bonTanggal}
                    onChange={(e) => setBonTanggal(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">DIVISI PEMOHON</label>
                  <select
                    value={bonDivisi}
                    onChange={(e) => setBonDivisi(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                  >
                    <option value="Produksi Assembling Pallet">Produksi Assembling Pallet</option>
                    <option value="Produksi Sawmill & Pembelahan">Produksi Sawmill & Pembelahan</option>
                    <option value="Kiln Dry & Heat Treatment (HT)">Kiln Dry & Heat Treatment (HT)</option>
                    <option value="Finishing & Sanding">Finishing & Sanding</option>
                    <option value="Maintenance & Workshop">Maintenance & Workshop</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">NAMA PENGAMBIL (OPERATOR / MANDOR)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Supriyanto (Mandor Assembling)"
                    value={bonPengambil}
                    onChange={(e) => setBonPengambil(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">NAMA PENYERAH (STAF GUDANG)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Budi (Kepala Gudang Logistik)"
                    value={bonPenyerah}
                    onChange={(e) => setBonPenyerah(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">TARGET PALLET / PRODUK</label>
                  <input
                    type="text"
                    placeholder="e.g., Pallet Standard 120 x 100 cm (Order PT Indofood)"
                    value={bonTargetProduk}
                    onChange={(e) => setBonTargetProduk(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">NOMOR SPK PRODUKSI</label>
                  <input
                    type="text"
                    placeholder="e.g., SPK-2026-042"
                    value={bonNomorSPK}
                    onChange={(e) => setBonNomorSPK(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Multi-Item Selector Table */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                    Daftar Bahan Baku yang Diambil:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBonItemRow}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Baris Bahan
                  </button>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-bold border-b border-zinc-200 dark:border-zinc-800">
                        <th className="p-2.5">Pilih Material Bahan Baku</th>
                        <th className="p-2.5">Ukuran / Dimensi</th>
                        <th className="p-2.5 text-center">Sisa Stok</th>
                        <th className="p-2.5 text-center w-28">Qty Diambil</th>
                        <th className="p-2.5">Keterangan</th>
                        <th className="p-2.5 text-center w-10">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {bonItems.map((row, idx) => {
                        const targetMat = materials.find(m => m.id === row.materialId);
                        const isOverStock = targetMat ? targetMat.stok < row.jumlah : false;
                        return (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                            <td className="p-2">
                              <select
                                value={row.materialId}
                                onChange={(e) => handleBonItemChange(idx, 'materialId', e.target.value)}
                                className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                              >
                                {materials.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.kode} - {m.nama}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
                              {row.ukuran || targetMat?.ukuran || '-'}
                            </td>
                            <td className="p-2 text-center font-bold text-zinc-700 dark:text-zinc-300">
                              {targetMat ? `${targetMat.stok} ${targetMat.satuan}` : '-'}
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  required
                                  min="0.01"
                                  step="any"
                                  value={row.jumlah}
                                  onChange={(e) => handleBonItemChange(idx, 'jumlah', Number(e.target.value))}
                                  className={`w-20 px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border rounded-lg text-xs font-bold text-center ${
                                    isOverStock ? 'border-red-500 bg-red-50 text-red-700' : 'border-zinc-200 dark:border-zinc-800'
                                  }`}
                                />
                                <span className="text-[10px] text-zinc-400 font-bold">{row.satuan}</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="e.g., Komponen alas atas"
                                value={row.keterangan || ''}
                                onChange={(e) => handleBonItemChange(idx, 'keterangan', e.target.value)}
                                className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveBonItemRow(idx)}
                                className="text-zinc-400 hover:text-red-600 cursor-pointer p-1"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">CATATAN KHUSUS</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan untuk tim assembling..."
                  value={bonCatatan}
                  onChange={(e) => setBonCatatan(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTandaTerimaModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-650 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
                >
                  Simpan & Potong Stok Gudang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PRINT PREVIEW BON TANDA TERIMA ===================== */}
      {selectedBonForPrint && (
        <div id="bon-print-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-3xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 relative">
            <button 
              onClick={() => setSelectedBonForPrint(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer print:hidden z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Top Bar for Print Controls */}
            <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center print:hidden pr-12">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">
                  Preview Bon Tanda Terima Pengambilan Material
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintOrPdf('bon-print-area', `Bon_Tanda_Terima_${selectedBonForPrint.nomorBon.replace(/\//g, '_')}`)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Cetak (Print / PDF)
                </button>
                <button
                  onClick={() => setSelectedBonForPrint(null)}
                  className="px-3.5 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Printable Document */}
            <div id="bon-print-area" className="p-8 md:p-10 bg-white text-black font-sans min-h-[550px] printable-sheet">
              {/* Kop Surat CV Mustika Kayunusa */}
              <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-white border border-zinc-300 rounded-xl flex items-center justify-center shrink-0">
                    <CompanyLogo size="md" className="h-12 w-12" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-zinc-900 tracking-tight">CV. MUSTIKA KAYUNUSA</h1>
                    <p className="text-[10px] text-zinc-600 max-w-sm">
                      Pabrik Pengolahan Kayu & Produsen Pallet Kayu Standar Ekspor ISPM #15.<br />
                      Sragentoyoso, Sragen, Jawa Tengah. Telp/WA: 0812-3456-7890
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wide">
                    SURAT TANDA TERIMA PENGAMBILAN MATERIAL
                  </h2>
                  <p className="text-xs font-mono font-bold text-red-600 mt-1">
                    NO: {selectedBonForPrint.nomorBon}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Tanggal: {selectedBonForPrint.tanggal}
                  </p>
                </div>
              </div>

              {/* Information Meta */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs mb-6">
                <div className="space-y-1">
                  <p><span className="text-zinc-500 font-medium">Divisi Pemohon:</span> <strong>{selectedBonForPrint.divisiPemohon}</strong></p>
                  <p><span className="text-zinc-500 font-medium">Pengambil (Penerima):</span> <strong>{selectedBonForPrint.namaPengambil}</strong></p>
                  <p><span className="text-zinc-500 font-medium">Penyerah (Warehouse):</span> <strong>{selectedBonForPrint.namaPenyerah}</strong></p>
                </div>
                <div className="space-y-1">
                  <p><span className="text-zinc-500 font-medium">Target Pallet / Produk:</span> <strong>{selectedBonForPrint.targetProduk || '-'}</strong></p>
                  <p><span className="text-zinc-500 font-medium">Nomor SPK:</span> <strong>{selectedBonForPrint.nomorSPK || '-'}</strong></p>
                  <p><span className="text-zinc-500 font-medium">Status:</span> <strong className="text-emerald-700">DISETUJUI / RESMI</strong></p>
                </div>
              </div>

              {/* Table of Items */}
              <div className="border border-zinc-300 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-300 font-extrabold text-zinc-800">
                      <th className="p-2.5 text-center w-10">No</th>
                      <th className="p-2.5">Nama Bahan Baku</th>
                      <th className="p-2.5">Kategori / Spesifikasi</th>
                      <th className="p-2.5">Ukuran / Dimensi</th>
                      <th className="p-2.5 text-right w-24">Jumlah Qty</th>
                      <th className="p-2.5">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {selectedBonForPrint.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-center font-bold text-zinc-500">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-zinc-900">{it.namaMaterial}</td>
                        <td className="p-2.5 text-zinc-600">{it.kategori || '-'}</td>
                        <td className="p-2.5 font-mono text-zinc-700">{it.ukuran || '-'}</td>
                        <td className="p-2.5 text-right font-mono font-black text-zinc-900">
                          {it.jumlah} {it.satuan}
                        </td>
                        <td className="p-2.5 text-zinc-600">{it.keterangan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedBonForPrint.catatan && (
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs mb-8">
                  <span className="text-zinc-500 font-bold">Catatan:</span> {selectedBonForPrint.catatan}
                </div>
              )}

              {/* 3-Column Signatures */}
              <div className="pt-6 grid grid-cols-3 gap-4 text-xs text-center">
                <div>
                  <p className="font-medium text-zinc-600">Yang Mengambil (Produksi),</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">{selectedBonForPrint.namaPengambil}</p>
                  <p className="text-[10px] text-zinc-400">Operator / Mandor</p>
                </div>

                <div>
                  <p className="font-medium text-zinc-600">Yang Menyerahkan,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">{selectedBonForPrint.namaPenyerah}</p>
                  <p className="text-[10px] text-zinc-400">Staf Gudang Logistik</p>
                </div>

                <div>
                  <p className="font-medium text-zinc-600">Mengetahui,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">Kepala Warehouse / Manager</p>
                  <p className="text-[10px] text-zinc-400">CV. Mustika Kayunusa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PRINT STOCK REPORT ===================== */}
      {showPrintModal && (
        <div id="material-print-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-5xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 relative">
            <button 
              onClick={() => setShowPrintModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer print:hidden z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center print:hidden pr-12">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" />
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">
                  Laporan Stok & Spesifikasi Bahan Baku Logistik
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={isDownloadingPdf}
                  onClick={async () => {
                    setIsDownloadingPdf(true);
                    await downloadElementAsPdf('material-print-area', `Laporan_Stok_Material_${new Date().toISOString().slice(0, 10)}`);
                    setIsDownloadingPdf(false);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF'}
                </button>
                <button
                  onClick={() => triggerPrintOrPdf('material-print-area', `Laporan_Stok_Material_${new Date().toISOString().slice(0, 10)}`)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Cetak (Print)
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div id="material-print-area" className="p-8 md:p-12 bg-white text-black font-sans min-h-[600px] printable-sheet">
              {/* Kop Surat */}
              <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-1 bg-white border border-zinc-200 rounded-xl flex items-center justify-center shrink-0">
                    <CompanyLogo size="md" className="h-14 w-14" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-zinc-900 tracking-tight">CV. MUSTIKA KAYUNUSA</h1>
                    <p className="text-[10px] text-zinc-500 max-w-sm mt-0.5">
                      Pabrik Pengolahan Kayu & Logistik Pallet Kayu Standar Ekspor (ISPM #15).<br />
                      Sragentoyoso, Sragen, Jawa Tengah, Indonesia.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-sm font-black text-zinc-900 uppercase">LAPORAN MUTASI & STOK BAHAN BAKU</h2>
                  <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase">
                    Tanggal: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Table */}
              <div className="border border-zinc-200 rounded-xl overflow-hidden mb-8">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200 font-extrabold text-zinc-700">
                      <th className="p-2.5">Kode</th>
                      <th className="p-2.5">Nama Item</th>
                      <th className="p-2.5">Kategori</th>
                      <th className="p-2.5">Ukuran</th>
                      <th className="p-2.5 text-center">Tgl Masuk</th>
                      <th className="p-2.5 text-right">Stok Awal</th>
                      <th className="p-2.5 text-right text-emerald-700">Masuk</th>
                      <th className="p-2.5 text-right text-red-700">Keluar</th>
                      <th className="p-2.5 text-right font-black">Sisa Stok</th>
                      {!isWarehouse && (
                        <th className="p-2.5 text-right">Harga Beli</th>
                      )}
                      <th className="p-2.5">Supplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150">
                    {materials.map(m => (
                      <tr key={m.id}>
                        <td className="p-2 font-mono font-bold text-zinc-650">{m.kode}</td>
                        <td className="p-2 font-semibold text-zinc-900">{m.nama}</td>
                        <td className="p-2 text-zinc-600">{m.kategori}</td>
                        <td className="p-2 font-mono text-zinc-600">{m.ukuran || '-'}</td>
                        <td className="p-2 text-center font-mono text-zinc-500">{m.tanggalMasukWarehouse || '-'}</td>
                        <td className="p-2 text-right font-mono font-bold">{m.stokAwal !== undefined ? m.stokAwal : m.stok} {m.satuan}</td>
                        <td className="p-2 text-right font-mono text-emerald-700 font-bold">+{m.stokMasuk || 0}</td>
                        <td className="p-2 text-right font-mono text-red-700 font-bold">-{m.stokKeluar || 0}</td>
                        <td className="p-2 text-right font-mono font-black text-zinc-900">
                          {m.stok} {m.satuan}
                        </td>
                        {!isWarehouse && (
                          <td className="p-2 text-right font-mono text-zinc-650">
                            Rp {m.hargaBeli.toLocaleString('id-ID')}
                          </td>
                        )}
                        <td className="p-2 text-zinc-500 font-medium">{m.supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-center text-xs text-center">
                <div className="w-48">
                  <p>Dipersiapkan Oleh,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">{currentUser?.name || 'Staf Gudang'}</p>
                  <p className="text-[10px] text-zinc-400">Kepala Gudang & Logistik</p>
                </div>
                <div className="w-48">
                  <p>Mengetahui / Menyetujui,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">Direktur Utama</p>
                  <p className="text-[10px] text-zinc-400">CV. Mustika Kayunusa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Material */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Data Material Bahan Baku"
        message="Apakah Anda yakin ingin menghapus data material ini dari sistem inventaris pabrik?"
        itemName={deleteTarget ? `${deleteTarget.kode} - ${deleteTarget.nama} (Stok: ${deleteTarget.stok} ${deleteTarget.satuan})` : ''}
      />

      {/* Delete Confirmation Modal for Bon */}
      <DeleteConfirmModal
        isOpen={!!deleteBonTarget}
        onClose={() => setDeleteBonTarget(null)}
        onConfirm={handleDeleteBonConfirm}
        title="Hapus Dokumen Tanda Terima"
        message="Apakah Anda yakin ingin menghapus dokumen bon tanda terima ini?"
        itemName={deleteBonTarget ? `${deleteBonTarget.nomorBon} (${deleteBonTarget.divisiPemohon} - ${deleteBonTarget.namaPengambil})` : ''}
      />

    </div>
  );
};
