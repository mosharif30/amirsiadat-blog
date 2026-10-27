export type StoredObject = { key: string; url: string };

/**
 * Pluggable file storage. The local driver is the default; a cloud driver (S3, R2, Supabase,
 * Cloudinary…) only needs to implement these three methods and be returned from getStorage().
 */
export interface StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  /** Public URL for a key. */
  url(key: string): string;
}
