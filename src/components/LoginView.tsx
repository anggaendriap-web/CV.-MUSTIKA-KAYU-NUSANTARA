import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { ShieldCheck, Lock, User, TreePine } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>('OWNER');
  const [password, setPassword] = useState('owner123');
  const [error, setError] = useState('');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    // Auto-fill passwords to make it very easy for the user to try each role
    const pwMap: Record<UserRole, string> = {
      ADMIN_SALES: 'sales123',
      WAREHOUSE: 'warehouse123',
      FINANCE: 'finance123',
      OWNER: 'owner123'
    };
    setPassword(pwMap[role]);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(selectedRole, password);
    if (!success) {
      setError('Password salah! Silakan coba lagi.');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'OWNER': return 'bg-red-500 text-white border-red-600';
      case 'FINANCE': return 'bg-emerald-500 text-white border-emerald-600';
      case 'WAREHOUSE': return 'bg-amber-500 text-white border-amber-600';
      case 'ADMIN_SALES': return 'bg-blue-500 text-white border-blue-600';
    }
  };

  const getRoleDesc = (role: UserRole) => {
    switch (role) {
      case 'OWNER': return 'Akses penuh ke semua laporan, alur keuangan, dan monitoring stok.';
      case 'FINANCE': return 'Kelola alur kas (pemasukan/pengeluaran), invoice, dan pelunasan pembayaran.';
      case 'WAREHOUSE': return 'Kelola stok bahan baku kayu/paku, produksi pallet, dan pengiriman Surat Jalan.';
      case 'ADMIN_SALES': return 'Kelola Purchase Order (PO) pelanggan, pelacakan pesanan, dan koordinasi penjualan.';
    }
  };

  return (
    <div id="login-screen" className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 transition-colors duration-200">
      <div id="login-card" className="w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 grid md:grid-cols-12">
        
        {/* Left Side: Branding and Context */}
        <div className="md:col-span-5 bg-gradient-to-br from-red-700 via-red-800 to-red-950 p-8 md:p-12 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-1 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <CompanyLogo size="sm" className="h-8 w-8" />
              </div>
              <div>
                <span className="font-semibold text-xs uppercase tracking-wider text-red-200/90 block">Sistem ERP Pallet</span>
                <span className="font-black text-lg tracking-tight block">MUSTIKA KAYU</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold leading-tight mb-4 text-white">
              CV. MUSTIKA KAYU NUSANTARA
            </h2>
            <p className="text-sm text-red-100/80 leading-relaxed">
              Sistem pencatatan administrasi terintegrasi untuk kontrol stok bahan baku, pallet siap kirim, surat jalan logistik, dan alur keuangan yang terkendali.
            </p>
          </div>

          <div className="mt-8 md:mt-0 relative z-10 pt-6 border-t border-white/10 text-xs text-red-200/70">
            <p>© 2026 CV. Mustika Kayu Nusantara.</p>
            <p className="mt-1">Handcrafted for premium timber-industry management.</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Selamat Datang
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Pilih peran Anda dan masukkan password untuk masuk ke sistem.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection Tabs */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2.5">
                  PILIH PERAN / ROLE AKUN
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['OWNER', 'FINANCE', 'WAREHOUSE', 'ADMIN_SALES'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      id={`btn-role-${role}`}
                      onClick={() => handleRoleChange(role)}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        selectedRole === role
                          ? 'border-red-600 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRoleBadgeColor(role)}`}>
                        {role.replace('_', ' ')}
                      </span>
                    </button>
                  ))}
                </div>
                
                {/* Role description panel */}
                <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/50 leading-relaxed min-h-[48px]">
                  {getRoleDesc(selectedRole)}
                </div>
              </div>

              {/* Password input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    PASSWORD AKUN
                  </label>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                    Kunci demo: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">{selectedRole === 'OWNER' ? 'owner123' : selectedRole === 'FINANCE' ? 'finance123' : selectedRole === 'WAREHOUSE' ? 'warehouse123' : 'sales123'}</code>
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <input
                    id="password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password..."
                    className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {error && (
                <div id="login-error" className="p-3 bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-600 dark:text-red-400 rounded-lg border border-red-200/50 dark:border-red-900/50">
                  {error}
                </div>
              )}

              <button
                id="btn-login-submit"
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
              >
                <ShieldCheck className="h-4.5 w-4.5" />
                Masuk ke Aplikasi
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
