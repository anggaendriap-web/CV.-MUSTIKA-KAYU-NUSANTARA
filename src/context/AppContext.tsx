import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Material, 
  FinishGood, 
  PurchaseOrder, 
  SuratJalan, 
  Keuangan, 
  User, 
  UserRole, 
  Customer, 
  MarketingCommission,
  HutangUsaha,
  KasKecilItem,
  BukuBankItem,
  AsetTetap,
  PajakItem,
  TandaTerimaPengambilanMaterial,
  MaterialMutasiItem,
  FinishGoodMutasiItem,
  PurchaseOrderSupplier,
  POSupplierItem,
  Supplier
} from '../types';
import { db, doc, collection, onSnapshot, setDoc, deleteDoc, getDocFromServer } from '../firebase';
import { calculateDueDateFromInvoice } from '../utils/paymentTerms';

interface AppContextProps {
  materials: Material[];
  finishGoods: FinishGood[];
  purchaseOrders: PurchaseOrder[];
  poSuppliers: PurchaseOrderSupplier[];
  suppliers: Supplier[];
  suratJalanList: SuratJalan[];
  keuanganList: Keuangan[];
  customers: Customer[];
  marketingList: MarketingCommission[];
  hutangList: HutangUsaha[];
  kasKecilList: KasKecilItem[];
  bukuBankList: BukuBankItem[];
  asetList: AsetTetap[];
  pajakList: PajakItem[];
  tandaTerimaMaterialList: TandaTerimaPengambilanMaterial[];
  currentUser: User | null;
  darkMode: boolean;
  
  // Opening Balance States & Functions
  saldoAwalKasKecil: number;
  saldoAwalKasBesar: number;
  saldoAwalBukuBank: number;
  updateSaldoAwalKasKecil: (val: number) => void;
  updateSaldoAwalKasBesar: (val: number) => void;
  updateSaldoAwalBukuBank: (val: number) => void;

  // HPP & Beban Override States & Functions
  useOverrideHPP: boolean;
  overrideHPPValue: number;
  useOverrideBeban: boolean;
  overrideBebanValue: number;
  updateOverrideHPP: (useOverride: boolean, val: number) => void;
  updateOverrideBeban: (useOverride: boolean, val: number) => void;

  // Equity States & Functions
  modalDisetor: number;
  labaDitahan: number;
  useOverrideLabaBersih: boolean;
  overrideLabaBersihValue: number;
  useOverridePenyeimbang: boolean;
  overridePenyeimbangValue: number;
  updateEquitySettings: (
    modalDisetor: number, 
    labaDitahan: number, 
    useOverride: boolean, 
    overrideVal: number,
    useOverridePenyeimbang?: boolean,
    overridePenyeimbangValue?: number
  ) => void;
  
  // Firebase State
  isFirebaseConnected: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';

  // Passwords & Auth actions
  passwords: Record<UserRole, string>;
  updatePassword: (role: UserRole, newPassword: string) => { success: boolean; message: string };
  login: (role: UserRole, password: string) => boolean;
  logout: () => void;
  switchUser: (role: UserRole) => void;

  // UI action
  toggleDarkMode: () => void;

  // Material actions
  addMaterial: (material: Omit<Material, 'id' | 'terakhirDiperbarui'>) => void;
  updateMaterial: (id: string, material: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  adjustMaterialStock: (id: string, amount: number) => void;
  recordMaterialMutation: (materialId: string, mutasi: Omit<MaterialMutasiItem, 'id'>) => void;

  // Form Tanda Terima Pengambilan Material actions
  addTandaTerimaMaterial: (bon: Omit<TandaTerimaPengambilanMaterial, 'id' | 'createdAt'>) => string;
  updateTandaTerimaMaterial: (id: string, bon: Partial<TandaTerimaPengambilanMaterial>) => void;
  deleteTandaTerimaMaterial: (id: string) => void;

  // FinishGood actions
  addFinishGood: (good: Omit<FinishGood, 'id' | 'terakhirDiperbarui'>) => void;
  updateFinishGood: (id: string, good: Partial<FinishGood>) => void;
  deleteFinishGood: (id: string) => void;
  adjustFinishGoodStock: (id: string, amount: number) => void;
  recordFinishGoodMutation: (finishGoodId: string, mutasi: Omit<FinishGoodMutasiItem, 'id'>) => void;
  updateFinishGoodOpname: (finishGoodId: string, stokFisik: number, keterangan?: string) => void;
  producePallets: (finishGoodId: string, quantity: number, consumedMaterials: { materialId: string; amount: number }[]) => { success: boolean; error?: string };

  // Purchase Order & Invoice actions
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => void;
  updatePurchaseOrder: (id: string, po: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  updatePOStatus: (id: string, status: PurchaseOrder['statusPO']) => void;
  updateInvoiceStatus: (id: string, status: PurchaseOrder['statusInvoice'], paymentMethod?: Keuangan['metodePembayaran']) => void;

  // Purchase Order ke Supplier actions
  addPOSupplier: (po: Omit<PurchaseOrderSupplier, 'id' | 'createdAt' | 'statusAP' | 'apId' | 'nomorTagihanAP'>) => string;
  updatePOSupplier: (id: string, po: Partial<PurchaseOrderSupplier>) => void;
  deletePOSupplier: (id: string) => void;
  updatePOSupplierStatus: (id: string, status: PurchaseOrderSupplier['statusPO']) => void;
  terimaBarangPOSupplier: (
    id: string, 
    keterangan?: string, 
    receivedItems?: { namaMaterial: string; jumlahDiterima: number }[]
  ) => { success: boolean; message: string; statusPO?: PurchaseOrderSupplier['statusPO']; totalNilaiDiterima?: number };

  // Supplier Database actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => string;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Customer actions
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Marketing actions
  addMarketing: (mkt: Omit<MarketingCommission, 'id'>) => void;
  updateMarketing: (id: string, mkt: Partial<MarketingCommission>) => void;
  deleteMarketing: (id: string) => void;

  // Surat Jalan actions
  addSuratJalan: (sj: Omit<SuratJalan, 'id'>) => void;
  updateSuratJalan: (id: string, sj: Partial<SuratJalan>) => void;
  deleteSuratJalan: (id: string) => void;
  updateSJStatus: (id: string, status: SuratJalan['statusPengiriman'], receiver?: string) => void;

  // Keuangan actions
  addKeuangan: (transaksi: Omit<Keuangan, 'id' | 'kodeTransaksi'>) => void;
  updateKeuangan: (id: string, transaksi: Partial<Keuangan>) => void;
  deleteKeuangan: (id: string) => void;

  // Hutang Usaha (AP) actions
  addHutang: (hutang: Omit<HutangUsaha, 'id' | 'sisaHutang'>) => void;
  updateHutang: (id: string, hutang: Partial<HutangUsaha>) => void;
  deleteHutang: (id: string) => void;
  bayarHutang: (id: string, nominalBayar: number, metode: string, catatan?: string) => void;

  // Kas Kecil actions
  addKasKecil: (item: Omit<KasKecilItem, 'id' | 'kode'>) => void;
  updateKasKecil: (id: string, item: Partial<KasKecilItem>) => void;
  deleteKasKecil: (id: string) => void;

  // Buku Bank actions
  addBukuBank: (item: Omit<BukuBankItem, 'id' | 'kodeMutasi'>) => void;
  updateBukuBank: (id: string, item: Partial<BukuBankItem>) => void;
  deleteBukuBank: (id: string) => void;
  clearAllBukuBank: () => void;

  // Aset & Depresiasi actions
  addAset: (aset: Omit<AsetTetap, 'id' | 'kodeAset' | 'nilaiBuku' | 'penyusutanPerBulan' | 'akumulasiPenyusutan'>) => void;
  updateAset: (id: string, aset: Partial<AsetTetap>) => void;
  deleteAset: (id: string) => void;

  // Pajak actions
  deletedTaxIds: string[];
  addPajak: (pajak: Omit<PajakItem, 'id'>) => void;
  updatePajak: (id: string, pajak: Partial<PajakItem>) => void;
  deletePajak: (id: string) => void;

  // Reset database action
  resetDatabase: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Initial Mock Users
const MOCK_USERS: Record<UserRole, User> = {
  ADMIN_SALES: { id: 'usr-1', username: 'sales_mustika', name: 'Sales Admin', role: 'ADMIN_SALES' },
  WAREHOUSE: { id: 'usr-2', username: 'warehouse_mustika', name: 'Warehouse Admin', role: 'WAREHOUSE' },
  FINANCE: { id: 'usr-3', username: 'finance_mustika', name: 'Finance Admin', role: 'FINANCE' },
  OWNER: { id: 'usr-4', username: 'owner_mustika', name: 'Owner', role: 'OWNER' }
};

export const DEFAULT_PASSWORDS: Record<UserRole, string> = {
  ADMIN_SALES: 'sales123',
  WAREHOUSE: 'warehouse123',
  FINANCE: 'finance123',
  OWNER: 'owner123'
};

export const DEFAULT_PO_SUPPLIERS: PurchaseOrderSupplier[] = [
  {
    id: 'posup-1',
    nomorPO: 'PO-SUP/2026/08/001',
    nomorRefSupplier: 'SPH-088/SKL/26',
    supplier: 'PT Sumber Kayu Lestari',
    alamatSupplier: 'Jl. Raya Magelang KM 14, Sleman, DI Yogyakarta',
    teleponSupplier: '0812-3456-7890',
    picSupplier: 'Bpk. H. Sudirman',
    tanggal: '2026-08-10',
    tanggalPengiriman: '2026-08-15',
    syaratPembayaran: 'Tempo 30 Hari',
    tanggalJatuhTempo: '2026-09-09',
    kategori: 'Bahan Baku Kayu',
    items: [
      { namaMaterial: 'Kayu Log Albasia Sengon Dia 25cm', kodeMaterial: 'MAT-001', ukuran: 'Dia 25-30 cm, P 200 cm', jumlah: 20, satuan: 'm3', hargaSatuan: 950000, subtotal: 19000000 },
      { namaMaterial: 'Balok Kayu Mahoni 6x12x200', kodeMaterial: 'MAT-002', ukuran: '6 x 12 x 200 cm', jumlah: 15, satuan: 'm3', hargaSatuan: 1450000, subtotal: 21750000 }
    ],
    subtotal: 40750000,
    tipePajak: 'PPN 11%',
    ppnNominal: 4482500,
    biayaKirim: 0,
    totalHarga: 45232500,
    statusPO: 'Diterima Gudang',
    statusAP: 'Belum Lunas',
    apId: 'ap-po-posup-1',
    nomorTagihanAP: 'AP-PO-SUP/2026/08/001',
    catatan: 'Kayu log grade super tanpa mata mati busuk',
    dibuatOleh: 'Sales Admin',
    createdAt: '2026-08-10T08:00:00Z'
  },
  {
    id: 'posup-2',
    nomorPO: 'PO-SUP/2026/08/020',
    nomorRefSupplier: 'NOTA-991/LMA',
    supplier: 'CV Log Makmur Abadi',
    alamatSupplier: 'Kutoarjo, Purworejo, Jawa Tengah',
    teleponSupplier: '0857-8910-1122',
    picSupplier: 'Ibu Ratna Susanti',
    tanggal: '2026-08-18',
    tanggalPengiriman: '2026-08-22',
    syaratPembayaran: 'Tempo 14 Hari',
    tanggalJatuhTempo: '2026-09-01',
    kategori: 'Bahan Baku Kayu',
    items: [
      { namaMaterial: 'Kayu Papan Mahoni 2x10x120', kodeMaterial: 'MAT-003', ukuran: '2 x 10 x 120 cm', jumlah: 300, satuan: 'lembar', hargaSatuan: 22000, subtotal: 6600000 },
      { namaMaterial: 'Papan Albasia Standard', kodeMaterial: 'MAT-004', ukuran: '2 x 9 x 100 cm', jumlah: 400, satuan: 'lembar', hargaSatuan: 16500, subtotal: 6600000 }
    ],
    subtotal: 13200000,
    tipePajak: 'Non PPN',
    totalHarga: 13200000,
    statusPO: 'Diterima Gudang',
    statusAP: 'Lunas',
    apId: 'ap-po-posup-2',
    nomorTagihanAP: 'AP-PO-SUP/2026/08/020',
    catatan: 'Pengiriman armada truk colt diesel CV Log Makmur',
    dibuatOleh: 'Sales Admin',
    createdAt: '2026-08-18T09:30:00Z'
  },
  {
    id: 'posup-3',
    nomorPO: 'PO-SUP/2026/09/005',
    nomorRefSupplier: 'SP-109/BPN/IX',
    supplier: 'PT Baja Paku Nusantara',
    alamatSupplier: 'Kawasan Industri Candi Blok 8, Semarang',
    teleponSupplier: '024-7612345',
    picSupplier: 'Sales Bpk Eko Wibowo',
    tanggal: '2026-09-12',
    tanggalPengiriman: '2026-09-18',
    syaratPembayaran: 'Tempo 30 Hari',
    tanggalJatuhTempo: '2026-10-12',
    kategori: 'Paku & Besi',
    items: [
      { namaMaterial: 'Paku Koil Coil Nails 2.1 x 45mm Pallet', kodeMaterial: 'MAT-007', ukuran: '2.1 x 45 mm', jumlah: 15, satuan: 'dus', hargaSatuan: 450000, subtotal: 6750000 },
      { namaMaterial: 'Paku Ulir Ring Shank 2.5 x 50mm', kodeMaterial: 'MAT-008', ukuran: '2.5 x 50 mm', jumlah: 10, satuan: 'dus', hargaSatuan: 520000, subtotal: 5200000 }
    ],
    subtotal: 11950000,
    tipePajak: 'PPN 11%',
    ppnNominal: 1314500,
    totalHarga: 13264500,
    statusPO: 'Dikirim Supplier',
    statusAP: 'Belum Lunas',
    apId: 'ap-po-posup-3',
    nomorTagihanAP: 'AP-PO-SUP/2026/09/005',
    catatan: 'Paku anti karat bersertifikasi untuk perakitan pallet ekspor',
    dibuatOleh: 'Sales Admin',
    createdAt: '2026-09-12T10:15:00Z'
  }
];

export const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    nama: 'PT Sumber Kayu Lestari',
    alamat: 'Jl. Raya Magelang KM 14, Sleman, DI Yogyakarta',
    telepon: '0812-3456-7890',
    email: 'sales@sumberkayulestari.com',
    pic: 'Bpk. H. Sudirman',
    kategoriDefault: 'Bahan Baku Kayu',
    syaratPembayaranDefault: 'Tempo 30 Hari',
    bankInfo: 'Bank BCA 802-991-8821 a.n PT Sumber Kayu Lestari',
    catatan: 'Penyuplai utama kayu log sengon albasia dan mahoni sertifikasi SVLK',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'sup-2',
    nama: 'CV Log Makmur Abadi',
    alamat: 'Kutoarjo, Purworejo, Jawa Tengah',
    telepon: '0857-8910-1122',
    email: 'logmakmurabadi@gmail.com',
    pic: 'Ibu Ratna Susanti',
    kategoriDefault: 'Bahan Baku Kayu',
    syaratPembayaranDefault: 'Tempo 14 Hari',
    bankInfo: 'Bank Mandiri 137-00-881299-1 a.n CV Log Makmur Abadi',
    catatan: 'Spesialis papan mahoni dan albasia kering oven kiln dry',
    createdAt: '2026-08-05T08:00:00Z'
  },
  {
    id: 'sup-3',
    nama: 'PT Baja Paku Nusantara',
    alamat: 'Kawasan Industri Candi Blok 8, Semarang',
    telepon: '024-7612345',
    email: 'order@bajapakunusantara.com',
    pic: 'Bpk. Eko Wibowo',
    kategoriDefault: 'Paku & Besi',
    syaratPembayaranDefault: 'Tempo 30 Hari',
    bankInfo: 'Bank Mandiri 135-00-192837-4 a.n PT Baja Paku Nusantara',
    catatan: 'Pemasok paku koil tembak pneumatic (coil nails) dan kawat pallet',
    createdAt: '2026-08-08T08:00:00Z'
  },
  {
    id: 'sup-4',
    nama: 'PT Mitra Preservasi Kayu Abadi',
    alamat: 'Jl. Industri Rungkut No. 12, Surabaya',
    telepon: '0811-2233-4455',
    email: 'info@mitrapreservasi.com',
    pic: 'Ir. Budi Santoso',
    kategoriDefault: 'Lainnya',
    syaratPembayaranDefault: 'Tempo 30 Hari',
    bankInfo: 'Bank BNI 091-882-7711 a.n PT Mitra Preservasi Kayu',
    catatan: 'Bahan kimia anti rayap, anti jamur, dan formula sertifikasi ISPM-15',
    createdAt: '2026-08-10T08:00:00Z'
  }
];

export const DEFAULT_HUTANG_FROM_POS: HutangUsaha[] = [
  {
    id: 'ap-po-posup-1',
    nomorTagihan: 'AP-PO-SUP/2026/08/001',
    supplier: 'PT Sumber Kayu Lestari',
    tanggal: '2026-08-10',
    tanggalJatuhTempo: '2026-09-09',
    kategori: 'Bahan Baku Kayu',
    keterangan: 'PO Supplier PO-SUP/2026/08/001: Kayu Log Albasia Sengon & Balok Mahoni',
    totalTagihan: 45232500,
    sudahDibayar: 0,
    sisaHutang: 45232500,
    status: 'Belum Lunas',
    poSupplierId: 'posup-1',
    nomorPO: 'PO-SUP/2026/08/001'
  },
  {
    id: 'ap-po-posup-2',
    nomorTagihan: 'AP-PO-SUP/2026/08/020',
    supplier: 'CV Log Makmur Abadi',
    tanggal: '2026-08-18',
    tanggalJatuhTempo: '2026-09-01',
    kategori: 'Bahan Baku Kayu',
    keterangan: 'PO Supplier PO-SUP/2026/08/020: Kayu Papan Mahoni & Papan Albasia',
    totalTagihan: 13200000,
    sudahDibayar: 13200000,
    sisaHutang: 0,
    status: 'Lunas',
    poSupplierId: 'posup-2',
    nomorPO: 'PO-SUP/2026/08/020',
    riwayatBayar: [
      { tanggal: '2026-08-28', nominal: 13200000, metode: 'Transfer Bank Mandiri', catatan: 'Pelunasan faktur PO-SUP/2026/08/020' }
    ]
  },
  {
    id: 'ap-po-posup-3',
    nomorTagihan: 'AP-PO-SUP/2026/09/005',
    supplier: 'PT Baja Paku Nusantara',
    tanggal: '2026-09-12',
    tanggalJatuhTempo: '2026-10-12',
    kategori: 'Paku & Besi',
    keterangan: 'PO Supplier PO-SUP/2026/09/005: Paku Koil Coil Nails & Paku Ulir Ring Shank',
    totalTagihan: 13264500,
    sudahDibayar: 0,
    sisaHutang: 13264500,
    status: 'Belum Lunas',
    poSupplierId: 'posup-3',
    nomorPO: 'PO-SUP/2026/09/005'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Master tombstone registry for all deleted IDs (prevents stale onSnapshot or offline cache re-hydration)
  const initialDeletedDocs: string[] = (() => {
    try {
      const cached = localStorage.getItem('mk_deleted_doc_ids');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  })();

  const [deletedDocIds, setDeletedDocIds] = useState<string[]>(initialDeletedDocs);
  const deletedDocIdsRef = useRef<Set<string>>(new Set(initialDeletedDocs));

  const [materials, setMaterials] = useState<Material[]>(() => {
    const cached = localStorage.getItem('mk_materials');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Material[];
        return parsed.filter(m => !deletedDocIdsRef.current.has(m.id));
      } catch { return []; }
    }
    return [];
  });

  const [finishGoods, setFinishGoods] = useState<FinishGood[]>(() => {
    const cached = localStorage.getItem('mk_finish_goods');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as FinishGood[];
        return parsed.filter(f => !deletedDocIdsRef.current.has(f.id));
      } catch { return []; }
    }
    return [];
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const cached = localStorage.getItem('mk_purchase_orders');
    if (cached) {
      try {
        const rawList = (JSON.parse(cached) as PurchaseOrder[]).filter(p => !deletedDocIdsRef.current.has(p.id));
        return rawList.map(po => {
          const terms = po.syaratPembayaran || 'Tempo 30 Hari';
          const invDate = po.tanggalInvoice || po.tanggal || new Date().toISOString().split('T')[0];
          const dueDate = po.tanggalJatuhTempo && po.tanggalJatuhTempo.trim() !== ''
            ? po.tanggalJatuhTempo
            : calculateDueDateFromInvoice(invDate, terms);
          return {
            ...po,
            nomorInvoice: po.nomorInvoice && po.nomorInvoice.trim() !== ''
              ? po.nomorInvoice
              : `INV/MKN/2026/08/${po.id.replace(/[^0-9]/g, '').slice(-3) || Math.floor(100 + Math.random() * 900)}`,
            syaratPembayaran: terms,
            tanggalInvoice: invDate,
            tanggalJatuhTempo: dueDate,
            statusInvoice: (po.statusInvoice as string) === 'Belum Terbit' || !po.statusInvoice
              ? 'Belum Bayar'
              : po.statusInvoice
          };
        });
      } catch { return []; }
    }
    return [];
  });

  const [poSuppliers, setPOSuppliers] = useState<PurchaseOrderSupplier[]>(() => {
    const cached = localStorage.getItem('mk_po_suppliers');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as PurchaseOrderSupplier[];
        return parsed.filter(p => !deletedDocIdsRef.current.has(p.id));
      } catch { return DEFAULT_PO_SUPPLIERS; }
    }
    return DEFAULT_PO_SUPPLIERS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const cached = localStorage.getItem('mk_suppliers');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Supplier[];
        const filtered = parsed.filter(s => !deletedDocIdsRef.current.has(s.id));
        const existingIds = new Set(filtered.map(s => s.id));
        const missingDefaults = DEFAULT_SUPPLIERS.filter(d => !existingIds.has(d.id) && !deletedDocIdsRef.current.has(d.id));
        if (missingDefaults.length > 0) {
          const merged = [...filtered, ...missingDefaults];
          localStorage.setItem('mk_suppliers', JSON.stringify(merged));
          return merged;
        }
        return filtered;
      } catch { return DEFAULT_SUPPLIERS; }
    }
    return DEFAULT_SUPPLIERS;
  });

  const [suratJalanList, setSuratJalanList] = useState<SuratJalan[]>(() => {
    const cached = localStorage.getItem('mk_surat_jalan');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as SuratJalan[];
        return parsed.filter(s => !deletedDocIdsRef.current.has(s.id));
      } catch { return []; }
    }
    return [];
  });

  const [keuanganList, setKeuanganList] = useState<Keuangan[]>(() => {
    const cached = localStorage.getItem('mk_keuangan');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Keuangan[];
        return parsed.filter(k => !deletedDocIdsRef.current.has(k.id));
      } catch { return []; }
    }
    return [];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const cached = localStorage.getItem('mk_customers');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Customer[];
        return parsed.filter(c => !deletedDocIdsRef.current.has(c.id));
      } catch { return []; }
    }
    return [];
  });

  const [marketingList, setMarketingList] = useState<MarketingCommission[]>(() => {
    const cached = localStorage.getItem('mk_marketing');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as MarketingCommission[];
        return parsed.filter(m => !deletedDocIdsRef.current.has(m.id));
      } catch { return []; }
    }
    return [];
  });

  const [hutangList, setHutangList] = useState<HutangUsaha[]>(() => {
    const cached = localStorage.getItem('mk_hutang_ap');
    if (cached) {
      try {
        const parsed = (JSON.parse(cached) as HutangUsaha[]).filter(h => !deletedDocIdsRef.current.has(h.id));
        // Ensure initial sample PO AP records exist if not deleted
        const existingIds = new Set(parsed.map(h => h.id));
        const missingDefaults = DEFAULT_HUTANG_FROM_POS.filter(d => !existingIds.has(d.id) && !deletedDocIdsRef.current.has(d.id));
        if (missingDefaults.length > 0) {
          const merged = [...parsed, ...missingDefaults];
          localStorage.setItem('mk_hutang_ap', JSON.stringify(merged));
          return merged;
        }
        return parsed;
      } catch { return DEFAULT_HUTANG_FROM_POS; }
    }
    return DEFAULT_HUTANG_FROM_POS;
  });

  const [kasKecilList, setKasKecilList] = useState<KasKecilItem[]>(() => {
    const cached = localStorage.getItem('mk_kas_kecil');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as KasKecilItem[];
        return parsed.filter(k => !deletedDocIdsRef.current.has(k.id));
      } catch { return []; }
    }
    return [];
  });

  const [bukuBankList, setBukuBankList] = useState<BukuBankItem[]>(() => {
    const cached = localStorage.getItem('mk_buku_bank');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as BukuBankItem[];
        return parsed.filter(b => !deletedDocIdsRef.current.has(b.id));
      } catch { return []; }
    }
    return [];
  });

  const [asetList, setAsetList] = useState<AsetTetap[]>(() => {
    const cached = localStorage.getItem('mk_aset_tetap');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as AsetTetap[];
        return parsed.filter(a => !deletedDocIdsRef.current.has(a.id));
      } catch { return []; }
    }
    return [];
  });

  const [pajakList, setPajakList] = useState<PajakItem[]>(() => {
    const cached = localStorage.getItem('mk_laporan_pajak');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as PajakItem[];
        return parsed.filter(p => !deletedDocIdsRef.current.has(p.id));
      } catch { return []; }
    }
    return [];
  });

  const [tandaTerimaMaterialList, setTandaTerimaMaterialList] = useState<TandaTerimaPengambilanMaterial[]>(() => {
    const cached = localStorage.getItem('mk_tanda_terima_material');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as TandaTerimaPengambilanMaterial[];
        return parsed.filter(t => !deletedDocIdsRef.current.has(t.id));
      } catch { return []; }
    }
    return [];
  });

  const [deletedTaxIds, setDeletedTaxIds] = useState<string[]>(() => {
    const cached = localStorage.getItem('mk_deleted_tax_ids');
    if (cached) {
      try { return JSON.parse(cached); } catch { return []; }
    }
    return [];
  });

  const [saldoAwalKasKecil, setSaldoAwalKasKecil] = useState<number>(() => {
    return Number(localStorage.getItem('mk_saldo_awal_kas_kecil') || '0');
  });
  const [saldoAwalKasBesar, setSaldoAwalKasBesar] = useState<number>(() => {
    return Number(localStorage.getItem('mk_saldo_awal_kas_besar') || '0');
  });
  const [saldoAwalBukuBank, setSaldoAwalBukuBank] = useState<number>(() => {
    return Number(localStorage.getItem('mk_saldo_awal_buku_bank') || '0');
  });

  const [useOverrideHPP, setUseOverrideHPP] = useState<boolean>(() => {
    return localStorage.getItem('mk_use_override_hpp') === 'true';
  });
  const [overrideHPPValue, setOverrideHPPValue] = useState<number>(() => {
    return Number(localStorage.getItem('mk_override_hpp_value') || '0');
  });
  const [useOverrideBeban, setUseOverrideBeban] = useState<boolean>(() => {
    return localStorage.getItem('mk_use_override_beban') === 'true';
  });
  const [overrideBebanValue, setOverrideBebanValue] = useState<number>(() => {
    return Number(localStorage.getItem('mk_override_beban_value') || '0');
  });

  const [modalDisetor, setModalDisetor] = useState<number>(() => {
    return Number(localStorage.getItem('mk_modal_disetor') || '500000000');
  });
  const [labaDitahan, setLabaDitahan] = useState<number>(() => {
    return Number(localStorage.getItem('mk_laba_ditahan') || '-499000000');
  });
  const [useOverrideLabaBersih, setUseOverrideLabaBersih] = useState<boolean>(() => {
    return localStorage.getItem('mk_use_override_laba_bersih') === 'true';
  });
  const [overrideLabaBersihValue, setOverrideLabaBersihValue] = useState<number>(() => {
    return Number(localStorage.getItem('mk_override_laba_bersih_value') || '145515000');
  });
  const [useOverridePenyeimbang, setUseOverridePenyeimbang] = useState<boolean>(() => {
    return localStorage.getItem('mk_use_override_penyeimbang') === 'true';
  });
  const [overridePenyeimbangValue, setOverridePenyeimbangValue] = useState<number>(() => {
    return Number(localStorage.getItem('mk_override_penyeimbang_value') || '-335500000');
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [passwords, setPasswords] = useState<Record<UserRole, string>>(() => {
    const cached = localStorage.getItem('mk_passwords');
    if (cached) {
      try {
        return { ...DEFAULT_PASSWORDS, ...JSON.parse(cached) };
      } catch {
        return DEFAULT_PASSWORDS;
      }
    }
    return DEFAULT_PASSWORDS;
  });

  const isInitialSyncDone = useRef(false);

  // Helper to safely sanitize and write to Firestore
  const sanitizeForFirestore = <T,>(data: T): T => {
    if (data === undefined) return null as any;
    if (data === null || typeof data !== 'object') return data;
    if (Array.isArray(data)) {
      return data.map(item => sanitizeForFirestore(item)) as any;
    }
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result;
  };

  const syncToFirestore = async (colName: string, id: string, data: any) => {
    const docId = String(id || '').trim();
    if (!docId) return;

    // If document is being created/updated, ensure it is un-marked from deleted tombstones
    if (deletedDocIdsRef.current.has(docId)) {
      deletedDocIdsRef.current.delete(docId);
      const nextArr = Array.from(deletedDocIdsRef.current);
      setDeletedDocIds(nextArr);
      localStorage.setItem('mk_deleted_doc_ids', JSON.stringify(nextArr));
    }

    try {
      setSyncStatus('syncing');
      const cleanData = sanitizeForFirestore(data);
      await setDoc(doc(db, colName, docId), cleanData, { merge: true });
      setSyncStatus('synced');
      setIsFirebaseConnected(true);
    } catch (err) {
      console.warn(`Firestore write error [${colName}/${docId}]:`, err);
      setSyncStatus('offline');
    }
  };

  const deleteFromFirestore = async (colName: string, id: string) => {
    const docId = String(id || '').trim();
    if (!docId) return;

    // 1. Immediately register in tombstone ref & state so all onSnapshot callbacks discard it instantly
    deletedDocIdsRef.current.add(docId);
    const nextArr = Array.from(deletedDocIdsRef.current);
    setDeletedDocIds(nextArr);
    localStorage.setItem('mk_deleted_doc_ids', JSON.stringify(nextArr));

    // Also persist tombstone list to Firestore config in the background
    try {
      setDoc(doc(db, 'app_config', 'deleted_doc_ids'), { ids: nextArr }, { merge: true }).catch(() => {});
    } catch {
      // ignore
    }

    // 2. Perform actual delete in Firestore
    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, colName, docId));
      setSyncStatus('synced');
      setIsFirebaseConnected(true);
    } catch (err) {
      console.warn(`Firestore delete error [${colName}/${docId}]:`, err);
      setSyncStatus('offline');
    }
  };

  // Load from LocalStorage and setup Firestore real-time subscriptions
  useEffect(() => {
    // 0. Test Firestore Server Connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'app_config', 'passwords'));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Firestore client is offline, using offline cache.");
          setIsFirebaseConnected(false);
          setSyncStatus('offline');
        } else {
          setIsFirebaseConnected(true);
        }
      }
    };
    testConnection();

    // 1. Load cached UI states
    const cachedDarkMode = localStorage.getItem('mk_dark_mode') === 'true';
    setDarkMode(cachedDarkMode);
    if (cachedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const cachedUser = localStorage.getItem('mk_current_user');
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch (e) {
        setCurrentUser(null);
      }
    }

    // 2. Setup Real-time Firestore Subscriptions for all collections
    try {
      const unsubMaterials = onSnapshot(collection(db, 'materials'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as Material));
        setMaterials(list);
        localStorage.setItem('mk_materials', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore materials sync fallback:', err);
      });

      const unsubFinishGoods = onSnapshot(collection(db, 'finish_goods'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as FinishGood));
        setFinishGoods(list);
        localStorage.setItem('mk_finish_goods', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore finish_goods sync fallback:', err);
      });

      const unsubPOs = onSnapshot(collection(db, 'purchase_orders'), (snap) => {
        const rawList = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as PurchaseOrder));
        const list = rawList.map(po => {
          const terms = po.syaratPembayaran || 'Tempo 30 Hari';
          const invDate = po.tanggalInvoice || po.tanggal || new Date().toISOString().split('T')[0];
          const dueDate = po.tanggalJatuhTempo && po.tanggalJatuhTempo.trim() !== ''
            ? po.tanggalJatuhTempo
            : calculateDueDateFromInvoice(invDate, terms);
          return {
            ...po,
            nomorInvoice: po.nomorInvoice && po.nomorInvoice.trim() !== ''
              ? po.nomorInvoice
              : `INV/MKN/2026/08/${po.id.replace(/[^0-9]/g, '').slice(-3) || Math.floor(100 + Math.random() * 900)}`,
            syaratPembayaran: terms,
            tanggalInvoice: invDate,
            tanggalJatuhTempo: dueDate,
            statusInvoice: (po.statusInvoice as string) === 'Belum Terbit' || !po.statusInvoice
              ? 'Belum Bayar'
              : po.statusInvoice
          };
        });
        setPurchaseOrders(list);
        localStorage.setItem('mk_purchase_orders', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore purchase_orders sync fallback:', err);
      });

      const unsubPOSuppliers = onSnapshot(collection(db, 'po_suppliers'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as PurchaseOrderSupplier));
        setPOSuppliers(list);
        localStorage.setItem('mk_po_suppliers', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore po_suppliers sync fallback:', err);
      });

      const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as Supplier));
        setSuppliers(list);
        localStorage.setItem('mk_suppliers', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore suppliers sync fallback:', err);
      });

      const unsubSJ = onSnapshot(collection(db, 'surat_jalan'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as SuratJalan));
        setSuratJalanList(list);
        localStorage.setItem('mk_surat_jalan', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore surat_jalan sync fallback:', err);
      });

      const unsubKeuangan = onSnapshot(collection(db, 'keuangan'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as Keuangan));
        setKeuanganList(list);
        localStorage.setItem('mk_keuangan', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore keuangan sync fallback:', err);
      });

      const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as Customer));
        setCustomers(list);
        localStorage.setItem('mk_customers', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore customers sync fallback:', err);
      });

      const unsubMarketing = onSnapshot(collection(db, 'marketing'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as MarketingCommission));
        setMarketingList(list);
        localStorage.setItem('mk_marketing', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore marketing sync fallback:', err);
      });

      const unsubHutang = onSnapshot(collection(db, 'hutang_ap'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as HutangUsaha));
        setHutangList(list);
        localStorage.setItem('mk_hutang_ap', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore hutang_ap sync fallback:', err);
      });

      const unsubKasKecil = onSnapshot(collection(db, 'kas_kecil'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as KasKecilItem));
        setKasKecilList(list);
        localStorage.setItem('mk_kas_kecil', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore kas_kecil sync fallback:', err);
      });

      const unsubBukuBank = onSnapshot(collection(db, 'buku_bank'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as BukuBankItem));
        setBukuBankList(list);
        localStorage.setItem('mk_buku_bank', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore buku_bank sync fallback:', err);
      });

      const unsubAset = onSnapshot(collection(db, 'aset_tetap'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as AsetTetap));
        setAsetList(list);
        localStorage.setItem('mk_aset_tetap', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore aset_tetap sync fallback:', err);
      });

      const unsubPajak = onSnapshot(collection(db, 'pajak'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as PajakItem));
        setPajakList(list);
        localStorage.setItem('mk_laporan_pajak', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore pajak sync fallback:', err);
      });

      const unsubTTM = onSnapshot(collection(db, 'tanda_terima_material'), (snap) => {
        const list = snap.docs
          .filter(d => !deletedDocIdsRef.current.has(d.id))
          .map(d => ({ ...d.data(), id: d.id } as TandaTerimaPengambilanMaterial));
        setTandaTerimaMaterialList(list);
        localStorage.setItem('mk_tanda_terima_material', JSON.stringify(list));
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore tanda_terima_material sync fallback:', err);
      });

      const unsubDeletedDocIds = onSnapshot(doc(db, 'app_config', 'deleted_doc_ids'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.ids)) {
            data.ids.forEach(id => deletedDocIdsRef.current.add(id));
            const nextArr = Array.from(deletedDocIdsRef.current);
            setDeletedDocIds(nextArr);
            localStorage.setItem('mk_deleted_doc_ids', JSON.stringify(nextArr));

            // Instantly cleanse all in-memory lists
            setMaterials(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setFinishGoods(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setPurchaseOrders(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setPOSuppliers(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setSuppliers(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setSuratJalanList(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setKeuanganList(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setCustomers(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setMarketingList(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setHutangList(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setKasKecilList(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setBukuBankList(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setAsetList(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setPajakList(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
            setTandaTerimaMaterialList(prev => prev.filter(item => !deletedDocIdsRef.current.has(item.id)));
          }
        }
      }, (err) => {
        console.warn('Firestore deleted_doc_ids sync fallback:', err);
      });

      const unsubDeletedTaxIds = onSnapshot(doc(db, 'app_config', 'deleted_tax_ids'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.ids)) {
            setDeletedTaxIds(data.ids);
            localStorage.setItem('mk_deleted_tax_ids', JSON.stringify(data.ids));
          }
        }
      }, (err) => {
        console.warn('Firestore deleted_tax_ids sync fallback:', err);
      });

      const unsubPasswords = onSnapshot(doc(db, 'app_config', 'passwords'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Record<UserRole, string>;
          if (data) {
            setPasswords(prev => {
              const merged = { ...prev, ...data };
              localStorage.setItem('mk_passwords', JSON.stringify(merged));
              return merged;
            });
          }
        }
      }, (err) => {
        console.warn('Firestore passwords sync fallback:', err);
      });

      const unsubFinanceSettings = onSnapshot(doc(db, 'app_config', 'finance_settings'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            if (typeof data.saldoAwalKasKecil === 'number') {
              setSaldoAwalKasKecil(data.saldoAwalKasKecil);
              localStorage.setItem('mk_saldo_awal_kas_kecil', String(data.saldoAwalKasKecil));
            }
            if (typeof data.saldoAwalKasBesar === 'number') {
              setSaldoAwalKasBesar(data.saldoAwalKasBesar);
              localStorage.setItem('mk_saldo_awal_kas_besar', String(data.saldoAwalKasBesar));
            }
            if (typeof data.saldoAwalBukuBank === 'number') {
              setSaldoAwalBukuBank(data.saldoAwalBukuBank);
              localStorage.setItem('mk_saldo_awal_buku_bank', String(data.saldoAwalBukuBank));
            }
            if (typeof data.useOverrideHPP === 'boolean') {
              setUseOverrideHPP(data.useOverrideHPP);
              localStorage.setItem('mk_use_override_hpp', String(data.useOverrideHPP));
            }
            if (typeof data.overrideHPPValue === 'number') {
              setOverrideHPPValue(data.overrideHPPValue);
              localStorage.setItem('mk_override_hpp_value', String(data.overrideHPPValue));
            }
            if (typeof data.useOverrideBeban === 'boolean') {
              setUseOverrideBeban(data.useOverrideBeban);
              localStorage.setItem('mk_use_override_beban', String(data.useOverrideBeban));
            }
            if (typeof data.overrideBebanValue === 'number') {
              setOverrideBebanValue(data.overrideBebanValue);
              localStorage.setItem('mk_override_beban_value', String(data.overrideBebanValue));
            }
            if (typeof data.modalDisetor === 'number') {
              setModalDisetor(data.modalDisetor);
              localStorage.setItem('mk_modal_disetor', String(data.modalDisetor));
            }
            if (typeof data.labaDitahan === 'number') {
              setLabaDitahan(data.labaDitahan);
              localStorage.setItem('mk_laba_ditahan', String(data.labaDitahan));
            }
            if (typeof data.useOverrideLabaBersih === 'boolean') {
              setUseOverrideLabaBersih(data.useOverrideLabaBersih);
              localStorage.setItem('mk_use_override_laba_bersih', String(data.useOverrideLabaBersih));
            }
            if (typeof data.overrideLabaBersihValue === 'number') {
              setOverrideLabaBersihValue(data.overrideLabaBersihValue);
              localStorage.setItem('mk_override_laba_bersih_value', String(data.overrideLabaBersihValue));
            }
            if (typeof data.useOverridePenyeimbang === 'boolean') {
              setUseOverridePenyeimbang(data.useOverridePenyeimbang);
              localStorage.setItem('mk_use_override_penyeimbang', String(data.useOverridePenyeimbang));
            }
            if (typeof data.overridePenyeimbangValue === 'number') {
              setOverridePenyeimbangValue(data.overridePenyeimbangValue);
              localStorage.setItem('mk_override_penyeimbang_value', String(data.overridePenyeimbangValue));
            }
          }
        }
      }, (err) => {
        console.warn('Firestore finance_settings sync fallback:', err);
      });

      isInitialSyncDone.current = true;

      return () => {
        unsubMaterials();
        unsubFinishGoods();
        unsubPOs();
        unsubPOSuppliers();
        unsubSuppliers();
        unsubSJ();
        unsubKeuangan();
        unsubCustomers();
        unsubMarketing();
        unsubHutang();
        unsubKasKecil();
        unsubBukuBank();
        unsubAset();
        unsubPajak();
        unsubTTM();
        unsubDeletedDocIds();
        unsubDeletedTaxIds();
        unsubPasswords();
        unsubFinanceSettings();
      };
    } catch (err) {
      console.warn('Firebase initialization error, using local persistence:', err);
      setIsFirebaseConnected(false);
    }
  }, []);

  // Sync state helpers
  const saveMaterials = (newMaterials: Material[]) => {
    setMaterials(newMaterials);
    localStorage.setItem('mk_materials', JSON.stringify(newMaterials));
  };

  const saveFinishGoods = (newGoods: FinishGood[]) => {
    setFinishGoods(newGoods);
    localStorage.setItem('mk_finish_goods', JSON.stringify(newGoods));
  };

  const saveTandaTerimaMaterial = (newList: TandaTerimaPengambilanMaterial[]) => {
    setTandaTerimaMaterialList(newList);
    localStorage.setItem('mk_tanda_terima_material', JSON.stringify(newList));
  };

  const savePurchaseOrders = (newPOs: PurchaseOrder[]) => {
    setPurchaseOrders(newPOs);
    localStorage.setItem('mk_purchase_orders', JSON.stringify(newPOs));
  };

  const savePOSuppliers = (newPOSup: PurchaseOrderSupplier[]) => {
    setPOSuppliers(newPOSup);
    localStorage.setItem('mk_po_suppliers', JSON.stringify(newPOSup));
  };

  const saveSuppliers = (newSupp: Supplier[]) => {
    setSuppliers(newSupp);
    localStorage.setItem('mk_suppliers', JSON.stringify(newSupp));
  };

  const saveSuratJalan = (newSJ: SuratJalan[]) => {
    setSuratJalanList(newSJ);
    localStorage.setItem('mk_surat_jalan', JSON.stringify(newSJ));
  };

  const saveKeuangan = (newKeuangan: Keuangan[]) => {
    setKeuanganList(newKeuangan);
    localStorage.setItem('mk_keuangan', JSON.stringify(newKeuangan));
  };

  const saveCustomers = (newCust: Customer[]) => {
    setCustomers(newCust);
    localStorage.setItem('mk_customers', JSON.stringify(newCust));
  };

  const saveMarketing = (newMkt: MarketingCommission[]) => {
    setMarketingList(newMkt);
    localStorage.setItem('mk_marketing', JSON.stringify(newMkt));
  };

  const saveHutang = (newHutang: HutangUsaha[]) => {
    setHutangList(newHutang);
    localStorage.setItem('mk_hutang_ap', JSON.stringify(newHutang));
  };

  const saveKasKecil = (newKK: KasKecilItem[]) => {
    setKasKecilList(newKK);
    localStorage.setItem('mk_kas_kecil', JSON.stringify(newKK));
  };

  const saveBukuBank = (newBank: BukuBankItem[]) => {
    setBukuBankList(newBank);
    localStorage.setItem('mk_buku_bank', JSON.stringify(newBank));
  };

  const saveAset = (newAset: AsetTetap[]) => {
    setAsetList(newAset);
    localStorage.setItem('mk_aset_tetap', JSON.stringify(newAset));
  };

  const savePajak = (newPajak: PajakItem[]) => {
    setPajakList(newPajak);
    localStorage.setItem('mk_laporan_pajak', JSON.stringify(newPajak));
  };

  // Auth & Password Operations
  const updatePassword = (role: UserRole, newPassword: string): { success: boolean; message: string } => {
    const trimmed = newPassword.trim();
    if (!trimmed || trimmed.length < 4) {
      return { success: false, message: 'Password baru minimal harus 4 karakter!' };
    }
    const updated = {
      ...passwords,
      [role]: trimmed
    };
    setPasswords(updated);
    localStorage.setItem('mk_passwords', JSON.stringify(updated));
    syncToFirestore('app_config', 'passwords', updated);
    return { success: true, message: `Password untuk role ${role.replace('_', ' ')} berhasil diperbarui!` };
  };

  const login = (role: UserRole, password: string): boolean => {
    const validPassword = passwords[role] || DEFAULT_PASSWORDS[role];
    if (validPassword === password) {
      const user = MOCK_USERS[role];
      setCurrentUser(user);
      localStorage.setItem('mk_current_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mk_current_user');
  };

  const switchUser = (role: UserRole) => {
    const user = MOCK_USERS[role];
    setCurrentUser(user);
    localStorage.setItem('mk_current_user', JSON.stringify(user));
  };

  // Dark Mode
  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem('mk_dark_mode', String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // --- CRUD Material ---
  const addMaterial = (material: Omit<Material, 'id' | 'terakhirDiperbarui'>) => {
    const id = `mat-${Date.now()}`;
    const today = material.tanggalMasukWarehouse || new Date().toISOString().split('T')[0];
    const initialQty = Number(material.stok || 0);
    const stokAwal = material.stokAwal !== undefined ? Number(material.stokAwal) : initialQty;
    const stokMasuk = material.stokMasuk !== undefined ? Number(material.stokMasuk) : initialQty;
    const stokKeluar = material.stokKeluar !== undefined ? Number(material.stokKeluar) : 0;
    const stok = initialQty;

    const initialMutasi: MaterialMutasiItem[] = material.riwayatMutasi && material.riwayatMutasi.length > 0
      ? material.riwayatMutasi
      : stok > 0 ? [{
          id: `mut-${Date.now()}`,
          tanggal: today,
          tipe: 'MASUK_WAREHOUSE',
          jumlah: stok,
          sisaStokSetelahnya: stok,
          keterangan: 'Penerimaan Awal / Saldo Awal Gudang',
          dicatatOleh: currentUser?.name || 'Warehouse Admin'
        }] : [];

    const newMat: Material = {
      ...material,
      id,
      ukuran: material.ukuran || '',
      dimensi: material.dimensi || '',
      tanggalMasukWarehouse: today,
      stokAwal,
      stokMasuk,
      stokKeluar,
      stok,
      riwayatMutasi: initialMutasi,
      terakhirDiperbarui: new Date().toISOString()
    };
    const updated = [newMat, ...materials];
    saveMaterials(updated);
    syncToFirestore('materials', id, newMat);
  };

  const updateMaterial = (id: string, material: Partial<Material>) => {
    let updatedItem: Material | null = null;
    const updated = materials.map(item => {
      if (item.id === id) {
        updatedItem = {
          ...item,
          ...material,
          terakhirDiperbarui: new Date().toISOString()
        };
        return updatedItem;
      }
      return item;
    });
    saveMaterials(updated);
    if (updatedItem) syncToFirestore('materials', id, updatedItem);
  };

  const deleteMaterial = (id: string) => {
    const updated = materials.filter(item => item.id !== id);
    saveMaterials(updated);
    deleteFromFirestore('materials', id);
  };

  const adjustMaterialStock = (id: string, amount: number) => {
    let updatedItem: Material | null = null;
    const today = new Date().toISOString().split('T')[0];
    const updated = materials.map(item => {
      if (item.id === id) {
        const newStok = Math.max(0, item.stok + amount);
        const stokMasuk = amount > 0 ? (item.stokMasuk || 0) + amount : (item.stokMasuk || 0);
        const stokKeluar = amount < 0 ? (item.stokKeluar || 0) + Math.abs(amount) : (item.stokKeluar || 0);
        
        const mutasiEntry: MaterialMutasiItem = {
          id: `mut-${Date.now()}`,
          tanggal: today,
          tipe: amount >= 0 ? 'MASUK_WAREHOUSE' : 'KELUAR_PRODUKSI',
          jumlah: Math.abs(amount),
          sisaStokSetelahnya: newStok,
          keterangan: amount >= 0 ? 'Penyesuaian Masuk Manual' : 'Penyesuaian Keluar Pemakaian Manual',
          dicatatOleh: currentUser?.name || 'Warehouse Admin'
        };

        updatedItem = {
          ...item,
          stok: newStok,
          stokMasuk,
          stokKeluar,
          riwayatMutasi: [mutasiEntry, ...(item.riwayatMutasi || [])],
          terakhirDiperbarui: new Date().toISOString()
        };
        return updatedItem;
      }
      return item;
    });
    saveMaterials(updated);
    if (updatedItem) syncToFirestore('materials', id, updatedItem);
  };

  const recordMaterialMutation = (materialId: string, mutasi: Omit<MaterialMutasiItem, 'id'>) => {
    let updatedItem: Material | null = null;
    const updated = materials.map(item => {
      if (item.id === materialId) {
        const mutasiId = `mut-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const qty = Number(mutasi.jumlah);
        let newStok = item.stok;
        let stokMasuk = item.stokMasuk || 0;
        let stokKeluar = item.stokKeluar || 0;

        if (mutasi.tipe === 'MASUK_WAREHOUSE') {
          newStok = item.stok + qty;
          stokMasuk += qty;
        } else if (mutasi.tipe === 'KELUAR_PRODUKSI') {
          newStok = Math.max(0, item.stok - qty);
          stokKeluar += qty;
        } else if (mutasi.tipe === 'PENYESUAIAN_OPNAME') {
          newStok = qty;
        }

        const newMutasiEntry: MaterialMutasiItem = {
          ...mutasi,
          id: mutasiId,
          jumlah: qty,
          sisaStokSetelahnya: newStok,
          dicatatOleh: mutasi.dicatatOleh || currentUser?.name || 'Warehouse Admin'
        };

        updatedItem = {
          ...item,
          stok: newStok,
          stokMasuk,
          stokKeluar,
          riwayatMutasi: [newMutasiEntry, ...(item.riwayatMutasi || [])],
          terakhirDiperbarui: new Date().toISOString()
        };
        return updatedItem;
      }
      return item;
    });
    saveMaterials(updated);
    if (updatedItem) syncToFirestore('materials', materialId, updatedItem);
  };

  // --- CRUD Tanda Terima Pengambilan Material ---
  const addTandaTerimaMaterial = (bon: Omit<TandaTerimaPengambilanMaterial, 'id' | 'createdAt'>): string => {
    const id = `ttm-${Date.now()}`;
    const generatedBon = bon.nomorBon && bon.nomorBon.trim() !== ''
      ? bon.nomorBon
      : `BON-MAT/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;

    const newBon: TandaTerimaPengambilanMaterial = {
      ...bon,
      id,
      nomorBon: generatedBon,
      createdAt: new Date().toISOString()
    };

    // Deduct materials from stock and record mutations
    const updatedMaterials = materials.map(mat => {
      const itemBon = bon.items.find(i => i.materialId === mat.id);
      if (itemBon && itemBon.jumlah > 0) {
        const qty = Number(itemBon.jumlah);
        const nextStok = Math.max(0, mat.stok - qty);
        const nextKeluar = (mat.stokKeluar || 0) + qty;
        const newMutasiEntry: MaterialMutasiItem = {
          id: `mut-${Date.now()}-${mat.id}`,
          tanggal: bon.tanggal,
          nomorBukti: generatedBon,
          tipe: 'KELUAR_PRODUKSI',
          jumlah: qty,
          sisaStokSetelahnya: nextStok,
          pengambil: bon.namaPengambil,
          penyerah: bon.namaPenyerah,
          keperluan: bon.targetProduk || `Divisi ${bon.divisiPemohon}`,
          nomorSPK: bon.nomorSPK,
          keterangan: itemBon.keterangan || `Pengambilan Material Produksi (${bon.divisiPemohon})`,
          dicatatOleh: currentUser?.name || 'Warehouse Admin'
        };

        const updatedMat: Material = {
          ...mat,
          stok: nextStok,
          stokKeluar: nextKeluar,
          riwayatMutasi: [newMutasiEntry, ...(mat.riwayatMutasi || [])],
          terakhirDiperbarui: new Date().toISOString()
        };
        syncToFirestore('materials', mat.id, updatedMat);
        return updatedMat;
      }
      return mat;
    });

    saveMaterials(updatedMaterials);
    const updatedBonList = [newBon, ...tandaTerimaMaterialList];
    saveTandaTerimaMaterial(updatedBonList);
    syncToFirestore('tanda_terima_material', id, newBon);

    return id;
  };

  const updateTandaTerimaMaterial = (id: string, bon: Partial<TandaTerimaPengambilanMaterial>) => {
    let updatedItem: TandaTerimaPengambilanMaterial | null = null;
    const updated = tandaTerimaMaterialList.map(item => {
      if (item.id === id) {
        updatedItem = { ...item, ...bon };
        return updatedItem;
      }
      return item;
    });
    saveTandaTerimaMaterial(updated);
    if (updatedItem) syncToFirestore('tanda_terima_material', id, updatedItem);
  };

  const deleteTandaTerimaMaterial = (id: string) => {
    const updated = tandaTerimaMaterialList.filter(item => item.id !== id);
    saveTandaTerimaMaterial(updated);
    deleteFromFirestore('tanda_terima_material', id);
  };

  // --- CRUD FinishGood (Pallet) ---
  const addFinishGood = (good: Omit<FinishGood, 'id' | 'terakhirDiperbarui'>) => {
    const id = `plt-${Date.now()}`;
    const today = good.tanggalMasukProduksi || new Date().toISOString().split('T')[0];
    const initialQty = Number(good.stok || 0);
    const stokAwal = good.stokAwal !== undefined ? Number(good.stokAwal) : initialQty;
    const stokMasuk = good.stokMasukProduksi !== undefined ? Number(good.stokMasukProduksi) : 0;
    const stokKeluar = good.stokKeluarPengiriman !== undefined ? Number(good.stokKeluarPengiriman) : 0;
    const stok = initialQty;

    const initialMutasiFG: FinishGoodMutasiItem[] = good.riwayatMutasiFG && good.riwayatMutasiFG.length > 0
      ? good.riwayatMutasiFG
      : stok > 0 ? [{
          id: `mutfg-${Date.now()}`,
          tanggal: today,
          tipe: 'MASUK_PRODUKSI',
          jumlah: stok,
          sisaStokSetelahnya: stok,
          keterangan: 'Stok Awal / Saldo Awal Pallet Jadi',
          dicatatOleh: currentUser?.name || 'Warehouse Admin'
        }] : [];

    const newGood: FinishGood = {
      ...good,
      id,
      stokAwal,
      stokMasukProduksi: stokMasuk,
      stokKeluarPengiriman: stokKeluar,
      stok,
      tanggalMasukProduksi: today,
      tanggalKeluarTerakhir: good.tanggalKeluarTerakhir || '',
      stokFisikOpname: good.stokFisikOpname !== undefined ? good.stokFisikOpname : stok,
      selisihOpname: good.selisihOpname !== undefined ? good.selisihOpname : 0,
      riwayatMutasiFG: initialMutasiFG,
      terakhirDiperbarui: new Date().toISOString()
    };
    const updated = [newGood, ...finishGoods];
    saveFinishGoods(updated);
    syncToFirestore('finish_goods', id, newGood);
  };

  const updateFinishGood = (id: string, good: Partial<FinishGood>) => {
    let updatedItem: FinishGood | null = null;
    const updated = finishGoods.map(item => {
      if (item.id === id) {
        updatedItem = {
          ...item,
          ...good,
          terakhirDiperbarui: new Date().toISOString()
        };
        return updatedItem;
      }
      return item;
    });
    saveFinishGoods(updated);
    if (updatedItem) syncToFirestore('finish_goods', id, updatedItem);
  };

  const deleteFinishGood = (id: string) => {
    const updated = finishGoods.filter(item => item.id !== id);
    saveFinishGoods(updated);
    deleteFromFirestore('finish_goods', id);
  };

  const adjustFinishGoodStock = (id: string, amount: number) => {
    let updatedItem: FinishGood | null = null;
    const today = new Date().toISOString().split('T')[0];
    const updated = finishGoods.map(item => {
      if (item.id === id) {
        const nextStok = Math.max(0, item.stok + amount);
        const stokMasuk = amount > 0 ? (item.stokMasukProduksi || 0) + amount : (item.stokMasukProduksi || 0);
        const stokKeluar = amount < 0 ? (item.stokKeluarPengiriman || 0) + Math.abs(amount) : (item.stokKeluarPengiriman || 0);
        
        const mutasiEntry: FinishGoodMutasiItem = {
          id: `mutfg-${Date.now()}`,
          tanggal: today,
          tipe: amount >= 0 ? 'MASUK_PRODUKSI' : 'KELUAR_PENGIRIMAN',
          jumlah: Math.abs(amount),
          sisaStokSetelahnya: nextStok,
          keterangan: amount >= 0 ? 'Penyesuaian Masuk Manual' : 'Penyesuaian Keluar Pengiriman Manual',
          dicatatOleh: currentUser?.name || 'Warehouse Admin'
        };

        updatedItem = {
          ...item,
          stok: nextStok,
          stokMasukProduksi: stokMasuk,
          stokKeluarPengiriman: stokKeluar,
          tanggalMasukProduksi: amount > 0 ? today : item.tanggalMasukProduksi,
          tanggalKeluarTerakhir: amount < 0 ? today : item.tanggalKeluarTerakhir,
          riwayatMutasiFG: [mutasiEntry, ...(item.riwayatMutasiFG || [])],
          terakhirDiperbarui: new Date().toISOString()
        };
        return updatedItem;
      }
      return item;
    });
    saveFinishGoods(updated);
    if (updatedItem) syncToFirestore('finish_goods', id, updatedItem);
  };

  const recordFinishGoodMutation = (finishGoodId: string, mutasi: Omit<FinishGoodMutasiItem, 'id'>) => {
    let updatedItem: FinishGood | null = null;
    const updated = finishGoods.map(item => {
      if (item.id === finishGoodId) {
        const mutasiId = `mutfg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const qty = Number(mutasi.jumlah);
        let newStok = item.stok;
        let stokMasuk = item.stokMasukProduksi || 0;
        let stokKeluar = item.stokKeluarPengiriman || 0;
        let tglMasuk = item.tanggalMasukProduksi || '';
        let tglKeluar = item.tanggalKeluarTerakhir || '';

        if (mutasi.tipe === 'MASUK_PRODUKSI') {
          newStok = item.stok + qty;
          stokMasuk += qty;
          tglMasuk = mutasi.tanggal || new Date().toISOString().split('T')[0];
        } else if (mutasi.tipe === 'KELUAR_PENGIRIMAN') {
          newStok = Math.max(0, item.stok - qty);
          stokKeluar += qty;
          tglKeluar = mutasi.tanggal || new Date().toISOString().split('T')[0];
        } else if (mutasi.tipe === 'PENYESUAIAN_OPNAME') {
          newStok = qty;
        }

        const newMutasiEntry: FinishGoodMutasiItem = {
          ...mutasi,
          id: mutasiId,
          jumlah: qty,
          sisaStokSetelahnya: newStok,
          dicatatOleh: mutasi.dicatatOleh || currentUser?.name || 'Warehouse Admin'
        };

        updatedItem = {
          ...item,
          stok: newStok,
          stokMasukProduksi: stokMasuk,
          stokKeluarPengiriman: stokKeluar,
          tanggalMasukProduksi: tglMasuk,
          tanggalKeluarTerakhir: tglKeluar,
          riwayatMutasiFG: [newMutasiEntry, ...(item.riwayatMutasiFG || [])],
          terakhirDiperbarui: new Date().toISOString()
        };
        return updatedItem;
      }
      return item;
    });
    saveFinishGoods(updated);
    if (updatedItem) syncToFirestore('finish_goods', finishGoodId, updatedItem);
  };

  const updateFinishGoodOpname = (finishGoodId: string, stokFisik: number, keterangan?: string) => {
    let updatedItem: FinishGood | null = null;
    const today = new Date().toISOString().split('T')[0];
    const updated = finishGoods.map(item => {
      if (item.id === finishGoodId) {
        const qtyFisik = Number(stokFisik);
        const selisih = qtyFisik - item.stok;
        const mutasiEntry: FinishGoodMutasiItem = {
          id: `mutfg-${Date.now()}`,
          tanggal: today,
          nomorBukti: `OPNAME-${today}`,
          tipe: 'PENYESUAIAN_OPNAME',
          jumlah: qtyFisik,
          sisaStokSetelahnya: qtyFisik,
          keterangan: keterangan || `Stock Opname: Fisik ${qtyFisik} pcs, Sistem ${item.stok} pcs (Selisih ${selisih >= 0 ? '+' : ''}${selisih})`,
          dicatatOleh: currentUser?.name || 'Warehouse Admin'
        };

        updatedItem = {
          ...item,
          stok: qtyFisik,
          stokFisikOpname: qtyFisik,
          selisihOpname: selisih,
          tanggalOpnameTerakhir: today,
          keteranganOpname: keterangan || `Opname ${today}`,
          riwayatMutasiFG: [mutasiEntry, ...(item.riwayatMutasiFG || [])],
          terakhirDiperbarui: new Date().toISOString()
        };
        return updatedItem;
      }
      return item;
    });
    saveFinishGoods(updated);
    if (updatedItem) syncToFirestore('finish_goods', finishGoodId, updatedItem);
  };

  // Manufacturing / Production Simulator
  const producePallets = (
    finishGoodId: string, 
    quantity: number, 
    consumedMaterials: { materialId: string; amount: number }[]
  ): { success: boolean; error?: string } => {
    for (const cm of consumedMaterials) {
      const mat = materials.find(m => m.id === cm.materialId);
      if (!mat) {
        return { success: false, error: `Material dengan ID ${cm.materialId} tidak ditemukan.` };
      }
      if (mat.stok < cm.amount * quantity) {
        return { 
          success: false, 
          error: `Stok material "${mat.nama}" tidak mencukupi. Butuh ${cm.amount * quantity} ${mat.satuan}, sisa stok hanya ${mat.stok} ${mat.satuan}.` 
        };
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const targetFG = finishGoods.find(f => f.id === finishGoodId);
    const fgName = targetFG ? targetFG.nama : 'Pallet Kayu';

    const updatedMaterials = materials.map(mat => {
      const cm = consumedMaterials.find(c => c.materialId === mat.id);
      if (cm) {
        const usedAmount = cm.amount * quantity;
        const nextStok = mat.stok - usedAmount;
        const nextKeluar = (mat.stokKeluar || 0) + usedAmount;

        const mutasiEntry: MaterialMutasiItem = {
          id: `mut-${Date.now()}-${mat.id}`,
          tanggal: today,
          tipe: 'KELUAR_PRODUKSI',
          jumlah: usedAmount,
          sisaStokSetelahnya: nextStok,
          keperluan: `Produksi ${quantity} pcs ${fgName}`,
          keterangan: `Pemakaian bahan baku untuk proses assembling/manufaktur ${fgName}`,
          dicatatOleh: currentUser?.name || 'Warehouse Admin'
        };

        const item: Material = {
          ...mat,
          stok: nextStok,
          stokKeluar: nextKeluar,
          riwayatMutasi: [mutasiEntry, ...(mat.riwayatMutasi || [])],
          terakhirDiperbarui: new Date().toISOString()
        };
        syncToFirestore('materials', item.id, item);
        return item;
      }
      return mat;
    });

    const updatedFinishGoods = finishGoods.map(fg => {
      if (fg.id === finishGoodId) {
        const nextStok = fg.stok + quantity;
        const nextMasuk = (fg.stokMasukProduksi || 0) + quantity;

        const mutasiEntry: FinishGoodMutasiItem = {
          id: `mutfg-${Date.now()}`,
          tanggal: today,
          tipe: 'MASUK_PRODUKSI',
          jumlah: quantity,
          sisaStokSetelahnya: nextStok,
          keterangan: `Hasil Produksi Pabrik masuk ke Gudang (${quantity} pcs)`,
          dicatatOleh: currentUser?.name || 'Warehouse Admin'
        };

        const item: FinishGood = {
          ...fg,
          stok: nextStok,
          stokMasukProduksi: nextMasuk,
          tanggalMasukProduksi: today,
          riwayatMutasiFG: [mutasiEntry, ...(fg.riwayatMutasiFG || [])],
          terakhirDiperbarui: new Date().toISOString()
        };
        syncToFirestore('finish_goods', item.id, item);
        return item;
      }
      return fg;
    });

    saveMaterials(updatedMaterials);
    saveFinishGoods(updatedFinishGoods);

    return { success: true };
  };

  // --- CRUD Purchase Orders ---
  const addPurchaseOrder = (po: Omit<PurchaseOrder, 'id'>) => {
    const id = `po-${Date.now()}`;
    const generatedInv = po.nomorInvoice && po.nomorInvoice.trim() !== ''
      ? po.nomorInvoice
      : `INV/MKN/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;
    const effectiveStatus = (po.statusInvoice as string) === 'Belum Terbit' || !po.statusInvoice
      ? 'Belum Bayar'
      : po.statusInvoice;
    const effectiveTerms = po.syaratPembayaran || 'Tempo 30 Hari';
    const effectiveInvDate = po.tanggalInvoice || po.tanggal || new Date().toISOString().split('T')[0];
    const effectiveDueDate = po.tanggalJatuhTempo && po.tanggalJatuhTempo.trim() !== ''
      ? po.tanggalJatuhTempo
      : calculateDueDateFromInvoice(effectiveInvDate, effectiveTerms);

    const newPO: PurchaseOrder = {
      ...po,
      nomorInvoice: generatedInv,
      statusInvoice: effectiveStatus,
      syaratPembayaran: effectiveTerms,
      tanggalInvoice: effectiveInvDate,
      tanggalJatuhTempo: effectiveDueDate,
      id
    };
    const updated = [newPO, ...purchaseOrders];
    savePurchaseOrders(updated);
    syncToFirestore('purchase_orders', id, newPO);
  };

  const updatePurchaseOrder = (id: string, po: Partial<PurchaseOrder>) => {
    let updatedItem: PurchaseOrder | null = null;
    let becameLunas = false;
    let oldPo: PurchaseOrder | null = null;

    const updated = purchaseOrders.map(item => {
      if (item.id === id) {
        oldPo = item;
        const effectiveTerms = po.syaratPembayaran || item.syaratPembayaran || 'Tempo 30 Hari';
        const effectiveInvDate = po.tanggalInvoice || item.tanggalInvoice || po.tanggal || item.tanggal;
        let effectiveDueDate = po.tanggalJatuhTempo || item.tanggalJatuhTempo;
        // If terms or invoice date was changed without explicit new due date, re-calculate
        if ((po.syaratPembayaran || po.tanggalInvoice) && !po.tanggalJatuhTempo) {
          effectiveDueDate = calculateDueDateFromInvoice(effectiveInvDate, effectiveTerms);
        }
        
        if (po.statusInvoice === 'Lunas' && item.statusInvoice !== 'Lunas') {
          becameLunas = true;
        }

        updatedItem = {
          ...item,
          ...po,
          syaratPembayaran: effectiveTerms,
          tanggalInvoice: effectiveInvDate,
          tanggalJatuhTempo: effectiveDueDate
        };
        return updatedItem;
      }
      return item;
    });
    savePurchaseOrders(updated);
    if (updatedItem) syncToFirestore('purchase_orders', id, updatedItem);

    if (becameLunas && oldPo) {
      const actualPo = oldPo as PurchaseOrder;
      const idKeuangan = `trx-${Date.now()}`;
      const kodeTransaksi = `INC-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
      const newKeuangan: Keuangan = {
        id: idKeuangan,
        kodeTransaksi,
        tanggal: new Date().toISOString().split('T')[0],
        tipe: 'Pemasukan',
        kategori: 'Penjualan Pallet',
        nominal: actualPo.totalHarga,
        keterangan: `Pembayaran Pelunasan PO ${actualPo.nomorPO} - ${actualPo.pelanggan}`,
        metodePembayaran: 'Transfer Bank Mandiri',
        referensiId: actualPo.nomorPO,
        pencatat: currentUser?.name || 'Sistem'
      };
      const updatedKeuangan = [newKeuangan, ...keuanganList];
      saveKeuangan(updatedKeuangan);
      syncToFirestore('keuangan', idKeuangan, newKeuangan);

      // Automatically record in Buku Bank (Bank Mandiri)
      const idBukuBank = `bb-${Date.now() + 1}`;
      const kodeMutasi = `MB-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
      const newBukuBank: BukuBankItem = {
        id: idBukuBank,
        kodeMutasi,
        tanggal: new Date().toISOString().split('T')[0],
        bank: 'Bank Mandiri',
        nomorRekening: '156-00-1909954-0',
        jenis: 'MASUK',
        tipe: 'Masuk',
        kategori: 'Penerimaan Piutang Buyer',
        keterangan: `Penerimaan Pelunasan PO ${actualPo.nomorPO} - ${actualPo.pelanggan}`,
        nominal: actualPo.totalHarga,
        referensi: actualPo.nomorPO,
        nomorReferensi: actualPo.nomorPO
      };
      const updatedBukuBank = [newBukuBank, ...bukuBankList];
      saveBukuBank(updatedBukuBank);
      syncToFirestore('buku_bank', idBukuBank, newBukuBank);
    }
  };

  const deletePurchaseOrder = (id: string) => {
    const target = purchaseOrders.find(item => item.id === id);
    const updated = purchaseOrders.filter(item => item.id !== id);
    savePurchaseOrders(updated);
    deleteFromFirestore('purchase_orders', id);

    if (target) {
      // 1. Remove related Keuangan records (Income / Invoice payments)
      const updatedKeuangan = keuanganList.filter(
        k => k.referensiId !== target.nomorPO && !k.keterangan?.includes(target.nomorPO)
      );
      if (updatedKeuangan.length !== keuanganList.length) {
        saveKeuangan(updatedKeuangan);
        keuanganList
          .filter(k => k.referensiId === target.nomorPO || k.keterangan?.includes(target.nomorPO))
          .forEach(k => deleteFromFirestore('keuangan', k.id));
      }

      // 2. Remove related Buku Bank records
      const updatedBukuBank = bukuBankList.filter(
        b => b.referensi !== target.nomorPO && b.nomorReferensi !== target.nomorPO && !b.keterangan?.includes(target.nomorPO)
      );
      if (updatedBukuBank.length !== bukuBankList.length) {
        saveBukuBank(updatedBukuBank);
        bukuBankList
          .filter(b => b.referensi === target.nomorPO || b.nomorReferensi === target.nomorPO || b.keterangan?.includes(target.nomorPO))
          .forEach(b => deleteFromFirestore('buku_bank', b.id));
      }

      // 3. Remove related Surat Jalan records
      const updatedSJ = suratJalanList.filter(
        sj => sj.purchaseOrderId !== target.id && sj.nomorPO !== target.nomorPO && (sj as any).poNomor !== target.nomorPO
      );
      if (updatedSJ.length !== suratJalanList.length) {
        saveSuratJalan(updatedSJ);
        suratJalanList
          .filter(sj => sj.purchaseOrderId === target.id || sj.nomorPO === target.nomorPO || (sj as any).poNomor === target.nomorPO)
          .forEach(sj => deleteFromFirestore('surat_jalan', sj.id));
      }

      // 4. Mark virtual/auto tax ids as deleted
      const taxPpnId = `auto-ppn-${target.id}`;
      const taxPphId = `auto-pph-${target.id}`;
      const nextDeletedTax = Array.from(new Set([...deletedTaxIds, taxPpnId, taxPphId]));
      setDeletedTaxIds(nextDeletedTax);
      localStorage.setItem('mk_deleted_tax_ids', JSON.stringify(nextDeletedTax));
      syncToFirestore('app_config', 'deleted_tax_ids', { ids: nextDeletedTax });
    }
  };

  const updatePOStatus = (id: string, status: PurchaseOrder['statusPO']) => {
    let updatedItem: PurchaseOrder | null = null;
    const updated = purchaseOrders.map(po => {
      if (po.id === id) {
        updatedItem = { ...po, statusPO: status };
        return updatedItem;
      }
      return po;
    });
    savePurchaseOrders(updated);
    if (updatedItem) syncToFirestore('purchase_orders', id, updatedItem);
  };

  const updateInvoiceStatus = (id: string, status: PurchaseOrder['statusInvoice'], paymentMethod: Keuangan['metodePembayaran'] = 'Transfer Bank Mandiri') => {
    const po = purchaseOrders.find(p => p.id === id);
    if (!po) return;

    const updated = purchaseOrders.map(item => {
      if (item.id === id) {
        const up = { ...item, statusInvoice: status };
        syncToFirestore('purchase_orders', item.id, up);
        return up;
      }
      return item;
    });
    savePurchaseOrders(updated);

    // If marked as paid, automatically create income in Keuangan and Buku Bank
    if (status === 'Lunas' && po.statusInvoice !== 'Lunas') {
      const idKeuangan = `trx-${Date.now()}`;
      const kodeTransaksi = `INC-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
      const newKeuangan: Keuangan = {
        id: idKeuangan,
        kodeTransaksi,
        tanggal: new Date().toISOString().split('T')[0],
        tipe: 'Pemasukan',
        kategori: 'Penjualan Pallet',
        nominal: po.totalHarga,
        keterangan: `Pembayaran Pelunasan PO ${po.nomorPO} - ${po.pelanggan}`,
        metodePembayaran: paymentMethod,
        referensiId: po.nomorPO,
        pencatat: currentUser?.name || 'Sistem'
      };
      const updatedKeuangan = [newKeuangan, ...keuanganList];
      saveKeuangan(updatedKeuangan);
      syncToFirestore('keuangan', idKeuangan, newKeuangan);

      // Automatically record in Buku Bank (Bank Mandiri)
      const idBukuBank = `bb-${Date.now() + 1}`;
      const kodeMutasi = `MB-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
      const newBukuBank: BukuBankItem = {
        id: idBukuBank,
        kodeMutasi,
        tanggal: new Date().toISOString().split('T')[0],
        bank: 'Bank Mandiri',
        nomorRekening: '156-00-1909954-0',
        jenis: 'MASUK',
        tipe: 'Masuk',
        kategori: 'Penerimaan Piutang Buyer',
        keterangan: `Penerimaan Pelunasan PO ${po.nomorPO} - ${po.pelanggan}`,
        nominal: po.totalHarga,
        referensi: po.nomorPO,
        nomorReferensi: po.nomorPO
      };
      const updatedBukuBank = [newBukuBank, ...bukuBankList];
      saveBukuBank(updatedBukuBank);
      syncToFirestore('buku_bank', idBukuBank, newBukuBank);
    }
  };

  // --- CRUD Purchase Order Supplier (Pengadaan Bahan Baku ke Supplier) ---
  const addPOSupplier = (poData: Omit<PurchaseOrderSupplier, 'id' | 'createdAt' | 'statusAP' | 'apId' | 'nomorTagihanAP'>): string => {
    const id = `posup-${Date.now()}`;
    const apId = `ap-po-${id}`;
    const nomorTagihanAP = `AP-${poData.nomorPO}`;

    const newPO: PurchaseOrderSupplier = {
      ...poData,
      id,
      statusAP: 'Belum Lunas',
      apId,
      nomorTagihanAP,
      createdAt: new Date().toISOString()
    };

    const updatedPOs = [newPO, ...poSuppliers];
    savePOSuppliers(updatedPOs);
    syncToFirestore('po_suppliers', id, newPO);

    // Otomatis masukkan ke Laporan AP (Hutang Usaha)
    const newHutang: HutangUsaha = {
      id: apId,
      nomorTagihan: nomorTagihanAP,
      supplier: poData.supplier,
      tanggal: poData.tanggal,
      tanggalJatuhTempo: poData.tanggalJatuhTempo,
      kategori: poData.kategori,
      keterangan: `PO Supplier ${poData.nomorPO}: ${poData.items.map(i => `${i.namaMaterial} (${i.jumlah} ${i.satuan})`).join(', ')}`,
      totalTagihan: poData.totalHarga,
      sudahDibayar: 0,
      sisaHutang: poData.totalHarga,
      status: 'Belum Lunas',
      poSupplierId: id,
      nomorPO: poData.nomorPO
    };

    const updatedHutang = [newHutang, ...hutangList];
    saveHutang(updatedHutang);
    syncToFirestore('hutang_ap', apId, newHutang);

    return id;
  };

  const updatePOSupplier = (id: string, poUpdate: Partial<PurchaseOrderSupplier>) => {
    let updatedItem: PurchaseOrderSupplier | null = null;
    const updated = poSuppliers.map(item => {
      if (item.id === id) {
        updatedItem = { ...item, ...poUpdate };
        return updatedItem;
      }
      return item;
    });
    savePOSuppliers(updated);
    if (updatedItem) syncToFirestore('po_suppliers', id, updatedItem);

    // Sync to Hutang AP
    if (updatedItem) {
      const up = updatedItem as PurchaseOrderSupplier;
      const targetApId = up.apId || `ap-po-${id}`;
      const existingHutang = hutangList.find(h => h.id === targetApId || h.poSupplierId === id);
      if (existingHutang) {
        const nextTotal = up.totalHarga !== undefined ? up.totalHarga : existingHutang.totalTagihan;
        const nextSisa = Math.max(0, nextTotal - existingHutang.sudahDibayar);
        const nextStatus: HutangUsaha['status'] = nextSisa === 0 ? 'Lunas' : existingHutang.status;
        
        updateHutang(existingHutang.id, {
          supplier: up.supplier,
          tanggal: up.tanggal,
          tanggalJatuhTempo: up.tanggalJatuhTempo,
          kategori: up.kategori,
          keterangan: `PO Supplier ${up.nomorPO}: ${up.items.map(i => `${i.namaMaterial} (${i.jumlah} ${i.satuan})`).join(', ')}`,
          totalTagihan: nextTotal,
          sisaHutang: nextSisa,
          status: nextStatus
        });
      }
    }
  };

  const deletePOSupplier = (id: string) => {
    const target = poSuppliers.find(p => p.id === id);
    const updated = poSuppliers.filter(item => item.id !== id);
    savePOSuppliers(updated);
    deleteFromFirestore('po_suppliers', id);

    if (target) {
      const targetApId = target.apId || `ap-po-${id}`;
      const existingHutang = hutangList.find(h => h.id === targetApId || h.poSupplierId === id);
      if (existingHutang) {
        deleteHutang(existingHutang.id);
      }
    }
  };

  const updatePOSupplierStatus = (id: string, status: PurchaseOrderSupplier['statusPO']) => {
    let updatedItem: PurchaseOrderSupplier | null = null;
    const updated = poSuppliers.map(item => {
      if (item.id === id) {
        updatedItem = { ...item, statusPO: status };
        return updatedItem;
      }
      return item;
    });
    savePOSuppliers(updated);
    if (updatedItem) syncToFirestore('po_suppliers', id, updatedItem);
  };

  const terimaBarangPOSupplier = (
    id: string, 
    keterangan?: string,
    receivedItems?: { namaMaterial: string; jumlahDiterima: number }[]
  ): { success: boolean; message: string; statusPO?: PurchaseOrderSupplier['statusPO']; totalNilaiDiterima?: number } => {
    const po = poSuppliers.find(p => p.id === id);
    if (!po) return { success: false, message: 'PO Supplier tidak ditemukan' };

    const today = new Date().toISOString().split('T')[0];
    let updatedMaterialsList = [...materials];

    // Tentukan jumlah barang yang diterima per item
    let allFulfilled = true;
    let anyReceived = false;

    const updatedItems = po.items.map(item => {
      const rec = receivedItems?.find(r => 
        r.namaMaterial.toLowerCase().trim() === item.namaMaterial.toLowerCase().trim()
      );
      
      // Jumlah fisik yang diterima nyata di gudang
      const newTotalReceived = rec !== undefined 
        ? Math.max(0, Number(rec.jumlahDiterima)) 
        : (item.jumlahDiterima !== undefined ? item.jumlahDiterima : item.jumlah);
      
      const prevReceived = item.jumlahDiterima || 0;
      const incrementalReceived = Math.max(0, newTotalReceived - prevReceived);

      if (newTotalReceived < item.jumlah) {
        allFulfilled = false;
      }
      if (newTotalReceived > 0) {
        anyReceived = true;
      }

      // Update stok material gudang HANYA sebesar jumlah fisik yang baru diterima (incremental)
      if (incrementalReceived > 0) {
        const idx = updatedMaterialsList.findIndex(m => 
          (item.materialId && m.id === item.materialId) ||
          (item.kodeMaterial && m.kode?.toLowerCase() === item.kodeMaterial.toLowerCase()) ||
          m.nama.toLowerCase().trim() === item.namaMaterial.toLowerCase().trim()
        );

        if (idx !== -1) {
          const currentMat = updatedMaterialsList[idx];
          const newStok = currentMat.stok + incrementalReceived;
          const newMasuk = (currentMat.stokMasuk || 0) + incrementalReceived;
          const mutasiEntry: MaterialMutasiItem = {
            id: `mutmat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            tanggal: today,
            nomorBukti: po.nomorPO,
            tipe: 'MASUK_WAREHOUSE',
            jumlah: incrementalReceived,
            sisaStokSetelahnya: newStok,
            pengambil: currentUser?.name || 'Staff Gudang',
            penyerah: po.supplier,
            keperluan: `Penerimaan Barang PO Supplier ${po.nomorPO}`,
            keterangan: keterangan || `Masuk Gudang: ${incrementalReceived} ${item.satuan} dari ${po.supplier} (Total Diterima: ${newTotalReceived}/${item.jumlah} ${item.satuan})`,
            dicatatOleh: currentUser?.name || 'Staff Gudang'
          };

          const updatedMat: Material = {
            ...currentMat,
            stok: newStok,
            stokMasuk: newMasuk,
            tanggalMasukWarehouse: today,
            riwayatMutasi: [mutasiEntry, ...(currentMat.riwayatMutasi || [])],
            terakhirDiperbarui: new Date().toISOString()
          };

          updatedMaterialsList[idx] = updatedMat;
          syncToFirestore('materials', updatedMat.id, updatedMat);
        }
      }

      return {
        ...item,
        jumlahDiterima: newTotalReceived,
        subtotalDiterima: newTotalReceived * item.hargaSatuan
      };
    });

    saveMaterials(updatedMaterialsList);

    // Hitung total nilai riil barang yang diterima untuk dasar Hutang Usaha (AP)
    const subtotalReceived = updatedItems.reduce((acc, it) => acc + (it.subtotalDiterima || 0), 0);
    const taxRatio = po.subtotal > 0 ? (subtotalReceived / po.subtotal) : 1;
    const ppnReal = po.ppnNominal ? Math.round(po.ppnNominal * taxRatio) : 0;
    const pphReal = po.pphNominal ? Math.round(po.pphNominal * taxRatio) : 0;
    const biayaKirimReal = subtotalReceived > 0 ? (po.biayaKirim || 0) : 0;
    const totalNilaiDiterima = subtotalReceived + ppnReal + biayaKirimReal - pphReal;

    const newStatusPO: PurchaseOrderSupplier['statusPO'] = 
      allFulfilled ? 'Diterima Gudang' : anyReceived ? 'Diterima Sebagian' : po.statusPO;

    // Update PO Supplier
    const updatedPO: PurchaseOrderSupplier = {
      ...po,
      items: updatedItems,
      totalNilaiDiterima,
      statusPO: newStatusPO,
      tanggalDiterima: today,
      penerimaGudang: currentUser?.name || 'Staff Gudang',
      catatanPenerimaan: keterangan || po.catatanPenerimaan
    };

    const nextPOs = poSuppliers.map(p => p.id === id ? updatedPO : p);
    savePOSuppliers(nextPOs);
    syncToFirestore('po_suppliers', id, updatedPO);

    // Sinkronisasi Hutang Usaha (AP): Tagihan AP dihitung riil berdasarkan jumlah barang yang diterima!
    const targetApId = po.apId || `ap-po-${id}`;
    const existingHutang = hutangList.find(h => h.id === targetApId || h.poSupplierId === id);
    if (existingHutang) {
      const nextTotalTagihan = totalNilaiDiterima;
      const nextSisa = Math.max(0, nextTotalTagihan - existingHutang.sudahDibayar);
      const nextStatusAP: HutangUsaha['status'] = nextSisa === 0 && nextTotalTagihan > 0 
        ? 'Lunas' 
        : existingHutang.sudahDibayar > 0 ? 'Sebagian' : 'Belum Lunas';

      const itemsDesc = updatedItems.map(i => `${i.namaMaterial} (Diterima ${i.jumlahDiterima || 0}/${i.jumlah} ${i.satuan})`).join(', ');

      updateHutang(existingHutang.id, {
        totalTagihan: nextTotalTagihan,
        sisaHutang: nextSisa,
        status: nextStatusAP,
        keterangan: `PO Supplier ${po.nomorPO} [${newStatusPO}]: ${itemsDesc}`
      });
    }

    const message = allFulfilled 
      ? `Semua barang PO ${po.nomorPO} telah diterima penuh (Nilai AP Riil: Rp ${totalNilaiDiterima.toLocaleString('id-ID')}). Stok material gudang & tagihan hutang AP telah disesuaikan!`
      : `Barang PO ${po.nomorPO} diterima sebagian (Nilai AP Riil: Rp ${totalNilaiDiterima.toLocaleString('id-ID')}). Stok material gudang bertambah sesuai fisik dan hutang AP disesuaikan dengan barang yang datang!`;

    return { success: true, message, statusPO: newStatusPO, totalNilaiDiterima };
  };

  // --- CRUD Suppliers (Database Supplier Vendor) ---
  const addSupplier = (supplier: Omit<Supplier, 'id' | 'createdAt'>): string => {
    const id = `sup-${Date.now()}`;
    const newSupp: Supplier = {
      ...supplier,
      id,
      createdAt: new Date().toISOString()
    };
    const updated = [newSupp, ...suppliers];
    saveSuppliers(updated);
    syncToFirestore('suppliers', id, newSupp);
    return id;
  };

  const updateSupplier = (id: string, supplier: Partial<Supplier>) => {
    let updatedItem: Supplier | null = null;
    const updated = suppliers.map(item => {
      if (item.id === id) {
        updatedItem = { ...item, ...supplier };
        return updatedItem;
      }
      return item;
    });
    saveSuppliers(updated);
    if (updatedItem) syncToFirestore('suppliers', id, updatedItem);
  };

  const deleteSupplier = (id: string) => {
    const updated = suppliers.filter(item => item.id !== id);
    saveSuppliers(updated);
    deleteFromFirestore('suppliers', id);
  };

  // --- CRUD Customers ---
  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const id = `cust-${Date.now()}`;
    const newCust: Customer = {
      ...customer,
      id,
      createdAt: new Date().toISOString()
    };
    const updated = [newCust, ...customers];
    saveCustomers(updated);
    syncToFirestore('customers', id, newCust);
  };

  const updateCustomer = (id: string, customer: Partial<Customer>) => {
    let updatedItem: Customer | null = null;
    const updated = customers.map(item => {
      if (item.id === id) {
        updatedItem = { ...item, ...customer };
        return updatedItem;
      }
      return item;
    });
    saveCustomers(updated);
    if (updatedItem) syncToFirestore('customers', id, updatedItem);
  };

  const deleteCustomer = (id: string) => {
    const updated = customers.filter(item => item.id !== id);
    saveCustomers(updated);
    deleteFromFirestore('customers', id);
  };

  // --- CRUD Marketing ---
  const addMarketing = (mkt: Omit<MarketingCommission, 'id'>) => {
    const id = `mkt-${Date.now()}`;
    const newMkt: MarketingCommission = {
      ...mkt,
      id
    };
    const updated = [newMkt, ...marketingList];
    saveMarketing(updated);
    syncToFirestore('marketing', id, newMkt);
  };

  const updateMarketing = (id: string, mkt: Partial<MarketingCommission>) => {
    let updatedItem: MarketingCommission | null = null;
    const updated = marketingList.map(item => {
      if (item.id === id) {
        updatedItem = { ...item, ...mkt };
        return updatedItem;
      }
      return item;
    });
    saveMarketing(updated);
    if (updatedItem) syncToFirestore('marketing', id, updatedItem);
  };

  const deleteMarketing = (id: string) => {
    const updated = marketingList.filter(item => item.id !== id);
    saveMarketing(updated);
    deleteFromFirestore('marketing', id);
  };

  // --- CRUD Surat Jalan ---
  const addSuratJalan = (sj: Omit<SuratJalan, 'id'>) => {
    const id = `sj-${Date.now()}`;
    const newSJ: SuratJalan = {
      ...sj,
      id
    };
    const updated = [newSJ, ...suratJalanList];
    saveSuratJalan(updated);
    syncToFirestore('surat_jalan', id, newSJ);
  };

  const updateSuratJalan = (id: string, sj: Partial<SuratJalan>) => {
    let updatedItem: SuratJalan | null = null;
    const updated = suratJalanList.map(item => {
      if (item.id === id) {
        updatedItem = { ...item, ...sj };
        return updatedItem;
      }
      return item;
    });
    saveSuratJalan(updated);
    if (updatedItem) syncToFirestore('surat_jalan', id, updatedItem);
  };

  const deleteSuratJalan = (id: string) => {
    const updated = suratJalanList.filter(item => item.id !== id);
    saveSuratJalan(updated);
    deleteFromFirestore('surat_jalan', id);
  };

  const updateSJStatus = (id: string, status: SuratJalan['statusPengiriman'], receiver?: string) => {
    const sjTarget = suratJalanList.find(s => s.id === id);
    if (!sjTarget) return;

    const oldStatus = sjTarget.statusPengiriman;
    let updatedItem: SuratJalan | null = null;

    const updated = suratJalanList.map(sj => {
      if (sj.id === id) {
        updatedItem = {
          ...sj,
          statusPengiriman: status,
          penerima: receiver || sj.penerima
        };
        return updatedItem;
      }
      return sj;
    });
    saveSuratJalan(updated);
    if (updatedItem) syncToFirestore('surat_jalan', id, updatedItem);

    // If status changes from 'Draf' to shipped ('Dalam Perjalanan' or further), reduce Finish Good stock
    if (oldStatus === 'Draf' && status !== 'Draf') {
      const today = new Date().toISOString().split('T')[0];
      const updatedGoods = finishGoods.map(fg => {
        const sjItem = sjTarget.itemKirim.find(i => i.namaPallet === fg.nama);
        if (sjItem) {
          const qtyKirim = Number(sjItem.jumlahKirim);
          const nextStock = Math.max(0, fg.stok - qtyKirim);
          const nextKeluar = (fg.stokKeluarPengiriman || 0) + qtyKirim;

          const mutasiEntry: FinishGoodMutasiItem = {
            id: `mutfg-${Date.now()}-${fg.id}`,
            tanggal: today,
            nomorBukti: sjTarget.nomorSuratJalan,
            tipe: 'KELUAR_PENGIRIMAN',
            jumlah: qtyKirim,
            sisaStokSetelahnya: nextStock,
            tujuanPengiriman: sjTarget.pelanggan,
            sopir: sjTarget.namaSopir,
            noKendaraan: sjTarget.nomorPolisi,
            keterangan: `Pengiriman barang via Surat Jalan ${sjTarget.nomorSuratJalan} ke ${sjTarget.pelanggan}`,
            dicatatOleh: currentUser?.name || 'Warehouse Admin'
          };

          const item: FinishGood = {
            ...fg,
            stok: nextStock,
            stokKeluarPengiriman: nextKeluar,
            tanggalKeluarTerakhir: today,
            riwayatMutasiFG: [mutasiEntry, ...(fg.riwayatMutasiFG || [])],
            terakhirDiperbarui: new Date().toISOString()
          };
          syncToFirestore('finish_goods', item.id, item);
          return item;
        }
        return fg;
      });
      saveFinishGoods(updatedGoods);
    }
  };

  // --- CRUD Keuangan ---
  const addKeuangan = (transaksi: Omit<Keuangan, 'id' | 'kodeTransaksi'>) => {
    const id = `trx-${Date.now()}`;
    const prefix = transaksi.tipe === 'Pemasukan' ? 'INC' : 'EXP';
    const kodeTransaksi = `${prefix}-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newTrx: Keuangan = {
      ...transaksi,
      id,
      kodeTransaksi,
      pencatat: currentUser?.name || 'Sistem'
    };
    const updated = [newTrx, ...keuanganList];
    saveKeuangan(updated);
    syncToFirestore('keuangan', id, newTrx);
  };

  const updateKeuangan = (id: string, transaksi: Partial<Keuangan>) => {
    let updatedItem: Keuangan | null = null;
    const updated = keuanganList.map(item => {
      if (item.id === id) {
        updatedItem = { ...item, ...transaksi };
        return updatedItem;
      }
      return item;
    });
    saveKeuangan(updated);
    if (updatedItem) syncToFirestore('keuangan', id, updatedItem);
  };

  const deleteKeuangan = (id: string) => {
    const updated = keuanganList.filter(item => item.id !== id);
    saveKeuangan(updated);
    deleteFromFirestore('keuangan', id);
  };

  // --- CRUD Hutang Usaha (AP) ---
  const addHutang = (hutang: Omit<HutangUsaha, 'id' | 'sisaHutang'>) => {
    const id = `ap-${Date.now()}`;
    const newHutang: HutangUsaha = {
      ...hutang,
      id,
      sisaHutang: hutang.totalTagihan - hutang.sudahDibayar
    };
    const updated = [newHutang, ...hutangList];
    saveHutang(updated);
    syncToFirestore('hutang_ap', id, newHutang);
  };

  const updateHutang = (id: string, hutang: Partial<HutangUsaha>) => {
    let updatedItem: HutangUsaha | null = null;
    const updated = hutangList.map(item => {
      if (item.id === id) {
        const nextTotal = hutang.totalTagihan !== undefined ? hutang.totalTagihan : item.totalTagihan;
        const nextPaid = hutang.sudahDibayar !== undefined ? hutang.sudahDibayar : item.sudahDibayar;
        const sisa = nextTotal - nextPaid;
        let st: HutangUsaha['status'] = item.status;
        if (sisa <= 0) st = 'Lunas';
        else st = 'Belum Lunas';

        updatedItem = {
          ...item,
          ...hutang,
          totalTagihan: nextTotal,
          sudahDibayar: nextPaid,
          sisaHutang: sisa,
          status: st
        };
        return updatedItem;
      }
      return item;
    });
    saveHutang(updated);
    if (updatedItem) syncToFirestore('hutang_ap', id, updatedItem);
  };

  const deleteHutang = (id: string) => {
    const target = hutangList.find(h => h.id === id);
    const updated = hutangList.filter(item => item.id !== id);
    saveHutang(updated);
    deleteFromFirestore('hutang_ap', id);

    if (target) {
      // Remove any related Keuangan payments created for this AP
      const updatedKeuangan = keuanganList.filter(
        k => k.referensiId !== target.nomorTagihan && !k.keterangan?.includes(target.nomorTagihan)
      );
      if (updatedKeuangan.length !== keuanganList.length) {
        saveKeuangan(updatedKeuangan);
        keuanganList
          .filter(k => k.referensiId === target.nomorTagihan || k.keterangan?.includes(target.nomorTagihan))
          .forEach(k => deleteFromFirestore('keuangan', k.id));
      }
    }
  };

  const bayarHutang = (id: string, nominalBayar: number, metode: string, catatan?: string) => {
    const target = hutangList.find(h => h.id === id);
    if (!target) return;

    const nextPaid = target.sudahDibayar + nominalBayar;
    const nextSisa = Math.max(0, target.totalTagihan - nextPaid);
    const nextStatus: HutangUsaha['status'] = nextSisa === 0 ? 'Lunas' : 'Belum Lunas';

    const historyItem = {
      tanggal: new Date().toISOString().split('T')[0],
      nominal: nominalBayar,
      metode,
      catatan: catatan || 'Pembayaran Tagihan Supplier'
    };

    const updatedItem: HutangUsaha = {
      ...target,
      sudahDibayar: nextPaid,
      sisaHutang: nextSisa,
      status: nextStatus,
      riwayatBayar: [...(target.riwayatBayar || []), historyItem]
    };

    const updated = hutangList.map(h => (h.id === id ? updatedItem : h));
    saveHutang(updated);
    syncToFirestore('hutang_ap', id, updatedItem);

    // Sync with linked PO Supplier statusAP
    if (target.poSupplierId) {
      setPOSuppliers(prev => {
        const nextPOList = prev.map(po => {
          if (po.id === target.poSupplierId) {
            const nextPoStatusAP = nextSisa === 0 ? 'Lunas' : 'Sebagian';
            const updatedPO = { ...po, statusAP: nextPoStatusAP };
            syncToFirestore('po_suppliers', po.id, updatedPO);
            return updatedPO;
          }
          return po;
        });
        localStorage.setItem('mk_po_suppliers', JSON.stringify(nextPOList));
        return nextPOList;
      });
    }

    // Record cashflow expense
    const idKeuangan = `trx-${Date.now()}`;
    const kodeTransaksi = `EXP-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newKeuangan: Keuangan = {
      id: idKeuangan,
      kodeTransaksi,
      tanggal: new Date().toISOString().split('T')[0],
      tipe: 'Pengeluaran',
      kategori: 'Pembelian Material',
      nominal: nominalBayar,
      keterangan: `Pembayaran Tagihan AP ${target.nomorTagihan} - ${target.supplier}`,
      metodePembayaran: (metode.includes('Cash') || metode.includes('Tunai')) ? 'Cash / Tunai' : 'Transfer Bank Mandiri',
      referensiId: target.nomorTagihan,
      pencatat: currentUser?.name || 'Sistem'
    };
    saveKeuangan([newKeuangan, ...keuanganList]);
    syncToFirestore('keuangan', idKeuangan, newKeuangan);
  };

  // --- CRUD Kas Kecil ---
  const addKasKecil = (item: Omit<KasKecilItem, 'id' | 'kode'>) => {
    const id = `kk-${Date.now()}`;
    const kode = `PC-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newKK: KasKecilItem = {
      ...item,
      id,
      kode
    };
    const updated = [newKK, ...kasKecilList];
    saveKasKecil(updated);
    syncToFirestore('kas_kecil', id, newKK);
  };

  const updateKasKecil = (id: string, item: Partial<KasKecilItem>) => {
    let updatedItem: KasKecilItem | null = null;
    const updated = kasKecilList.map(kk => {
      if (kk.id === id) {
        updatedItem = { ...kk, ...item };
        return updatedItem;
      }
      return kk;
    });
    if (updatedItem) {
      saveKasKecil(updated);
      syncToFirestore('kas_kecil', id, updatedItem);
    }
  };

  const deleteKasKecil = (id: string) => {
    const updated = kasKecilList.filter(item => item.id !== id);
    saveKasKecil(updated);
    deleteFromFirestore('kas_kecil', id);
  };

  // --- CRUD Buku Bank ---
  const addBukuBank = (item: Omit<BukuBankItem, 'id' | 'kodeMutasi'>) => {
    const id = `bb-${Date.now()}`;
    const kodeMutasi = `MB-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newBank: BukuBankItem = {
      ...item,
      id,
      kodeMutasi
    };
    const updated = [newBank, ...bukuBankList];
    saveBukuBank(updated);
    syncToFirestore('buku_bank', id, newBank);
  };

  const updateBukuBank = (id: string, item: Partial<BukuBankItem>) => {
    let updatedItem: BukuBankItem | null = null;
    const updated = bukuBankList.map(bb => {
      if (bb.id === id) {
        updatedItem = { ...bb, ...item };
        return updatedItem;
      }
      return bb;
    });
    if (updatedItem) {
      saveBukuBank(updated);
      syncToFirestore('buku_bank', id, updatedItem);
    }
  };

  const deleteBukuBank = (id: string) => {
    const updated = bukuBankList.filter(item => item.id !== id);
    saveBukuBank(updated);
    deleteFromFirestore('buku_bank', id);
  };

  const clearAllBukuBank = () => {
    bukuBankList.forEach(item => {
      deleteFromFirestore('buku_bank', item.id);
    });
    saveBukuBank([]);
    localStorage.setItem('mk_buku_bank', JSON.stringify([]));
  };

  // --- CRUD Aset & Depresiasi ---
  const addAset = (aset: Omit<AsetTetap, 'id' | 'kodeAset' | 'nilaiBuku' | 'penyusutanPerBulan' | 'akumulasiPenyusutan'>) => {
    const id = `ast-${Date.now()}`;
    const kodeAset = `AST-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalBulan = Math.max(1, aset.masaManfaatTahun * 12);
    const dasarPenyusutan = Math.max(0, aset.hargaPerolehan - aset.nilaiResidu);
    const penyusutanPerBulan = Math.round(dasarPenyusutan / totalBulan);
    const akumulasiPenyusutan = 0;
    const nilaiBuku = aset.hargaPerolehan;

    const newAset: AsetTetap = {
      ...aset,
      id,
      kodeAset,
      penyusutanPerBulan,
      akumulasiPenyusutan,
      nilaiBuku
    };
    const updated = [newAset, ...asetList];
    saveAset(updated);
    syncToFirestore('aset_tetap', id, newAset);
  };

  const updateAset = (id: string, aset: Partial<AsetTetap>) => {
    let updatedItem: AsetTetap | null = null;
    const updated = asetList.map(item => {
      if (item.id === id) {
        const merged = { ...item, ...aset };
        const totalBulan = Math.max(1, merged.masaManfaatTahun * 12);
        const dasar = Math.max(0, merged.hargaPerolehan - merged.nilaiResidu);
        const pBulan = Math.round(dasar / totalBulan);
        updatedItem = {
          ...merged,
          penyusutanPerBulan: pBulan,
          nilaiBuku: Math.max(merged.nilaiResidu, merged.hargaPerolehan - merged.akumulasiPenyusutan)
        };
        return updatedItem;
      }
      return item;
    });
    saveAset(updated);
    if (updatedItem) syncToFirestore('aset_tetap', id, updatedItem);
  };

  const deleteAset = (id: string) => {
    const updated = asetList.filter(item => item.id !== id);
    saveAset(updated);
    deleteFromFirestore('aset_tetap', id);
  };

  // --- CRUD Pajak ---
  const addPajak = (pajak: Omit<PajakItem, 'id'>) => {
    const id = `pjk-${Date.now()}`;
    const newPajak: PajakItem = {
      ...pajak,
      id
    };
    const updated = [newPajak, ...pajakList];
    savePajak(updated);
    syncToFirestore('pajak', id, newPajak);
  };

  const updatePajak = (id: string, pajak: Partial<PajakItem>) => {
    let updatedItem: PajakItem | null = null;
    const updated = pajakList.map(item => {
      if (item.id === id) {
        updatedItem = {
          ...item,
          ...pajak
        };
        return updatedItem;
      }
      return item;
    });
    savePajak(updated);
    if (updatedItem) syncToFirestore('pajak', id, updatedItem);
  };

  const deletePajak = (id: string) => {
    const cleanId = String(id || '').trim();
    if (!cleanId) return;

    const updated = pajakList.filter(item => item.id !== cleanId);
    savePajak(updated);
    deleteFromFirestore('pajak', cleanId);

    // Track deleted tax ID so virtual/auto tax generator never resurrects it
    const nextDeleted = Array.from(new Set([...deletedTaxIds, cleanId]));
    setDeletedTaxIds(nextDeleted);
    localStorage.setItem('mk_deleted_tax_ids', JSON.stringify(nextDeleted));
    syncToFirestore('app_config', 'deleted_tax_ids', { ids: nextDeleted });

    if (cleanId.startsWith('auto-ppn-')) {
      const poId = cleanId.replace('auto-ppn-', '');
      const targetPo = purchaseOrders.find(p => p.id === poId);
      if (targetPo) {
        updatePurchaseOrder(poId, {
          tipePajak: targetPo.tipePajak === 'PPN & PPh' ? 'PPh' : 'Non PPN',
          ppnNominal: 0
        });
      }
    } else if (cleanId.startsWith('auto-pph-')) {
      const poId = cleanId.replace('auto-pph-', '');
      const targetPo = purchaseOrders.find(p => p.id === poId);
      if (targetPo) {
        updatePurchaseOrder(poId, {
          tipePajak: targetPo.tipePajak === 'PPN & PPh' ? 'PPN' : 'Non PPN',
          pphNominal: 0
        });
      }
    }
  };

  const updateSaldoAwalKasKecil = (val: number) => {
    setSaldoAwalKasKecil(val);
    localStorage.setItem('mk_saldo_awal_kas_kecil', String(val));
    syncToFirestore('app_config', 'finance_settings', {
      saldoAwalKasKecil: val,
      saldoAwalKasBesar,
      saldoAwalBukuBank,
      useOverrideHPP,
      overrideHPPValue,
      useOverrideBeban,
      overrideBebanValue,
      modalDisetor,
      labaDitahan,
      useOverrideLabaBersih,
      overrideLabaBersihValue
    });
  };

  const updateSaldoAwalKasBesar = (val: number) => {
    setSaldoAwalKasBesar(val);
    localStorage.setItem('mk_saldo_awal_kas_besar', String(val));
    syncToFirestore('app_config', 'finance_settings', {
      saldoAwalKasKecil,
      saldoAwalKasBesar: val,
      saldoAwalBukuBank,
      useOverrideHPP,
      overrideHPPValue,
      useOverrideBeban,
      overrideBebanValue,
      modalDisetor,
      labaDitahan,
      useOverrideLabaBersih,
      overrideLabaBersihValue
    });
  };

  const updateSaldoAwalBukuBank = (val: number) => {
    setSaldoAwalBukuBank(val);
    localStorage.setItem('mk_saldo_awal_buku_bank', String(val));
    syncToFirestore('app_config', 'finance_settings', {
      saldoAwalKasKecil,
      saldoAwalKasBesar,
      saldoAwalBukuBank: val,
      useOverrideHPP,
      overrideHPPValue,
      useOverrideBeban,
      overrideBebanValue,
      modalDisetor,
      labaDitahan,
      useOverrideLabaBersih,
      overrideLabaBersihValue
    });
  };

  const updateOverrideHPP = (useOverride: boolean, val: number) => {
    setUseOverrideHPP(useOverride);
    setOverrideHPPValue(val);
    localStorage.setItem('mk_use_override_hpp', String(useOverride));
    localStorage.setItem('mk_override_hpp_value', String(val));
    syncToFirestore('app_config', 'finance_settings', {
      saldoAwalKasKecil,
      saldoAwalKasBesar,
      saldoAwalBukuBank,
      useOverrideHPP: useOverride,
      overrideHPPValue: val,
      useOverrideBeban,
      overrideBebanValue,
      modalDisetor,
      labaDitahan,
      useOverrideLabaBersih,
      overrideLabaBersihValue
    });
  };

  const updateOverrideBeban = (useOverride: boolean, val: number) => {
    setUseOverrideBeban(useOverride);
    setOverrideBebanValue(val);
    localStorage.setItem('mk_use_override_beban', String(useOverride));
    localStorage.setItem('mk_override_beban_value', String(val));
    syncToFirestore('app_config', 'finance_settings', {
      saldoAwalKasKecil,
      saldoAwalKasBesar,
      saldoAwalBukuBank,
      useOverrideHPP,
      overrideHPPValue,
      useOverrideBeban: useOverride,
      overrideBebanValue: val,
      modalDisetor,
      labaDitahan,
      useOverrideLabaBersih,
      overrideLabaBersihValue
    });
  };

  const updateEquitySettings = (
    newModal: number, 
    newLabaDitahan: number, 
    useOverride: boolean, 
    overrideVal: number,
    newUseOverridePenyeimbang?: boolean,
    newOverridePenyeimbangValue?: number
  ) => {
    setModalDisetor(newModal);
    setLabaDitahan(newLabaDitahan);
    setUseOverrideLabaBersih(useOverride);
    setOverrideLabaBersihValue(overrideVal);

    if (newUseOverridePenyeimbang !== undefined) {
      setUseOverridePenyeimbang(newUseOverridePenyeimbang);
      localStorage.setItem('mk_use_override_penyeimbang', String(newUseOverridePenyeimbang));
    }
    if (newOverridePenyeimbangValue !== undefined) {
      setOverridePenyeimbangValue(newOverridePenyeimbangValue);
      localStorage.setItem('mk_override_penyeimbang_value', String(newOverridePenyeimbangValue));
    }

    localStorage.setItem('mk_modal_disetor', String(newModal));
    localStorage.setItem('mk_laba_ditahan', String(newLabaDitahan));
    localStorage.setItem('mk_use_override_laba_bersih', String(useOverride));
    localStorage.setItem('mk_override_laba_bersih_value', String(overrideVal));

    syncToFirestore('app_config', 'finance_settings', {
      saldoAwalKasKecil,
      saldoAwalKasBesar,
      saldoAwalBukuBank,
      useOverrideHPP,
      overrideHPPValue,
      useOverrideBeban,
      overrideBebanValue,
      modalDisetor: newModal,
      labaDitahan: newLabaDitahan,
      useOverrideLabaBersih: useOverride,
      overrideLabaBersihValue: overrideVal,
      useOverridePenyeimbang: newUseOverridePenyeimbang !== undefined ? newUseOverridePenyeimbang : useOverridePenyeimbang,
      overridePenyeimbangValue: newOverridePenyeimbangValue !== undefined ? newOverridePenyeimbangValue : overridePenyeimbangValue
    });
  };

  const resetDatabase = () => {
    // Delete in Firestore
    materials.forEach(m => deleteFromFirestore('materials', m.id));
    finishGoods.forEach(f => deleteFromFirestore('finish_goods', f.id));
    purchaseOrders.forEach(p => deleteFromFirestore('purchase_orders', p.id));
    poSuppliers.forEach(p => deleteFromFirestore('po_suppliers', p.id));
    suppliers.forEach(s => deleteFromFirestore('suppliers', s.id));
    suratJalanList.forEach(s => deleteFromFirestore('surat_jalan', s.id));
    keuanganList.forEach(k => deleteFromFirestore('keuangan', k.id));
    customers.forEach(c => deleteFromFirestore('customers', c.id));
    marketingList.forEach(m => deleteFromFirestore('marketing', m.id));
    hutangList.forEach(h => deleteFromFirestore('hutang_ap', h.id));
    kasKecilList.forEach(k => deleteFromFirestore('kas_kecil', k.id));
    bukuBankList.forEach(b => deleteFromFirestore('buku_bank', b.id));
    asetList.forEach(a => deleteFromFirestore('aset_tetap', a.id));
    pajakList.forEach(p => deleteFromFirestore('pajak', p.id));

    localStorage.setItem('mk_materials', JSON.stringify([]));
    localStorage.setItem('mk_finish_goods', JSON.stringify([]));
    localStorage.setItem('mk_purchase_orders', JSON.stringify([]));
    localStorage.setItem('mk_po_suppliers', JSON.stringify([]));
    localStorage.setItem('mk_suppliers', JSON.stringify([]));
    localStorage.setItem('mk_surat_jalan', JSON.stringify([]));
    localStorage.setItem('mk_keuangan', JSON.stringify([]));
    localStorage.setItem('mk_customers', JSON.stringify([]));
    localStorage.setItem('mk_marketing', JSON.stringify([]));
    localStorage.setItem('mk_hutang_ap', JSON.stringify([]));
    localStorage.setItem('mk_kas_kecil', JSON.stringify([]));
    localStorage.setItem('mk_buku_bank', JSON.stringify([]));
    localStorage.setItem('mk_aset_tetap', JSON.stringify([]));
    localStorage.setItem('mk_laporan_pajak', JSON.stringify([]));
    
    setMaterials([]);
    setFinishGoods([]);
    setPurchaseOrders([]);
    setPOSuppliers([]);
    setSuppliers([]);
    setSuratJalanList([]);
    setKeuanganList([]);
    setCustomers([]);
    setMarketingList([]);
    setHutangList([]);
    setKasKecilList([]);
    setBukuBankList([]);
    setAsetList([]);
    setPajakList([]);
    setTandaTerimaMaterialList([]);
  };

  return (
    <AppContext.Provider value={{
      materials,
      finishGoods,
      purchaseOrders,
      poSuppliers,
      suppliers,
      suratJalanList,
      keuanganList,
      customers,
      marketingList,
      hutangList,
      kasKecilList,
      bukuBankList,
      asetList,
      pajakList,
      tandaTerimaMaterialList,
      currentUser,
      darkMode,
      saldoAwalKasKecil,
      saldoAwalKasBesar,
      saldoAwalBukuBank,
      updateSaldoAwalKasKecil,
      updateSaldoAwalKasBesar,
      updateSaldoAwalBukuBank,
      useOverrideHPP,
      overrideHPPValue,
      useOverrideBeban,
      overrideBebanValue,
      updateOverrideHPP,
      updateOverrideBeban,
      modalDisetor,
      labaDitahan,
      useOverrideLabaBersih,
      overrideLabaBersihValue,
      useOverridePenyeimbang,
      overridePenyeimbangValue,
      updateEquitySettings,
      isFirebaseConnected,
      syncStatus,
      passwords,
      updatePassword,
      login,
      logout,
      switchUser,
      toggleDarkMode,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      adjustMaterialStock,
      recordMaterialMutation,
      addTandaTerimaMaterial,
      updateTandaTerimaMaterial,
      deleteTandaTerimaMaterial,
      addFinishGood,
      updateFinishGood,
      deleteFinishGood,
      adjustFinishGoodStock,
      producePallets,
      recordFinishGoodMutation,
      updateFinishGoodOpname,
      addPurchaseOrder,
      updatePurchaseOrder,
      deletePurchaseOrder,
      updatePOStatus,
      updateInvoiceStatus,
      addPOSupplier,
      updatePOSupplier,
      deletePOSupplier,
      updatePOSupplierStatus,
      terimaBarangPOSupplier,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addMarketing,
      updateMarketing,
      deleteMarketing,
      addSuratJalan,
      updateSuratJalan,
      deleteSuratJalan,
      updateSJStatus,
      addKeuangan,
      updateKeuangan,
      deleteKeuangan,
      addHutang,
      updateHutang,
      deleteHutang,
      bayarHutang,
      addKasKecil,
      updateKasKecil,
      deleteKasKecil,
      addBukuBank,
      updateBukuBank,
      deleteBukuBank,
      clearAllBukuBank,
      addAset,
      updateAset,
      deleteAset,
      addPajak,
      updatePajak,
      deletePajak,
      deletedTaxIds,
      resetDatabase
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
