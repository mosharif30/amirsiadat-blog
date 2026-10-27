import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter } from "./types";

/** Stores files on disk (UPLOAD_DIR); they are served by app/uploads/[...path]/route.ts. */
export class LocalStorage implements StorageAdapter {
  constructor(
    readonly root: string,
    readonly publicPath = "/uploads",
  ) {}

  /** Absolute path for a key, refusing anything that escapes the upload directory. */
  resolve(key: string): string {
    const file = path.resolve(this.root, key);
    if (!file.startsWith(path.resolve(this.root) + path.sep)) throw new Error("Invalid storage key");
    return file;
  }

  async put(key: string, data: Buffer) {
    const file = this.resolve(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data, { flag: "wx" });
    return { key, url: this.url(key) };
  }

  async delete(key: string) {
    await rm(this.resolve(key), { force: true });
  }

  read(key: string) {
    return readFile(this.resolve(key));
  }

  url(key: string) {
    return `${this.publicPath}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }
}
