import React, { createContext, useContext, useState, useEffect } from 'react';
import { Material, FinishGood, PurchaseOrder, SuratJalan, Keuangan, User, UserRole, Customer, MarketingCommission } from '../types';

interface AppContextProps {
  materials: Material[];
  finishGoods: FinishGood[];
  purchaseOrders: PurchaseOrder[];
  suratJalanList: SuratJalan[];
  keuanganList: Keuangan[];
  customers: Customer[];
  marketingList: MarketingCommission[];
  currentUser: User | null;
  darkMode: boolean;
  
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Load from LocalStorage
  useEffect(() => {
    // Customers Data
    const cachedCustomers = localStorage.getItem('mk_customers');
    if (cachedCustomers) {
      setCustomers(JSON.parse(cachedCustomers));
    } else {
      const initCustomers: Customer[] = [];
      setCustomers(initCustomers);
      localStorage.setItem('mk_customers', JSON.stringify(initCustomers));
    }

    // Marketing Data
    const cachedMarketing = localStorage.getItem('mk_marketing');
    if (cachedMarketing) {
      setMarketingList(JSON.parse(cachedMarketing));
    } else {
      const initMarketing: MarketingCommission[] = [];
      setMarketingList(initMarketing);
      localStorage.setItem('mk_marketing', JSON.stringify(initMarketing));
    }
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
    } else {
      // Default to null to force login screen
      setCurrentUser(null);
    }

    // Material Data
    const cachedMaterials = localStorage.getItem('mk_materials');
    if (cachedMaterials) {
      setMaterials(JSON.parse(cachedMaterials));
    } else {
      const initMaterials: Material[] = [];
      setMaterials(initMaterials);
      localStorage.setItem('mk_materials', JSON.stringify(initMaterials));
    }

    // Finished Goods Data (Pallets)
    const cachedGoods = localStorage.getItem('mk_finish_goods');
    if (cachedGoods) {
      setFinishGoods(JSON.parse(cachedGoods));
    } else {
      const initGoods: FinishGood[] = [];
      setFinishGoods(initGoods);
      localStorage.setItem('mk_finish_goods', JSON.stringify(initGoods));
    }

    // Purchase Orders (POs) Data
    const cachedPOs = localStorage.getItem('mk_purchase_orders');
    if (cachedPOs) {
      setPurchaseOrders(JSON.parse(cachedPOs));
    } else {
      const initPOs: PurchaseOrder[] = [];
      setPurchaseOrders(initPOs);
      localStorage.setItem('mk_purchase_orders', JSON.stringify(initPOs));
    }

    // Surat Jalan Data
    const cachedSJ = localStorage.getItem('mk_surat_jalan');
    if (cachedSJ) {
      setSuratJalanList(JSON.parse(cachedSJ));
    } else {
      const initSJ: SuratJalan[] = [];
      setSuratJalanList(initSJ);
      localStorage.setItem('mk_surat_jalan', JSON.stringify(initSJ));
    }

    // Keuangan Data (Cashflow)
    const cachedKeuangan = localStorage.getItem('mk_keuangan');
    if (cachedKeuangan) {
      setKeuanganList(JSON.parse(cachedKeuangan));
    } else {
      const initKeuangan: Keuangan[] = [];
      setKeuanganList(initKeuangan);
      localStorage.setItem('mk_keuangan', JSON.stringify(initKeuangan));
    }
  }, []);

  // Sync state functions with LocalStorage
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

    // Audit Log in Keuangan if it's initial stock purchase or we record it
    // For simplicity, just add to materials
  };

  const updateMaterial = (id: string, material: Partial<Material>) => {
    const updated = materials.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...material,
          terakhirDiperbarui: new Date().toISOString()
        };
      }
      return item;
    });
    saveMaterials(updated);
  };

  const deleteMaterial = (id: string) => {
    const updated = materials.filter(item => item.id !== id);
    saveMaterials(updated);
  };

  const adjustMaterialStock = (id: string, amount: number) => {
    const updated = materials.map(item => {
      if (item.id === id) {
        return {
          ...item,
          stok: Math.max(0, item.stok + amount),
          terakhirDiperbarui: new Date().toISOString()
        };
      }
      return item;
    });
    saveMaterials(updated);
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
  };

  const updateFinishGood = (id: string, good: Partial<FinishGood>) => {
    const updated = finishGoods.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...good,
          terakhirDiperbarui: new Date().toISOString()
        };
      }
      return item;
    });
    saveFinishGoods(updated);
  };

  const deleteFinishGood = (id: string) => {
    const updated = finishGoods.filter(item => item.id !== id);
    saveFinishGoods(updated);
  };

  const adjustFinishGoodStock = (id: string, amount: number) => {
    const updated = finishGoods.map(item => {
      if (item.id === id) {
        return {
          ...item,
          stok: Math.max(0, item.stok + amount),
          terakhirDiperbarui: new Date().toISOString()
        };
      }
      return item;
    });
    saveFinishGoods(updated);
  };

  // Manufacturing / Production Simulator: Consumes Material Stock and increases Finish Good Stock
  const producePallets = (
    finishGoodId: string, 
    quantity: number, 
    consumedMaterials: { materialId: string; amount: number }[]
  ): { success: boolean; error?: string } => {
    // 1. Verify enough material stock is available
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

    // 2. Consume Materials
    const updatedMaterials = materials.map(mat => {
      const cm = consumedMaterials.find(c => c.materialId === mat.id);
      if (cm) {
        return {
          ...mat,
          stok: mat.stok - (cm.amount * quantity),
          terakhirDiperbarui: new Date().toISOString()
        };
      }
      return mat;
    });

    // 3. Increment Finish Good Stock
    const updatedGoods = finishGoods.map(good => {
      if (good.id === finishGoodId) {
        return {
          ...good,
          stok: good.stok + quantity,
          terakhirDiperbarui: new Date().toISOString()
        };
      }
      return good;
    });

    saveMaterials(updatedMaterials);
    saveFinishGoods(updatedGoods);

    // Record an entry in cashflow / logs? (Not cashflow since it is manufacturing, but it updates stocks!)
    return { success: true };
  };

  // --- CRUD Purchase Order & Invoice ---
  const saveCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    localStorage.setItem('mk_customers', JSON.stringify(newCustomers));
  };

  const saveMarketing = (newMarketing: MarketingCommission[]) => {
    setMarketingList(newMarketing);
    localStorage.setItem('mk_marketing', JSON.stringify(newMarketing));
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const id = `cust-${Date.now()}`;
    const newCust: Customer = {
      ...customer,
      id,
      createdAt: new Date().toISOString()
    };
    saveCustomers([...customers, newCust]);
  };

  const updateCustomer = (id: string, updatedCust: Partial<Customer>) => {
    const updated = customers.map(c => c.id === id ? { ...c, ...updatedCust } : c);
    saveCustomers(updated);
  };

  const deleteCustomer = (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    saveCustomers(updated);
  };

  const addMarketing = (mkt: Omit<MarketingCommission, 'id'>) => {
    const id = `mkt-${Date.now()}`;
    const newMkt: MarketingCommission = {
      ...mkt,
      id
    };
    saveMarketing([...marketingList, newMkt]);
  };

  const updateMarketing = (id: string, updatedMkt: Partial<MarketingCommission>) => {
    const updated = marketingList.map(m => m.id === id ? { ...m, ...updatedMkt } : m);
    saveMarketing(updated);
  };

  const deleteMarketing = (id: string) => {
    const updated = marketingList.filter(m => m.id !== id);
    saveMarketing(updated);
  };

  const addPurchaseOrder = (po: Omit<PurchaseOrder, 'id'>) => {
    const id = `po-${Date.now()}`;
    const newPO: PurchaseOrder = {
      ...po,
      id
    };
    const updated = [newPO, ...purchaseOrders];
    savePurchaseOrders(updated);

    // Auto-insert customer to database if not exists
    const customerExists = customers.some(c => c.nama.toLowerCase() === po.pelanggan.trim().toLowerCase());
    if (!customerExists && po.pelanggan.trim()) {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        nama: po.pelanggan.trim(),
        alamat: 'Alamat Baru (Ditambahkan otomatis dari PO)',
        telepon: '-',
        createdAt: new Date().toISOString()
      };
      saveCustomers([...customers, newCust]);
    }

    // Auto-insert marketing person if they don't exist and have a name
    if (po.namaMarketing && po.namaMarketing.trim()) {
      const mktExists = marketingList.some(m => m.namaMarketing.toLowerCase() === po.namaMarketing!.trim().toLowerCase());
      if (!mktExists) {
        const newMkt: MarketingCommission = {
          id: `mkt-${Date.now()}`,
          namaMarketing: po.namaMarketing.trim(),
          persentaseKomisi: 2.0, // default 2%
          targetOmset: 50000000 // default 50jt target
        };
        saveMarketing([...marketingList, newMkt]);
      }
    }
  };

  const updatePurchaseOrder = (id: string, po: Partial<PurchaseOrder>) => {
    const updated = purchaseOrders.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...po
        };
      }
      return item;
    });
    savePurchaseOrders(updated);
  };

  const deletePurchaseOrder = (id: string) => {
    const updated = purchaseOrders.filter(item => item.id !== id);
    savePurchaseOrders(updated);
  };

  const updatePOStatus = (id: string, status: PurchaseOrder['statusPO']) => {
    const po = purchaseOrders.find(p => p.id === id);
    if (!po) return;

    // Deduct warehouse stock when PO becomes "Selesai" / Shipped or Delivered (if not already deducted)
    // For business logic, let's deduct stock when status is marked "Siap Kirim" or "Selesai" (e.g. shipping)
    // To keep it simple & functional: when PO changes from something else to 'Selesai' or 'Siap Kirim',
    // we can reduce finished goods stock.
    const isNowShipping = (status === 'Siap Kirim' || status === 'Selesai') && po.statusPO !== 'Siap Kirim' && po.statusPO !== 'Selesai';
    
    if (isNowShipping) {
      const updatedGoods = finishGoods.map(good => {
        const itemOrdered = po.item.find(i => i.finishGoodId === good.id);
        if (itemOrdered) {
          return {
            ...good,
            stok: Math.max(0, good.stok - itemOrdered.jumlah),
            terakhirDiperbarui: new Date().toISOString()
          };
        }
        return good;
      });
      saveFinishGoods(updatedGoods);
    }

    const updated = purchaseOrders.map(item => {
      if (item.id === id) {
        return {
          ...item,
          statusPO: status
        };
      }
      return item;
    });
    savePurchaseOrders(updated);
  };

  const updateInvoiceStatus = (
    id: string, 
    status: PurchaseOrder['statusInvoice'], 
    paymentMethod: Keuangan['metodePembayaran'] = 'Transfer Bank BCA'
  ) => {
    const po = purchaseOrders.find(p => p.id === id);
    if (!po) return;

    // If status changes to 'Lunas', automatically record cashflow entry!
    const isNowPaid = status === 'Lunas' && po.statusInvoice !== 'Lunas';

    const updated = purchaseOrders.map(item => {
      if (item.id === id) {
        return {
          ...item,
          statusInvoice: status,
          // automatically assign invoice number if not existing
          nomorInvoice: item.nomorInvoice || `INV/MKN/2026/08/${Math.floor(100 + Math.random() * 900)}`
        };
      }
      return item;
    });
    savePurchaseOrders(updated);

    if (isNowPaid) {
      addKeuangan({
        tanggal: new Date().toISOString().split('T')[0],
        tipe: 'Pemasukan',
        kategori: 'Penjualan Pallet',
        keterangan: `Pembayaran Lunas Invoice ${po.nomorInvoice || 'Invoice'} dari ${po.pelanggan}`,
        nominal: po.totalHarga,
        referensiId: id,
        metodePembayaran: paymentMethod,
        pencatat: currentUser?.name || 'Staf Keuangan'
      });
    }
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

    // Link back to PO: If a Delivery Note (Surat Jalan) is issued, we might update PO status to 'Siap Kirim' or 'Selesai'
    updatePOStatus(sj.purchaseOrderId, 'Siap Kirim');
  };

  const updateSuratJalan = (id: string, sj: Partial<SuratJalan>) => {
    const updated = suratJalanList.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...sj
        };
      }
      return item;
    });
    saveSuratJalan(updated);
  };

  const deleteSuratJalan = (id: string) => {
    const updated = suratJalanList.filter(item => item.id !== id);
    saveSuratJalan(updated);
  };

  const updateSJStatus = (id: string, status: SuratJalan['statusPengiriman'], receiver?: string) => {
    const sj = suratJalanList.find(s => s.id === id);
    if (!sj) return;

    const updated = suratJalanList.map(item => {
      if (item.id === id) {
        return {
          ...item,
          statusPengiriman: status,
          penerima: receiver || item.penerima
        };
      }
      return item;
    });
    saveSuratJalan(updated);

    // If shipment is received by customer, mark PO as Selesai
    if (status === 'Diterima Pelanggan') {
      updatePOStatus(sj.purchaseOrderId, 'Selesai');
    }
  };

  // --- CRUD Keuangan ---
  const addKeuangan = (transaksi: Omit<Keuangan, 'id' | 'kodeTransaksi'>) => {
    const id = `tx-${Date.now()}`;
    const kodeTransaksi = `TX-2026-08-${Math.floor(100 + Math.random() * 900)}`;
    const newTx: Keuangan = {
      ...transaksi,
      id,
      kodeTransaksi
    };
    const updated = [newTx, ...keuanganList];
    saveKeuangan(updated);
  };

  const updateKeuangan = (id: string, transaksi: Partial<Keuangan>) => {
    const updated = keuanganList.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...transaksi
        };
      }
      return item;
    });
    saveKeuangan(updated);
  };

  const deleteKeuangan = (id: string) => {
    const updated = keuanganList.filter(item => item.id !== id);
    saveKeuangan(updated);
  };

  const resetDatabase = () => {
    localStorage.setItem('mk_materials', JSON.stringify([]));
    localStorage.setItem('mk_finish_goods', JSON.stringify([]));
    localStorage.setItem('mk_purchase_orders', JSON.stringify([]));
    localStorage.setItem('mk_surat_jalan', JSON.stringify([]));
    localStorage.setItem('mk_keuangan', JSON.stringify([]));
    localStorage.setItem('mk_customers', JSON.stringify([]));
    localStorage.setItem('mk_marketing', JSON.stringify([]));
    
    setMaterials([]);
    setFinishGoods([]);
    setPurchaseOrders([]);
    setSuratJalanList([]);
    setKeuanganList([]);
    setCustomers([]);
    setMarketingList([]);
  };

  return (
    <AppContext.Provider value={{
      materials,
      finishGoods,
      purchaseOrders,
      suratJalanList,
      keuanganList,
      currentUser,
      darkMode,
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
      customers,
      marketingList,
      addSuratJalan,
      updateSuratJalan,
      deleteSuratJalan,
      updateSJStatus,
      addKeuangan,
      updateKeuangan,
      deleteKeuangan,
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
