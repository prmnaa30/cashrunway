# CashRunway (Runway Finance) - Implementation Plan & Progress Tracking

> **Ringkasan Produk:**  
> CashRunway adalah aplikasi pencatatan keuangan personal *offline-first* berbasis ketahanan kas (*runway engine*) untuk memproyeksikan tanggal habisnya kas secara presisi dan dinamis tanpa batasan siklus bulanan kaku.

---

## 🛠️ Tech Stack Resmi

| Layer | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | **Expo SDK 57** (React Native 0.86.3, React 19) | TypeScript, Expo Router v4 (Tabs) |
| **Styling & Design System** | **NativeWind v4** (Tailwind CSS v3.4.19) | Dual Theme: *Botanical Linen* (Light) & *Deep Cypress* (Dark) |
| **UI Kit & Primitives** | **React Native Reusables** (`@rn-primitives`) | `class-variance-authority`, `clsx`, `tailwind-merge` |
| **Icons** | **`lucide-react-native`** | SVG Icons murni untuk navigasi dan kontrol UI |
| **Animasi Sentuh** | **`react-native-reanimated`** (v4.5.1) | Haptic/spring physics tactile buttons |
| **State Management** | **Zustand** (v5) | Reaktif untuk tema, mata uang, dan privacy mode |
| **Database Engine** | **`expo-sqlite`** (SDK 57) | Native SQLite engine dengan 5 Triggers otomatis & WAL mode |
| **ORM & Query Builder** | **`drizzle-orm`** (v0.45+) + **`drizzle-kit`** | Type-safe schema, relational queries, Drizzle Studio |

---

## 🚦 Status Pengembangan (Development Progress)

```
[Fase 1: Done] ──► [Fase 2: Done] ──► [Fase 3: Done] ──► [Fase 4: Done] ──► [Fase 5: Done] ──► [Fase 6: Done] ──► [Fase 7: Done] ──► [Fase 8: Done] ──► [Fase 9: Done]
```

- [x] **Fase 1: Scaffold Proyek & Setup Design System** *(Selesai)*
- [x] **Fase 2: Database Layer & SQLite Triggers (Drizzle ORM Core)** *(Selesai)*
- [x] **Fase 3: Financial Engine (Runway, Burn Rate, Safe Spend, & Vault Accrual)** *(Selesai)*
- [x] **Fase 4: Antarmuka Dasbor & Layar Utama (Modular Architecture)** *(Selesai)*
- [x] **Fase 5: Bottom Sheet Quick Entry & Keypad Mini-Kalkulator** *(Selesai)*
- [x] **Fase 6: Manajemen Rekening & Tabungan (CRUD Dompet, Brankas, Soft Delete, Custom Tax, & Yield Terdesentralisasi)** *(Selesai)*
- [x] **Fase 7: Pengaturan, Internasionalisasi (i18n), & Ekspor Data** *(Selesai)*
- [x] **Fase 8: Integrasi Perangkat Keras OS & Polish Aksesibilitas** *(Selesai)*
- [x] **Fase 9: Auto Google Drive Backup, Import Backup (Google Drive & CSV)** *(Selesai)*

---

## 📦 Rincian Fase yang Telah Selesai

### [COMPLETED] Fase 1: Scaffold Proyek & Setup Design System
- **Scaffold:** Inisialisasi Expo Router dengan template tab (`app/(tabs)/`).
- **Styling:** Setup NativeWind v4 (`global.css`, `tailwind.config.js`, `metro.config.js`).
- **Palet Warna:**
  - *Deep Cypress* (`#0C1513`, surface: `#13211D`, card: `#192B26`, border: `#233A34`)
  - *Botanical Linen* (`#F2F6F4`, surface: `#FFFFFF`, card: `#E8EFEA`, border: `#D0DDD7`)
  - *Accents:* Champagne Gold (`#D4AF37`) & Burnished Brass (`#B8860B`)
- **Komponen UI:** `Button`, `Badge`, `Card`, `Separator` berbasis `class-variance-authority`.
- **Navigasi & Animasi:** Tombol Quick Add tengah Reanimated (`AnimatedAddButton`) dengan *spring physics* pada `app/(tabs)/_layout.tsx`.
- **Formatters & Store:**
  - `lib/format.ts`: `formatCurrency` universal multi-currency (IDR, USD, EUR, dsb.) dengan sensor nominal *Privacy Mode*.
  - `store/useSettingStore.ts`: Zustand store untuk tema, mata uang, dan privacy toggle.

### [COMPLETED] Fase 2: Database Layer & SQLite Triggers (Drizzle ORM Core)
- **Instalasi:** `expo-sqlite`, `drizzle-orm`, dan `drizzle-kit`.
- **Konfigurasi:** `drizzle.config.ts` untuk inspeksi Drizzle Studio.
- **Skema Drizzle & Triggers (`lib/db/schema.ts`):**
  - `wallets`: id, name, type (cash/bank/ewallet), balance, isVault, isInterestEnabled, interestRate, interestPeriod, payoutDay, autoTax, lastAccruedDate.
  - `categories`: id, name, type (income/expense), icon (emoji HP), isFixed, isDefault.
  - `recurringBills`: id, name, amount, dueDay (1-31), categoryId, walletId, lastPaidPeriod (YYYY-MM), isActive.
  - `transactions`: id, type (income/expense/transfer/adjustment), amount, fee, walletId, targetWalletId, categoryId, recurringBillId, isOutlier, date (ISO), localDate, note.
  - `settings`: id, targetDate, paydayDay, fallbackDailyBurn, burnWindowDays, notificationHour, language, isPrivacyMode, dualRunwayMode.
- **5 SQLite Triggers (Level Engine Native):**
  1. `trg_tx_expense_insert`: Potong saldo dompet asal otomatis saat expense dicatat.
  2. `trg_tx_income_insert`: Tambah saldo dompet asal saat income dicatat.
  3. `trg_tx_transfer_insert`: Potong `(amount + fee)` dari asal dan tambah `amount` ke tujuan.
  4. `trg_tx_adjustment_insert`: Setel `balance` dompet langsung sesuai saldo fisik nyata.
  5. `trg_tx_delete`: Rollback mutasi saldo secara presisi saat baris transaksi dihapus.
- **Seed Bawaan (`lib/db/seed.ts`):**
  - Kategori bawaan emoji (5 pengeluaran variabel, 5 pengeluaran tetap, 4 pemasukan).
  - 4 Dompet bawaan: Tunai Saku, BCA Tahapan, GoPay, dan SeaBank Vault (3.75% p.a. harian).
  - Pengaturan default (payday 25, fallback burn Rp 50.000, window 14 hari).
- **Client & Provider (`lib/db/index.ts` & `app/_layout.tsx`):**
  - Inisialisasi koneksi `drizzle(expoDb, { schema })`.
  - Terintegrasi via `<SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>` dengan proteksi singleton promise dan mode WAL.

### [COMPLETED] Fase 3: Financial Engine (Runway, Burn Rate, Safe Spend, & Vault Accrual)
- **`lib/engine/burnRate.ts`**:
  - `calculateRollingBurnRate`:
    - $\text{Effective } N = \max(1, \min(\text{burn\_window\_days}, \text{Hari Sejak Transaksi Pertama} + 1))$.
    - Pengecualian transaksi `is_outlier = 1` dan kategori `is_fixed = 1`.
    - Pemasukan biaya admin transfer (`fee`) ke pengeluaran variabel.
    - Penanganan *cold start*: jika riwayat transaksi $< 5\text{ hari}$, gunakan `fallback_daily_burn`.
- **`lib/engine/runway.ts`**:
  - `calculateDiscreteRunway`:
    - Mesin simulasi diskret harian ($O(K)$ calendar simulation loop, horizon maksimal 1095 hari / 3 tahun).
    - Pengurangan `dailyBurnRate` setiap hari.
    - Pengurangan tagihan tetap sesuai `due_day` dengan penjepit tanggal akhir bulan (*clamped due day* untuk bulan 28/30 hari).
    - Proteksi *double counting* tagihan bulan berjalan jika sudah terbayar (`last_paid_period == current_period`).
    - Dual Runway: *Runway Operasional* (hanya kas aktif) vs *Emergency Runway* (kas aktif + total vault).
    - Guard clause untuk saldo defisit $\le 0$ atau daily burn = 0.
- **`lib/engine/safeSpend.ts`**:
  - `calculateSafeDailySpend`:
    - *Auto-advancing target payday* (jika hari ini $\ge \text{payday\_day}$, target otomatis bergeser ke bulan berikutnya).
    - $\text{Base Daily Allowance} = \max\left(0, \frac{\text{Saldo Kas Aktif Awal Hari} - \text{Tagihan Belum Lunas s/d Target}}{\text{Hari Tersisa Menuju Target}}\right)$.
    - $\text{Sisa Jatah Hari Ini} = \text{Base Daily Allowance} - \sum \text{Belanja Variabel Hari Ini}$.
- **`lib/engine/vaultAccrual.ts`**:
  - `calculateVaultAccrual`:
    - Bunga harian kotor: $\text{Saldo} \times \frac{\text{bunga\_pa}}{365}$.
    - Pajak bunga PPh Final 20% otomatis jika saldo $> \text{Rp } 7.500.000$ dan `auto_tax = 1`.
    - *Offline Catch-up Engine*: kalkulasi akumulasi hari yang terlewat dan pembuatan transaksi konsolidasi `type = 'income'`.
- **Unit Tests (`lib/engine/__tests__/`):**
  - 30 unit tests Vitest lolos 100% mencakup burn rate, simulasi runway kabisat/akhir bulan, proteksi double-counting, dan bunga akrual.

### [COMPLETED] Fase 4: Antarmuka Dasbor, Riwayat, & Dompet (Modular Architecture)
- **Zustand Finance Store (`store/useFinanceStore.ts`)**:
  - Terkoneksi penuh dengan database Drizzle SQLite dan kalkulasi engine matematika.
  - *Memory Fast-Path Cache*: navigasi instan 0ms antar-tab tanpa re-query SQLite atau kalkulasi berulang di JS thread.
- **Komponen Dasbor Modular (`components/dashboard/` & `app/(tabs)/index.tsx`)**:
  - `RunwayHeroCard`: Meteran sisa hari, tanggal proyeksi habis, status Traffic Light, segmented horizon bar (0–60+ hari), dan Reanimated spring sliding pill untuk beralih Kas Harian vs + Tabungan.
  - `SafeSpendCard`: Sisa jatah belanja hari ini, badge status (*Masih Aman* / *Kelewatan*), progress bar belanja harian, alokasi tagihan rutin, dan hitung mundur gajian.
  - `LiquidityBar`: Pembagian kas siap pakai (*Emerald Green*) vs tabungan (*Champagne Gold*) berkontras tinggi.
- **Komponen Riwayat Mutasi Modular (`components/history/` & `app/(tabs)/history.tsx`)**:
  - `TransactionGroup` & `TransactionItem`: Daftar mutasi terkelompok berdasarkan tanggal (`local_date`) dengan header harian, badge kategori emoji, dan badge anomali.
  - `DeleteTransactionModal`: Dialog konfirmasi hapus transaksi terpusat di tengah layar dengan animasi instan Reanimated (0ms delay) dan jaminan pemulihan saldo otomatis (*rollback trigger*).
- **Komponen Dompet & Tabungan Modular (`components/wallets/` & `app/(tabs)/wallets.tsx`)**:
  - `WalletCard`: Rincian saldo dan persentase kontribusi dompet operasional.
  - `VaultYieldCard`: Estimasi bunga bersih harian, proyeksi bulanan & tahunan, dan tombol klaim bunga tabungan tertunda.
  - `VaultCard`: Rekening tabungan dengan suku bunga p.a. dan status pajak bunga otomatis.

### [COMPLETED] Fase 5: Bottom Sheet Quick Entry & Keypad Mini-Kalkulator
- **Kalkulator Mini Bebas `eval()` (`lib/utils/calculator.ts`)**:
  - Penanganan token numerik, pintasan `000`, operator `+`, `-`, `=`, `backspace`, dan `clear`.
  - Proteksi batas nominal transaksi (`MAX_TRANSACTION_AMOUNT`) dan pencegahan operator bertumpuk.
  - 15 unit tests Vitest lolos 100%.
- **Keypad Tactile 4x4 Ultra-Responsif (`components/entry/CalculatorKeypad.tsx`)**:
  - Pendaftaran input pada touch-down (`onPressIn`) untuk latensi mekanis 0ms (setara dialer/kalkulator native smartphone).
  - Animasi visual sentuhan native hardware-accelerated via `android_ripple` pada OS UI thread (bebas beban JS thread).
  - Tombol simpan reaktif dinamis yang aktif hanya jika nominal valid dan relasi akun/kategori terpenuhi.
  - Tombol dimemoisasi penuh dengan `<KeyDigit>` agar tidak me-render ulang saat mengetik.
- **Komponen Modular Quick Entry (`components/entry/`)**:
  - `ModeSelector`: Segmented switch 3 mode (Pengeluaran, Pemasukan, Transfer) dengan aksen semantik.
  - `AmountDisplay`: Tampilan nominal besar, kursor berkedip (*blinking cursor*), dan wadah indikator ekspresi tetap untuk mencegah *layout shift*.
  - `MetadataBar`: Chip aksi seimbang untuk dompet asal, dompet tujuan, kategori, tanggal, anomali, catatan, dan biaya transfer.
  - **Sistem 5 Sub-Picker Modals Terisolasi**:
    - `WalletPickerModal`: Pemilih dompet asal & tujuan yang dapat di-scroll lancar tanpa mengganggu bottom sheet.
    - `CategoryPickerModal`: Grid picker kategori ber-emoji yang tersinkronisasi dengan database.
    - `DatePickerModal`: Pilihan cepat (Hari ini, Kemarin, Lusa) serta custom date stepper (Tanggal, Bulan, Tahun).
    - `FeePickerModal`: Preset biaya admin transfer (Gratis, Rp 2.500, Rp 6.500, dll) serta input custom fee.
    - `NoteInputModal`: Input catatan fleksibel dengan `KeyboardAvoidingView` yang tidak tertutup keyboard HP.
- **Integrasi Bottom Sheet & Database (`components/entry/QuickEntrySheet.tsx` & `app/(tabs)/_layout.tsx`)**:
  - Didukung `@gorhom/bottom-sheet` v5 dengan `enableDynamicSizing={true}` yang presisi memeluk keypad (*snug-fit* tanpa ruang kosong).
  - **Pre-Mounted di Index -1**: Sheet selalu siap di memori sehingga terbuka seketika pada frame ke-0 (0ms cold start) saat tombol `+` ditekan di navbar.
  - **Backdrop Touch Clamping**: Area klik penutup sheet dibatasi secara dinamis hanya pada area gelap di atas sheet (`height: animatedPosition.value`), mencegah sentuhan pada header atau nominal display tembus ke backdrop.
  - Penahanan over-drag 0px dan penonaktifan pan vertikal ke atas agar swipe up tidak menutup sheet secara tidak sengaja.
  - Aksi `addTransaction` pada Zustand store memicu SQLite trigger untuk mutasi saldo dompet otomatis, diikuti refresh reaktif seluruh metrik runway.


---

### [COMPLETED] Fase 6: Manajemen Rekening & Tabungan (CRUD Dompet, Brankas, Soft Delete, Custom Tax, & Yield Terdesentralisasi)
- **Database Layer & Soft Delete (`lib/db/schema.ts`, `lib/db/index.ts`)**:
  - Kolom `deleted_at: text('deleted_at')` untuk soft deletion dengan timestamp ISO. Migrasi aman otomatis via `initDatabase`.
  - Kolom `tax_rate`, `tax_threshold`, dan `auto_tax` dinamis per akun tabungan brankas (menggantikan aturan kaku pajak bunga flat 20% > Rp 7.500.000).
  - Fungsi `insertWallet`: Pendaftaran dompet baru dengan inisialisasi saldo awal transparan via trigger `trg_tx_adjustment_insert`.
  - Fungsi `softDeleteWallet` & `restoreWallet`: Menghapus dompet secara aman tanpa merusak integritas referensial atau memicu rollback mutasi masa lalu.
  - `getWallets`: Secara default hanya mengembalikan akun aktif (`deleted_at IS NULL`).
- **Financial Calculation Engine (`lib/engine/vaultAccrual.ts`)**:
  - Dukungan tarif pajak bunga kustom (`taxRate`) dan batas saldo bebas pajak (`taxThreshold`) per tabungan dengan preset: Bank Indonesia (20% > Rp7,5jt), Bebas Pajak (0%), dan Kustom.
- **Zustand Finance Store (`store/useFinanceStore.ts`)**:
  - Aksi `createWallet`, `editWallet`, `adjustBalance`, `removeWallet`.
  - Aksi `applyVaultAccrualForWallet(walletId)` untuk mengeksekusi klaim akrual bunga mandiri per rekening tabungan secara independen tanpa memengaruhi tabungan lain.
- **Desentralisasi Bunga ke Kartu Tabungan (`components/wallets/VaultCard.tsx`)**:
  - Menghitung dan menampilkan estimasi bunga bersih harian spesifik per akun (`+Rp X/hari`).
  - Tombol aksi *"Ambil Bunga ({missedDays} hari) +Rp Y"* beranimasi Reanimated tactile langsung di dalam kartu tabungan terkait jika terdapat bunga tertunda.
- **Penyederhanaan `VaultYieldCard.tsx`**:
  - Berfungsi murni sebagai kartu ringkasan portofolio simpanan (*Portfolio Overview Card*) tanpa tombol klaim global yang berantakan (*uncluttered*).
- **Komponen Interaktif Modular (`components/wallets/`)**:
  - `WalletFormSheet.tsx`: Bottom sheet Tambah & Edit dompet/tabungan berbasis Reanimated decoupled worklet (durasi 380ms, backdrop fade statis, dan gestur pan-to-dismiss) dengan pilihan tipe (Bank, E-Wallet, Tunai) dan konfigurasi pajak bunga dinamis.
  - `AdjustBalanceModal.tsx`: Modal dialog tengah (`<Modal animationType="fade">`) dengan copywriting alami (*"Perbarui saldo akun {wallet} agar sesuai dengan jumlah yang sebenarnya"*), kartu perbandingan saldo tercatat vs saldo nyata, dan kalkulasi selisih delta otomatis.
  - `DeleteWalletModal.tsx`: Modal dialog tengah konfirmasi soft delete dengan peringatan saldo tersisa dan jaminan keamanan riwayat transaksi.
  - `WalletActionMenuModal.tsx`: Bottom sheet menu aksi cepat berbasis Reanimated decoupled worklet (durasi 380ms, backdrop fade statis, dan gestur pan-to-dismiss) untuk Ubah Informasi, Sesuaikan Saldo, dan Hapus/Arsipkan.
- **Integrasi Antarmuka (`app/(tabs)/wallets.tsx`)**:
  - Tombol "+ Tambah" di header layar yang responsif terhadap tab aktif (Uang Harian vs Tabungan).
  - Segmented tab switcher dengan animasi sliding pill halus tanpa efek jelly berlebihan.
  - Penempatan modal dan sheet sebagai *sibling* di luar `<ScrollView>` untuk jaminan rendering dan penanganan sentuhan 100% stabil.
- **Unit Tests (`lib/engine/__tests__/`)**:
  - `walletDb.test.ts`: Validasi aturan soft delete, query `deleted_at IS NULL`, dan penyesuaian delta saldo.
  - `vaultAccrualPerWallet.test.ts`: Validasi isolasi akrual bunga mandiri antar-rekening tabungan dan penerapan custom tax rate/threshold.
  - `vaultAccrual.test.ts`: Validasi kalkulasi bunga harian dan formula pajak.
  - 55 unit tests Vitest lolos 100%.

---

## 📋 Panduan Fase Berikutnya

---

### [COMPLETED] Fase 7: Pengaturan, Internasionalisasi (i18n), Ekspor Data, & Kategori Kustom
- **Sistem Internasionalisasi & Lokalisasi (`lib/i18n/`)**:
  - Deteksi bahasa perangkat otomatis via `expo-localization` dengan fallback aman ke Bahasa Indonesia.
  - Dukungan dwibahasa penuh (Bahasa Indonesia `id` dan English `en`) pada seluruh copywriting antarmuka, format tanggal, dan label transaksi.
  - Pemilih bahasa interaktif di Pengaturan dengan opsi `Otomatis`, `Indonesia`, dan `English`.
- **Ekspor Data & Backup CSV (`lib/export/csvExport.ts`)**:
  - Generator CSV compliant RFC 4180 dengan sanitasi teks dan kutipan otomatis.
  - Integrasi native `expo-file-system` dan `expo-sharing` untuk unduh dan bagikan dokumen mutasi keuangan.
  - Tombol aksi ekspor beraksen *Botanical Emerald* harmonis di Pengaturan.
- **Pengaturan Lengkap Aplikasi (`app/(tabs)/settings.tsx` & `components/settings/`)**:
  - Pengaturan Mata Uang (`CurrencyPickerModal.tsx`): Dukungan IDR, USD, EUR, SGD, MYR, JPY, GBP, AUD.
  - Pengaturan Siklus Gajian (`PaydayPickerModal.tsx`): Grid kalender 1–31 dengan penanda aktif tegas *Solid Deep Cypress*.
  - Pemilih Jendela Analisis Burn Rate (`7`, `14`, `30` hari) dilengkapi panduan (*BurnWindowExplainerSheet.tsx*).
  - Penyesuaian Estimasi Pengeluaran Harian Cadangan (*FallbackBurnSheet.tsx*) dengan preset chip cepat.
  - Opsi Keamanan & Manajemen Data:
    - `Reload Demo Data`: Khusus dimunculkan pada mode development (`__DEV__`), otomatis disembunyikan pada build rilis produksi.
    - `Clear All Transactions`: Pembersihan mutasi transaksi dengan modal konfirmasi bahaya (*DangerConfirmModal.tsx*).
- **Fitur Kategori Kustom (*Custom Categories*)**:
  - Database CRUD (`lib/db/index.ts`): `createCategory`, `updateCategory`, `deleteCategory` dengan proteksi bawaan (`isDefault === 1` terlindungi) dan foreign key safety (`ON DELETE SET NULL`).
  - Zustand Store (`store/useFinanceStore.ts`): Actions reaktif `addCategory`, `updateCategory`, `deleteCategory`.
  - UI Universal (`components/categories/CategoryFormModal.tsx`): Form tambah/edit kategori dengan kurasi ~36 emoji cepat, input emoji bebas dari keyboard native, safe area insets padding, dan pencegahan nama duplikat.
  - Integrasi Akses Ganda:
    - Quick Entry (`CategoryPickerModal.tsx`): Card aksi `+ Tambah Baru` yang langsung memilih kategori baru begitu disimpan.
    - Pengaturan (`ManageCategoriesModal.tsx`): Modal manajemen kategori terpusat untuk melihat, mengedit, dan menghapus kategori kustom.
- **Penyempurnaan Visual Sistem (*Botanical Linen & Deep Cypress*)**:
  - Penanda aktif navbar jelas (*anti-saru*) berwarna Botanical Emerald (`#059669`) dengan bobot semibold.
  - Unifikasi seluruh selector aktif (kategori, dompet, bentuk dompet) ke Botanical Emerald di Light Mode.
- **Unit Tests (`lib/db/__tests__/`)**:
  - `settingsDb.test.ts`: Pengujian pembaruan pengaturan dan keamanan data demo.
  - `categoriesDb.test.ts`: Pengujian CRUD kategori kustom dan proteksi kategori bawaan sistem.
  - 68 unit tests Vitest lolos 100%.

---

## 📋 Panduan Fase Berikutnya

### [COMPLETED] Fase 8: Integrasi Perangkat Keras OS & Polish Aksesibilitas
- **Sistem Multi-Reminder Alarm (`expo-notifications` & `reminder.wav`)**:
  - Pemanfaatan file audio kustom `assets/sounds/reminder.wav` dan konfigurasi Android Channel `cashrunway-reminders` (High Importance, suara kustom, vibrasi).
  - Skema database SQLite (`settings.reminder_times` & `settings.is_reminder_enabled`) dengan migrasi aman via `initDatabase`.
  - Penjadwalan alarm harian berulang (`SchedulableTriggerInputTypes.DAILY`) per slot jam aktif (preset: 09:00, 13:00, 20:00, serta penambahan jam bebas).
  - Pesan notifikasi cerdas yang disinkronkan secara dinamis dengan status napas kas (`Runway Days`):
    - Kas normal/finite: *"Sisa napas kasmu {days} hari lagi. Yuk catat transaksimu agar runway tetap akurat!"*
    - Kas habis: *"Kas operasionalmu telah habis. Yuk tinjau dan catat pengeluaran hari ini!"*
    - Kas aman/surplus: *"Arus kasmu sehat! Tetap catat pengeluaran hari ini agar keuangan terkendali."*
  - Respons klik notifikasi: Otomatis membuka aplikasi dan memicu `useQuickEntryStore.open('expense')` seketika (baik cold-start maupun background).
  - Fitur pengujian instan: Tombol *"Uji Coba Suara & Notifikasi"* untuk verifikasi hardware seketika (1s delay).
- **Pintasan Cepat Ikon Launcher (`expo-quick-actions`)**:
  - Registrasi 2 tindakan pintasan saat ikon aplikasi ditekan lama (*long-press*):
    1. *"Catat Pengeluaran"* (`action_expense`): Membuka Quick Entry di mode Pengeluaran.
    2. *"Catat Pemasukan"* (`action_income`): Membuka Quick Entry di mode Pemasukan.
  - Integrasi listener di root `app/_layout.tsx` melalui hook `useQuickActionCallback` dengan fallback aman.
- **Antarmuka Pengaturan Jam Pengingat (`ReminderManagerModal.tsx`)**:
  - Modal pengatur alarm dengan daftar waktu, switch aktif/nonaktif independen per jam, formulir tambah jam baru, dan tombol hapus.
  - Seksi baru *"Notifikasi & Pengingat"* di `app/(tabs)/settings.tsx` berhiaskan ikon `Bell` dan horizontal pill badges alarm aktif.
- **Audit Aksesibilitas & UI Polish Menyeluruh**:
  - Penerapan `tabular-nums` (`style={{ fontVariant: ['tabular-nums'] }}` & kelas `tabular-nums`) pada seluruh angka, nominal mata uang, persentase yield, dan counter hari di Dasbor, Riwayat Transaksi, Dompet & Brankas, serta Keypad Mini-Kalkulator untuk menghilangkan pergeseran angka (*horizontal layout shift*).
  - Standardisasi target sentuh minimum $\ge 44\text{pt}$ (`min-w-[44px] min-h-[44px]`) dan `hitSlop` (`top: 12, bottom: 12, left: 12, right: 12`) pada seluruh tombol tutup modal (`X`), back button, filter chips, action triggers, dan steppers.
- **Unit Tests & Quality Assurance**:
  - `notifications.test.ts`: Pengujian parser waktu `HH:mm`, generator pesan napas kas, channel setup, dan penjadwalan alarm.
  - `quickActions.test.ts`: Pengujian definisi pintasan home screen dan penanganan platform tidak mendukung.
  - `reminderSettingsDb.test.ts`: Pengujian migrasi aman database SQLite dan persistensi JSON alarm.
  - `reminderStore.test.ts`: Pengujian aksi CRUD alarm di Zustand store dan sinkronisasi runway.
  - **17 test files (97 unit tests) lolos 100%** dengan `tsc --noEmit` 0 errors.

---

### [COMPLETED] Fase 9: Auto Google Drive Backup, Import Backup (Google Drive & CSV)
- **Autentikasi Google (`lib/services/googleAuth.ts`)**:
  - `@react-native-google-signin/google-signin` dengan native One Tap UI (tanpa redirect browser).
  - Scope terbatas `drive.appdata` — hanya folder tersembunyi khusus aplikasi.
  - Token management aman via `expo-secure-store` dengan auto-refresh.
  - Konfigurasi OAuth 2.0: `google-services.json` (Android) + `GoogleService-Info.plist` (iOS).
- **Google Drive REST API v3 Client (`lib/services/googleDrive.ts`)**:
  - Klien HTTP langsung (`fetch()`) tanpa SDK tambahan — upload, list, download, delete.
  - Semua file backup disimpan di `appDataFolder` (tidak terlihat pengguna di Google Drive mereka).
  - Rolling retention policy: maksimal 5 backup terakhir, otomatis hapus yang lebih lama.
  - Upload multipart (`uploadType=multipart`) dengan metadata JSON + konten backup.
- **Serialisasi Database (`lib/backup/serializer.ts`)**:
  - Ekspor seluruh 5 tabel (wallets, categories, recurringBills, transactions, settings) ke format JSON terstruktur.
  - Metadata backup: versi skema, versi aplikasi, timestamp ekspor, info perangkat.
  - Validasi integritas via checksum SHA-256 sebelum restore.
  - Mekanisme restore aman: drop triggers → clear all → insert all → recreate triggers → `PRAGMA integrity_check`.
- **CSV Importer (`lib/backup/csvImporter.ts`)**:
  - Parser RFC 4180 compliant dengan BOM handling dan quoted field support.
  - Deteksi otomatis format CashRunway (header khas: 'Akun / Dompet', 'Pengeluaran Khusus') vs CSV generik.
  - Column mapping semi-otomatis untuk format generik.
  - Dua strategi impor: `append` (tambahkan, skip duplikat) dan `replace` (ganti semua transaksi).
- **Zustand Backup Store (`store/useBackupStore.ts`)**:
  - State management autentikasi Google, daftar backup, progress upload/download/restore.
  - Aksi `signIn`, `signOut`, `createBackup`, `restoreBackup`, `deleteBackup`, `importCsv`.
  - Mekanisme auto-backup: debounce timer 5 menit setelah perubahan data terakhir.
  - Integrasi `AppState` listener: backup segera saat app masuk background jika ada perubahan tertunda.
  - Hook ke `useFinanceStore` — setiap mutasi data (`addTransaction`, `editTransaction`, dll.) memicu `scheduleAutoBackup()`.
- **Antarmuka Pengaturan — Seksi Cadangan & Sinkronisasi (`app/(tabs)/settings.tsx`)**:
  - `GoogleAccountCard.tsx`: Kartu status akun Google (avatar, email, tombol Sign In/Out) berikón `CloudUpload`.
  - `BackupListSheet.tsx`: Bottom sheet Reanimated dengan daftar backup cloud (nama, tanggal, ukuran, tombol Pulihkan/Hapus).
  - `RestoreConfirmModal.tsx`: Modal konfirmasi destruktif bergaya `DangerConfirmModal` dengan auto pre-backup sebelum restore.
  - `ImportCsvSheet.tsx`: Bottom sheet impor CSV dengan preview data, deteksi format, column mapping, dan pilihan strategi.
  - Toggle "Auto-Backup" dengan deskripsi *"Otomatis mencadangkan 5 menit setelah perubahan data"*.
  - Badge timestamp backup terakhir: *"Terakhir dicadangkan: 15 Sep 2026, 23:00"*.
- **Migrasi Database (`lib/db/schema.ts` & `lib/db/index.ts`)**:
  - Kolom baru `settings`: `last_backup_date TEXT`, `google_email TEXT`, `auto_backup_enabled INTEGER NOT NULL DEFAULT 0`.
  - Fungsi `getAllDataForBackup()` dan `restoreFromBackup(data)` di `lib/db/index.ts`.
- **Internasionalisasi (`lib/i18n/locales/`)**:
  - ~40 kunci terjemahan baru untuk seluruh UI backup, restore, impor CSV, progress, dan pesan error dalam Bahasa Indonesia dan English.
- **Dependensi Baru**:
  - `@react-native-google-signin/google-signin` (^14.x) — Autentikasi Google native.
  - `expo-secure-store` (~57.x) — Penyimpanan token aman.
  - `expo-document-picker` (~57.x) — Pemilih file CSV/JSON lokal.
- **Unit Tests (`lib/backup/__tests__/` & `lib/services/__tests__/`)**:
  - `serializer.test.ts`: Serialisasi round-trip, validasi checksum, verifikasi struktur backup.
  - `csvImporter.test.ts`: Parsing format CashRunway & generik, BOM handling, deteksi duplikat, error handling.
  - `googleDrive.test.ts`: Mocked REST API calls, multipart construction, error handling (401/403/network), retention policy.
  - **21 test files (134 unit tests) lolos 100%** dengan `tsc --noEmit` 0 errors.
