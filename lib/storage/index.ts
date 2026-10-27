import path from "node:path";
import { LocalStorage } from "./local";
import type { StorageAdapter } from "./types";

export type { StorageAdapter, StoredObject } from "./types";

export const uploadDir = () => path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.UPLOAD_DIR || "storage/uploads");

let local: LocalStorage | undefined;

export function getLocalStorage(): LocalStorage {
  return (local ??= new LocalStorage(uploadDir()));
}

export function getStorage(): StorageAdapter {
  const driver = process.env.STORAGE_DRIVER || "local";
  if (driver === "local") return getLocalStorage();
  throw new Error(`Unknown STORAGE_DRIVER "${driver}". Implement it in lib/storage (see StorageAdapter).`);
}
