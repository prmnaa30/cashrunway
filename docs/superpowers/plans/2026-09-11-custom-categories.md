# Custom Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur pembuatan, pengubahan, dan penghapusan kategori kustom dengan akses ganda (Quick Entry & Pengaturan), pemilih emoji cepat, dan proteksi integritas data.

**Architecture:** 
- Layer Data: CRUD categories di `lib/db/index.ts` dengan proteksi `isDefault` dan foreign-key handling.
- Layer State: Integrasi actions di Zustand `useFinanceStore` (`addCategory`, `updateCategory`, `deleteCategory`).
- Layer UI: Komponen universal `CategoryFormModal` dengan grid emoji kurasi + keyboard input, tombol tambah cepat di `CategoryPickerModal`, serta lembar manajemen kategori lengkap di `settings.tsx` via `ManageCategoriesModal`.

**Tech Stack:** React Native, Expo 57, Drizzle ORM, SQLite (`expo-sqlite`), Zustand, Lucide React Native, Tailwind CSS / NativeWind.

**Spec:** [`docs/superpowers/specs/2026-09-11-custom-category-design.md`](file:///w:/home/creez/projects/js/cashrunway/docs/superpowers/specs/2026-09-11-custom-category-design.md)

---

## File Structure & Responsibilities

- **`lib/db/index.ts`**: Menambahkan fungsi ekspor `createCategory`, `updateCategory`, `deleteCategory`.
- **`lib/db/__tests__/categoriesDb.test.ts`**: Unit test logic untuk CRUD kategori, proteksi default, dan cascade/nullification.
- **`store/useFinanceStore.ts`**: Menambahkan action `addCategory`, `updateCategory`, `deleteCategory` pada store interface dan implementation.
- **`components/categories/CategoryFormModal.tsx`**: Modal universal untuk input nama, tipe, dan icon emoji kategori.
- **`components/entry/CategoryPickerModal.tsx`**: Menambahkan card `+ Kategori Baru` dan menghubungkan pembukaan `CategoryFormModal`.
- **`components/settings/ManageCategoriesModal.tsx`**: Modal manajemen daftar kategori dengan filter tipe, edit, dan hapus.
- **`app/(tabs)/settings.tsx`**: Menambahkan baris menu pengaturan `Kelola Kategori`.

---

## Bite-Sized Tasks

### Task 1: Database Operations for Categories & Tests

**Files:**
- Create: `lib/db/__tests__/categoriesDb.test.ts`
- Modify: `lib/db/index.ts`

**Interfaces:**
- Produces:
  - `createCategory(data: { name: string; type: 'income' | 'expense'; icon: string; isFixed?: number }): Promise<Category>`
  - `updateCategory(id: string, updates: { name?: string; icon?: string }): Promise<void>`
  - `deleteCategory(id: string): Promise<void>`

- [ ] **Step 1: Tulis unit test untuk fungsi CRUD kategori**
  Tulis test di `lib/db/__tests__/categoriesDb.test.ts`:
  - `createCategory` menghasilkan ID unik, menyetel `isDefault: 0`, dan mengembalikan kategori.
  - `updateCategory` memperbarui nama dan icon.
  - `deleteCategory` melempar error / mencegah penghapusan jika kategori `isDefault === 1`.
  - `deleteCategory` berhasil menghapus kategori kustom.

- [ ] **Step 2: Jalankan test dan pastikan gagal**
  Jalankan `rtk vitest run lib/db/__tests__/categoriesDb.test.ts`.

- [ ] **Step 3: Implementasikan fungsi di `lib/db/index.ts`**
  Tambahkan fungsi `createCategory`, `updateCategory`, dan `deleteCategory` dengan validasi guard `isDefault`.

- [ ] **Step 4: Jalankan test dan pastikan lulus**
  Jalankan `rtk vitest run lib/db/__tests__/categoriesDb.test.ts`.

---

### Task 2: Store Actions in `useFinanceStore.ts`

**Files:**
- Modify: `store/useFinanceStore.ts`

**Interfaces:**
- Consumes: `createCategory`, `updateCategory`, `deleteCategory` dari `lib/db`
- Produces:
  - `useFinanceStore.getState().addCategory(data)`
  - `useFinanceStore.getState().updateCategory(id, updates)`
  - `useFinanceStore.getState().deleteCategory(id)`

- [ ] **Step 1: Tambahkan types action ke `FinanceState`**
  Update tipe `FinanceState` di `store/useFinanceStore.ts`:
  ```ts
  addCategory: (categoryData: { name: string; type: 'income' | 'expense'; icon: string }) => Promise<Category>;
  updateCategory: (id: string, updates: { name?: string; icon?: string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  ```

- [ ] **Step 2: Implementasikan actions di `createFinanceStore`**
  Implementasikan:
  - `addCategory`: memanggil `createCategory`, update `categories: [...state.categories, newCat]`, dan kembalikan `newCat`.
  - `updateCategory`: memanggil `updateCategory`, perbarui item dalam `state.categories`.
  - `deleteCategory`: memanggil `deleteCategory`, filter out dari `state.categories`.
  - Jalankan `recomputeFinancialMetrics()` jika transaksi terpengaruh.

- [ ] **Step 3: Jalankan typecheck & unit test**
  Jalankan `npx tsc --noEmit` dan `rtk vitest run`.

---

### Task 3: Universal `CategoryFormModal` Component

**Files:**
- Create: `components/categories/CategoryFormModal.tsx`

**Interfaces:**
- Produces:
  ```ts
  interface CategoryFormModalProps {
    visible: boolean;
    initialType?: 'expense' | 'income';
    categoryToEdit?: Category | null;
    onSave: (category: Category) => void;
    onClose: () => void;
    colorScheme: 'light' | 'dark';
  }
  ```

- [ ] **Step 1: Buat komponen `CategoryFormModal`**
  - Tipe switcher: Pengeluaran / Pemasukan (segmented pill Linen/Cypress).
  - Preview emoji besar (52x52) + input teks emoji keyboard native.
  - Grid kurasi ~36 emoji populer (makanan, transport, belanja, bills, hobi, gaji, freelance, investasi).
  - Input nama kategori (placeholder contoh, trim, maxLength 30).
  - Validasi tombol simpan (hanya aktif jika nama & icon terisi).
  - Menghubungkan ke `addCategory` atau `updateCategory` dari `useFinanceStore`.

- [ ] **Step 2: Verifikasi sintaks & typecheck**
  Jalankan `npx tsc --noEmit`.

---

### Task 4: Integrasi di Quick Entry (`CategoryPickerModal.tsx`)

**Files:**
- Modify: `components/entry/CategoryPickerModal.tsx`

**Interfaces:**
- Consumes: `CategoryFormModal`

- [ ] **Step 1: Tambahkan card `+ Tambah Baru` pada daftar kategori**
  Di bagian akhir daftar kategori `CategoryPickerModalComponent`:
  - Tampilkan card aksi berbingkai garis putus-putus (`border-dashed`).
  - Saat ditekan, set `isFormModalVisible = true`.

- [ ] **Step 2: Render `CategoryFormModal` di dalam / bersama `CategoryPickerModal`**
  - Teruskan mode saat ini (`mode: 'expense' | 'income'`).
  - Saat kategori baru disimpan (`onSave`):
    - Panggil `onSelectCategory(savedCategory.id)`.
    - Tutup form modal dan tutup picker modal sehingga form transaksi langsung siap dengan kategori baru terpilih.

- [ ] **Step 3: Verifikasi build & typecheck**
  Jalankan `npx tsc --noEmit`.

---

### Task 5: Lembar Manajemen Kategori di Pengaturan

**Files:**
- Create: `components/settings/ManageCategoriesModal.tsx`
- Modify: `app/(tabs)/settings.tsx`

**Interfaces:**
- Consumes: `CategoryFormModal`, `useFinanceStore`

- [ ] **Step 1: Buat komponen `ManageCategoriesModal.tsx`**
  - Header dengan tombol tutup (`X`) dan tombol `+ Tambah`.
  - Tab Switcher: Pengeluaran vs Pemasukan.
  - List kategori yang ditampilkan rapi:
    - Kategori bawaan: label/badge `Bawaan`.
    - Kategori kustom: tombol Edit (pensil) & Hapus (tempat sampah).
  - Alert konfirmasi sebelum menghapus: *"Hapus Kategori? Transaksi terkait akan menjadi tanpa kategori."*
  - Integrasi modal `CategoryFormModal` untuk aksi tambah baru & edit.

- [ ] **Step 2: Tambahkan menu `Kelola Kategori` di `settings.tsx`**
  - Tambahkan baris baru di section "Pengaturan" dengan icon `Tag`.
  - Buka `ManageCategoriesModal` saat baris ditekan.

- [ ] **Step 3: Verifikasi build & typecheck**
  Jalankan `npx tsc --noEmit`.

---

### Task 6: Verifikasi Menyeluruh & Testing

- [ ] **Step 1: Jalankan seluruh test suite**
  Jalankan `rtk vitest run` untuk memastikan semua unit test (lama & baru) lolos 100%.

- [ ] **Step 2: Jalankan typecheck proyek**
  Jalankan `npx tsc --noEmit` untuk memastikan 0 TypeScript error.

- [ ] **Step 3: Periksa konsistensi visual Light Mode & Dark Mode**
  Pastikan warna modal, border, dan tombol konsisten dengan palet *Botanical Linen* dan *Deep Cypress*.
