import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PurchaseOrder, FinishGood, Customer, MarketingCommission } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { motion } from 'motion/react';
import { 
  Plus, Search, FileText, CheckCircle, Clock, Trash2, Printer, Eye, 
  ShoppingCart, DollarSign, Ban, Users, Award, TrendingUp, Building, 
  Percent, Calendar, Edit2, ChevronRight, Check, AlertCircle, RefreshCw,
  Download, X
} from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';

interface FormItem {
  finishGoodId: string;
  namaItem: string;
  tipeIspm: 'Lokal' | 'Ekspor ISPM';
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
}

export const PurchaseOrderView: React.FC = () => {
  const { 
    purchaseOrders, 
    finishGoods, 
    addPurchaseOrder, 
    updatePurchaseOrder, 
    deletePurchaseOrder, 
    updatePOStatus, 
    updateInvoiceStatus, 
    currentUser,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    marketingList,
    addMarketing,
    updateMarketing,
    deleteMarketing
  } = useApp();

  // Sub-tab state: 'po' | 'customer' | 'marketing'
  const [activeTab, setActiveTab] = useState<'po' | 'customer' | 'marketing'>('po');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusPOFilter, setStatusPOFilter] = useState<string>('SEMUA');
  const [statusInvoiceFilter, setStatusInvoiceFilter] = useState<string>('SEMUA');

  // Modal forms triggers
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Detail/Invoice Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  // SPK Production Modal State
  const [showSPKModal, setShowSPKModal] = useState(false);
  const [viewingSPK, setViewingSPK] = useState<PurchaseOrder | null>(null);

  // Customer Modal States
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custNama, setCustNama] = useState('');
  const [custAlamat, setCustAlamat] = useState('');
  const [custTelepon, setCustTelepon] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPic, setCustPic] = useState('');

  // Marketing Modal States
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [editingMarketing, setEditingMarketing] = useState<MarketingCommission | null>(null);
  const [mktNama, setMktNama] = useState('');
  const [mktKomisi, setMktKomisi] = useState(2.0);
  const [mktTarget, setMktTarget] = useState(50000000);

  // Create PO Form fields
  const [nomorPO, setNomorPO] = useState('');
  const [nomorJO, setNomorJO] = useState('');
  const [pelanggan, setPelanggan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [catatan, setCatatan] = useState('');
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('');
  const [tipePajak, setTipePajak] = useState<'PPN' | 'Non PPN' | 'PPh' | 'PPN & PPh'>('Non PPN');
  const [namaMarketing, setNamaMarketing] = useState('');
  
  // Dynamic PO Items form state
  const [formItems, setFormItems] = useState<FormItem[]>([
    { finishGoodId: '', namaItem: '', tipeIspm: 'Lokal', jumlah: 100, hargaSatuan: 145000, subtotal: 14500000 }
  ]);

  // Payment Selection Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingPOId, setPayingPOId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Transfer Bank BCA' | 'Transfer Bank Mandiri' | 'Cash / Tunai'>('Transfer Bank BCA');

  // State for Purchase Order report printing by period
  const [showPOPrintModal, setShowPOPrintModal] = useState(false);
  const [poStartDate, setPoStartDate] = useState('2026-08-01');
  const [poEndDate, setPoEndDate] = useState('2026-08-31');

  // Permissions Check
  const canModifySales = currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN_SALES';
  const canModifyFinance = currentUser?.role === 'OWNER' || currentUser?.role === 'FINANCE';

  // Filters logic for PO
  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = po.nomorPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          po.pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (po.nomorJO && po.nomorJO.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (po.namaMarketing && po.namaMarketing.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (po.nomorInvoice && po.nomorInvoice.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPO = statusPOFilter === 'SEMUA' || po.statusPO === statusPOFilter;
    const matchesInvoice = statusInvoiceFilter === 'SEMUA' || po.statusInvoice === statusInvoiceFilter;

    return matchesSearch && matchesPO && matchesInvoice;
  });

  // Filter logic for Customer
  const filteredCustomers = customers.filter(c => 
    c.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.pic && c.pic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAddModal = () => {
    setEditingId(null);
    setNomorPO('');
    setNomorJO('');
    setPelanggan('');
    setTanggal(new Date().toISOString().split('T')[0]);
    setCatatan('');
    setTipePajak('Non PPN');
    setNamaMarketing('');
    
    // Default 1 item with empty and 0 values
    setFormItems([
      { finishGoodId: '', namaItem: '', tipeIspm: 'Lokal', jumlah: 0, hargaSatuan: 0, subtotal: 0 }
    ]);

    setTanggalJatuhTempo('');
    setShowFormModal(true);
  };

  // Open Edit PO Modal
  const handleOpenEditPOModal = (po: PurchaseOrder) => {
    setEditingId(po.id);
    setNomorPO(po.nomorPO);
    setNomorJO(po.nomorJO || `JO/MKN/2026/08/${Math.floor(100 + Math.random() * 900)}`);
    setPelanggan(po.pelanggan);
    setTanggal(po.tanggal);
    setCatatan(po.catatan || '');
    setTanggalJatuhTempo(po.tanggalJatuhTempo || '');
    setTipePajak(po.tipePajak || 'Non PPN');
    setNamaMarketing(po.namaMarketing || '');
    
    // Map existing items
    const mappedItems = po.item.map(it => ({
      finishGoodId: it.finishGoodId || '',
      namaItem: it.namaPallet,
      tipeIspm: it.tipeIspm || 'Lokal',
      jumlah: it.jumlah,
      hargaSatuan: it.hargaSatuan,
      subtotal: it.subtotal
    }));
    setFormItems(mappedItems);
    setShowFormModal(true);
  };

  // Dynamic Item Form Row Handlers
  const handleAddItemRow = () => {
    const template = finishGoods[0];
    setFormItems([
      ...formItems,
      {
        finishGoodId: template ? template.id : '',
        namaItem: template ? template.nama : '',
        tipeIspm: 'Lokal',
        jumlah: 50,
        hargaSatuan: template ? template.hargaJual : 145000,
        subtotal: (template ? template.hargaJual : 145000) * 50
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (formItems.length === 1) return; // keep at least 1
    const updated = formItems.filter((_, idx) => idx !== index);
    setFormItems(updated);
  };

  const handleItemFieldChange = (index: number, field: keyof FormItem, value: any) => {
    const updated = formItems.map((item, idx) => {
      if (idx === index) {
        const newItem = { ...item, [field]: value };
        
        // Auto-fill template values when finished good template is changed
        if (field === 'finishGoodId' && value) {
          const matchedGood = finishGoods.find(g => g.id === value);
          if (matchedGood) {
            newItem.namaItem = matchedGood.nama;
            newItem.hargaSatuan = matchedGood.hargaJual;
          }
        }
        
        // Compute subtotal on qty or price change
        if (field === 'jumlah' || field === 'hargaSatuan' || field === 'finishGoodId') {
          newItem.subtotal = newItem.jumlah * newItem.hargaSatuan;
        }
        return newItem;
      }
      return item;
    });
    setFormItems(updated);
  };

  // Tax calculations
  const calculateFormTotals = () => {
    const subtotal = formItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    let ppn = 0;
    let pph = 0;

    if (tipePajak === 'PPN' || tipePajak === 'PPN & PPh') {
      ppn = Math.round(subtotal * 0.11);
    }
    if (tipePajak === 'PPh' || tipePajak === 'PPN & PPh') {
      pph = Math.round(subtotal * 0.02);
    }

    const total = subtotal + ppn - pph;
    return { subtotal, ppn, pph, total };
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formItems.some(it => !it.namaItem.trim() || it.jumlah <= 0)) {
      alert('Mohon lengkapi seluruh kolom item pekerjaan dengan benar.');
      return;
    }

    const { subtotal, ppn, pph, total } = calculateFormTotals();

    const itemsToSave = formItems.map(it => ({
      finishGoodId: it.finishGoodId || undefined,
      namaPallet: it.namaItem,
      tipeIspm: it.tipeIspm,
      jumlah: it.jumlah,
      hargaSatuan: it.hargaSatuan,
      subtotal: it.subtotal
    }));

    if (editingId) {
      updatePurchaseOrder(editingId, {
        nomorPO,
        nomorJO,
        pelanggan,
        tanggal,
        item: itemsToSave,
        subtotalHarga: subtotal,
        tipePajak,
        ppnNominal: ppn,
        pphNominal: pph,
        totalHarga: total,
        namaMarketing,
        tanggalJatuhTempo,
        catatan
      });
    } else {
      addPurchaseOrder({
        nomorPO,
        nomorJO,
        nomorInvoice: '',
        tanggal,
        pelanggan,
        item: itemsToSave,
        subtotalHarga: subtotal,
        tipePajak,
        ppnNominal: ppn,
        pphNominal: pph,
        totalHarga: total,
        namaMarketing,
        statusPO: 'Diterima',
        statusInvoice: 'Belum Terbit',
        tanggalJatuhTempo,
        catatan
      });
    }

    setShowFormModal(false);
  };

  const handleOpenPaymentModal = (poId: string) => {
    setPayingPOId(poId);
    setPaymentMethod('Transfer Bank BCA');
    setShowPaymentModal(true);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    updateInvoiceStatus(payingPOId, 'Lunas', paymentMethod);
    setShowPaymentModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data PO ini?')) {
      deletePurchaseOrder(id);
    }
  };

  const handleGenerateInvoice = (id: string) => {
    const invNum = `INV/MKN/2026/08/${Math.floor(100 + Math.random() * 900)}`;
    updatePurchaseOrder(id, {
      nomorInvoice: invNum,
      statusInvoice: 'Belum Bayar'
    });
  };

  // Customer Actions Helpers
  const handleOpenAddCustModal = () => {
    setEditingCustomer(null);
    setCustNama('');
    setCustAlamat('');
    setCustTelepon('');
    setCustEmail('');
    setCustPic('');
    setShowCustomerModal(true);
  };

  const handleOpenEditCustModal = (c: Customer) => {
    setEditingCustomer(c);
    setCustNama(c.nama);
    setCustAlamat(c.alamat);
    setCustTelepon(c.telepon);
    setCustEmail(c.email || '');
    setCustPic(c.pic || '');
    setShowCustomerModal(true);
  };

  const handleCustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custNama.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        nama: custNama,
        alamat: custAlamat,
        telepon: custTelepon,
        email: custEmail,
        pic: custPic
      });
    } else {
      addCustomer({
        nama: custNama,
        alamat: custAlamat,
        telepon: custTelepon,
        email: custEmail,
        pic: custPic
      });
    }
    setShowCustomerModal(false);
  };

  const handleCustDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pelanggan ini dari database?')) {
      deleteCustomer(id);
    }
  };

  // Marketing Actions Helpers
  const handleOpenAddMktModal = () => {
    setEditingMarketing(null);
    setMktNama('');
    setMktKomisi(0);
    setMktTarget(0);
    setShowMarketingModal(true);
  };

  const handleOpenEditMktModal = (m: MarketingCommission) => {
    setEditingMarketing(m);
    setMktNama(m.namaMarketing);
    setMktKomisi(m.persentaseKomisi);
    setMktTarget(m.targetOmset || 50000000);
    setShowMarketingModal(true);
  };

  const handleMktSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mktNama.trim()) return;

    if (editingMarketing) {
      updateMarketing(editingMarketing.id, {
        namaMarketing: mktNama,
        persentaseKomisi: mktKomisi,
        targetOmset: mktTarget
      });
    } else {
      addMarketing({
        namaMarketing: mktNama,
        persentaseKomisi: mktKomisi,
        targetOmset: mktTarget
      });
    }
    setShowMarketingModal(false);
  };

  const handleMktDelete = (id: string) => {
    if (confirm('Hapus staf marketing ini dari database komisi?')) {
      deleteMarketing(id);
    }
  };

  // Compute dynamic performance per marketing
  const getMarketingMetrics = (nama: string) => {
    const poStaf = purchaseOrders.filter(p => 
      p.namaMarketing?.toLowerCase() === nama.toLowerCase() && 
      p.statusPO !== 'Dibatalkan'
    );
    const omset = poStaf.reduce((sum, curr) => sum + curr.totalHarga, 0);
    const mkt = marketingList.find(m => m.namaMarketing.toLowerCase() === nama.toLowerCase());
    const rate = mkt ? mkt.persentaseKomisi : 2.0;
    const target = mkt?.targetOmset || 50000000;
    const komisi = Math.round(omset * (rate / 100));
    const achievementPercent = Math.min(100, Math.round((omset / target) * 100));

    return { omset, komisi, target, achievementPercent, count: poStaf.length };
  };

  const getStatusPOBadge = (status: PurchaseOrder['statusPO']) => {
    switch (status) {
      case 'Diterima': return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
      case 'Diproduksi': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
      case 'Siap Kirim': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400';
      case 'Selesai': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'Dibatalkan': return 'bg-red-100 text-red-850 dark:bg-red-950/40 dark:text-red-400';
    }
  };

  const getStatusInvoiceBadge = (status: PurchaseOrder['statusInvoice']) => {
    switch (status) {
      case 'Belum Terbit': return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
      case 'Belum Bayar': return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';
      case 'Lunas': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
    }
  };

  const handleExportExcelAllPOs = () => {
    exportToExcel<PurchaseOrder>(
      purchaseOrders,
      ['ID PO', 'Nomor PO', 'Nomor Invoice', 'Tanggal', 'Pelanggan', 'Sales Marketing', 'Tipe Pajak', 'Subtotal', 'PPN', 'PPh', 'Total Harga', 'Status PO', 'Status Invoice', 'Jatuh Tempo'],
      (po) => [
        po.id,
        po.nomorPO,
        po.nomorInvoice || '-',
        po.tanggal,
        po.pelanggan,
        po.namaMarketing || '-',
        po.tipePajak || 'Non PPN',
        po.subtotalHarga || po.totalHarga,
        po.ppnNominal || 0,
        po.pphNominal || 0,
        po.totalHarga,
        po.statusPO,
        po.statusInvoice,
        po.tanggalJatuhTempo || '-'
      ],
      `Database_Purchase_Orders`
    );
  };

  return (
    <div id="purchase-order-view" className="p-4 md:p-6 space-y-6">
      
      {/* Tab Switcher */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-850">
        <button
          onClick={() => { setActiveTab('po'); setSearchTerm(''); }}
          className={`px-5 py-3 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'po' 
              ? 'border-red-600 text-red-600' 
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          Manajemen PO & Invoice
        </button>
        <button
          onClick={() => { setActiveTab('customer'); setSearchTerm(''); }}
          className={`px-5 py-3 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'customer' 
              ? 'border-red-600 text-red-600' 
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Building className="h-4 w-4" />
          Database Customer
        </button>
        <button
          onClick={() => { setActiveTab('marketing'); setSearchTerm(''); }}
          className={`px-5 py-3 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'marketing' 
              ? 'border-red-600 text-red-600' 
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Users className="h-4 w-4" />
          Performa Marketing & Penjualan
        </button>
      </div>

      {activeTab === 'po' && (
        <>
          {/* Header Area */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Manajemen Purchase Order & Invoice</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Kelola pesanan pelanggan dari hulu manufaktur hingga penagihan invoice lunas.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-excel-all-po"
                onClick={handleExportExcelAllPOs}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer font-sans"
              >
                <Download className="h-4.5 w-4.5" />
                Download Excel PO
              </button>
              <button
                id="btn-print-po-pdf"
                onClick={() => setShowPOPrintModal(true)}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer font-sans"
              >
                <Printer className="h-4.5 w-4.5" />
                Cetak PDF PO
              </button>
              {canModifySales && (
                <button
                  id="btn-tambah-po"
                  onClick={handleOpenAddModal}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer font-sans dark:bg-zinc-800 dark:hover:bg-zinc-700"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Buat PO Baru
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
                id="search-po-input"
                type="text"
                placeholder="Cari PO, JO, Invoice, Sales, Pelanggan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>

            {/* Multi Status Dropdowns */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* PO Status Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] font-bold text-zinc-400 uppercase hidden lg:inline">Status PO</span>
                <select
                  value={statusPOFilter}
                  onChange={(e) => setStatusPOFilter(e.target.value)}
                  className="block w-full sm:w-auto px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
                >
                  <option value="SEMUA">Semua Status PO</option>
                  <option value="Diterima">Diterima</option>
                  <option value="Diproduksi">Diproduksi</option>
                  <option value="Siap Kirim">Siap Kirim</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              {/* Invoice Status Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] font-bold text-zinc-400 uppercase hidden lg:inline">Invoice</span>
                <select
                  value={statusInvoiceFilter}
                  onChange={(e) => setStatusInvoiceFilter(e.target.value)}
                  className="block w-full sm:w-auto px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
                >
                  <option value="SEMUA">Semua Invoice</option>
                  <option value="Belum Terbit">Belum Terbit</option>
                  <option value="Belum Bayar">Belum Bayar</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>
            </div>
          </div>

          {/* PO Master Data Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <th className="p-4">Tanggal / No JO</th>
                    <th className="p-4">Nomor PO</th>
                    <th className="p-4">Pelanggan & Sales</th>
                    <th className="p-4">Detail Pekerjaan</th>
                    <th className="p-4 text-right">Nilai Tagihan</th>
                    <th className="p-4 text-center">Status PO</th>
                    <th className="p-4 text-center">Status Tagihan</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-semibold text-zinc-700 dark:text-zinc-300">
                  {filteredPOs.map((po) => (
                    <tr key={po.id} id={`row-po-${po.id}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-zinc-400 dark:text-zinc-500 font-bold block">{po.tanggal}</span>
                        <span className="text-[10px] bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 font-bold rounded px-1.5 py-0.5 mt-1 inline-block font-mono">
                          JO: {po.nomorJO || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-red-750 dark:text-red-400 whitespace-nowrap">{po.nomorPO}</td>
                      <td className="p-4">
                        <p className="font-extrabold text-zinc-900 dark:text-zinc-100">{po.pelanggan}</p>
                        <p className="text-[10px] text-zinc-450 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3" /> Marketing: <span className="font-bold">{po.namaMarketing || '-'}</span>
                        </p>
                      </td>
                      <td className="p-4 max-w-xs">
                        {po.item.map((it, idx) => (
                          <div key={idx} className="text-xs mb-1 last:mb-0">
                            <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{it.namaPallet}</span>
                            <span className="text-red-600 font-bold ml-1">x{it.jumlah} pcs</span>
                            <span className="text-[10px] text-zinc-400 ml-1.5 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-bold">
                              {it.tipeIspm || 'Lokal'}
                            </span>
                          </div>
                        ))}
                      </td>
                      <td className="p-4 text-right font-black text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                        <p>Rp {po.totalHarga.toLocaleString('id-ID')}</p>
                        {po.tipePajak && po.tipePajak !== 'Non PPN' && (
                          <span className="text-[9px] text-emerald-600 block mt-0.5 font-bold">({po.tipePajak})</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${getStatusPOBadge(po.statusPO)}`}>
                          {po.statusPO}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${getStatusInvoiceBadge(po.statusInvoice)}`}>
                          {po.statusInvoice}
                        </span>
                        {po.nomorInvoice && (
                          <span className="text-[9px] text-zinc-400 font-mono block mt-1">{po.nomorInvoice}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* View & Print Detail Invoice Button */}
                          <button
                            onClick={() => {
                              setViewingPO(po);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-red-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                            title="Detail & Invoice"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>

                          {/* Print SPK Produksi Button */}
                          <button
                            onClick={() => {
                              setViewingSPK(po);
                              setShowSPKModal(true);
                            }}
                            className="p-1.5 text-red-650 hover:text-red-850 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                            title="Cetak SPK Produksi"
                          >
                            <Printer className="h-4.5 w-4.5" />
                          </button>

                          {/* Edit PO */}
                          {canModifySales && (
                            <button
                              onClick={() => handleOpenEditPOModal(po)}
                              className="p-1.5 text-zinc-500 hover:text-amber-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                              title="Edit PO & Item"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}

                          {/* --- ROLE ACTION: SALES UPDATE STATUS PO --- */}
                          {canModifySales && po.statusPO !== 'Selesai' && po.statusPO !== 'Dibatalkan' && (
                            <select
                              value={po.statusPO}
                              onChange={(e) => updatePOStatus(po.id, e.target.value as PurchaseOrder['statusPO'])}
                              className="px-1.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-bold text-zinc-700 dark:text-zinc-300"
                            >
                              <option value="Diterima">Set: Diterima</option>
                              <option value="Diproduksi">Set: Diproduksi</option>
                              <option value="Siap Kirim">Set: Siap Kirim</option>
                              <option value="Selesai">Set: Selesai</option>
                              <option value="Dibatalkan">Set: Dibatalkan</option>
                            </select>
                          )}

                          {/* --- ROLE ACTION: FINANCE ACTION (Generate Invoice / Settle Lunas) --- */}
                          {canModifyFinance && (
                            <>
                              {po.statusInvoice === 'Belum Terbit' ? (
                                <button
                                  id={`btn-issue-inv-${po.id}`}
                                  onClick={() => handleGenerateInvoice(po.id)}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded cursor-pointer transition-all"
                                  title="Terbitkan Invoice"
                                >
                                  Terbit Inv
                                </button>
                              ) : po.statusInvoice === 'Belum Bayar' ? (
                                <button
                                  id={`btn-pay-inv-${po.id}`}
                                  onClick={() => handleOpenPaymentModal(po.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded flex items-center gap-0.5 cursor-pointer transition-all"
                                  title="Tandai Lunas"
                                >
                                  <DollarSign className="h-3 w-3" /> Lunas
                                </button>
                              ) : null}
                            </>
                          )}

                          {/* Delete PO */}
                          {canModifySales && (
                            <button
                              onClick={() => handleDelete(po.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-500 rounded-lg cursor-pointer"
                              title="Hapus PO"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredPOs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-zinc-400 dark:text-zinc-500">
                        Tidak ada transaksi Purchase Order yang ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* activeTab === 'customer' DATABASE CUSTOMER */}
      {activeTab === 'customer' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Database Customer CV. Mustika Kayu</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Kelola data seluruh mitra usaha, pembeli resmi, dan rekam alamat pengiriman kargo.</p>
            </div>
            {canModifySales && (
              <button
                onClick={handleOpenAddCustModal}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
                Tambah Customer Baru
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Cari nama perusahaan, alamat, atau PIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Customer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCustomers.map(cust => (
              <div key={cust.id} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-red-600 shrink-0" />
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 leading-tight">{cust.nama}</h3>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-bold text-zinc-400 uppercase tracking-wide text-[9px] block">Alamat Pengiriman:</span>
                    {cust.alamat}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-100 dark:border-zinc-850">
                    <div>
                      <span className="text-[9px] text-zinc-400 block font-bold uppercase">PIC Kontak:</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">{cust.pic || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 block font-bold uppercase">Telepon:</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">{cust.telepon}</span>
                    </div>
                  </div>
                  {cust.email && (
                    <p className="text-[10px] text-zinc-400 font-mono">Email: {cust.email}</p>
                  )}
                </div>

                {canModifySales && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEditCustModal(cust)}
                      className="p-1.5 text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      title="Edit Customer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCustDelete(cust.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-650 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      title="Hapus Customer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {filteredCustomers.length === 0 && (
              <div className="col-span-2 text-center py-12 text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 border rounded-xl">
                Tidak ada data customer yang ditemukan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* activeTab === 'marketing' MARKETING COMMISSION & SALES GRAPH */}
      {activeTab === 'marketing' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Kinerja & Omset Komisi Marketing</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Kelola tarif komisi, target penjualan, kalkulasi turnover bersih, dan grafik analitis kontribusi marketing.</p>
            </div>
            {canModifySales && (
              <button
                onClick={handleOpenAddMktModal}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
                Tambah Tim Marketing
              </button>
            )}
          </div>

          {/* Performance Summary Cards & D3/SVG Graph Block */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* SVG Interactive Chart Card */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-5 w-5 text-red-600" />
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">Grafik Penjualan Staf Marketing</h3>
                  </div>
                  <span className="text-[10px] bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-extrabold px-2 py-0.5 rounded-full">Live Dashboard</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Visualisasi kontribusi omset bruto (IDR) per staf marketing berdasarkan seluruh PO yang diterima.</p>
              </div>

              {/* Custom SVG Bar Chart */}
              <div className="relative h-64 w-full flex items-end justify-around border-b border-l border-zinc-200 dark:border-zinc-800 pb-2 px-4">
                {marketingList.map((m, idx) => {
                  const metrics = getMarketingMetrics(m.namaMarketing);
                  // Find max omset to scale heights proportionately
                  const maxOmset = Math.max(10000000, ...marketingList.map(item => getMarketingMetrics(item.namaMarketing).omset));
                  const percentHeight = Math.max(10, Math.round((metrics.omset / maxOmset) * 100));

                  return (
                    <div key={m.id} className="flex flex-col items-center group w-20 relative">
                      {/* Tooltip */}
                      <div className="absolute -top-12 bg-zinc-900 text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center shadow z-10 font-bold">
                        Rp {metrics.omset.toLocaleString('id-ID')}
                      </div>

                      {/* Animated Bar using standard motion div */}
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${percentHeight}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                        className="w-12 bg-gradient-to-t from-red-700 to-red-500 hover:to-red-400 rounded-t-md shadow-md cursor-pointer"
                      />

                      {/* Name tag */}
                      <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mt-2 truncate w-full text-center">
                        {m.namaMarketing}
                      </span>
                      <span className="text-[8px] text-zinc-400 font-mono">
                        {metrics.count} PO
                      </span>
                    </div>
                  );
                })}

                {marketingList.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400">
                    Belum ada data marketing atau omset penjualan.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Summary Card */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Award className="h-5 w-5 text-red-650" />
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">Kalkulator Pengeluaran Komisi</h3>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                  Sistem otomatis CV. Mustika menghitung komisi berdasarkan omset terkirim (tidak termasuk PO yang dibatalkan).
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-150 dark:border-zinc-850">
                    <span className="text-[10px] text-zinc-400 font-extrabold uppercase block">TOTAL OMSET DARI MARKETING:</span>
                    <span className="text-lg font-black text-zinc-800 dark:text-zinc-100">
                      Rp {purchaseOrders.filter(p => p.statusPO !== 'Dibatalkan' && p.namaMarketing).reduce((sum, po) => sum + po.totalHarga, 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-3 bg-red-50/50 dark:bg-red-950/10 rounded-lg border border-red-100 dark:border-red-950/40">
                    <span className="text-[10px] text-red-500 font-extrabold uppercase block">ESTIMASI TOTAL KOMISI DIKELUARKAN:</span>
                    <span className="text-lg font-black text-red-750 dark:text-red-400">
                      Rp {marketingList.reduce((sum, m) => sum + getMarketingMetrics(m.namaMarketing).komisi, 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-zinc-400 italic pt-3 border-t border-zinc-100 dark:border-zinc-850 mt-4">
                * Parameter tarif komisi dan target omset bulanan dapat dikonfigurasi melalui panel kontrol di bawah ini.
              </div>
            </div>

          </div>

          {/* Marketing Table List */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/60 flex justify-between items-center">
              <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Konfigurasi Target & Estimasi Komisi</span>
              <span className="text-[10px] text-zinc-400">Total: {marketingList.length} Staf Marketing</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold text-[10px] border-b border-zinc-200/50 dark:border-zinc-850">
                    <th className="p-4">Staf Marketing</th>
                    <th className="p-4 text-center">Tarif Komisi (%)</th>
                    <th className="p-4 text-right">Target Omset Bulanan</th>
                    <th className="p-4 text-right">Omset Riil Tercipta</th>
                    <th className="p-4 text-right">Kalkulasi Komisi</th>
                    <th className="p-4 text-center">Pencapaian Target</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-semibold text-zinc-700 dark:text-zinc-350">
                  {marketingList.map(m => {
                    const metrics = getMarketingMetrics(m.namaMarketing);
                    const meetsTarget = metrics.omset >= metrics.target;

                    return (
                      <tr key={m.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-zinc-400" />
                            <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{m.namaMarketing}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-mono text-zinc-800 dark:text-zinc-200">{m.persentaseKomisi}%</td>
                        <td className="p-4 text-right font-mono">Rp {metrics.target.toLocaleString('id-ID')}</td>
                        <td className="p-4 text-right font-mono font-bold text-zinc-900 dark:text-zinc-50">Rp {metrics.omset.toLocaleString('id-ID')}</td>
                        <td className="p-4 text-right font-mono font-black text-red-650 dark:text-red-400">Rp {metrics.komisi.toLocaleString('id-ID')}</td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full ${
                              meetsTarget 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}>
                              {meetsTarget ? 'Target Tercapai ✓' : `${metrics.achievementPercent}%`}
                            </span>
                            {/* Simple Progress Bar */}
                            <div className="w-24 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-red-600 h-full rounded-full" style={{ width: `${metrics.achievementPercent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditMktModal(m)}
                              className="p-1 text-zinc-400 hover:text-amber-600 dark:hover:text-amber-450 cursor-pointer"
                              title="Edit Target & Komisi"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleMktDelete(m.id)}
                              className="p-1 text-zinc-400 hover:text-red-650 cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {marketingList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-zinc-400 dark:text-zinc-500">
                        Belum ada staf marketing terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT PURCHASE ORDER FORM MODAL --- */}
      {showFormModal && (
        <div id="po-form-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                {editingId ? 'Edit Purchase Order' : 'Buat Purchase Order Pelanggan'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer text-xl">&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              
              {/* No PO, No JO, Date Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">NOMOR PO RESMI</label>
                  <input
                    type="text"
                    required
                    value={nomorPO}
                    onChange={(e) => setNomorPO(e.target.value)}
                    className="block w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">NOMOR JO (JOB ORDER)</label>
                  <input
                    type="text"
                    required
                    value={nomorJO}
                    onChange={(e) => setNomorJO(e.target.value)}
                    className="block w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">TANGGAL MASUK</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="block w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Customer Selection & Auto Customer Insertion support */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">PELANGGAN (AUTO-SAVE JIKA BARU)</label>
                  <input
                    type="text"
                    required
                    list="customer-datalist"
                    placeholder="Ketik / Pilih nama perusahaan..."
                    value={pelanggan}
                    onChange={(e) => setPelanggan(e.target.value)}
                    className="block w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <datalist id="customer-datalist">
                    {customers.map(c => (
                      <option key={c.id} value={custNama}>{c.nama}</option>
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">NAMA MARKETING</label>
                  <input
                    type="text"
                    required
                    list="marketing-datalist"
                    placeholder="Nama staf marketing..."
                    value={namaMarketing}
                    onChange={(e) => setNamaMarketing(e.target.value)}
                    className="block w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <datalist id="marketing-datalist">
                    {marketingList.map(m => (
                      <option key={m.id} value={m.namaMarketing} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* DYNAMIC ITEM PEKERJAAN LIST */}
              <div className="p-4 bg-zinc-50/70 dark:bg-zinc-950 rounded-xl border border-zinc-200/55 dark:border-zinc-850 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-zinc-400 uppercase">Daftar Item Pekerjaan (Dapat Diedit & Ditambah)</p>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[10px] font-bold text-red-650 hover:text-red-800 flex items-center gap-0.5 cursor-pointer bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded"
                  >
                    <Plus className="h-3 w-3" /> Tambah Item
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {formItems.map((formItem, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800">
                      
                      {/* Select Template Optional */}
                      <div className="col-span-4 space-y-1">
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase">NAMA ITEM / TEMPLATE</label>
                        <select
                          value={formItem.finishGoodId}
                          onChange={(e) => handleItemFieldChange(index, 'finishGoodId', e.target.value)}
                          className="block w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-[11px]"
                        >
                          <option value="">-- Ketik Bebas / Pilih Template --</option>
                          {finishGoods.map(fg => (
                            <option key={fg.id} value={fg.id}>{fg.nama}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          required
                          placeholder="Nama item pekerjaan..."
                          value={formItem.namaItem}
                          onChange={(e) => handleItemFieldChange(index, 'namaItem', e.target.value)}
                          className="block w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-[11px] font-bold mt-1"
                        />
                      </div>

                      {/* Dropdown Lokal / ISPM */}
                      <div className="col-span-2.5 space-y-1">
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase">TIPIFIKASI</label>
                        <select
                          value={formItem.tipeIspm}
                          onChange={(e) => handleItemFieldChange(index, 'tipeIspm', e.target.value)}
                          className="block w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-[11px] font-bold"
                        >
                          <option value="Lokal">Lokal</option>
                          <option value="Ekspor ISPM">Ekspor ISPM</option>
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2 space-y-1">
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase">QTY (PCS)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formItem.jumlah}
                          onChange={(e) => handleItemFieldChange(index, 'jumlah', Math.max(1, Number(e.target.value)))}
                          className="block w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-[11px] font-bold"
                        />
                      </div>

                      {/* Harga Satuan */}
                      <div className="col-span-2.5 space-y-1">
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase">HARGA (RP)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formItem.hargaSatuan}
                          onChange={(e) => handleItemFieldChange(index, 'hargaSatuan', Math.max(0, Number(e.target.value)))}
                          className="block w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-[11px] font-bold"
                        />
                      </div>

                      {/* Delete row */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          disabled={formItems.length === 1}
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-1.5 text-zinc-400 hover:text-red-650 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Due Date & Tax Selection */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="space-y-1 col-span-1">
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">JATUH TEMPO BAYAR</label>
                  <input
                    type="date"
                    required
                    value={tanggalJatuhTempo}
                    onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                    className="block w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">TIPE PERPAJAKAN</label>
                  <select
                    value={tipePajak}
                    onChange={(e) => setTipePajak(e.target.value as any)}
                    className="block w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                  >
                    <option value="Non PPN">Non PPN (Nett)</option>
                    <option value="PPN">PPN (11%)</option>
                    <option value="PPh">PPh Saja (2% Pot.)</option>
                    <option value="PPN & PPh">PPN (11%) & PPh (2% Pot.)</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">CATATAN KHUSUS</label>
                  <input
                    type="text"
                    placeholder="e.g., Kirim bertahap"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="block w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Live Price Calculator Display */}
              <div className="p-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-1 text-right text-xs">
                {(() => {
                  const { subtotal, ppn, pph, total } = calculateFormTotals();
                  return (
                    <>
                      <p className="text-zinc-500 font-bold">Subtotal Item: Rp {subtotal.toLocaleString('id-ID')}</p>
                      {ppn > 0 && <p className="text-emerald-600 font-bold">PPN (11%): +Rp {ppn.toLocaleString('id-ID')}</p>}
                      {pph > 0 && <p className="text-red-500 font-bold">PPh (2% Potongan): -Rp {pph.toLocaleString('id-ID')}</p>}
                      <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 pt-1 border-t border-zinc-200 dark:border-zinc-800 mt-1">
                        Total Pembayaran PO: Rp {total.toLocaleString('id-ID')}
                      </p>
                    </>
                  );
                })()}
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Simpan Pesanan PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PAYMENT BANK SELECTOR MODAL --- */}
      {showPaymentModal && (
        <div id="payment-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">Settle / Lunasi Tagihan</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-5 space-y-4">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Konfirmasi pelunasan tagihan invoice. Dana yang masuk akan langsung tercatat otomatis di Buku Kas Besar Keuangan.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Metode Pembayaran Rekening</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="Transfer Bank BCA">Transfer Bank BCA (CV Mustika)</option>
                  <option value="Transfer Bank Mandiri">Transfer Bank Mandiri (CV Mustika)</option>
                  <option value="Cash / Tunai">Tunai / Cash Langsung</option>
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Settle Lunas✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CUSTOMER ENTRY FORM MODAL --- */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                {editingCustomer ? 'Edit Data Mitra Customer' : 'Tambah Customer Baru'}
              </h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer text-xl">&times;</button>
            </div>

            <form onSubmit={handleCustSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Nama Perusahaan / Customer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., PT Unilever Indonesia Tbk"
                  value={custNama}
                  onChange={(e) => setCustNama(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Alamat Kantor / Pengiriman</label>
                <textarea
                  required
                  placeholder="Kawasan Industri, Blok, Jalan utama..."
                  value={custAlamat}
                  onChange={(e) => setCustAlamat(e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">Nomor Telepon</label>
                  <input
                    type="text"
                    required
                    placeholder="021-xxx"
                    value={custTelepon}
                    onChange={(e) => setCustTelepon(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">PIC Hubungan</label>
                  <input
                    type="text"
                    placeholder="Nama Penanggung Jawab"
                    value={custPic}
                    onChange={(e) => setCustPic(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Alamat Email Resmi (Opsional)</label>
                <input
                  type="email"
                  placeholder="email@perusahaan.com"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 rounded-lg text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Simpan Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MARKETING EDIT FORM MODAL --- */}
      {showMarketingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                {editingMarketing ? 'Edit Parameter Staf Marketing' : 'Tambah Staf Marketing Baru'}
              </h3>
              <button onClick={() => setShowMarketingModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer text-xl">&times;</button>
            </div>

            <form onSubmit={handleMktSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Nama Lengkap Marketing</label>
                <input
                  type="text"
                  required
                  placeholder="Ketik nama lengkap..."
                  value={mktNama}
                  onChange={(e) => setMktNama(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Tarif Komisi Penjualan (%)</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={mktKomisi}
                  onChange={(e) => setMktKomisi(Number(e.target.value))}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase">Target Omset Bulanan (Rp)</label>
                <input
                  type="number"
                  required
                  min="1000000"
                  step="1000000"
                  value={mktTarget}
                  onChange={(e) => setMktTarget(Number(e.target.value))}
                  className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMarketingModal(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 rounded-lg text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- INVOICE VIEW DETAIL MODAL --- */}
      {showDetailModal && viewingPO && (
        <div id="invoice-detail-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-3xl rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 relative">
            
            {/* Floating Close Button X (Non-Printable) */}
            <button 
              onClick={() => setShowDetailModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer print:hidden z-10"
              title="Tutup Modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header Controls (Non-Printable) */}
            <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-red-600 animate-pulse" />
                <div>
                  <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 block">Invoice Tagihan Resmi</span>
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
                    if(confirm("Apakah Anda yakin ingin membatalkan proses cetak dokumen ini?")) {
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

            {/* Invoice Printable Area */}
            <div id="print-area" className="p-8 md:p-12 bg-white text-black font-sans min-h-[600px]">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-zinc-200 pb-6 mb-8">
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
                  <h2 className="text-2xl font-black text-zinc-800 uppercase tracking-tight">INVOICE</h2>
                  <p className="text-xs font-mono font-bold text-red-750 mt-1">{viewingPO.nomorInvoice || 'DRAF - INVOICE BELUM TERBIT'}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Tanggal: {viewingPO.tanggal}</p>
                </div>
              </div>

              {/* Addresses Block */}
              <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
                <div>
                  <span className="block font-bold text-zinc-400 uppercase tracking-wider text-[9px] mb-1">DITAGIHKAN KEPADA:</span>
                  <p className="font-extrabold text-sm text-zinc-800">{viewingPO.pelanggan}</p>
                  <p className="text-zinc-500 mt-1">Gudang Logistik & Penerimaan Pembelian</p>
                  <p className="text-zinc-500 mt-0.5">Indonesia</p>
                  {viewingPO.nomorJO && (
                    <p className="text-zinc-900 mt-2 font-mono font-bold text-[10px]">No Job Order (JO): {viewingPO.nomorJO}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="block font-bold text-zinc-400 uppercase tracking-wider text-[9px] mb-1">METODE PEMBAYARAN:</span>
                  <p className="font-semibold text-zinc-700">Transfer Bank Utama Mandiri / BCA</p>
                  <p className="text-zinc-500 mt-0.5">No Rek Mandiri: 128-00-112233-4 (a.n CV. Mustika Kayu Nusantara)</p>
                  <p className="text-zinc-500 mt-0.5">No Rek BCA: 012-345-6789 (a.n CV. Mustika Kayu Nusantara)</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left border-collapse mb-8">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-200">
                    <th className="p-3 font-bold uppercase text-[10px]">Deskripsi Barang / Item Pekerjaan</th>
                    <th className="p-3 text-center font-bold uppercase text-[10px]">Sertifikasi ISPM</th>
                    <th className="p-3 text-right font-bold uppercase text-[10px]">Kuantitas</th>
                    <th className="p-3 text-right font-bold uppercase text-[10px]">Harga Satuan</th>
                    <th className="p-3 text-right font-bold uppercase text-[10px]">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {viewingPO.item.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3">
                        <p className="font-bold text-zinc-800">{item.namaPallet}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Sertifikasi oven, anti-rayap terlapisi penuh</p>
                      </td>
                      <td className="p-3 text-center text-zinc-600 font-bold">{item.tipeIspm || 'Lokal'}</td>
                      <td className="p-3 text-right font-bold">{item.jumlah} pcs</td>
                      <td className="p-3 text-right">Rp {item.hargaSatuan.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right font-bold">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                  
                  {/* Subtotal Neto, PPN, PPh breakdowns */}
                  <tr className="border-t border-zinc-300">
                    <td colSpan={3} className="p-2 text-right text-[10px] uppercase text-zinc-400 font-bold">Neto Sebelum Pajak:</td>
                    <td colSpan={2} className="p-2 text-right font-mono text-zinc-800 font-bold">
                      Rp {(viewingPO.subtotalHarga || viewingPO.item.reduce((acc, c) => acc + c.subtotal, 0)).toLocaleString('id-ID')}
                    </td>
                  </tr>

                  {viewingPO.ppnNominal && viewingPO.ppnNominal > 0 ? (
                    <tr>
                      <td colSpan={3} className="p-2 text-right text-[10px] uppercase text-zinc-400 font-bold">PPN (11%):</td>
                      <td colSpan={2} className="p-2 text-right font-mono text-emerald-600 font-bold">
                        +Rp {viewingPO.ppnNominal.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ) : null}

                  {viewingPO.pphNominal && viewingPO.pphNominal > 0 ? (
                    <tr>
                      <td colSpan={3} className="p-2 text-right text-[10px] uppercase text-zinc-400 font-bold">PPh (2% Potongan):</td>
                      <td colSpan={2} className="p-2 text-right font-mono text-red-500 font-bold">
                        -Rp {viewingPO.pphNominal.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ) : null}

                  <tr className="bg-zinc-50 font-bold border-t-2 border-zinc-300">
                    <td colSpan={3} className="p-3 text-right text-[10px] uppercase text-zinc-900 font-extrabold">Jumlah Total Tagihan:</td>
                    <td colSpan={2} className="p-3 text-right text-base text-red-800 font-extrabold font-mono">
                      Rp {viewingPO.totalHarga.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Footer Terms */}
              <div className="border-t border-dashed border-zinc-250 pt-6 text-[10px] text-zinc-500 leading-relaxed grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold uppercase text-[9px] text-zinc-400 mb-1">KETENTUAN PEMBAYARAN:</p>
                  <p>1. Invoice ini memiliki jatuh tempo pada tanggal: <span className="font-bold text-red-850">{viewingPO.tanggalJatuhTempo || '-'}</span>.</p>
                  <p>2. Mohon cantumkan nomor invoice pada berita transfer bank Anda.</p>
                  <p>3. Barang yang sudah dikirim dengan Surat Jalan resmi tidak dapat dibatalkan.</p>
                  {viewingPO.namaMarketing && (
                    <p className="mt-2 font-bold text-zinc-500">Staf Marketing Terkait: {viewingPO.namaMarketing}</p>
                  )}
                </div>
                <div className="text-center w-48 ml-auto">
                  <p className="font-sans">Hormat Kami,</p>
                  <div className="h-12"></div>
                  <p className="font-bold underline">Staf Keuangan</p>
                  <p className="text-[9px]">Bagian Finance & Kasir</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- SPK PRODUCTION VIEW DETAIL MODAL --- */}
      {showSPKModal && viewingSPK && (
        <div id="spk-detail-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-3xl rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 relative">
            
            {/* Floating Close Button X (Non-Printable) */}
            <button 
              onClick={() => setShowSPKModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer print:hidden z-10"
              title="Tutup Modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header Controls (Non-Printable) */}
            <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-red-600 animate-pulse" />
                <div>
                  <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 block">Surat Perintah Kerja (SPK) Produksi</span>
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">REVIEW SEBELUM CETAK</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-md"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Cetak SPK
                </button>
                <button
                  onClick={() => {
                    if(confirm("Apakah Anda yakin ingin membatalkan proses cetak SPK ini?")) {
                      setShowSPKModal(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-200 rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Batalkan Cetak
                </button>
                <button
                  onClick={() => setShowSPKModal(false)}
                  className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* SPK Printable Area */}
            <div id="spk-print-area" className="p-8 md:p-12 bg-white text-black font-sans min-h-[600px] border-4 border-double border-zinc-400">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-zinc-300 pb-4 mb-6">
                <div className="flex items-center gap-4">
                  <CompanyLogo size="md" className="h-12 w-12" />
                  <div>
                    <h1 className="font-extrabold text-lg tracking-tight text-red-750">CV. MUSTIKA KAYU NUSANTARA</h1>
                    <p className="text-[10px] text-zinc-600">DEPARTEMEN MANUFAKTUR & PRODUKSI PALLET KAYU</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-black text-zinc-800 tracking-tight">SURAT PERINTAH KERJA (SPK)</h2>
                  <p className="text-[11px] font-mono font-bold text-zinc-900 mt-1">No JO: {viewingSPK.nomorJO || 'JO/MKN/2026/08/991'}</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Referensi PO: {viewingSPK.nomorPO}</p>
                </div>
              </div>

              {/* SPK Meta Info */}
              <div className="grid grid-cols-2 gap-6 bg-zinc-50 p-4 rounded-lg border border-zinc-200 text-xs mb-6">
                <div className="space-y-1.5">
                  <p><span className="text-zinc-400 font-bold block uppercase text-[8px]">PELANGGAN / PEMBELI:</span> <strong className="text-sm">{viewingSPK.pelanggan}</strong></p>
                  <p><span className="text-zinc-400 font-bold block uppercase text-[8px]">TANGGAL WORK ORDER:</span> <strong>{viewingSPK.tanggal}</strong></p>
                </div>
                <div className="space-y-1.5">
                  <p><span className="text-zinc-400 font-bold block uppercase text-[8px]">STAF MARKETING PENGAWAS:</span> <strong>{viewingSPK.namaMarketing || 'Staf Marketing'}</strong></p>
                  <p><span className="text-zinc-400 font-bold block uppercase text-[8px]">BATAS WAKTU SELESAI (TARGET):</span> <strong className="text-red-700">{viewingSPK.tanggalJatuhTempo || '-'}</strong></p>
                </div>
              </div>

              {/* Items to Produce - FINANCIAL DETAILS HIDDEN ON PURPOSE */}
              <h3 className="font-bold text-xs text-zinc-800 uppercase tracking-wider mb-2">Item Pekerjaan yang Harus Diproduksi:</h3>
              <table className="w-full text-xs text-left border-collapse mb-8 border border-zinc-200">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-700 font-extrabold uppercase text-[9px]">
                    <th className="p-3 border-r border-zinc-200">Nama Produk Pallet / Deskripsi Pekerjaan</th>
                    <th className="p-3 text-center border-r border-zinc-200">Sertifikasi & Standar Kayu</th>
                    <th className="p-3 text-right font-black">Target Jumlah (PCS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-bold text-zinc-850">
                  {viewingSPK.item.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/40">
                      <td className="p-3 border-r border-zinc-200">
                        <p className="text-sm font-extrabold text-zinc-900">{item.namaPallet}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Proses perakitan kokoh, pelapis anti-rayap, paku presisi</p>
                      </td>
                      <td className="p-3 text-center border-r border-zinc-200">
                        <span className="px-2 py-0.5 bg-red-50 text-red-800 rounded font-mono text-[10px]">
                          {item.tipeIspm || 'Lokal'}
                        </span>
                      </td>
                      <td className="p-3 text-right text-lg font-black text-red-750">
                        {item.jumlah} pcs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Production Instructions */}
              <div className="border border-zinc-200 p-4 rounded-lg bg-zinc-50/50 text-xs mb-8 space-y-2">
                <p className="font-extrabold text-red-800 uppercase text-[9px] tracking-wider">INTRUKSI TEKNIS PRODUKSI PABRIK:</p>
                <ul className="list-disc pl-4 space-y-1 text-zinc-700">
                  <li>Wajib melakukan proses Heat Treatment (HT) & Fumigasi khusus jika item berstatus <strong>Ekspor ISPM</strong>.</li>
                  <li>Pastikan kelembapan (MC / Moisture Content) kayu berada pada rentang aman maksimal 18-20% sebelum perakitan.</li>
                  <li>Lakukan uji beban statis sampel secara acak sebelum pallet dipindahkan ke area gudang barang jadi.</li>
                  <li>Catatan khusus PO: <span className="font-bold underline">{viewingSPK.catatan || 'Tidak ada catatan tambahan.'}</span></li>
                </ul>
              </div>

              {/* SPK Signatures Grid */}
              <div className="grid grid-cols-3 gap-4 text-center text-xs pt-6 mt-12 border-t border-dashed border-zinc-300">
                <div>
                  <p className="text-zinc-500 font-bold">Disiapkan Oleh (Sales),</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">Staf Administrasi Sales</p>
                  <p className="text-[9px] text-zinc-400">CV. Mustika Kayu Nusantara</p>
                </div>
                <div>
                  <p className="text-zinc-500 font-bold">Disetujui Oleh (Pimpinan),</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">Kepala Pabrik / Produksi</p>
                  <p className="text-[9px] text-zinc-400">Otorisasi Manufaktur</p>
                </div>
                <div>
                  <p className="text-zinc-500 font-bold">Diterima Gudang (Logistik),</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">Kepala Logistik & Gudang</p>
                  <p className="text-[9px] text-zinc-400">Verifikasi Barang Masuk</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- PRINTABLE PO REPORT PERIOD MODAL --- */}
      {showPOPrintModal && (
        <div id="po-report-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 relative">
            
            {/* Floating Close Button X (Non-Printable) */}
            <button 
              onClick={() => setShowPOPrintModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer print:hidden z-10"
              title="Tutup Laporan"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header controls (Non-printable) */}
            <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden pr-12">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Laporan PO & Omset Periode</h3>
                  <span className="inline-block bg-yellow-100 text-yellow-850 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">REVIEW SEBELUM CETAK</span>
                </div>
              </div>

              {/* Period selection in modal header */}
              <div className="flex flex-wrap items-center gap-2 text-xs bg-zinc-150/50 dark:bg-zinc-800/30 p-2 rounded-xl">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500 font-extrabold text-[9px] uppercase">Mulai:</span>
                  <input 
                    type="date" 
                    value={poStartDate} 
                    onChange={(e) => setPoStartDate(e.target.value)} 
                    className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-50 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500 font-extrabold text-[9px] uppercase">Selesai:</span>
                  <input 
                    type="date" 
                    value={poEndDate} 
                    onChange={(e) => setPoEndDate(e.target.value)} 
                    className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-50 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    exportToExcel<PurchaseOrder>(
                      purchaseOrders.filter(t => {
                        let ok = true;
                        if (poStartDate) ok = ok && t.tanggal >= poStartDate;
                        if (poEndDate) ok = ok && t.tanggal <= poEndDate;
                        return ok;
                      }),
                      ['ID PO', 'Nomor PO', 'Nomor Invoice', 'Tanggal', 'Pelanggan', 'Sales Marketing', 'Tipe Pajak', 'Subtotal', 'PPN', 'PPh', 'Total Harga', 'Status PO', 'Status Invoice', 'Jatuh Tempo'],
                      (po) => [
                        po.id,
                        po.nomorPO,
                        po.nomorInvoice || '-',
                        po.tanggal,
                        po.pelanggan,
                        po.namaMarketing || '-',
                        po.tipePajak || 'Non PPN',
                        po.subtotalHarga || po.totalHarga,
                        po.ppnNominal || 0,
                        po.pphNominal || 0,
                        po.totalHarga,
                        po.statusPO,
                        po.statusInvoice,
                        po.tanggalJatuhTempo || '-'
                      ],
                      `Laporan_PO_Periode_${poStartDate}_sd_${poEndDate}`
                    );
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Excel
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Cetak PDF
                </button>
                <button
                  onClick={() => {
                    if (confirm("Apakah Anda yakin ingin membatalkan cetak laporan PO ini?")) {
                      setShowPOPrintModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-200 rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => setShowPOPrintModal(false)}
                  className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Tips for save pdf */}
            <div className="bg-blue-50 dark:bg-blue-950/20 px-6 py-2.5 border-b border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-300 text-[11px] font-semibold flex items-center gap-2 print:hidden">
              <AlertCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>
                <strong>Tips Cetak PDF:</strong> Jika lembar cetak tidak merespon / tidak bisa menyimpan PDF, silakan klik tombol <strong>"Buka Aplikasi"</strong> (Tab Baru) di pojok kanan atas layar Anda, lalu cetak dengan lancar menggunakan <strong>Ctrl + P</strong> atau <strong>Cmd + P</strong>.
              </span>
            </div>

            {/* Printable Report Content */}
            <div id="print-area" className="p-8 md:p-12 bg-white text-black font-sans min-h-[600px]">
              
              {/* Header Kop Surat */}
              <div className="flex justify-between items-start border-b border-zinc-300 pb-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-1 bg-white border border-zinc-200 rounded-xl flex items-center justify-center shrink-0">
                    <CompanyLogo size="md" className="h-14 w-14" />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">CV. MUSTIKA KAYU</h1>
                    <p className="text-[10px] text-zinc-500 max-w-sm mt-0.5">
                      Industri Pengolahan Kayu & Pallet Kayu Berkualitas Tinggi (ISPM #15).<br />
                      Sragentoyoso, Sragen, Jawa Tengah, Indonesia.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-sm font-extrabold text-zinc-900 uppercase">LAPORAN REKAPITULASI PURCHASE ORDER (PO)</h2>
                  <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase">
                    Periode: {poStartDate} s/d {poEndDate}
                  </p>
                </div>
              </div>

              {/* Filtering data & math inside print view */}
              {(() => {
                const list = purchaseOrders.filter(t => {
                  let ok = true;
                  if (poStartDate) ok = ok && t.tanggal >= poStartDate;
                  if (poEndDate) ok = ok && t.tanggal <= poEndDate;
                  return ok;
                });

                const totalRevenue = list.reduce((a, b) => a + b.totalHarga, 0);
                const countApproved = list.filter(t => t.statusPO === 'DISETUJUI').length;
                const countPending = list.filter(t => t.statusPO === 'PENDING').length;
                const countDone = list.filter(t => t.statusPO === 'SELESAI').length;

                return (
                  <div className="space-y-6">
                    {/* Summary statistics row */}
                    <div className="grid grid-cols-4 gap-4 border border-zinc-200 p-4 rounded-xl bg-zinc-50/50">
                      <div className="text-center border-r border-zinc-200">
                        <span className="text-[9px] uppercase font-black text-zinc-400 block">Total Transaksi PO</span>
                        <span className="text-sm font-extrabold text-zinc-800">{list.length} Pesanan</span>
                      </div>
                      <div className="text-center border-r border-zinc-200">
                        <span className="text-[9px] uppercase font-black text-zinc-400 block">Total Nilai Omset</span>
                        <span className="text-sm font-extrabold text-emerald-600">Rp {totalRevenue.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="text-center border-r border-zinc-200">
                        <span className="text-[9px] uppercase font-black text-zinc-400 block">Status Disetujui</span>
                        <span className="text-sm font-extrabold text-blue-600">{countApproved} PO</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] uppercase font-black text-zinc-400 block">Status Selesai / Terkirim</span>
                        <span className="text-sm font-extrabold text-indigo-600">{countDone} PO</span>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-zinc-100 border-b border-zinc-200 font-extrabold text-zinc-700">
                            <th className="p-3">No</th>
                            <th className="p-3">Nomor PO / JO</th>
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Pelanggan</th>
                            <th className="p-3">Marketing</th>
                            <th className="p-3">Status PO</th>
                            <th className="p-3 text-right">Total Nilai</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-150">
                          {list.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-zinc-400 font-medium">
                                Tidak ada catatan transaksi PO pada rentang periode ini.
                              </td>
                            </tr>
                          ) : (
                            list.map((po, idx) => (
                              <tr key={po.id} className="hover:bg-zinc-50/50">
                                <td className="p-3 text-zinc-400 font-bold">{idx + 1}</td>
                                <td className="p-3">
                                  <span className="font-bold text-zinc-900 block">{po.nomorPO}</span>
                                  <span className="text-[9px] text-zinc-400 block font-mono">JO: {po.nomorJO || '-'}</span>
                                </td>
                                <td className="p-3">{po.tanggal}</td>
                                <td className="p-3 font-semibold text-zinc-800">{po.pelanggan}</td>
                                <td className="p-3 text-zinc-600">{po.namaMarketing || '-'}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${
                                    po.statusPO === 'SELESAI' ? 'bg-green-100 text-green-800' :
                                    po.statusPO === 'DISETUJUI' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {po.statusPO}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono font-bold">
                                  Rp {po.totalHarga.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer Signs */}
                    <div className="pt-12 flex justify-between items-center text-xs text-center">
                      <div className="w-48">
                        <p>Dipersiapkan Oleh (Sales),</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">{currentUser?.name || 'Staf Administrasi'}</p>
                        <p className="text-[10px] text-zinc-400">Sales & Marketing Admin</p>
                      </div>
                      <div className="w-48">
                        <p>Mengetahui / Menyetujui,</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">Direktur Utama</p>
                        <p className="text-[10px] text-zinc-400">CV. Mustika Kayu</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
