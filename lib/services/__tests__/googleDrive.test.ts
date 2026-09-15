import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listBackupFiles,
  uploadBackupFile,
  downloadBackupFile,
  deleteBackupFile,
  enforceRetentionPolicy,
} from '../googleDrive';

describe('Google Drive REST API Service', () => {
  const mockToken = 'mock_access_token_123';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists and filters json backup files from appDataFolder', async () => {
    const mockFilesResponse = {
      files: [
        { id: 'f1', name: 'cashrunway-backup-2026-09-15.json', size: '1024', createdTime: '2026-09-15T12:00:00Z' },
        { id: 'f2', name: 'cashrunway-backup-2026-09-14.json', size: '2048', createdTime: '2026-09-14T12:00:00Z' },
        { id: 'f3', name: 'other-unrelated-file.txt', size: '512', createdTime: '2026-09-10T00:00:00Z' },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockFilesResponse,
    } as any);

    const files = await listBackupFiles(mockToken);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('spaces=appDataFolder'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      })
    );
    expect(files).toHaveLength(2);
    expect(files[0].id).toBe('f1');
    expect(files[1].id).toBe('f2');
  });

  it('uploads multipart backup file to appDataFolder', async () => {
    const mockUploadResponse = {
      id: 'new_file_id',
      name: 'cashrunway-backup-test.json',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUploadResponse,
    } as any);

    const jsonPayload = JSON.stringify({ version: 1, test: true });
    const uploaded = await uploadBackupFile(mockToken, jsonPayload, 'cashrunway-backup-test.json');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('uploadType=multipart'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': expect.stringContaining('multipart/related; boundary='),
        }),
        body: expect.stringContaining('"parents":["appDataFolder"]'),
      })
    );
    expect(uploaded.id).toBe('new_file_id');
  });

  it('downloads raw JSON backup content from Drive file', async () => {
    const expectedContent = '{"version":1,"data":{}}';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => expectedContent,
    } as any);

    const content = await downloadBackupFile(mockToken, 'file_123');
    expect(fetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/drive/v3/files/file_123?alt=media',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      })
    );
    expect(content).toBe(expectedContent);
  });

  it('deletes backup file with DELETE request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    } as any);

    await deleteBackupFile(mockToken, 'file_to_delete');
    expect(fetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/drive/v3/files/file_to_delete',
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });

  it('enforces retention policy by removing files past the threshold', async () => {
    // 7 files, max keep is 5 -> should delete 2 oldest
    const mockFiles = Array.from({ length: 7 }, (_, i) => ({
      id: `file_${i}`,
      name: `cashrunway-backup-${i}.json`,
      createdTime: new Date(2026, 8, 20 - i).toISOString(),
    }));

    global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (opts?.method === 'DELETE') {
        return Promise.resolve({ ok: true, status: 204 });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ files: mockFiles }),
      });
    });

    const deletedCount = await enforceRetentionPolicy(mockToken, 5);
    expect(deletedCount).toBe(2);
  });
});
