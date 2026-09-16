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

function mapGoogleAuthError(err: any): string | null {
  const msg = String(err?.message || '').toLowerCase();
  const code = String(err?.code || '');
  if (
    code === '13' ||
    code === '12501' ||
    msg.includes('cancel') ||
    msg.includes('sign-in cancelled') ||
    msg.includes('sign_in_cancelled')
  ) {
    return null;
  }
  if (
    msg.includes('gettokens requires') ||
    msg.includes('developer_error') ||
    msg.includes('not configured') ||
    msg.includes('credentials') ||
    code === '10'
  ) {
    return 'settings.googleDrive.errorConfig';
  }
  if (msg.includes('play services') || msg.includes('play_services')) {
    return 'settings.googleDrive.errorPlayServices';
  }
  if (msg.includes('network') || msg.includes('internet') || msg.includes('timeout') || code === '7') {
    return 'settings.googleDrive.errorNetwork';
  }
  return 'settings.googleDrive.errorGeneric';
}

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
      const result = await signInWithGoogle();
      if (!result) {
        // User cancelled, smoothly dismiss loading
        set({ isSigningIn: false });
        return;
      }

      const { user } = result;
      set({
        googleUser: user,
        isSignedIn: true,
        isSigningIn: false,
        feedbackMessage: 'settings.googleDrive.connected',
      });

      await updateSettings({ googleEmail: user.email });
      await get().loadBackups();
    } catch (err: any) {
      const friendlyKey = mapGoogleAuthError(err);
      set({
        isSigningIn: false,
        error: friendlyKey,
      });
    }
  },

  signOut: async () => {
    try {
      await signOutGoogle();
      set({
        googleUser: null,
        isSignedIn: false,
        backups: [],
        feedbackMessage: 'settings.googleDrive.disconnectSuccess',
      });
      await updateSettings({ googleEmail: null });
    } catch (err: any) {
      set({ error: 'settings.googleDrive.errorSignOut' });
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
      set({ isLoadingBackups: false, error: 'settings.googleDrive.errorLoadFailed' });
    }
  },

  createBackup: async (silent = false) => {
    const state = get();
    if (state.isBackingUp) return false;

    const token = await getValidAccessToken();
    if (!token) {
      if (!silent) set({ error: 'settings.googleDrive.errorNotConnected' });
      return false;
    }

    try {
      set({
        isBackingUp: true,
        error: null,
        backupProgress: { stage: 'Preparing backup payload...', percent: 25 },
      });

      // 1. Serialize DB
      const tables = await getAllDataForBackup();
      const payload = serializeBackup(tables);
      const jsonString = JSON.stringify(payload, null, 2);

      set({ backupProgress: { stage: 'Uploading to Google Drive...', percent: 60 } });

      // 2. Upload to Drive
      const uploadedFile = await uploadBackupFile(token, jsonString);

      set({ backupProgress: { stage: 'Enforcing retention policy...', percent: 90 } });

      // 3. Enforce retention (keep max 5)
      await enforceRetentionPolicy(token, 5);

      const nowIso = new Date().toISOString();
      await updateSettings({ lastBackupDate: nowIso });

      set((prev) => ({
        isBackingUp: false,
        lastBackupDate: nowIso,
        backupProgress: null,
        backups: [uploadedFile, ...prev.backups.filter((f) => f.id !== uploadedFile.id)],
        feedbackMessage: silent ? null : 'settings.googleDrive.backupSuccess',
      }));

      return true;
    } catch (err: any) {
      console.error('[useBackupStore] Backup failed:', err);
      set({
        isBackingUp: false,
        backupProgress: null,
        error: 'settings.googleDrive.errorBackupFailed',
      });
      return false;
    }
  },

  restoreBackup: async (fileId: string) => {
    const token = await getValidAccessToken();
    if (!token) {
      set({ error: 'settings.googleDrive.errorSessionExpired' });
      return false;
    }

    try {
      set({
        isRestoring: true,
        error: null,
        backupProgress: { stage: 'Downloading backup file...', percent: 30 },
      });

      // 1. Download
      const rawJson = await downloadBackupFile(token, fileId);

      set({ backupProgress: { stage: 'Verifying data integrity...', percent: 60 } });

      // 2. Validate
      const validation = validateBackupPayload(rawJson);
      if (!validation.valid || !validation.payload) {
        throw new Error(validation.errors.join(' '));
      }

      set({ backupProgress: { stage: 'Restoring database...', percent: 85 } });

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
        feedbackMessage: 'Database restored from Google Drive backup successfully!',
      });

      return true;
    } catch (err: any) {
      console.error('[useBackupStore] Restore failed:', err);
      set({
        isRestoring: false,
        backupProgress: null,
        error: err.message || 'Failed to restore backup.',
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
        feedbackMessage: 'Backup deleted successfully.',
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete backup file.' });
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
        throw new Error('CSV file is empty or has no data.');
      }

      const mappedTransactions = mapCashRunwayCsvRows(parsed.rows);
      if (mappedTransactions.length === 0) {
        throw new Error('No valid transactions found in CSV file.');
      }

      const result = await importTransactionsBatch(mappedTransactions, strategy);

      // Refresh finance store
      try {
        const { useFinanceStore } = require('@/store/useFinanceStore');
        await useFinanceStore.getState().loadAllData({ force: true, showLoading: false });
      } catch (_) {}

      set({
        isImporting: false,
        feedbackMessage: `Successfully imported ${result.imported} transactions (${result.skipped} skipped).`,
      });

      return result;
    } catch (err: any) {
      set({
        isImporting: false,
        error: err.message || 'Failed to import CSV data.',
      });
      throw err;
    }
  },

  clearFeedback: () => set({ error: null, feedbackMessage: null }),
}));
