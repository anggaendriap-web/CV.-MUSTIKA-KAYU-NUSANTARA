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

export interface HutangUsaha {
  id: string;
  nomorTagihan: string; // e.g. AP-2026-001
  supplier: string;
  tanggal: string;
  tanggalJatuhTempo: string;
  kategori: 'Bahan Baku Kayu' | 'Paku & Besi' | 'Sewa / Perbaikan Mesin' | 'Solar & Bahan Bakar' | 'Lainnya';
  keterangan: string;
  totalTagihan: number;
  sudahDibayar: number;
  sisaHutang: number;
  status: 'Belum Lunas' | 'Lunas' | 'Jatuh Tempo';
  riwayatBayar?: {
    tanggal: string;
    nominal: number;
    metode: string;
    catatan?: string;
  }[];
}

export interface KasKecilItem {
  id: string;
  tanggal: string;
  kode: string; // e.g. KK-001
  kategori: 'Konsumsi Tukang' | 'BBM & Parkir' | 'Alat Kerja Ringan' | 'Listrik & Air' | 'Kebersihan' | 'Lainnya';
  keterangan: string;
  tipe: 'Masuk' | 'Keluar'; // Masuk = Pengisian kas kecil, Keluar = Pengeluaran
  nominal: number;
  penerimaAtauPenyetor: string;
  buktiNota?: string;
}

export interface BukuBankItem {
  id: string;
  tanggal: string;
  kodeMutasi: string; // e.g. BNK-001
  namaBank: 'BCA (8820192831)' | 'Mandiri (1370092819201)' | 'BRI (034101002341)';
  tipe: 'Masuk' | 'Keluar';
  kategori: 'Pelunasan Invoice' | 'DP Pembeli' | 'Bayar Supplier Kayu' | 'Gaji Tukang & Staf' | 'Pajak & Operasional' | 'Mutasi Kas Kecil';
  keterangan: string;
  nominal: number;
  saldoSetelahnya?: number;
  nomorReferensi?: string;
}

export interface AsetTetap {
  id: string;
  kodeAset: string; // e.g. AST-001
  namaAset: string; // e.g. Mesin Four-side Planer
  kategori: 'Mesin Produksi' | 'Kendaraan Operasional' | 'Peralatan Pabrik' | 'Bangunan & Fasilitas' | 'Peralatan Kantor';
  tanggalPerolehan: string;
  hargaPerolehan: number;
  masaManfaatTahun: number; // e.g. 5 tahun
  nilaiResidu: number; // e.g. 10.000.000
  akumulasiPenyusutan: number;
  nilaiBuku: number;
  penyusutanPerBulan: number;
  lokasi: string;
  kondisi: 'Sangat Baik' | 'Baik' | 'Perlu Perawatan' | 'Rusak';
}

export interface PajakItem {
  id: string;
  tanggal: string;
  nomorFaktur: string; // e.g. FP-010.000-26.0000001
  jenisPajak: 'PPN Keluaran 11%' | 'PPN Masukan 11%' | 'PPh 21 (Upah/Gaji)' | 'PPh 23 (Jasa)' | 'PPh Final UMKM / Badan';
  lawanTransaksi: string; // Pelanggan / Supplier / Karyawan
  dpp: number; // Dasar Pengenaan Pajak
  tarifPersen: number; // 11%, 5%, 2%, 0.5%
  nominalPajak: number;
  statusBayarLapor: 'Belum Lapor' | 'Sudah Lapor SPT' | 'Lunas Bayar';
  masaPajak: string; // e.g. Agustus 2026
  keterangan?: string;
}

