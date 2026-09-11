export default {
  tabs: {
    dashboard: 'Beranda',
    history: 'Mutasi',
    wallets: 'Akun',
    settings: 'Pengaturan'
  },
  settings: {
    title: 'Pengaturan',
    sections: {
      financial: 'Preferensi Finansial & Hitungan',
      appearance: 'Tampilan & Bahasa',
      notifications: 'Notifikasi & Pengingat',
      data: 'Data & Cadangan',
      about: 'Tentang Aplikasi'
    },
    currency: {
      title: 'Mata Uang Utama',
      desc: 'Mata uang acuan seluruh pencatatan dan estimasi',
      modalTitle: 'Pilih Mata Uang Utama',
      modalSubtitle: 'Basis mata uang untuk semua kalkulasi dan pencatatan',
    },
    payday: {
      title: 'Tanggal Siklus Gajian',
      desc: 'Tanggal gajian bulanan untuk batas belanja aman',
      valueFormat: 'Setiap tanggal {day}',
      modalTitle: 'Pilih Tanggal Gajian',
      modalSubtitle: 'Digunakan untuk menghitung batas belanja aman harian',
    },
    burnWindow: {
      title: 'Rentang Analisis Pengeluaran',
      desc: 'Jumlah hari untuk menghitung rata-rata belanja harian',
      days: '{days} Hari',
      hint7: '⚡ Responsif — Cocok jika kamu sedang berhemat ketat dan ingin melihat hasilnya lebih cepat.',
      hint14: '⚖️ Seimbang (Disarankan) — Menyeimbangkan belanja akhir pekan agar perkiraan keuanganmu tetap tenang dan wajar.',
      hint30: '🛡️ Stabil — Gambaran jangka panjang yang tidak mudah terpengaruh belanja sesaat.',
    },
    burnWindowExplainer: {
      title: 'Rentang Analisis Pengeluaran',
      subtitle: 'Pilih periode yang paling sesuai dengan pola hidup dan kestabilan keuanganmu',
      days7: {
        title: '7 Hari (Responsif / Cepat)',
        desc: 'Hanya melihat pola belanja dalam satu minggu terakhir.',
        pros: 'Kelebihan: Cepat menyesuaikan jika kamu baru saja mulai berhemat ketat.',
        cons: 'Kekurangan: Cukup sensitif terhadap pengeluaran sesekali di akhir pekan.',
      },
      days14: {
        title: '14 Hari (Standar / Seimbang)',
        desc: 'Menggabungkan dua siklus akhir pekan untuk estimasi yang lebih seimbang.',
        pros: 'Kelebihan: Menyeimbangkan belanja akhir pekan dan tetap cukup cepat menangkap perubahan pola hidup.',
        cons: 'Kekurangan: Butuh sekitar 1-2 minggu sebelum penghematan barumu terlihat nyata di ketahanan kas.',
      },
      days30: {
        title: '30 Hari (Stabil / Jangka Panjang)',
        desc: 'Mencakup satu bulan penuh termasuk fluktuasi awal dan akhir bulan.',
        pros: 'Kelebihan: Sangat tenang dan stabil, tidak gampang terpengaruh belanja impulsif sesaat.',
        cons: 'Kekurangan: Butuh waktu lebih lama untuk mencerminkan perubahan drastis pada kebiasaan belanjamu.',
      },
    },
    fallbackBurn: {
      title: 'Patokan Belanja Harian Awal',
      desc: 'Estimasi sementara saat riwayat belanja masih di bawah 5 hari',
      modalTitle: 'Ubah Patokan Belanja Awal',
      modalSubtitle: 'Digunakan sementara saat data transaksi masih di bawah 5 hari',
      presets: 'Pilihan Cepat',
      inputPlaceholder: 'Nominal per hari',
      save: 'Simpan Patokan',
    },
    dualRunway: {
      title: 'Sertakan Tabungan Brankas',
      desc: 'Lihat berapa lama uangmu bertahan jika tabungan darurat ikut dipakai'
    },
    language: {
      title: 'Bahasa Aplikasi',
      desc: 'Pilih bahasa tampilan antarmuka',
      auto: 'Auto',
      id: 'ID',
      en: 'EN',
      autoHint: 'Mengikuti bahasa default sistem perangkat.',
      idHint: 'Bahasa Indonesia aktif.',
      enHint: 'Bahasa Inggris (English) aktif.',
    },
    theme: {
      title: 'Mode Warna',
      desc: 'Pilih skema warna antarmuka',
      auto: 'Auto',
      light: 'Terang',
      dark: 'Gelap',
      autoHint: 'Mengikuti setelan tema tampilan sistem perangkat.',
      lightHint: 'Tema terang (Botanical Linen) aktif.',
      darkHint: 'Tema gelap (Deep Cypress) aktif.',
    },
    privacy: {
      title: 'Mode Privasi',
      desc: 'Samarkan nominal angka saldo di layar umum'
    },
    notificationHour: {
      title: 'Jam Pengingat Harian',
      desc: 'Pengingat refleksi keuangan setiap malam',
      format: 'Pukul {hour}:00'
    },
    exportCsv: {
      title: 'Ekspor Mutasi ke CSV',
      desc: 'Unduh seluruh riwayat mutasi untuk arsip atau analisis',
      button: 'Ekspor File CSV',
      exporting: 'Menyiapkan CSV...',
      success: 'File CSV berhasil diekspor!',
      noData: 'Belum ada riwayat mutasi untuk diekspor.'
    },
    resetDemo: {
      title: 'Muat Ulang Data Demo',
      desc: 'Kembalikan data simulasi transaksi dan akun contoh',
      button: 'Muat Demo',
      confirmTitle: 'Muat Ulang Data Demo?',
      confirmDesc: 'Semua transaksi saat ini akan diganti dengan paket data contoh simulasi.',
      confirmButton: 'Ya, Muat Ulang Demo'
    },
    clearData: {
      title: 'Kosongkan Semua Mutasi',
      desc: 'Hapus seluruh riwayat transaksi dan mulai dari nol',
      button: 'Hapus Mutasi',
      confirmTitle: 'Kosongkan Semua Mutasi?',
      confirmDesc: 'Tindakan ini permanen. Seluruh mutasi akan dihapus dan saldo dompet dinolkan.',
      confirmButton: 'Hapus Permanen'
    },
    aboutInfo: {
      version: 'Versi Aplikasi',
      storage: 'Penyimpanan',
      storageDesc: 'Lokal Mandiri (SQLite WAL On-Device)',
      tagline: 'Ketahanan Finansial & Runway Kas Harian'
    }
  },
  explainer: {
    title: 'Rentang Analisis Pengeluaran',
    subtitle: 'Kelebihan & Kekurangan Pilihan Hari',
    howItWorks: 'Aplikasi menghitung rata-rata belanja harianmu dari transaksi non-rutin selama periode hari yang kamu pilih. Angka ini digunakan untuk memprediksi berapa hari sisa uangmu akan bertahan.',
    option7Title: '7 Hari (Paling Responsif)',
    option7Pros: 'Sangat cepat mendeteksi efek penghematan baru atau perubahan gaya hidup mendadak.',
    option7Cons: 'Angka sisa napas uang bisa fluktuatif hanya karena belanja agak banyak di akhir pekan.',
    option7Fit: 'Cocok jika kamu sedang berhemat ketat dan ingin melihat dampak hari demi hari.',
    option14Title: '14 Hari (Standar & Seimbang)',
    option14Badge: 'Disarankan',
    option14Pros: 'Meredam lonjakan belanja mingguan tanpa kehilangan kepekaan membaca tren baru.',
    option14Cons: 'Perubahan gaya hidup baru butuh waktu 1–2 minggu agar tercermin penuh di indikator.',
    option14Fit: 'Paling pas untuk rutinitas belanja sehari-hari sebagian besar orang.',
    option30Title: '30 Hari (Paling Stabil)',
    option30Pros: 'Proyeksi ketahanan kas sangat stabil dan tenang, tidak mudah goyang oleh satu kali belanja sesaat.',
    option30Cons: 'Lambat membaca kebiasaan boros atau hemat yang baru saja dimulai minggu ini.',
    option30Fit: 'Cocok bagi yang ingin proyeksi jangka panjang atau berpola belanja bulanan teratur.',
    close: 'Mengerti'
  },
  common: {
    cancel: 'Batal',
    save: 'Simpan',
    confirm: 'Konfirmasi',
    close: 'Tutup',
    loading: 'Memuat...',
    search: 'Cari...'
  }
};
