import { create } from 'zustand';
import {
  signInWithGoogle,
  signOutGoogle,
  getValidAccessToken,
  getStoredUserProfile,
  isGoogleSignedIn,
  GoogleUserProfile,
} from '@/lib/services/googleAuth';
import {
  listBackupFiles,
  uploadBackupFile,
  downloadBackupFile,
  deleteBackupFile,
  enforceRetentionPolicy,
  GoogleDriveFile,
} from '@/lib/services/googleDrive';
import {
  getAllDataForBackup,
  restoreFromBackup,
  getSettings,
  updateSettings,
} from '@/lib/db';
import { serializeBackup, validateBackupPayload } from '@/lib/backup/serializer';
import {
  parseCsvContent,
  mapCashRunwayCsvRows,
  importTransactionsBatch,
  ImportResult,
} from '@/lib/backup/csvImporter';

export interface BackupProgress {
  stage: string;
  percent: number;
}

export interface BackupState {
  // Auth
  googleUser: GoogleUserProfile | null;
  isSignedIn: boolean;
  isSigningIn: boolean;

  // Cloud Backups
  backups: GoogleDriveFile[];
  isLoadingBackups: boolean;
  isBackingUp: boolean;
  isRestoring: boolean;
  lastBackupDate: string | null;
  backupProgress: BackupProgress | null;

  // Auto-backup
  isAutoBackupEnabled: boolean;

  // CSV Import
  isImporting: boolean;

  // Error feedback
  error: string | null;
  feedbackMessage: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  loadBackups: () => Promise<void>;
  createBackup: (silent?: boolean) => Promise<boolean>;
  restoreBackup: (fileId: string) => Promise<boolean>;
  deleteBackup: (fileId: string) => Promise<boolean>;
  toggleAutoBackup: () => Promise<void>;
  scheduleAutoBackup: () => void;
  importCsvContent: (rawCsv: string, strategy?: 'append' | 'replace') => Promise<ImportResult>;
  clearFeedback: () => void;
}

let autoBackupDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const AUTO_BACKUP_DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes

export const useBackupStore = create<BackupState>((set, get) => ({
  googleUser: null,
  isSignedIn: false,
  isSigningIn: false,

  backups: [],
  isLoadingBackups: false,
  isBackingUp: false,
  isRestoring: false,
  lastBackupDate: null,
  backupProgress: null,

  isAutoBackupEnabled: false,
  isImporting: false,
  error: null,
  feedbackMessage: null,

  initialize: async () => {
    try {
      const [signedIn, storedProfile, dbSettings] = await Promise.all([
        isGoogleSignedIn(),
        getStoredUserProfile(),
        getSettings(),
      ]);

      const isAuto = Boolean(dbSettings?.autoBackupEnabled);
      const lastDate = dbSettings?.lastBackupDate || null;

      set({
        isSignedIn: signedIn,
        googleUser: storedProfile,
        isAutoBackupEnabled: isAuto,
        lastBackupDate: lastDate,
      });

      if (signedIn) {
        get().loadBackups().catch(() => {});
      }
    } catch (err) {
      console.warn('[useBackupStore] Init error:', err);
    }
  },

  signIn: async () => {
    try {
      set({ isSigningIn: true, error: null });
      const { user } = await signInWithGoogle();
      set({
        googleUser: user,
        isSignedIn: true,
        isSigningIn: false,
        feedbackMessage: `Terhubung sebagai ${user.email}`,
      });

      await updateSettings({ googleEmail: user.email });
      await get().loadBackups();
    } catch (err: any) {
      set({
        isSigningIn: false,
        error: err.message || 'Gagal masuk dengan Google.',
      });
      throw err;
    }
  },

  signOut: async () => {
    try {
      await signOutGoogle();
      set({
        googleUser: null,
        isSignedIn: false,
        backups: [],
        feedbackMessage: 'Google Drive berhasil diputuskan.',
      });
      await updateSettings({ googleEmail: null });
    } catch (err: any) {
      set({ error: err.message || 'Gagal keluar.' });
    }
  },

  loadBackups: async () => {
    const token = await getValidAccessToken();
    if (!token) return;

    try {
      set({ isLoadingBackups: true });
      const files = await listBackupFiles(token);
      set({ backups: files, isLoadingBackups: false });
    } catch (err: any) {
      set({ isLoadingBackups: false, error: err.message || 'Gagal memuat daftar cadangan.' });
    }
  },

  createBackup: async (silent = false) => {
    const state = get();
    if (state.isBackingUp) return false;

    const token = await getValidAccessToken();
    if (!token) {
      if (!silent) set({ error: 'Harap hubungkan akun Google Drive terlebih dahulu.' });
      return false;
    }

    try {
      set({
        isBackingUp: true,
        error: null,
        backupProgress: { stage: 'Menyiapkan data cadangan...', percent: 25 },
      });

      // 1. Serialize DB
      const tables = await getAllDataForBackup();
      const payload = serializeBackup(tables);
      const jsonString = JSON.stringify(payload, null, 2);

      set({ backupProgress: { stage: 'Mengunggah ke Google Drive...', percent: 60 } });

      // 2. Upload to Drive
      const uploadedFile = await uploadBackupFile(token, jsonString);

      set({ backupProgress: { stage: 'Menerapkan kebijakan retensi...', percent: 90 } });

      // 3. Enforce retention (keep max 5)
      await enforceRetentionPolicy(token, 5);

      const nowIso = new Date().toISOString();
      await updateSettings({ lastBackupDate: nowIso });

      set((prev) => ({
        isBackingUp: false,
        lastBackupDate: nowIso,
        backupProgress: null,
        backups: [uploadedFile, ...prev.backups.filter((f) => f.id !== uploadedFile.id)],
        feedbackMessage: silent ? null : 'Cadangan berhasil disimpan ke Google Drive!',
      }));

      return true;
    } catch (err: any) {
      console.error('[useBackupStore] Backup failed:', err);
      set({
        isBackingUp: false,
        backupProgress: null,
        error: err.message || 'Gagal membuat cadangan ke Google Drive.',
      });
      return false;
    }
  },

  restoreBackup: async (fileId: string) => {
    const token = await getValidAccessToken();
    if (!token) {
      set({ error: 'Sesi Google Drive berakhir. Harap hubungkan ulang.' });
      return false;
    }

    try {
      set({
        isRestoring: true,
        error: null,
        backupProgress: { stage: 'Mengunduh berkas cadangan...', percent: 30 },
      });

      // 1. Download
      const rawJson = await downloadBackupFile(token, fileId);

      set({ backupProgress: { stage: 'Memvalidasi integritas data...', percent: 60 } });

      // 2. Validate
      const validation = validateBackupPayload(rawJson);
      if (!validation.valid || !validation.payload) {
        throw new Error(validation.errors.join(' '));
      }

      set({ backupProgress: { stage: 'Menerapkan data ke database...', percent: 85 } });

      // 3. Restore to SQLite
      await restoreFromBackup(validation.payload.data);

      // 4. Reload app finance store
      try {
        const { useFinanceStore } = require('@/store/useFinanceStore');
        await useFinanceStore.getState().loadAllData({ force: true, showLoading: false });
      } catch (_) {}

      set({
        isRestoring: false,
        backupProgress: null,
        feedbackMessage: 'Data berhasil dipulihkan dari cadangan Google Drive!',
      });

      return true;
    } catch (err: any) {
      console.error('[useBackupStore] Restore failed:', err);
      set({
        isRestoring: false,
        backupProgress: null,
        error: err.message || 'Gagal memulihkan cadangan.',
      });
      return false;
    }
  },

  deleteBackup: async (fileId: string) => {
    const token = await getValidAccessToken();
    if (!token) return false;

    try {
      await deleteBackupFile(token, fileId);
      set((prev) => ({
        backups: prev.backups.filter((f) => f.id !== fileId),
        feedbackMessage: 'Cadangan berhasil dihapus.',
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Gagal menghapus berkas cadangan.' });
      return false;
    }
  },

  toggleAutoBackup: async () => {
    const nextVal = !get().isAutoBackupEnabled;
    set({ isAutoBackupEnabled: nextVal });
    await updateSettings({ autoBackupEnabled: nextVal ? 1 : 0 });

    if (nextVal && get().isSignedIn) {
      get().scheduleAutoBackup();
    }
  },

  scheduleAutoBackup: () => {
    const { isAutoBackupEnabled, isSignedIn, isBackingUp } = get();
    if (!isAutoBackupEnabled || !isSignedIn || isBackingUp) return;

    if (autoBackupDebounceTimer) {
      clearTimeout(autoBackupDebounceTimer);
    }

    autoBackupDebounceTimer = setTimeout(async () => {
      try {
        await get().createBackup(true);
      } catch (err) {
        console.warn('[AutoBackup] Debounced backup execution failed:', err);
      }
    }, AUTO_BACKUP_DEBOUNCE_MS);
  },

  importCsvContent: async (rawCsv: string, strategy = 'append') => {
    try {
      set({ isImporting: true, error: null });

      const parsed = parseCsvContent(rawCsv);
      if (parsed.rows.length === 0) {
        throw new Error('File CSV kosong atau tidak memiliki data.');
      }

      const mappedTransactions = mapCashRunwayCsvRows(parsed.rows);
      if (mappedTransactions.length === 0) {
        throw new Error('Tidak ditemukan transaksi valid di dalam berkas CSV.');
      }

      const result = await importTransactionsBatch(mappedTransactions, strategy);

      // Refresh finance store
      try {
        const { useFinanceStore } = require('@/store/useFinanceStore');
        await useFinanceStore.getState().loadAllData({ force: true, showLoading: false });
      } catch (_) {}

      set({
        isImporting: false,
        feedbackMessage: `Berhasil mengimpor ${result.imported} transaksi (${result.skipped} dilewati).`,
      });

      return result;
    } catch (err: any) {
      set({
        isImporting: false,
        error: err.message || 'Gagal mengimpor data CSV.',
      });
      throw err;
    }
  },

  clearFeedback: () => set({ error: null, feedbackMessage: null }),
}));
