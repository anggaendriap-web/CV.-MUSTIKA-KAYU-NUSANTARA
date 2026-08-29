export type UserRole = 'ADMIN_SALES' | 'WAREHOUSE' | 'FINANCE' | 'OWNER';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Material {
  id: string;
  kode: string; // e.g., MAT-001
  nama: string; // e.g., Kayu Albasia 2x10x130
  kategori: 'Kayu Log' | 'Papan' | 'Balok' | 'Paku' | 'Cat/Pelapis' | 'Lainnya';
  stok: number;
  satuan: 'm3' | 'pcs' | 'kg' | 'liter';
  hargaBeli: number; // IDR
  minimalStok: number;
  supplier: string;
  terakhirDiperbarui: string; // ISO Date
}

export interface FinishGood {
  id: string;
  kode: string; // e.g., PLT-001
  nama: string; // e.g., Pallet Standard 100x120
  tipe: 'Standard' | 'Custom' | 'Ekspor ISPM 15' | 'Heavy Duty' | 'Dua Arah';
  dimensi: string; // e.g., 1000 x 1200 x 130 mm
  stok: number;
  satuan: 'pcs';
  hargaJual: number; // IDR
  minimalStok: number;
  deskripsi: string;
  terakhirDiperbarui: string; // ISO Date
}

export interface PurchaseOrder {
  id: string;
  nomorPO: string; // e.g., PO-2026-001
  nomorJO?: string; // e.g., JO-2026-001
  nomorInvoice?: string; // e.g., INV-2026-001
  tanggal: string;
  pelanggan: string;
  item: {
    finishGoodId?: string;
    namaPallet: string;
    tipeIspm?: 'Lokal' | 'Ekspor ISPM';
    jumlah: number;
    hargaSatuan: number;
    subtotal: number;
  }[];
  subtotalHarga?: number; // Before tax
  tipePajak?: 'PPN' | 'Non PPN' | 'PPh' | 'PPN & PPh';
  ppnNominal?: number;
  pphNominal?: number;
  namaMarketing?: string;
  totalHarga: number;
  statusPO: 'Diterima' | 'Diproduksi' | 'Siap Kirim' | 'Selesai' | 'Dibatalkan';
  statusInvoice: 'Belum Terbit' | 'Belum Bayar' | 'Lunas';
  tanggalJatuhTempo?: string;
  catatan?: string;
}

export interface Customer {
  id: string;
  nama: string;
  alamat: string;
  telepon: string;
  email?: string;
  pic?: string;
  createdAt: string;
}

export interface MarketingCommission {
  id: string;
  namaMarketing: string;
  persentaseKomisi: number; // e.g., 2%
  targetOmset?: number;
}

export interface SuratJalan {
  id: string;
  nomorSuratJalan: string; // e.g., SJ-2026-001
  purchaseOrderId: string;
  nomorPO: string;
  pelanggan: string;
  tanggalKirim: string;
  namaSopir: string;
  platNomor: string;
  jenisKendaraan: 'Colt Diesel' | 'Fuso' | 'Tronton' | 'L300' | 'Lainnya';
  itemKirim: {
    namaPallet: string;
    jumlahKirim: number;
    satuan: string;
  }[];
  statusPengiriman: 'Draf' | 'Dalam Perjalanan' | 'Tiba di Lokasi' | 'Diterima Pelanggan';
  penerima?: string;
  catatanKirim?: string;
}

export interface Keuangan {
  id: string;
  tanggal: string;
  kodeTransaksi: string; // e.g., TX-1001
  tipe: 'Pemasukan' | 'Pengeluaran';
  kategori: 'Penjualan Pallet' | 'Pembelian Material' | 'Gaji Karyawan' | 'Operasional Pabrik' | 'Transportasi' | 'Lainnya';
  keterangan: string;
  nominal: number;
  referensiId?: string; // e.g., Invoice ID or PO ID
  metodePembayaran: 'Transfer Bank BCA' | 'Transfer Bank Mandiri' | 'Cash / Tunai';
  pencatat: string; // Nama user
}
