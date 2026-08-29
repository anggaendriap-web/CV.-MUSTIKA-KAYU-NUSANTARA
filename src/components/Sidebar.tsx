import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { 
  LayoutDashboard, 
  TreePine, 
  Package, 
  FileSpreadsheet, 
  Truck, 
  Wallet, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  FileText,
  CreditCard,
  Building2,
  Coins,
  Landmark,
  Scale,
  Boxes,
  Receipt
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
  group?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}) => {
  const { currentUser, logout } = useApp();

  const navigationItems: NavItem[] = [
    { id: 'DASHBOARD', label: 'Dashboard Rekapan', icon: LayoutDashboard, roles: ['OWNER', 'FINANCE', 'WAREHOUSE', 'ADMIN_SALES'] },
    { id: 'STOK_MATERIAL', label: 'Stok Material', icon: TreePine, roles: ['OWNER', 'WAREHOUSE', 'FINANCE'], group: 'Operasional' },
    { id: 'STOK_JADI', label: 'Stok Finish Good', icon: Package, roles: ['OWNER', 'WAREHOUSE', 'ADMIN_SALES'], group: 'Operasional' },
    { id: 'PURCHASE_ORDERS', label: 'Purchase Orders', icon: FileSpreadsheet, roles: ['OWNER', 'ADMIN_SALES', 'FINANCE'], group: 'Operasional' },
    { id: 'SURAT_JALAN', label: 'Surat Jalan Kirim', icon: Truck, roles: ['OWNER', 'WAREHOUSE', 'ADMIN_SALES'], group: 'Operasional' },
    
    // Modul Finance & Akuntansi
    { id: 'INVOICE_BILLING', label: 'Cetak Invoice', icon: FileText, roles: ['OWNER', 'FINANCE', 'ADMIN_SALES'], group: 'Keuangan & Akuntansi' },
    { id: 'LAPORAN_AR', label: 'Laporan Piutang (AR)', icon: CreditCard, roles: ['OWNER', 'FINANCE'], group: 'Keuangan & Akuntansi' },
    { id: 'LAPORAN_AP', label: 'Laporan Hutang (AP)', icon: Building2, roles: ['OWNER', 'FINANCE'], group: 'Keuangan & Akuntansi' },
    { id: 'KAS_KECIL', label: 'Kas Kecil (Petty Cash)', icon: Coins, roles: ['OWNER', 'FINANCE'], group: 'Keuangan & Akuntansi' },
    { id: 'BUKU_BANK', label: 'Buku Bank Giro', icon: Landmark, roles: ['OWNER', 'FINANCE'], group: 'Keuangan & Akuntansi' },
    { id: 'LAPORAN_KEUANGAN', label: 'Neraca & Laba Rugi', icon: Scale, roles: ['OWNER', 'FINANCE'], group: 'Keuangan & Akuntansi' },
    { id: 'ASET_DEPRESIASI', label: 'Aset & Depresiasi', icon: Boxes, roles: ['OWNER', 'FINANCE'], group: 'Keuangan & Akuntansi' },
    { id: 'LAPORAN_PAJAK', label: 'Laporan Pajak', icon: Receipt, roles: ['OWNER', 'FINANCE'], group: 'Keuangan & Akuntansi' },
    { id: 'KEUANGAN', label: 'Buku Kas & Arus Kas', icon: Wallet, roles: ['OWNER', 'FINANCE'], group: 'Keuangan & Akuntansi' }
  ];

  if (!currentUser) return null;

  // Filter navigation by role
  const allowedItems = navigationItems.filter(item => item.roles.includes(currentUser.role));

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'OWNER': return 'Owner';
      case 'FINANCE': return 'Finance';
      case 'WAREHOUSE': return 'Warehouse';
      case 'ADMIN_SALES': return 'Sales Admin';
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'OWNER': return 'bg-white/20 text-white';
      case 'FINANCE': return 'bg-emerald-500/30 text-emerald-200';
      case 'WAREHOUSE': return 'bg-amber-500/30 text-amber-200';
      case 'ADMIN_SALES': return 'bg-blue-500/30 text-blue-200';
    }
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false); // Close mobile drawer on click
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 left-0 h-screen bg-red-900 text-white border-r border-red-950 z-40 transition-all duration-300 flex flex-col justify-between ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Top Header Section */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-red-950 shrink-0">
            {!collapsed ? (
              <div className="flex items-center gap-3">
                <div className="p-1 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  <CompanyLogo size="sm" className="h-8 w-8" />
                </div>
                <div>
                  <span className="font-extrabold text-sm tracking-tight block">MUSTIKA KAYU</span>
                  <span className="text-[10px] text-red-200/80 font-medium block">N U S A N T A R A</span>
                </div>
              </div>
            ) : (
              <div className="mx-auto p-1 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <CompanyLogo size="sm" className="h-8 w-8" />
              </div>
            )}

            {/* Desktop Collapse Trigger */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1 bg-red-950/50 hover:bg-red-950 text-red-100 rounded-lg border border-red-800/50 hover:text-white transition-all cursor-pointer"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* User Profile Summary */}
          {!collapsed && (
            <div className="p-3 border-b border-red-950/60 bg-red-950/20 text-center shrink-0">
              <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeColor(currentUser.role)}`}>
                Akses: {getRoleLabel(currentUser.role)}
              </span>
            </div>
          )}

          {/* Nav Items List with Scroll */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1 custom-sidebar-scroll">
            {allowedItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const prevItem = allowedItems[idx - 1];
              const showGroupHeader = !collapsed && item.group && (!prevItem || prevItem.group !== item.group);

              return (
                <React.Fragment key={item.id}>
                  {showGroupHeader && (
                    <div className="pt-3 pb-1 px-2 text-[10px] font-extrabold uppercase tracking-wider text-red-300/70 border-t border-red-950/40 first:border-t-0 first:pt-1">
                      {item.group}
                    </div>
                  )}
                  <button
                    id={`nav-item-${item.id}`}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-red-950 shadow-md font-bold scale-[1.01]'
                        : 'text-red-100 hover:bg-red-950/50 hover:text-white'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-red-700' : 'text-red-200'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-red-950 shrink-0">
          <button
            onClick={() => logout()}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-red-200 hover:bg-red-950/80 hover:text-white transition-all cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Keluar' : undefined}
          >
            <LogOut className="h-4 w-4 text-red-200 shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
