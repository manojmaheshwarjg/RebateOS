import { db, generateId, getCurrentTimestamp } from './db';

/**
 * File storage utilities for managing file blobs in IndexedDB
 */

export interface FileUploadResult {
  id: string;
  url: string; // blob URL
  path: string;
  size: number;
}

/**
 * Upload a file to IndexedDB storage
 * @param file The file to upload
 * @param path Optional path (defaults to auto-generated)
 * @returns Upload result with ID and blob URL
 */
export async function uploadFile(file: File, path?: string): Promise<FileUploadResult> {
  const id = generateId();
  const filePath = path || `${id}/${file.name}`;

  // Store the blob
  await db.file_blobs.add({
    id,
    blob: file,
    created_at: getCurrentTimestamp(),
  });

  // Generate a blob URL for display
  const url = URL.createObjectURL(file);

  return {
    id,
    url,
    path: filePath,
    size: file.size,
  };
}

/**
 * Get a file blob URL by ID
 * @param id File ID
 * @returns Blob URL or null if not found
 */
export async function getFileUrl(id: string): Promise<string | null> {
  const fileBlob = await db.file_blobs.get(id);
  if (!fileBlob) return null;

  return URL.createObjectURL(fileBlob.blob);
}

/**
 * Get the actual blob by ID
 * @param id File ID
 * @returns Blob or null if not found
 */
export async function getFileBlob(id: string): Promise<Blob | null> {
  const fileBlob = await db.file_blobs.get(id);
  return fileBlob?.blob || null;
}

/**
 * Convert a file blob to base64 data URI
 * @param id File ID
 * @returns Data URI string or null
 */
export async function getFileAsDataUri(id: string): Promise<string | null> {
  const blob = await getFileBlob(id);
  if (!blob) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Delete a file from storage
 * @param id File ID
 */
export async function deleteFile(id: string): Promise<void> {
  await db.file_blobs.delete(id);
}

/**
 * Get multiple file URLs by IDs
 * @param ids Array of file IDs
 * @returns Map of ID to blob URL
 */
export async function getFileUrls(ids: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();

  for (const id of ids) {
    const url = await getFileUrl(id);
    if (url) {
      urls.set(id, url);
    }
  }

  return urls;
}

/**
 * Calculate total storage used (in bytes)
 * @returns Total bytes used
 */
export async function getTotalStorageUsed(): Promise<number> {
  const blobs = await db.file_blobs.toArray();
  return blobs.reduce((total, item) => total + item.blob.size, 0);
}

/**
 * Clear all file storage
 */
export async function clearAllFiles(): Promise<void> {
  await db.file_blobs.clear();
}
