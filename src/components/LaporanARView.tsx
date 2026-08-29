import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CompanyLogo } from './CompanyLogo';
import { triggerPrintOrPdf } from '../utils/exportPdf';
import { 
  CreditCard, 
  Printer, 
  Download, 
  Search, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  TrendingUp, 
  X,
  FileSpreadsheet
} from 'lucide-react';

export const LaporanARView: React.FC = () => {
  const { purchaseOrders, updateInvoiceStatus, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('Semua');
  const [agingFilter, setAgingFilter] = useState<'Semua' | 'Lancar' | '31-60' | '>60'>('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Initialize dates
  React.useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Calculate Aging & Due Dates
  const arItems = useMemo(() => {
    const today = new Date();
    return purchaseOrders
      .filter(po => po.statusInvoice !== 'Lunas')
      .map(po => {
        const orderDate = new Date(po.tanggalOrder);
        // Default terms 30 days
        const dueDate = new Date(orderDate);
        dueDate.setDate(dueDate.getDate() + 30);
        
        const diffTime = today.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const overdueDays = Math.max(0, diffDays);

        let agingCategory: 'Lancar (0-30 hari)' | 'Jatuh Tempo (31-60 hari)' | 'Kritis (>60 hari)';
        if (overdueDays === 0) {
          agingCategory = 'Lancar (0-30 hari)';
        } else if (overdueDays <= 30) {
          agingCategory = 'Jatuh Tempo (31-60 hari)';
        } else {
          agingCategory = 'Kritis (>60 hari)';
        }

        return {
          ...po,
          dueDateStr: dueDate.toISOString().split('T')[0],
          overdueDays,
          agingCategory,
          sisaPiutang: po.totalHarga // if partial not tracked, full is receivable
        };
      });
  }, [purchaseOrders]);

  // Filtered AR
  const filteredAR = useMemo(() => {
    return arItems.filter(item => {
      const matchesSearch = 
        item.pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomorPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nomorInvoice?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

      const matchesCust = customerFilter === 'Semua' || item.pelanggan === customerFilter;

      let matchesAging = true;
      if (agingFilter === 'Lancar') matchesAging = item.agingCategory === 'Lancar (0-30 hari)';
      if (agingFilter === '31-60') matchesAging = item.agingCategory === 'Jatuh Tempo (31-60 hari)';
      if (agingFilter === '>60') matchesAging = item.agingCategory === 'Kritis (>60 hari)';

      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && item.tanggalOrder >= startDate;
      if (endDate) matchesDate = matchesDate && item.tanggalOrder <= endDate;

      return matchesSearch && matchesCust && matchesAging && matchesDate;
    });
  }, [arItems, searchTerm, customerFilter, agingFilter, startDate, endDate]);

  // Summary Metrics
  const totalPiutang = useMemo(() => arItems.reduce((a, b) => a + b.sisaPiutang, 0), [arItems]);
  const piutangLancar = useMemo(() => arItems.filter(i => i.agingCategory === 'Lancar (0-30 hari)').reduce((a, b) => a + b.sisaPiutang, 0), [arItems]);
  const piutangJatuhTempo = useMemo(() => arItems.filter(i => i.agingCategory === 'Jatuh Tempo (31-60 hari)').reduce((a, b) => a + b.sisaPiutang, 0), [arItems]);
  const piutangKritis = useMemo(() => arItems.filter(i => i.agingCategory === 'Kritis (>60 hari)').reduce((a, b) => a + b.sisaPiutang, 0), [arItems]);

  const uniqueCustomers = useMemo(() => {
    return Array.from(new Set(purchaseOrders.map(p => p.pelanggan)));
  }, [purchaseOrders]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-700 dark:text-blue-400">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Laporan Piutang Usaha (AR)</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Monitoring umur piutang (Aging Schedule), jatuh tempo buyer, dan penagihan kas</p>
          </div>
        </div>

        <button
          onClick={() => setShowPrintModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>Cetak Laporan AR PDF</span>
        </button>
      </div>

      {/* Aging Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Total Saldo Piutang</span>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">{formatRupiah(totalPiutang)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">{arItems.length} Tagihan aktif belum lunas</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Lancar (0 - 30 Hari)</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(piutangLancar)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Dalam batas tempo normal</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">Lewat Tempo (31 - 60 Hari)</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatRupiah(piutangJatuhTempo)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Perlu reminder penagihan</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1">Kritis ( {'>'} 60 Hari)</span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">{formatRupiah(piutangKritis)}</div>
          <span className="text-xs text-zinc-400 mt-1 block">Prioritas follow-up ketat</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari Customer, PO, Invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Customer</option>
            {uniqueCustomers.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={agingFilter}
            onChange={(e) => setAgingFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="Semua">Semua Umur Piutang</option>
            <option value="Lancar">Lancar (0-30 hr)</option>
            <option value="31-60">Jatuh Tempo (31-60 hr)</option>
            <option value=">60">Kritis ({'>'}60 hr)</option>
          </select>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-zinc-800 dark:text-zinc-200 focus:outline-none text-[11px] w-full"
            />
          </div>
        </div>
      </div>

      {/* AR Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-bold text-sm text-zinc-900 dark:text-white">Daftar Tagihan Piutang Customer ({filteredAR.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-3.5">Pelanggan</th>
                <th className="p-3.5">No. Invoice & PO</th>
                <th className="p-3.5">Tgl Faktur</th>
                <th className="p-3.5">Jatuh Tempo</th>
                <th className="p-3.5 text-center">Umur Piutang</th>
                <th className="p-3.5 text-right">Nilai Piutang</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredAR.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">
                    Tidak ada data piutang usaha yang sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredAR.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-bold text-zinc-900 dark:text-white block">{item.pelanggan}</span>
                      <span className="text-[11px] text-zinc-400">{item.tujuanPengiriman}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-red-700 dark:text-red-400 block">{item.nomorInvoice || item.nomorPO}</span>
                      <span className="text-[11px] text-zinc-400">PO: {item.nomorPO}</span>
                    </td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-300">{item.tanggalOrder}</td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-300 font-medium">{item.dueDateStr}</td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.agingCategory === 'Lancar (0-30 hari)'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : item.agingCategory === 'Jatuh Tempo (31-60 hari)'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                      }`}>
                        {item.overdueDays > 0 ? `Lewat ${item.overdueDays} Hari` : 'Lancar'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-zinc-900 dark:text-white">
                      {formatRupiah(item.sisaPiutang)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => updateInvoiceStatus(item.id, 'Lunas')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Pelunasan
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AR Print PDF Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-red-400" />
                <span className="font-bold text-sm">Pratinjau Laporan Piutang Usaha (AR)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintOrPdf('ar-report-sheet', `Laporan_AR_Piutang_${new Date().toISOString().split('T')[0]}`)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download / Print PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-zinc-100 dark:bg-zinc-950 flex justify-center">
              <div
                id="ar-report-sheet"
                className="bg-white text-zinc-900 p-8 rounded-lg shadow-md max-w-3xl w-full text-xs font-sans border border-zinc-200"
              >
                <div className="flex items-start justify-between border-b-2 border-red-900 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo size="md" className="h-10 w-10" />
                    <div>
                      <h2 className="text-lg font-black text-red-900">PT MUSTIKA KAYU NUSANTARA</h2>
                      <p className="text-[10px] text-zinc-600">Laporan Umur Piutang Usaha (Accounts Receivable Aging Report)</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-600">
                    <p><b>Tanggal Cetak:</b> {new Date().toLocaleDateString('id-ID')}</p>
                    <p><b>Pencatat:</b> {currentUser?.name || 'Finance Dept'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-center text-[10px]">
                  <div>
                    <span className="text-zinc-500 block font-bold">Total Piutang:</span>
                    <span className="font-extrabold text-zinc-900">{formatRupiah(totalPiutang)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block font-bold">0-30 Hari:</span>
                    <span className="font-extrabold text-emerald-700">{formatRupiah(piutangLancar)}</span>
                  </div>
                  <div>
                    <span className="text-amber-700 block font-bold">31-60 Hari:</span>
                    <span className="font-extrabold text-amber-700">{formatRupiah(piutangJatuhTempo)}</span>
                  </div>
                  <div>
                    <span className="text-red-700 block font-bold">&gt; 60 Hari:</span>
                    <span className="font-extrabold text-red-700">{formatRupiah(piutangKritis)}</span>
                  </div>
                </div>

                <table className="w-full border-collapse text-[10px] mb-6">
                  <thead>
                    <tr className="bg-red-900 text-white font-bold">
                      <th className="p-2 text-left">Pelanggan</th>
                      <th className="p-2 text-left">No. Invoice</th>
                      <th className="p-2 text-left">Tgl Faktur</th>
                      <th className="p-2 text-left">Jatuh Tempo</th>
                      <th className="p-2 text-center">Status Umur</th>
                      <th className="p-2 text-right">Saldo Piutang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 border-b border-zinc-200">
                    {filteredAR.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                        <td className="p-2 font-bold">{item.pelanggan}</td>
                        <td className="p-2 text-red-900">{item.nomorInvoice || item.nomorPO}</td>
                        <td className="p-2">{item.tanggalOrder}</td>
                        <td className="p-2">{item.dueDateStr}</td>
                        <td className="p-2 text-center font-bold">
                          {item.overdueDays > 0 ? `Lewat ${item.overdueDays} Hari` : 'Lancar'}
                        </td>
                        <td className="p-2 text-right font-bold">{formatRupiah(item.sisaPiutang)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 font-bold">
                      <td colSpan={5} className="p-2 text-right">TOTAL PIUTANG USAHA:</td>
                      <td className="p-2 text-right font-black text-red-900">{formatRupiah(filteredAR.reduce((a, b) => a + b.sisaPiutang, 0))}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="flex justify-end pt-4">
                  <div className="text-center w-48">
                    <span className="text-[10px] text-zinc-500 block mb-12">Mengetahui,</span>
                    <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                      Finance & AR Collection
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
