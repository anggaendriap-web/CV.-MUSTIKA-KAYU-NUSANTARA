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
  Sparkles
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
    { id: 'STOK_MATERIAL', label: 'Stok Material', icon: TreePine, roles: ['OWNER', 'WAREHOUSE', 'FINANCE'] },
    { id: 'STOK_JADI', label: 'Stok Finish Good', icon: Package, roles: ['OWNER', 'WAREHOUSE', 'ADMIN_SALES'] },
    { id: 'PURCHASE_ORDERS', label: 'Purchase Orders', icon: FileSpreadsheet, roles: ['OWNER', 'ADMIN_SALES', 'FINANCE'] },
    { id: 'SURAT_JALAN', label: 'Surat Jalan Kirim', icon: Truck, roles: ['OWNER', 'WAREHOUSE', 'ADMIN_SALES'] },
    { id: 'KEUANGAN', label: 'Alur Keuangan', icon: Wallet, roles: ['OWNER', 'FINANCE'] }
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
        <div>
          <div className="p-4 flex items-center justify-between border-b border-red-950">
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
            <div className="p-4 border-b border-red-950/60 bg-red-950/20 text-center">
              <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeColor(currentUser.role)}`}>
                Akses: {getRoleLabel(currentUser.role)}
              </span>
            </div>
          )}

          {/* Nav Items List */}
          <nav className="p-3 space-y-1">
            {allowedItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-red-950 shadow-md font-bold scale-[1.01]'
                      : 'text-red-100 hover:bg-red-950/50 hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-red-700' : 'text-red-200'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-red-950">
          <button
            onClick={() => logout()}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-200 hover:bg-red-950/80 hover:text-white transition-all cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Keluar' : undefined}
          >
            <LogOut className="h-5 w-5 text-red-200" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
