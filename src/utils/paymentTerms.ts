import { SyaratPembayaran } from '../types';

export const PAYMENT_TERMS_OPTIONS: SyaratPembayaran[] = [
  'COD',
  'CBD',
  'Tempo 7 Hari',
  'Tempo 14 Hari',
  'Tempo 30 Hari'
];

/**
 * Menghitung tanggal jatuh tempo berpatokan pada tanggal cetak/terbit invoice
 * dan syarat pembayaran (COD, CBD, Tempo 7 Hari, Tempo 14 Hari, Tempo 30 Hari)
 */
export function calculateDueDateFromInvoice(
  invoiceDateStr?: string,
  terms?: SyaratPembayaran | string
): string {
  if (!invoiceDateStr || !invoiceDateStr.trim()) {
    invoiceDateStr = new Date().toISOString().split('T')[0];
  }

  // Parse YYYY-MM-DD safely
  const [year, month, day] = invoiceDateStr.split('-').map(Number);
  const baseDate = (!isNaN(year) && !isNaN(month) && !isNaN(day))
    ? new Date(year, month - 1, day)
    : new Date(invoiceDateStr);

  if (isNaN(baseDate.getTime())) {
    return invoiceDateStr;
  }

  const cleanTerms = (terms || 'Tempo 30 Hari').trim();

  if (cleanTerms === 'COD' || cleanTerms === 'CBD') {
    // COD & CBD: Jatuh tempo pada hari H saat invoice dicetak / diterbitkan
    const y = baseDate.getFullYear();
    const m = String(baseDate.getMonth() + 1).padStart(2, '0');
    const d = String(baseDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  let daysToAdd = 30;
  if (cleanTerms === 'Tempo 7 Hari') {
    daysToAdd = 7;
  } else if (cleanTerms === 'Tempo 14 Hari') {
    daysToAdd = 14;
  } else if (cleanTerms === 'Tempo 30 Hari') {
    daysToAdd = 30;
  } else {
    // Fallback if numeric or custom pattern
    const match = cleanTerms.match(/\d+/);
    if (match) {
      daysToAdd = parseInt(match[0], 10) || 30;
    }
  }

  baseDate.setDate(baseDate.getDate() + daysToAdd);

  const y = baseDate.getFullYear();
  const m = String(baseDate.getMonth() + 1).padStart(2, '0');
  const d = String(baseDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format ringkas tanggal Indonesia
 */
export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (year && month && day) {
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Deskripsi detail mengenai syarat pembayaran
 */
export function getTermsBadgeColor(terms?: SyaratPembayaran | string): string {
  switch (terms) {
    case 'COD':
      return 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    case 'CBD':
      return 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800';
    case 'Tempo 7 Hari':
      return 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
    case 'Tempo 14 Hari':
      return 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
    case 'Tempo 30 Hari':
      return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    default:
      return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  }
}
