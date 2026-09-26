export type UserRole = 'ADMIN_SALES' | 'WAREHOUSE' | 'FINANCE' | 'OWNER';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export type MaterialKategori = 
  | 'Kayu Log' 
  | 'Balok Kayu' 
  | 'Papan Kayu' 
  | 'Paku Koil / Besi' 
  | 'Obat Pengawet / Kimia' 
  | 'Cat / Pelapis' 
  | 'Papan' 
  | 'Balok' 
  | 'Paku' 
  | 'Cat/Pelapis'
  | 'Lainnya';

export interface MaterialMutasiItem {
  id: string;
  tanggal: string; // ISO Date or YYYY-MM-DD
  nomorBukti?: string; // e.g. TTM-2026/09/001 or IN-MAT-001
  tipe: 'MASUK_WAREHOUSE' | 'KELUAR_PRODUKSI' | 'PENYESUAIAN_OPNAME';
  jumlah: number;
  sisaStokSetelahnya?: number;
  pengambil?: string; // Nama staf/mandor produksi yang mengambil
  penyerah?: string; // Petugas gudang yang menyerahkan
  keperluan?: string; // e.g. "Produksi SPK Pallet ISPM 100x120"
  nomorSPK?: string; // No SPK / Target Order
  keterangan?: string;
  dicatatOleh?: string;
}

export interface TandaTerimaMaterialItem {
  materialId: string;
  kodeMaterial: string;
  namaMaterial: string;
  ukuran: string;
  dimensi: string;
  jumlah: number;
  satuan: string;
  keterangan?: string;
}

export interface TandaTerimaPengambilanMaterial {
  id: string;
  nomorBon: string; // e.g. BON-MAT/2026/09/001
  tanggal: string; // YYYY-MM-DD
  nomorSPK?: string; // e.g. SPK-2026-088
  targetProduk?: string; // e.g. Pallet Kayu Standard 100x120 cm
  divisiPemohon: string; // Divisi Assembling / Sawmill / Kiln Dry
  namaPengambil: string; // Mandor / Staf Produksi
  namaPenyerah: string; // Petugas Gudang / Warehouse
  items: TandaTerimaMaterialItem[];
  catatan?: string;
  status: 'Diserahkan' | 'Draf' | 'Selesai';
  createdAt: string;
}

export interface Material {
  id: string;
  kode: string; // e.g., MAT-001
  nama: string; // e.g., Kayu Papan Mahoni 2x10x120
  ukuran?: string; // e.g., "2 x 10 x 120 cm" or "Dia 25 cm x P 200 cm"
  dimensi?: string; // e.g., "20mm x 100mm x 1200mm"
  kategori: MaterialKategori;
  tanggalMasukWarehouse?: string; // YYYY-MM-DD
  stokAwal?: number; // Kondisi Stock QTY Awal
  stokMasuk?: number; // Total incoming stock (pembelian/penerimaan)
  stokKeluar?: number; // Total outgoing stock (pemakaian produksi)
  stok: number; // Sisa Stok Terkini
  satuan: 'm3' | 'pcs' | 'kg' | 'liter' | 'batang' | 'lembar' | 'dus' | 'sak';
  hargaBeli: number; // IDR
  minimalStok: number;
  supplier: string;
  lokasiGudang?: string; // e.g. "Gudang Bahan Baku A"
  riwayatMutasi?: MaterialMutasiItem[]; // Pencatatan keluar masuk yang dipakai oleh produksi
  terakhirDiperbarui: string; // ISO Date
}

export interface FinishGoodMutasiItem {
  id: string;
  tanggal: string; // YYYY-MM-DD
  nomorBukti?: string; // e.g. PRD-2026-001 or SJ-2026-001
  tipe: 'MASUK_PRODUKSI' | 'KELUAR_PENGIRIMAN' | 'PENYESUAIAN_OPNAME';
  jumlah: number;
  sisaStokSetelahnya?: number;
  noReferensi?: string; // PO number / Surat Jalan / SPK
  tujuanPengiriman?: string; // Customer / Pelanggan tujuan
  sopir?: string;
  noKendaraan?: string;
  keterangan?: string;
  dicatatOleh?: string;
}

export interface FinishGood {
  id: string;
  kode: string; // e.g., PLT-001
  nama: string; // e.g., Pallet Standard 100x120
  tipe: 'Standard' | 'Custom' | 'Ekspor ISPM 15' | 'Heavy Duty' | 'Dua Arah';
  dimensi: string; // e.g., 1000 x 1200 x 130 mm
  stokAwal?: number; // Stok Awal untuk memudahkan Stock Opname
  stokMasukProduksi?: number; // Total Masuk dari Produksi ke Gudang
  stokKeluarPengiriman?: number; // Total Keluar Barang / Pengiriman Surat Jalan
  stok: number; // Stok Akhir Gudang
  satuan: 'pcs';
  hargaJual: number; // IDR
  minimalStok: number;
  tanggalMasukProduksi?: string; // Tanggal Masuk dari Produksi ke Gudang (YYYY-MM-DD)
  tanggalKeluarTerakhir?: string; // Tanggal Keluar Barang (YYYY-MM-DD)
  stokFisikOpname?: number; // Stok Fisik hasil Opname
  selisihOpname?: number; // Selisih Fisik vs Sistem
  tanggalOpnameTerakhir?: string; // Tanggal terakhir stock opname
  keteranganOpname?: string; // Catatan hasil opname
  deskripsi: string;
  riwayatMutasiFG?: FinishGoodMutasiItem[];
  terakhirDiperbarui: string; // ISO Date
}

export type SyaratPembayaran = 'COD' | 'CBD' | 'Tempo 7 Hari' | 'Tempo 14 Hari' | 'Tempo 30 Hari';

export interface PurchaseOrder {
  id: string;
  nomorPO: string; // e.g., PO-2026-001
  nomorJO?: string; // e.g., JO-2026-001
  nomorInvoice?: string; // e.g., INV-2026-001
  tanggal: string; // Tanggal order / PO
  tanggalInvoice?: string; // Tanggal cetak / terbit invoice
  syaratPembayaran?: SyaratPembayaran; // COD, CBD, Tempo 7 Hari, Tempo 14 Hari, Tempo 30 Hari
  pelanggan: string;
  item: {
    finishGoodId?: string;
    namaPallet: string;
    tipeIspm?: 'Lokal' | 'Ekspor ISPM';
    jumlah: number;
    hargaSatuan: number;
    subtotal: number;
    jumlahInvoice?: number; // Qty yang akan dicetak di Invoice
  }[];
  subtotalHarga?: number; // Before tax
  tipePajak?: 'PPN' | 'Non PPN' | 'PPh' | 'PPN & PPh';
  ppnNominal?: number;
  pphNominal?: number;
  namaMarketing?: string;
  totalHarga: number;
  statusPO: 'Diterima' | 'Diproduksi' | 'Siap Kirim' | 'Selesai' | 'Dibatalkan';
  statusInvoice: 'Belum Bayar' | 'Lunas' | 'Jatuh Tempo';
  tanggalJatuhTempo?: string;
  catatan?: string;
}

export interface POSupplierItem {
  materialId?: string;
  kodeMaterial?: string;
  namaMaterial: string;
  ukuran?: string;
  kategori?: string;
  jumlah: number; // Qty Dipesan di PO
  jumlahDiterima?: number; // Qty yang benar-benar diterima fisik di gudang
  satuan: string;
  hargaSatuan: number;
  subtotal: number;
  subtotalDiterima?: number; // Nilai subtotal barang yang sudah diterima fisik
}

export interface PurchaseOrderSupplier {
  id: string;
  nomorPO: string; // e.g., PO-SUP/2026/09/001
  nomorRefSupplier?: string; // e.g. SPH-092/2026
  supplier: string; // Nama Vendor / Supplier
  alamatSupplier?: string;
  teleponSupplier?: string;
  picSupplier?: string;
  tanggal: string; // Tanggal order
  tanggalPengiriman?: string; // Tanggal estimasi tiba di pabrik
  syaratPembayaran: SyaratPembayaran; // COD, CBD, Tempo 7 Hari, Tempo 14 Hari, Tempo 30 Hari
  tanggalJatuhTempo: string;
  kategori: 'Bahan Baku Kayu' | 'Paku & Besi' | 'Sewa / Perbaikan Mesin' | 'Solar & Bahan Bakar' | 'Lainnya';
  items: POSupplierItem[];
  subtotal: number;
  tipePajak?: 'Non PPN' | 'PPN 11%' | 'PPh 23' | 'PPN & PPh';
  ppnNominal?: number;
  pphNominal?: number;
  biayaKirim?: number;
  totalHarga: number;
  totalNilaiDiterima?: number; // Total nilai riil barang yang diterima di gudang (dasar AP riil)
  tanggalDiterima?: string;
  penerimaGudang?: string;
  catatanPenerimaan?: string;
  statusPO: 'Draf' | 'Disetujui' | 'Dikirim Supplier' | 'Diterima Sebagian' | 'Diterima Gudang' | 'Selesai' | 'Dibatalkan';
  statusAP: 'Belum Lunas' | 'Sebagian' | 'Lunas';
  apId?: string; // Link ID to HutangUsaha (Laporan AP)
  nomorTagihanAP?: string; // e.g. AP-PO-SUP/2026/09/001
  catatan?: string;
  dibuatOleh: string; // Admin Sales / User
  createdAt: string;
}

export interface Customer {
  id: string;
  nama: string;
  alamat: string;
  telepon: string;
  email?: string;
  pic?: string;
  syaratPembayaran?: SyaratPembayaran; // Default TOP customer: COD, CBD, Tempo 7 Hari, Tempo 14 Hari, Tempo 30 Hari
  createdAt: string;
}

export interface Supplier {
  id: string;
  nama: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  pic?: string;
  kategoriDefault?: 'Bahan Baku Kayu' | 'Paku & Besi' | 'Sewa / Perbaikan Mesin' | 'Solar & Bahan Bakar' | 'Lainnya' | string;
  syaratPembayaranDefault?: SyaratPembayaran;
  bankInfo?: string; // Rekening / Info Pembayaran Vendor
  catatan?: string;
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
  metodePembayaran: 'Transfer Bank Mandiri' | 'Cash / Tunai' | string;
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
  status: 'Belum Lunas' | 'Lunas' | 'Sebagian' | 'Jatuh Tempo';
  riwayatBayar?: {
    tanggal: string;
    nominal: number;
    metode: string;
    catatan?: string;
  }[];
  poSupplierId?: string; // ID Purchase Order Supplier (jika berasal dari PO)
  nomorPO?: string; // Nomor PO Supplier referensi
}

export interface KasKecilItem {
  id: string;
  tanggal: string;
  kode?: string; // e.g. KK-001
  kodeTransaksi?: string;
  kategori: string;
  keterangan: string;
  tipe?: 'Masuk' | 'Keluar'; // Masuk = Pengisian kas kecil, Keluar = Pengeluaran
  jenis?: 'MASUK' | 'KELUAR';
  nominal: number;
  penerimaAtauPenyetor?: string;
  penerima?: string;
  buktiNota?: string;
}

export interface BukuBankItem {
  id: string;
  tanggal: string;
  kodeMutasi: string; // e.g. BNK-001
  namaBank?: string;
  bank?: 'Bank Mandiri' | string;
  nomorRekening?: string;
  tipe?: 'Masuk' | 'Keluar';
  jenis?: 'MASUK' | 'KELUAR';
  kategori?: string;
  keterangan: string;
  nominal: number;
  saldoSetelahnya?: number;
  nomorReferensi?: string;
  referensi?: string;
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

