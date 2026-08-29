import { HutangUsaha, KasKecilItem, BukuBankItem, AsetTetap, PajakItem } from '../types';

export const DEFAULT_HUTANG_INIT: HutangUsaha[] = [
  {
    id: 'ap-1',
    nomorTagihan: 'AP/MKN/2026/08/001',
    supplier: 'CV Sumber Rimba Makmur',
    tanggal: '2026-08-05',
    tanggalJatuhTempo: '2026-09-05',
    kategori: 'Bahan Baku Kayu',
    keterangan: 'Pengiriman Kayu Albasia Log 50 m3 untuk pallet ekspor',
    totalTagihan: 45000000,
    sudahDibayar: 20000000,
    sisaHutang: 25000000,
    status: 'Belum Lunas',
    riwayatBayar: [
      { tanggal: '2026-08-06', nominal: 20000000, metode: 'Transfer Bank BCA', catatan: 'DP 44%' }
    ]
  },
  {
    id: 'ap-2',
    nomorTagihan: 'AP/MKN/2026/08/002',
    supplier: 'PT Indo Paku Perkasa',
    tanggal: '2026-08-08',
    tanggalJatuhTempo: '2026-08-20',
    kategori: 'Paku & Besi',
    keterangan: 'Pembelian Paku Tembak Coil Nail Ring Shank 50 dus',
    totalTagihan: 8500000,
    sudahDibayar: 8500000,
    sisaHutang: 0,
    status: 'Lunas',
    riwayatBayar: [
      { tanggal: '2026-08-18', nominal: 8500000, metode: 'Transfer Bank BCA', catatan: 'Pelunasan faktur paku' }
    ]
  },
  {
    id: 'ap-3',
    nomorTagihan: 'AP/MKN/2026/08/003',
    supplier: 'CV Timber Log Lestari',
    tanggal: '2026-07-25',
    tanggalJatuhTempo: '2026-08-24',
    kategori: 'Bahan Baku Kayu',
    keterangan: 'Kayu Papan Mahoni Kering Oven 30 m3',
    totalTagihan: 36000000,
    sudahDibayar: 10000000,
    sisaHutang: 26000000,
    status: 'Jatuh Tempo',
    riwayatBayar: [
      { tanggal: '2026-07-26', nominal: 10000000, metode: 'Transfer Bank Mandiri', catatan: 'Uang muka pengiriman' }
    ]
  }
];

export const DEFAULT_KAS_KECIL_INIT: KasKecilItem[] = [
  {
    id: 'kk-1',
    tanggal: '2026-08-01',
    kode: 'KK-2026-08-001',
    kategori: 'Lainnya',
    keterangan: 'Pengisian Plafon Awal Kas Kecil Operasional Pabrik dari Bank BCA',
    tipe: 'Masuk',
    nominal: 5000000,
    penerimaAtauPenyetor: 'Finance (Kasir Pabrik)'
  },
  {
    id: 'kk-2',
    tanggal: '2026-08-04',
    kode: 'KK-2026-08-002',
    kategori: 'Konsumsi Tukang',
    keterangan: 'Konsumsi & kopi lembur tukang perakitan pallet PT Indofood',
    tipe: 'Keluar',
    nominal: 350000,
    penerimaAtauPenyetor: 'Mandor Budi'
  },
  {
    id: 'kk-3',
    tanggal: '2026-08-09',
    kode: 'KK-2026-08-003',
    kategori: 'BBM & Parkir',
    keterangan: 'BBM & e-Toll armada L300 kirim sample pallet ke Cikarang',
    tipe: 'Keluar',
    nominal: 250000,
    penerimaAtauPenyetor: 'Sopir Agus'
  },
  {
    id: 'kk-4',
    tanggal: '2026-08-14',
    kode: 'KK-2026-08-004',
    kategori: 'Alat Kerja Ringan',
    keterangan: 'Beli mata gergaji bandsaw darurat, sarung tangan & amplas',
    tipe: 'Keluar',
    nominal: 420000,
    penerimaAtauPenyetor: 'Bagian Maintenance'
  },
  {
    id: 'kk-5',
    tanggal: '2026-08-18',
    kode: 'KK-2026-08-005',
    kategori: 'Listrik & Air',
    keterangan: 'Token Listrik PLN Tambahan Workshop Perakitan 2',
    tipe: 'Keluar',
    nominal: 500000,
    penerimaAtauPenyetor: 'Finance / Kasir'
  },
  {
    id: 'kk-6',
    tanggal: '2026-08-22',
    kode: 'KK-2026-08-006',
    kategori: 'Kebersihan',
    keterangan: 'Perlengkapan sanitasi dan sabun pembersih workshop pabrik',
    tipe: 'Keluar',
    nominal: 180000,
    penerimaAtauPenyetor: 'Admin Umum'
  }
];

export const DEFAULT_BUKU_BANK_INIT: BukuBankItem[] = [
  {
    id: 'bnk-1',
    tanggal: '2026-08-01',
    kodeMutasi: 'MUT-BCA-001',
    namaBank: 'BCA (8820192831)',
    tipe: 'Masuk',
    kategori: 'Pelunasan Invoice',
    keterangan: 'Pelunasan Invoice INV/MKN/2026/08/101 dari PT Tirta Makmur',
    nominal: 45000000,
    nomorReferensi: 'INV-101'
  },
  {
    id: 'bnk-2',
    tanggal: '2026-08-06',
    kodeMutasi: 'MUT-BCA-002',
    namaBank: 'BCA (8820192831)',
    tipe: 'Keluar',
    kategori: 'Bayar Supplier Kayu',
    keterangan: 'DP Bahan Baku Kayu Log CV Sumber Rimba Makmur',
    nominal: 20000000,
    nomorReferensi: 'AP-001'
  },
  {
    id: 'bnk-3',
    tanggal: '2026-08-10',
    kodeMutasi: 'MUT-MND-001',
    namaBank: 'Mandiri (1370092819201)',
    tipe: 'Masuk',
    kategori: 'DP Pembeli',
    keterangan: 'Uang Muka 50% Order Pallet Ekspor PT Astra Agro',
    nominal: 60000000,
    nomorReferensi: 'PO-2026-004'
  },
  {
    id: 'bnk-4',
    tanggal: '2026-08-15',
    kodeMutasi: 'MUT-BCA-003',
    namaBank: 'BCA (8820192831)',
    tipe: 'Keluar',
    kategori: 'Gaji Tukang & Staf',
    keterangan: 'Payroll Gaji & Upah Borongan Tukang Pallet Periode I Agustus',
    nominal: 28500000,
    nomorReferensi: 'PAYROLL-08A'
  },
  {
    id: 'bnk-5',
    tanggal: '2026-08-18',
    kodeMutasi: 'MUT-MND-002',
    namaBank: 'Mandiri (1370092819201)',
    tipe: 'Keluar',
    kategori: 'Pajak & Operasional',
    keterangan: 'Pembayaran Solar Industri Boiler Oven Kiln Dry & Genset',
    nominal: 14500000,
    nomorReferensi: 'SLR-0818'
  }
];

export const DEFAULT_ASET_INIT: AsetTetap[] = [
  {
    id: 'ast-1',
    kodeAset: 'AST-MKN-001',
    namaAset: 'Mesin Four-Side Planer Woodworking (Serut 4 Sisi)',
    kategori: 'Mesin Produksi',
    tanggalPerolehan: '2024-01-15',
    hargaPerolehan: 145000000,
    masaManfaatTahun: 8,
    nilaiResidu: 15000000,
    akumulasiPenyusutan: 42250000,
    nilaiBuku: 102750000,
    penyusutanPerBulan: 1354166,
    lokasi: 'Line Produksi 1 (Workshop A)',
    kondisi: 'Sangat Baik'
  },
  {
    id: 'ast-2',
    kodeAset: 'AST-MKN-002',
    namaAset: 'Chamber Oven Kiln Dry ISPM 15 (Kapasitas 1.200 Pallet)',
    kategori: 'Peralatan Pabrik',
    tanggalPerolehan: '2023-06-10',
    hargaPerolehan: 220000000,
    masaManfaatTahun: 10,
    nilaiResidu: 20000000,
    akumulasiPenyusutan: 63333333,
    nilaiBuku: 156666667,
    penyusutanPerBulan: 1666666,
    lokasi: 'Area Heat Treatment ISPM 15',
    kondisi: 'Sangat Baik'
  },
  {
    id: 'ast-3',
    kodeAset: 'AST-MKN-003',
    namaAset: 'Forklift Diesel TCM Heavy Duty 3.5 Ton',
    kategori: 'Kendaraan Operasional',
    tanggalPerolehan: '2024-05-20',
    hargaPerolehan: 175000000,
    masaManfaatTahun: 5,
    nilaiResidu: 25000000,
    akumulasiPenyusutan: 37500000,
    nilaiBuku: 137500000,
    penyusutanPerBulan: 2500000,
    lokasi: 'Loading Dock & Gudang Kayu',
    kondisi: 'Baik'
  },
  {
    id: 'ast-4',
    kodeAset: 'AST-MKN-004',
    namaAset: 'Mesin Bandsaw Otomatis Pembelah Log Kayu',
    kategori: 'Mesin Produksi',
    tanggalPerolehan: '2024-03-01',
    hargaPerolehan: 85000000,
    masaManfaatTahun: 5,
    nilaiResidu: 10000000,
    akumulasiPenyusutan: 21250000,
    nilaiBuku: 63750000,
    penyusutanPerBulan: 1250000,
    lokasi: 'Area Sawmill Kayu Log',
    kondisi: 'Baik'
  },
  {
    id: 'ast-5',
    kodeAset: 'AST-MKN-005',
    namaAset: 'Truk Tronton Hino Ranger Wingbox 24 Ton',
    kategori: 'Kendaraan Operasional',
    tanggalPerolehan: '2023-10-15',
    hargaPerolehan: 420000000,
    masaManfaatTahun: 8,
    nilaiResidu: 60000000,
    akumulasiPenyusutan: 127500000,
    nilaiBuku: 292500000,
    penyusutanPerBulan: 3750000,
    lokasi: 'Pool Armada Pengiriman',
    kondisi: 'Baik'
  },
  {
    id: 'ast-6',
    kodeAset: 'AST-MKN-006',
    namaAset: 'Bangunan Gudang & Workshop Fabrikasi Pallet (1.500 m2)',
    kategori: 'Bangunan & Fasilitas',
    tanggalPerolehan: '2022-01-01',
    hargaPerolehan: 950000000,
    masaManfaatTahun: 20,
    nilaiResidu: 150000000,
    akumulasiPenyusutan: 186666666,
    nilaiBuku: 763333334,
    penyusutanPerBulan: 3333333,
    lokasi: 'Kawasan Industri Pabrik Pallet',
    kondisi: 'Sangat Baik'
  }
];

export const DEFAULT_PAJAK_INIT: PajakItem[] = [
  {
    id: 'pjk-1',
    tanggal: '2026-08-05',
    nomorFaktur: 'FP-010.000-26.00000101',
    jenisPajak: 'PPN Keluaran 11%',
    lawanTransaksi: 'PT Tirta Makmur Sentosa',
    dpp: 45000000,
    tarifPersen: 11,
    nominalPajak: 4950000,
    statusBayarLapor: 'Sudah Lapor SPT',
    masaPajak: 'Agustus 2026',
    keterangan: 'Faktur Pajak Penjualan 400 pcs Pallet Standar ISPM 15'
  },
  {
    id: 'pjk-2',
    tanggal: '2026-08-10',
    nomorFaktur: 'FP-010.000-26.00000102',
    jenisPajak: 'PPN Keluaran 11%',
    lawanTransaksi: 'PT Fast Food Logistik Nusantara',
    dpp: 105000000,
    tarifPersen: 11,
    nominalPajak: 11550000,
    statusBayarLapor: 'Belum Lapor',
    masaPajak: 'Agustus 2026',
    keterangan: 'Faktur Pajak Penjualan 750 pcs Pallet Heavy Duty Dua Arah'
  },
  {
    id: 'pjk-3',
    tanggal: '2026-08-08',
    nomorFaktur: 'FP-020.000-26.00000852',
    jenisPajak: 'PPN Masukan 11%',
    lawanTransaksi: 'PT Indo Paku Perkasa',
    dpp: 8500000,
    tarifPersen: 11,
    nominalPajak: 935000,
    statusBayarLapor: 'Sudah Lapor SPT',
    masaPajak: 'Agustus 2026',
    keterangan: 'Faktur Pajak Masukan Pembelian Paku Coil & Ring Shank'
  },
  {
    id: 'pjk-4',
    tanggal: '2026-08-15',
    nomorFaktur: 'PPH21-MKN-202608',
    jenisPajak: 'PPh 21 (Upah/Gaji)',
    lawanTransaksi: 'Karyawan & Tukang Fabrikasi Kayu',
    dpp: 35000000,
    tarifPersen: 5,
    nominalPajak: 1750000,
    statusBayarLapor: 'Lunas Bayar',
    masaPajak: 'Agustus 2026',
    keterangan: 'Pemotongan PPh 21 Masa Agustus 2026 Tenaga Kerja Borongan'
  },
  {
    id: 'pjk-5',
    tanggal: '2026-08-18',
    nomorFaktur: 'PPH23-MKN-202608',
    jenisPajak: 'PPh 23 (Jasa)',
    lawanTransaksi: 'Badan Sertifikasi Barantan ISPM 15',
    dpp: 12000000,
    tarifPersen: 2,
    nominalPajak: 240000,
    statusBayarLapor: 'Belum Lapor',
    masaPajak: 'Agustus 2026',
    keterangan: 'PPh 23 Jasa Audit & Kalibrasi Sensor Suhu Ruang Oven Heat Treatment'
  }
];
