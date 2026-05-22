import type { PluginData } from "../data/PluginData";
import type { TFile, Vault } from "obsidian";

import ePub from "epubjs";

export class LibraryIndexService {
  constructor(
    private readonly vault: Vault,
    private readonly data: PluginData,
    private readonly persist: () => Promise<void>,
  ) {}

  async scanVault(): Promise<void> {
    const files = this.vault.getFiles().filter((f) => f.extension === "epub");
    for (const file of files) {
      await this.scanFile(file);
    }
    await this.persist();
  }

  async scanFile(file: TFile): Promise<boolean> {
    let book: ReturnType<typeof ePub> | null = null;
    try {
      const ab = await this.vault.readBinary(file);
      book = ePub(ab);

      await Promise.allSettled([book.opened, ...Object.values(book.loaded)]);
      const meta = await book.loaded.metadata;

      const existing = this.data.libraryIndex[file.path];
      this.data.libraryIndex[file.path] = {
        vaultPath: file.path,
        title: meta.title || file.basename,
        author: meta.creator || "",
        lastOpened: existing?.lastOpened,
      };
      return true;
    } catch (err) {
      console.error(`[4now] failed to scan ${file.path}:`, err);
      return false;
    } finally {
      try {
        book?.destroy();
      } catch {}
    }
  }

  removeFile(vaultPath: string): void {
    delete this.data.libraryIndex[vaultPath];
    delete this.data.favorites[vaultPath];
    delete this.data.readingProgress[vaultPath];
  }

  renameFile(oldPath: string, newPath: string): boolean {
    const existing = this.data.libraryIndex[oldPath];
    if (existing) {
      delete this.data.libraryIndex[oldPath];
      this.data.libraryIndex[newPath] = { ...existing, vaultPath: newPath };
    }

    if (this.data.favorites[oldPath]) {
      delete this.data.favorites[oldPath];
      this.data.favorites[newPath] = true;
    }

    const progress = this.data.readingProgress[oldPath];
    if (progress) {
      delete this.data.readingProgress[oldPath];
      this.data.readingProgress[newPath] = { ...progress, vaultPath: newPath };
    }

    return existing !== undefined;
  }
}
