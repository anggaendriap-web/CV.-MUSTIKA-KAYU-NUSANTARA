import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Menu, Sun, Moon, Bell, RefreshCw, TriangleAlert, Info } from 'lucide-react';

interface TopbarProps {
  activeTab: string;
  setMobileOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ activeTab, setMobileOpen }) => {
  const { currentUser, switchUser, darkMode, toggleDarkMode, materials, finishGoods, purchaseOrders } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  if (!currentUser) return null;

  // Compute Alerts
  const lowStockMaterials = materials.filter(m => m.stok <= m.minimalStok);
  const lowStockGoods = finishGoods.filter(g => g.stok <= g.minimalStok);
  const unpaidInvoices = purchaseOrders.filter(po => po.statusInvoice === 'Belum Bayar');

  const alertsCount = lowStockMaterials.length + lowStockGoods.length + unpaidInvoices.length;

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'DASHBOARD': return 'Dashboard Rekapan Pabrik';
      case 'STOK_MATERIAL': return 'Manajemen Stok Material Bahan Baku';
      case 'STOK_JADI': return 'Gudang Penyimpanan Pallet Selesai';
      case 'PURCHASE_ORDERS': return 'Sistem Purchase Order & Invoice';
      case 'SURAT_JALAN': return 'Ekspedisi & Surat Jalan Kirim';
      case 'KEUANGAN': return 'Arus Kas Keuangan & Buku Besar';
      default: return 'CV. Mustika Kayu Nusantara';
    }
  };

  const handleRoleQuickSwitch = (role: UserRole) => {
    switchUser(role);
    setShowRoleSwitcher(false);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 md:px-6 py-4 transition-colors duration-200">
      
      {/* Left Area: Mobile Trigger and View Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
            {getTabTitle(activeTab)}
          </h1>
          <p className="text-[10px] md:text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-1">
            CV. Mustika Kayu Nusantara • Pallet Manufacture Indonesia
          </p>
        </div>
      </div>

      {/* Right Area: Control Panel */}
      <div className="flex items-center gap-3 relative">
        
        {/* Quick Role Switcher (Best UX for Testing) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-red-600 dark:text-red-400 animate-pulse" />
            <span className="hidden sm:inline">Ganti Akun Cepat</span>
          </button>

          {showRoleSwitcher && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleSwitcher(false)}></div>
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Simulasi Login Akun</p>
                </div>
                {(['OWNER', 'FINANCE', 'WAREHOUSE', 'ADMIN_SALES'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleQuickSwitch(role)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer ${
                      currentUser.role === role ? 'font-bold text-red-600 bg-red-50/50 dark:bg-red-950/20 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span>
                      {role === 'OWNER' ? '👑 Owner' : role === 'FINANCE' ? '💵 Finance' : role === 'WAREHOUSE' ? '📦 Warehouse' : '📈 Sales Admin'}
                    </span>
                    {currentUser.role === role && <span className="h-1.5 w-1.5 bg-red-600 dark:bg-red-400 rounded-full"></span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          title="Ubah Tema"
        >
          {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors relative cursor-pointer"
            title="Pemberitahuan"
          >
            <Bell className="h-4.5 w-4.5" />
            {alertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-600 text-[10px] font-extrabold text-white rounded-full flex items-center justify-center animate-bounce">
                {alertsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[380px] overflow-y-auto">
                <div className="px-4 pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-2 flex justify-between items-center">
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Alert & Notifikasi Kontrol</p>
                  <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-bold px-2 py-0.5 rounded-full">
                    {alertsCount} Masalah
                  </span>
                </div>

                <div className="space-y-1">
                  {/* Low Stock Materials */}
                  {lowStockMaterials.map(m => (
                    <div key={m.id} className="px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors flex gap-2.5">
                      <TriangleAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Stok Material Menipis!</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{m.nama} sisa {m.stok} {m.satuan} (Min: {m.minimalStok}).</p>
                      </div>
                    </div>
                  ))}

                  {/* Low Stock Finished Goods */}
                  {lowStockGoods.map(g => (
                    <div key={g.id} className="px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors flex gap-2.5">
                      <TriangleAlert className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Stok Pallet Jadi Menipis!</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{g.nama} sisa {g.stok} pcs (Min: {g.minimalStok}).</p>
                      </div>
                    </div>
                  ))}

                  {/* Unpaid Invoices */}
                  {unpaidInvoices.map(po => (
                    <div key={po.id} className="px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors flex gap-2.5">
                      <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Invoice Belum Bayar</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{po.pelanggan} - Rp {po.totalHarga.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  ))}

                  {alertsCount === 0 && (
                    <div className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500">
                      <p className="text-xs">Semua aman! Tidak ada alert stok atau tagihan menunggak.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
