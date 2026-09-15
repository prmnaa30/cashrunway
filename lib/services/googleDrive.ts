export interface GoogleDriveFile {
  id: string;
  name: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

const DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

/**
 * List backup files stored in user's hidden appDataFolder.
 * Returns records ordered by creation time descending (latest first).
 */
export async function listBackupFiles(accessToken: string): Promise<GoogleDriveFile[]> {
  const url = `${DRIVE_FILES_ENDPOINT}?spaces=appDataFolder&fields=files(id,name,size,createdTime,modifiedTime)&orderBy=createdTime desc`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list Google Drive backups (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const files: GoogleDriveFile[] = (data.files || []).filter((f: any) =>
    f.name && (f.name.endsWith('.json') || f.name.includes('cashrunway-backup'))
  );

  return files;
}

/**
 * Upload a structured JSON backup into Google Drive appDataFolder using RFC 2387 multipart.
 */
export async function uploadBackupFile(
  accessToken: string,
  jsonPayload: string,
  fileName?: string
): Promise<GoogleDriveFile> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const actualFileName = fileName || `cashrunway-backup-${timestamp}.json`;

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: actualFileName,
    mimeType: 'application/json',
    parents: ['appDataFolder'],
  };

  const multipartBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    jsonPayload +
    closeDelimiter;

  const response = await fetch(DRIVE_UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload backup to Google Drive (${response.status}): ${errorText}`);
  }

  const uploadedFile: GoogleDriveFile = await response.json();
  return uploadedFile;
}

/**
 * Download a backup file's raw JSON content by file ID.
 */
export async function downloadBackupFile(
  accessToken: string,
  fileId: string
): Promise<string> {
  const url = `${DRIVE_FILES_ENDPOINT}/${fileId}?alt=media`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to download backup from Google Drive (${response.status}): ${errorText}`);
  }

  return await response.text();
}

/**
 * Delete a specific backup file from Google Drive.
 */
export async function deleteBackupFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const url = `${DRIVE_FILES_ENDPOINT}/${fileId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`Failed to delete backup file (${response.status}): ${errorText}`);
  }
}

/**
 * Enforce rolling retention policy (keep at most maxKeep backups, e.g. 5).
 * Older files beyond the limit will be deleted asynchronously.
 */
export async function enforceRetentionPolicy(
  accessToken: string,
  maxKeep = 5
): Promise<number> {
  try {
    const files = await listBackupFiles(accessToken);
    if (files.length <= maxKeep) {
      return 0;
    }

    const filesToDelete = files.slice(maxKeep);
    let deletedCount = 0;

    for (const file of filesToDelete) {
      try {
        await deleteBackupFile(accessToken, file.id);
        deletedCount++;
      } catch (err) {
        console.warn(`[GoogleDrive] Failed to prune old backup ${file.id}:`, err);
      }
    }

    return deletedCount;
  } catch (err) {
    console.warn('[GoogleDrive] Retention policy error:', err);
    return 0;
  }
}
