import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { MaterialView } from './components/MaterialView';
import { FinishGoodView } from './components/FinishGoodView';
import { PurchaseOrderView } from './components/PurchaseOrderView';
import { SuratJalanView } from './components/SuratJalanView';
import { KeuanganView } from './components/KeuanganView';
import { InvoiceBillingView } from './components/InvoiceBillingView';
import { LaporanARView } from './components/LaporanARView';
import { LaporanAPView } from './components/LaporanAPView';
import { KasKecilView } from './components/KasKecilView';
import { BukuBankView } from './components/BukuBankView';
import { LaporanKeuanganView } from './components/LaporanKeuanganView';
import { AsetDepresiasiView } from './components/AsetDepresiasiView';
import { LaporanPajakView } from './components/LaporanPajakView';

function AppContent() {
  const { currentUser, darkMode } = useApp();
  const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Sync dark mode class with root HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle role transition resets (e.g. if a restricted role tries to view a restricted page)
  useEffect(() => {
    if (currentUser) {
      const role = currentUser.role;
      // Define tab access limitations to gracefully redirect if role changes
      if (role === 'FINANCE' && ['STOK_JADI', 'SURAT_JALAN'].includes(activeTab)) {
        setActiveTab('DASHBOARD');
      } else if (role === 'WAREHOUSE' && ['PURCHASE_ORDERS', 'KEUANGAN', 'INVOICE_BILLING', 'LAPORAN_AR', 'LAPORAN_AP', 'KAS_KECIL', 'BUKU_BANK', 'LAPORAN_KEUANGAN', 'ASET_DEPRESIASI', 'LAPORAN_PAJAK'].includes(activeTab)) {
        setActiveTab('DASHBOARD');
      } else if (role === 'ADMIN_SALES' && ['STOK_MATERIAL', 'KEUANGAN', 'LAPORAN_AR', 'LAPORAN_AP', 'KAS_KECIL', 'BUKU_BANK', 'LAPORAN_KEUANGAN', 'ASET_DEPRESIASI', 'LAPORAN_PAJAK'].includes(activeTab)) {
        setActiveTab('DASHBOARD');
      }
    }
  }, [currentUser, activeTab]);

  if (!currentUser) {
    return <LoginView />;
  }

  // View routing switcher
  const renderActiveView = () => {
    switch (activeTab) {
      case 'DASHBOARD':
        return <DashboardView />;
      case 'STOK_MATERIAL':
        return <MaterialView />;
      case 'STOK_JADI':
        return <FinishGoodView />;
      case 'PURCHASE_ORDERS':
        return <PurchaseOrderView />;
      case 'SURAT_JALAN':
        return <SuratJalanView />;
      case 'INVOICE_BILLING':
        return <InvoiceBillingView />;
      case 'LAPORAN_AR':
        return <LaporanARView />;
      case 'LAPORAN_AP':
        return <LaporanAPView />;
      case 'KAS_KECIL':
        return <KasKecilView />;
      case 'BUKU_BANK':
        return <BukuBankView />;
      case 'LAPORAN_KEUANGAN':
        return <LaporanKeuanganView />;
      case 'ASET_DEPRESIASI':
        return <AsetDepresiasiView />;
      case 'LAPORAN_PAJAK':
        return <LaporanPajakView />;
      case 'KEUANGAN':
        return <KeuanganView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* Navigation Sidebar Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Panel Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Dynamic Header */}
        <Topbar activeTab={activeTab} setMobileOpen={setMobileOpen} />

        {/* Scrollable Main View Content */}
        <main className="flex-1 overflow-y-auto max-w-full p-4 md:p-8">
          {renderActiveView()}
        </main>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
