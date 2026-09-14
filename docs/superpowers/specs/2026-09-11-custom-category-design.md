# Desain Arsitektur: Fitur Kategori Kustom (Custom Categories)

Tanggal: 11 September 2026  
Status: Disetujui  
Ruang Lingkup: Architectural / Full-Stack Mobile (Expo + SQLite + Zustand)

---

## 1. Latar Belakang & Tujuan
Saat ini, CashRunway hanya menyediakan kategori bawaan (*default seed categories*) yang sudah ditentukan sebelumnya. Pengguna memerlukan fleksibilitas untuk membuat, mengubah, dan menghapus kategori transaksi kustom sesuai gaya hidup mereka (misal: *Skincare*, *Langganan SaaS*, *Hobi & Koleksi*, dsb.).

### Kriteria Keberhasilan:
- Pengguna dapat membuat kategori baru secara instan saat mencatat transaksi di Quick Entry tanpa meninggalkan alur (*dual access*).
- Pengguna dapat melihat daftar seluruh kategori, mengedit, dan menghapus kategori kustom secara terpusat dari Pengaturan.
- Pemilihan icon/emoji cepat melalui grid kurasi ~36 emoji populer ditambah kemampuan mengetik/menempel emoji bebas dari keyboard native.
- Integritas data terjamin: Kategori bawaan (`isDefault === 1`) terlindungi dari penghapusan, dan transaksi lama yang memakai kategori terhapus tetap aman (`categoryId` otomatis diset ke `null`).

---

## 2. Arsitektur & Model Data

### 2.1 Database Schema (`categories`)
Skema SQLite saat ini di [`lib/db/schema.ts`](file:///w:/home/creez/projects/js/cashrunway/lib/db/schema.ts) sudah mendukung kategori kustom tanpa perlu migrasi DDL:
```ts
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  icon: text('icon').notNull().default('💰'),
  isFixed: integer('is_fixed').notNull().default(0),
  isDefault: integer('is_default').notNull().default(0),
});
```

Untuk kategori kustom baru:
- `id`: `cat_${Date.now()}_${randomSuffix}`
- `name`: Nama kategori (string non-kosong, trim)
- `type`: `'expense' | 'income'`
- `icon`: String emoji (1-2 emoji glyphs)
- `isFixed`: `0` (berdasarkan keputusan desain, pengeluaran rutin/outlier diatur pada level transaksi/recurring bills)
- `isDefault`: `0` (menandakan kategori kustom buatan pengguna)

### 2.2 Operasi Database ([`lib/db/index.ts`](file:///w:/home/creez/projects/js/cashrunway/lib/db/index.ts))
Fungsi-fungsi baru yang akan diekspor:
1. `createCategory(data: Omit<NewCategory, 'id' | 'isDefault' | 'isFixed'>): Promise<Category>`
   - Membuat ID acak unik.
   - Insert ke tabel `categories`.
   - Mengembalikan record kategori lengkap.
2. `updateCategory(id: string, data: { name?: string; icon?: string }): Promise<void>`
   - Memperbarui nama dan/atau emoji icon.
3. `deleteCategory(id: string): Promise<void>`
   - Memvalidasi bahwa kategori bukan default (`isDefault !== 1`).
   - Menghapus record dari database (foreign key di tabel `transactions` otomatis men-set `category_id = NULL`).

### 2.3 State Management ([`store/useFinanceStore.ts`](file:///w:/home/creez/projects/js/cashrunway/store/useFinanceStore.ts))
Tambahan action pada `FinanceState`:
```ts
addCategory: (categoryData: { name: string; type: 'income' | 'expense'; icon: string }) => Promise<Category>;
updateCategory: (id: string, updates: { name?: string; icon?: string }) => Promise<void>;
deleteCategory: (id: string) => Promise<void>;
```
Setiap operasi memperbarui state `categories: Category[]` secara reaktif dan memicu pembaruan metrik keuangan.

---

## 3. Komponen Antarmuka Pengguna (UI/UX)

### 3.1 `CategoryFormModal` ([`components/categories/CategoryFormModal.tsx`](file:///w:/home/creez/projects/js/cashrunway/components/categories/CategoryFormModal.tsx))
Komponen form universal untuk membuat dan mengedit kategori:
- **Tipe Transaksi Switcher**: Segmented pill *Pengeluaran* vs *Pemasukan*.
- **Icon Selector**:
  - Tampilan *Preview* besar emoji terpilih.
  - Kolom teks input emoji bebas (bisa ketik / paste emoji dari keyboard).
  - Grid kurasi ~36 emoji cepat yang dibagi menjadi kategori logis (Makanan, Belanja, Rumah, Transport, Hobi, Kerja, Tabungan).
- **Nama Kategori**: Input teks dengan validasi max 30 karakter.
- **Validasi**: Mencegah nama kosong atau nama duplikat pada tipe yang sama.

### 3.2 Integrasi Quick Entry ([`components/entry/CategoryPickerModal.tsx`](file:///w:/home/creez/projects/js/cashrunway/components/entry/CategoryPickerModal.tsx))
- Pada bagian akhir grid kategori, ditambahkan card aksi `+ Kategori Baru` dengan style *dashed border*.
- Saat di-tap, membuka `CategoryFormModal` dengan tipe terkunci sesuai `mode` saat itu (`expense` atau `income`).
- Setelah disimpan: Kategori baru langsung otomatis dipilih dan masuk ke form transaksi tanpa gesekan tambahan.

### 3.3 Layar Manajemen di Pengaturan (`ManageCategoriesModal.tsx` & [`settings.tsx`](file:///w:/home/creez/projects/js/cashrunway/app/(tabs)/settings.tsx))
- Menu baru di Pengaturan: `Kelola Kategori`.
- Modal lembar manajemen:
  - Tab switch: `Pengeluaran` vs `Pemasukan`.
  - Tombol `+ Tambah Kategori`.
  - Daftar kategori:
    - Kategori bawaan: Badge `Bawaan`.
    - Kategori kustom: Tombol Edit (pensil) & Hapus (tempat sampah) dengan alert konfirmasi penghapusan.

---

## 4. Rencana Pengujian & Verifikasi
1. **Unit Test (Vitest)**:
   - Tes CRUD kategori di `lib/db` (`createCategory`, `updateCategory`, `deleteCategory`).
   - Tes proteksi kategori bawaan agar tidak bisa dihapus.
   - Tes foreign key constraint (transaksi tetap ada dan `categoryId` menjadi null setelah kategori dihapus).
   - Tes Zustand store actions (`addCategory`, `updateCategory`, `deleteCategory`).
2. **Type Safety**:
   - `npx tsc --noEmit` untuk memastikan 0 type errors.
3. **Manual Flow Verification**:
   - Tambah kategori baru lewat Quick Entry -> Cek apakah otomatis terpilih dan tersimpan di transaksi.
   - Kelola kategori dari Pengaturan -> Ubah nama/icon dan hapus kategori kustom.
   - Verifikasi tampilan di Light Mode (*Botanical Linen*) dan Dark Mode (*Deep Cypress*).
