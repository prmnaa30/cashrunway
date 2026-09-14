# CashRunway - Fase 8: OS Hardware Integration & Accessibility Polish Spec

- **Tanggal:** 2026-09-11
- **Status:** Approved by User
- **Cakupan:**
  1. Multi-Reminder Alarm System (`expo-notifications`) dengan Custom Audio (`reminder.wav`) & Pesan Runway Dinamis.
  2. Pintasan Ikon Home Screen (`expo-quick-actions`) untuk Quick Entry Pengeluaran & Pemasukan.
  3. Audit Aksesibilitas & UI Polish: Standardisasi target sentuh $\ge 44\text{pt}$ dan tipografi angka `tabular-nums`.

---

## 1. Latar Belakang & Tujuan
Aplikasi CashRunway memerlukan integrasi hardware native OS untuk meningkatkan retensi pengguna dalam mencatat kas harian:
- **Pengingat Fleksibel Bergaya Alarm:** Pengguna dapat menentukan beberapa waktu pengingat harian (misal: 09:00, 13:00, 20:00) yang memutar audio kustom (*chime*) dan menampilkan sisa hari runway terkini.
- **Aksi Cepat 0-Klik:** Akses instan pencatatan pengeluaran atau pemasukan langsung dari launcher Home Screen HP tanpa harus menavigasi menu.
- **Kenyamanan & Inklusivitas Aksesibilitas:** Menghilangkan guncangan horizontal angka (*jitter*) dengan angka monospaced (`tabular-nums`) serta memastikan seluruh elemen interaktif mudah ditekan dengan target sentuh $\ge 44\text{pt}$.

---

## 2. Arsitektur & Subsystem

### 2.1 Multi-Reminder Alarm System (`lib/services/notifications.ts`)

#### Struktur Data Jadwal Alarm
Disimpan sebagai JSON terstruktur pada kolom `reminder_times` di tabel `settings`:
```ts
export interface ReminderItem {
  id: string;          // e.g. 'rem_1'
  time: string;        // Format 'HH:mm' (misal '09:00', '13:00', '20:00')
  label: string;       // Label pembeda (misal 'Pagi', 'Makan Siang', 'Rekap Malam')
  isEnabled: boolean;  // Status saklar alarm
}
```

**Preset Bawaan (Default):**
1. `09:00` - *"Pagi (Kesiapan Kas Hari Ini)"* (Non-aktif bawaan)
2. `13:00` - *"Siang (Catat Makan Siang)"* (Non-aktif bawaan)
3. `20:00` - *"Malam (Rekap Harian & Sisa Napas)"* (**Aktif bawaan**)

#### Custom Audio & Channel Notifikasi
- File audio: `assets/sounds/reminder.wav` dipindahkan dari root.
- Konfigurasi plugin di `app.json`:
  ```json
  [
    "expo-notifications",
    {
      "sounds": ["./assets/sounds/reminder.wav"],
      "defaultChannel": "cashrunway-reminders"
    }
  ]
  ```
- Android Notification Channel (`cashrunway-reminders`):
  - `importance: Notifications.AndroidImportance.HIGH`
  - `sound: 'reminder.wav'`
  - `vibrationPattern: [0, 250, 250, 250]`

#### Penjadwalan Dinamis & Generator Pesan
Setiap alarm yang aktif dijadwalkan dengan trigger `SchedulableTriggerInputTypes.DAILY` pada `hour` & `minute`.
Pesan notifikasi disesuaikan dengan konteks sisa runway:
- **Kas Finite:** `"Sisa napas kasmu {days} hari lagi. Yuk catat transaksimu agar runway tetap akurat!"`
- **Kas Defisit / Habis ($\le 0$):** `"Kas operasionalmu telah habis. Yuk tinjau dan catat pengeluaran hari ini!"`
- **Kas Sehat (> 365 hari):** `"Arus kasmu sehat! Tetap catat pengeluaran hari ini agar keuangan terkendali."`

#### Interaksi Buka Aplikasi (Tap Notification)
- **Cold Start:** Dideteksi via `Notifications.getLastNotificationResponseAsync()`.
- **Foreground / Background:** Dideteksi via `Notifications.addNotificationResponseReceivedListener`.
- **Aksi:** Memanggil `useQuickEntryStore.getState().open('expense')` seketika.

---

### 2.2 Home Screen Quick Actions (`lib/services/quickActions.ts`)

#### Registrasi Pintasan
Didaftarkan saat inisialisasi aplikasi:
1. **`action_expense`**:
   - `title`: *"Catat Pengeluaran"*
   - `subtitle`: *"Input transaksi pengeluaran baru"*
   - `icon`: iOS `symbol:arrow.down.circle`, Android default shortcut icon
   - `params`: `{ mode: 'expense' }`
2. **`action_income`**:
   - `title`: *"Catat Pemasukan"*
   - `subtitle`: *"Input pemasukan kas baru"*
   - `icon`: iOS `symbol:arrow.up.circle`, Android default shortcut icon
   - `params`: `{ mode: 'income' }`

#### Routing Hook
Menggunakan `useQuickActionCallback` di `app/_layout.tsx`:
```ts
useQuickActionCallback((action) => {
  const mode = action.params?.mode as TransactionMode | undefined;
  if (mode === 'expense' || mode === 'income') {
    useQuickEntryStore.getState().open(mode);
  }
});
```

---

### 2.3 Skema Database & Zustand Store

#### Database (`lib/db/schema.ts` & `lib/db/index.ts`)
- Kolom baru pada tabel `settings`:
  - `isReminderEnabled: integer('is_reminder_enabled').notNull().default(1)`
  - `reminderTimes: text('reminder_times').notNull().default(DEFAULT_REMINDERS_JSON)`
- Migrasi aman via `initDatabase()`:
  - `ALTER TABLE settings ADD COLUMN is_reminder_enabled INTEGER NOT NULL DEFAULT 1;`
  - `ALTER TABLE settings ADD COLUMN reminder_times TEXT NOT NULL DEFAULT '...';`

#### Zustand Store (`store/useSettingStore.ts`)
- State:
  - `isReminderEnabled: boolean`
  - `reminders: ReminderItem[]`
- Actions:
  - `toggleReminderEnabled()`: Mengaktifkan/menonaktifkan seluruh sistem pengingat.
  - `toggleReminderItem(id: string)`: Mengaktifkan/menonaktifkan alarm spesifik.
  - `addReminderItem(time: string, label: string)`: Menambah jam pengingat baru.
  - `deleteReminderItem(id: string)`: Menghapus jam pengingat.
  - `syncScheduledNotifications()`: Menyelaraskan alarm terdaftar di OS.

---

### 2.4 Antarmuka Pengaturan Baru (`components/settings/`)
- **Card Bagian "Notifikasi & Pengingat" di `app/(tabs)/settings.tsx`:**
  - Switch utama: *"Pengingat Pencatatan Harian"*
  - Daftar ringkasan alarm aktif (misal: `[09:00] [13:00] [20:00]`).
  - Tombol *"Kelola Jam Pengingat"* -> membuka **`ReminderManagerModal.tsx`**.
  - Tombol *"Uji Coba Notifikasi"* -> memicu notifikasi instan 1 detik untuk verifikasi suara kustom dan respons klik.
- **`ReminderManagerModal.tsx`:**
  - Tampilan daftar alarm bergaya jam weker modern.
  - Switch per item, tombol hapus untuk item kustom, dan form tambah jam & menit.

---

### 2.5 Audit Aksesibilitas & UI Polish

#### 1. Tipografi Numerik Monospaced (`tabular-nums`)
Menerapkan kelas Tailwind `tabular-nums` atau style `fontVariant: ['tabular-nums']` pada:
- `components/dashboard/RunwayHeroCard.tsx` (Runway meter angka hari, total kas)
- `components/dashboard/SafeSpendCard.tsx` (Nominal sisa safe daily spend)
- `components/dashboard/LiquidityBar.tsx` (Nominal kas operasional & brankas)
- `components/history/TransactionItem.tsx` (Nominal mutasi transaksi & fee)
- `components/wallets/WalletCard.tsx` (Saldo dompet)
- `components/wallets/VaultCard.tsx` & `VaultYieldCard.tsx` (Saldo simpanan, estimasi yield harian, suku bunga)
- `components/entry/AmountDisplay.tsx` (Display angka input keypad)
- `components/entry/CalculatorKeypad.tsx` (Tombol digit kalkulator)

#### 2. Target Sentuh Minimum ($\ge 44\text{pt}$)
- Tombol tutup modal (`X`) dan back button: ditambahkan `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` serta `min-w-[44px] min-h-[44px]`.
- Tombol `+ Tambah` pada tab Wallets dan tombol aksi modal: dipastikan memenuhi `min-h-[44px]`.
- Seluruh baris list pengaturan dan alarm: `min-h-[48px]`.
- Area tap hapus transaksi / konfirmasi bahaya: diperlebar untuk kenyamanan jari.

---

## 3. Rencana Pengujian (Testing Strategy)

### Unit Tests (Vitest)
1. `lib/services/__tests__/notifications.test.ts`:
   - Validasi pembentukan pesan notifikasi berdasarkan rentang sisa runway (finite, 0/defisit, surplus > 365 hari).
   - Validasi parsing jam dan menit dari format `HH:mm`.
   - Validasi sinkronisasi data jadwal alarm (CRUD alarm list).
2. `lib/db/__tests__/settingsDb.test.ts`:
   - Validasi pembaruan kolom `is_reminder_enabled` dan `reminder_times` JSON.

### Verifikasi Manual
- Build & compile check (`rtk npm test` dan Expo type-check).
- Verifikasi notifikasi uji coba (suara `reminder.wav`, getar, dan banner).
- Verifikasi tap notifikasi membuka bottom sheet Quick Entry.
- Verifikasi long-press shortcut icon membuka Quick Entry mode expense / income.
