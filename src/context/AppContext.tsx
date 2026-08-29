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
  PajakItem
} from '../types';
import {
  DEFAULT_HUTANG_INIT,
  DEFAULT_KAS_KECIL_INIT,
  DEFAULT_BUKU_BANK_INIT,
  DEFAULT_ASET_INIT,
  DEFAULT_PAJAK_INIT
} from '../data/financeDefaults';
import { db, doc, collection, onSnapshot, setDoc, deleteDoc } from '../firebase';

interface AppContextProps {
  materials: Material[];
  finishGoods: FinishGood[];
  purchaseOrders: PurchaseOrder[];
  suratJalanList: SuratJalan[];
  keuanganList: Keuangan[];
  customers: Customer[];
  marketingList: MarketingCommission[];
  hutangList: HutangUsaha[];
  kasKecilList: KasKecilItem[];
  bukuBankList: BukuBankItem[];
  asetList: AsetTetap[];
  pajakList: PajakItem[];
  currentUser: User | null;
  darkMode: boolean;
  
  // Firebase State
  isFirebaseConnected: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';

  // Auth actions
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

  // FinishGood actions
  addFinishGood: (good: Omit<FinishGood, 'id' | 'terakhirDiperbarui'>) => void;
  updateFinishGood: (id: string, good: Partial<FinishGood>) => void;
  deleteFinishGood: (id: string) => void;
  adjustFinishGoodStock: (id: string, amount: number) => void;
  producePallets: (finishGoodId: string, quantity: number, consumedMaterials: { materialId: string; amount: number }[]) => { success: boolean; error?: string };

  // Purchase Order & Invoice actions
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => void;
  updatePurchaseOrder: (id: string, po: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  updatePOStatus: (id: string, status: PurchaseOrder['statusPO']) => void;
  updateInvoiceStatus: (id: string, status: PurchaseOrder['statusInvoice'], paymentMethod?: Keuangan['metodePembayaran']) => void;

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
  deleteKasKecil: (id: string) => void;

  // Buku Bank actions
  addBukuBank: (item: Omit<BukuBankItem, 'id' | 'kodeMutasi'>) => void;
  deleteBukuBank: (id: string) => void;

  // Aset & Depresiasi actions
  addAset: (aset: Omit<AsetTetap, 'id' | 'kodeAset' | 'nilaiBuku' | 'penyusutanPerBulan' | 'akumulasiPenyusutan'>) => void;
  updateAset: (id: string, aset: Partial<AsetTetap>) => void;
  deleteAset: (id: string) => void;

  // Pajak actions
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

const PASSWORDS: Record<UserRole, string> = {
  ADMIN_SALES: 'sales123',
  WAREHOUSE: 'warehouse123',
  FINANCE: 'finance123',
  OWNER: 'owner123'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [finishGoods, setFinishGoods] = useState<FinishGood[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suratJalanList, setSuratJalanList] = useState<SuratJalan[]>([]);
  const [keuanganList, setKeuanganList] = useState<Keuangan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [marketingList, setMarketingList] = useState<MarketingCommission[]>([]);
  const [hutangList, setHutangList] = useState<HutangUsaha[]>([]);
  const [kasKecilList, setKasKecilList] = useState<KasKecilItem[]>([]);
  const [bukuBankList, setBukuBankList] = useState<BukuBankItem[]>([]);
  const [asetList, setAsetList] = useState<AsetTetap[]>([]);
  const [pajakList, setPajakList] = useState<PajakItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  const isInitialSyncDone = useRef(false);

  // Helper to safely write to Firestore
  const syncToFirestore = async (colName: string, id: string, data: any) => {
    try {
      setSyncStatus('syncing');
      await setDoc(doc(db, colName, id), data, { merge: true });
      setSyncStatus('synced');
      setIsFirebaseConnected(true);
    } catch (err) {
      console.warn(`Firestore write error [${colName}/${id}]:`, err);
      setSyncStatus('offline');
    }
  };

  const deleteFromFirestore = async (colName: string, id: string) => {
    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, colName, id));
      setSyncStatus('synced');
      setIsFirebaseConnected(true);
    } catch (err) {
      console.warn(`Firestore delete error [${colName}/${id}]:`, err);
      setSyncStatus('offline');
    }
  };

  // Load from LocalStorage and setup Firestore real-time subscriptions
  useEffect(() => {
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
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as Material);
          setMaterials(list);
          localStorage.setItem('mk_materials', JSON.stringify(list));
        } else if (!isInitialSyncDone.current) {
          const cached = localStorage.getItem('mk_materials');
          if (cached) setMaterials(JSON.parse(cached));
        }
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      }, (err) => {
        console.warn('Firestore materials sync fallback:', err);
        setIsFirebaseConnected(false);
      });

      const unsubFinishGoods = onSnapshot(collection(db, 'finish_goods'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as FinishGood);
          setFinishGoods(list);
          localStorage.setItem('mk_finish_goods', JSON.stringify(list));
        } else if (!isInitialSyncDone.current) {
          const cached = localStorage.getItem('mk_finish_goods');
          if (cached) setFinishGoods(JSON.parse(cached));
        }
      });

      const unsubPOs = onSnapshot(collection(db, 'purchase_orders'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as PurchaseOrder);
          setPurchaseOrders(list);
          localStorage.setItem('mk_purchase_orders', JSON.stringify(list));
        } else if (!isInitialSyncDone.current) {
          const cached = localStorage.getItem('mk_purchase_orders');
          if (cached) setPurchaseOrders(JSON.parse(cached));
        }
      });

      const unsubSJ = onSnapshot(collection(db, 'surat_jalan'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as SuratJalan);
          setSuratJalanList(list);
          localStorage.setItem('mk_surat_jalan', JSON.stringify(list));
        } else if (!isInitialSyncDone.current) {
          const cached = localStorage.getItem('mk_surat_jalan');
          if (cached) setSuratJalanList(JSON.parse(cached));
        }
      });

      const unsubKeuangan = onSnapshot(collection(db, 'keuangan'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as Keuangan);
          setKeuanganList(list);
          localStorage.setItem('mk_keuangan', JSON.stringify(list));
        } else if (!isInitialSyncDone.current) {
          const cached = localStorage.getItem('mk_keuangan');
          if (cached) setKeuanganList(JSON.parse(cached));
        }
      });

      const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as Customer);
          setCustomers(list);
          localStorage.setItem('mk_customers', JSON.stringify(list));
        } else if (!isInitialSyncDone.current) {
          const cached = localStorage.getItem('mk_customers');
          if (cached) setCustomers(JSON.parse(cached));
        }
      });

      const unsubMarketing = onSnapshot(collection(db, 'marketing'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as MarketingCommission);
          setMarketingList(list);
          localStorage.setItem('mk_marketing', JSON.stringify(list));
        } else if (!isInitialSyncDone.current) {
          const cached = localStorage.getItem('mk_marketing');
          if (cached) setMarketingList(JSON.parse(cached));
        }
      });

      const unsubHutang = onSnapshot(collection(db, 'hutang_ap'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as HutangUsaha);
          setHutangList(list);
          localStorage.setItem('mk_hutang_ap', JSON.stringify(list));
        } else if (!isInitialSyncDone.current) {
          const cached = localStorage.getItem('mk_hutang_ap');
          const data = cached ? JSON.parse(cached) : DEFAULT_HUTANG_INIT;
          setHutangList(data);
        }
      });

      const unsubKasKecil = onSnapshot(collection(db, 'kas_kecil'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as KasKecilItem);
          setKasKecilList(list);
          localStorage.setItem('mk_kas_kecil', JSON.stringify(list));
        } else if (!isInitialSyncDone.current) {
          const cached = localStorage.getItem('mk_kas_kecil');
          const data = cached ? JSON.parse(cached) : DEFAULT_KAS_KECIL_INIT;
          setKasKecilList(data);
        }
      });

      const unsubBukuBank = onSnapshot(collection(db, 'buku_bank'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as BukuBankItem);
          setBukuBankList(list);
          localStorage.setItem('mk_buku_bank', JSON.stringify(list));
        } else if (!isInitialSyncDone.current) {
          const cached = localStorage.getItem('mk_buku_bank');
          const data = cached ? JSON.parse(cached) : DEFAULT_BUKU_BANK_INIT;
          setBukuBankList(data);
        }
      });

      const unsubAset = onSnapshot(collection(db, 'aset_tetap'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as AsetTetap);
          setAsetList(list);
          localStorage.setItem('mk_aset_tetap', JSON.stringify(list));
        } else if (!isInitialSyncDone.current) {
          const cached = localStorage.getItem('mk_aset_tetap');
          const data = cached ? JSON.parse(cached) : DEFAULT_ASET_INIT;
          setAsetList(data);
        }
      });

      const unsubPajak = onSnapshot(collection(db, 'pajak'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as PajakItem);
          setPajakList(list);
          localStorage.setItem('mk_laporan_pajak', JSON.stringify(list));
        } else if (!isInitialSyncDone.current) {
          const cached = localStorage.getItem('mk_laporan_pajak');
          const data = cached ? JSON.parse(cached) : DEFAULT_PAJAK_INIT;
          setPajakList(data);
        }
      });

      isInitialSyncDone.current = true;

      return () => {
        unsubMaterials();
        unsubFinishGoods();
        unsubPOs();
        unsubSJ();
        unsubKeuangan();
        unsubCustomers();
        unsubMarketing();
        unsubHutang();
        unsubKasKecil();
        unsubBukuBank();
        unsubAset();
        unsubPajak();
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

  const savePurchaseOrders = (newPOs: PurchaseOrder[]) => {
    setPurchaseOrders(newPOs);
    localStorage.setItem('mk_purchase_orders', JSON.stringify(newPOs));
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

  // Auth Operations
  const login = (role: UserRole, password: string): boolean => {
    if (PASSWORDS[role] === password) {
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
    const newMat: Material = {
      ...material,
      id,
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
    const updated = materials.map(item => {
      if (item.id === id) {
        updatedItem = {
          ...item,
          stok: Math.max(0, item.stok + amount),
          terakhirDiperbarui: new Date().toISOString()
        };
        return updatedItem;
      }
      return item;
    });
    saveMaterials(updated);
    if (updatedItem) syncToFirestore('materials', id, updatedItem);
  };

  // --- CRUD FinishGood (Pallet) ---
  const addFinishGood = (good: Omit<FinishGood, 'id' | 'terakhirDiperbarui'>) => {
    const id = `plt-${Date.now()}`;
    const newGood: FinishGood = {
      ...good,
      id,
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
    const updated = finishGoods.map(item => {
      if (item.id === id) {
        updatedItem = {
          ...item,
          stok: Math.max(0, item.stok + amount),
          terakhirDiperbarui: new Date().toISOString()
        };
        return updatedItem;
      }
      return item;
    });
    saveFinishGoods(updated);
    if (updatedItem) syncToFirestore('finish_goods', id, updatedItem);
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

    const updatedMaterials = materials.map(mat => {
      const cm = consumedMaterials.find(c => c.materialId === mat.id);
      if (cm) {
        const item = {
          ...mat,
          stok: mat.stok - (cm.amount * quantity),
          terakhirDiperbarui: new Date().toISOString()
        };
        syncToFirestore('materials', item.id, item);
        return item;
      }
      return mat;
    });

    const updatedFinishGoods = finishGoods.map(fg => {
      if (fg.id === finishGoodId) {
        const item = {
          ...fg,
          stok: fg.stok + quantity,
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
    const newPO: PurchaseOrder = {
      ...po,
      id
    };
    const updated = [newPO, ...purchaseOrders];
    savePurchaseOrders(updated);
    syncToFirestore('purchase_orders', id, newPO);
  };

  const updatePurchaseOrder = (id: string, po: Partial<PurchaseOrder>) => {
    let updatedItem: PurchaseOrder | null = null;
    const updated = purchaseOrders.map(item => {
      if (item.id === id) {
        updatedItem = {
          ...item,
          ...po
        };
        return updatedItem;
      }
      return item;
    });
    savePurchaseOrders(updated);
    if (updatedItem) syncToFirestore('purchase_orders', id, updatedItem);
  };

  const deletePurchaseOrder = (id: string) => {
    const updated = purchaseOrders.filter(item => item.id !== id);
    savePurchaseOrders(updated);
    deleteFromFirestore('purchase_orders', id);
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

  const updateInvoiceStatus = (id: string, status: PurchaseOrder['statusInvoice'], paymentMethod: Keuangan['metodePembayaran'] = 'Transfer Bank BCA') => {
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

    // If marked as paid, automatically create income in Keuangan
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
    }
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

    // Reduce FinishGood stocks upon shipment dispatch
    const updatedGoods = finishGoods.map(fg => {
      const sjItem = sj.itemKirim.find(i => i.namaPallet === fg.nama);
      if (sjItem) {
        const nextStock = Math.max(0, fg.stok - sjItem.jumlahKirim);
        const item = {
          ...fg,
          stok: nextStock,
          terakhirDiperbarui: new Date().toISOString()
        };
        syncToFirestore('finish_goods', item.id, item);
        return item;
      }
      return fg;
    });
    saveFinishGoods(updatedGoods);
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
    const updated = hutangList.filter(item => item.id !== id);
    saveHutang(updated);
    deleteFromFirestore('hutang_ap', id);
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
      metodePembayaran: metode.includes('BCA') ? 'Transfer Bank BCA' : metode.includes('Mandiri') ? 'Transfer Bank Mandiri' : 'Cash / Tunai',
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

  const deleteBukuBank = (id: string) => {
    const updated = bukuBankList.filter(item => item.id !== id);
    saveBukuBank(updated);
    deleteFromFirestore('buku_bank', id);
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
    const updated = pajakList.filter(item => item.id !== id);
    savePajak(updated);
    deleteFromFirestore('pajak', id);
  };

  const resetDatabase = () => {
    localStorage.setItem('mk_materials', JSON.stringify([]));
    localStorage.setItem('mk_finish_goods', JSON.stringify([]));
    localStorage.setItem('mk_purchase_orders', JSON.stringify([]));
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
    setSuratJalanList([]);
    setKeuanganList([]);
    setCustomers([]);
    setMarketingList([]);
    setHutangList([]);
    setKasKecilList([]);
    setBukuBankList([]);
    setAsetList([]);
    setPajakList([]);
  };

  return (
    <AppContext.Provider value={{
      materials,
      finishGoods,
      purchaseOrders,
      suratJalanList,
      keuanganList,
      customers,
      marketingList,
      hutangList,
      kasKecilList,
      bukuBankList,
      asetList,
      pajakList,
      currentUser,
      darkMode,
      isFirebaseConnected,
      syncStatus,
      login,
      logout,
      switchUser,
      toggleDarkMode,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      adjustMaterialStock,
      addFinishGood,
      updateFinishGood,
      deleteFinishGood,
      adjustFinishGoodStock,
      producePallets,
      addPurchaseOrder,
      updatePurchaseOrder,
      deletePurchaseOrder,
      updatePOStatus,
      updateInvoiceStatus,
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
      deleteKasKecil,
      addBukuBank,
      deleteBukuBank,
      addAset,
      updateAset,
      deleteAset,
      addPajak,
      updatePajak,
      deletePajak,
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
