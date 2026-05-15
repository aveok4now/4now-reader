import type { PluginData } from "../models/plugin-data";
import type { BookMeta } from "../models/types";

import ePub from "epubjs";
import { TFile, Vault } from "obsidian";

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

	async scanFile(file: TFile): Promise<void> {
		try {
			const ab = await this.vault.readBinary(file);
			const book = ePub(ab);
			// Swallow secondary rejections; don't book.destroy() here — it would
			// tear down internals while these promises are still in-flight.
			void book.opened.catch(() => {});
			const { metadata, ...rest } = book.loaded;
			Object.values(rest).forEach((p) => void p.catch(() => {}));
			const meta = await metadata;

			const existing = this.data.libraryIndex[file.path];
			this.data.libraryIndex[file.path] = {
				vaultPath: file.path,
				title: meta.title || file.basename,
				author: meta.creator || "",
				lastOpened: existing?.lastOpened,
			};
		} catch {}
	}

	removeFile(vaultPath: string): void {
		delete this.data.libraryIndex[vaultPath];
		if (this.data.favorites) delete this.data.favorites[vaultPath];
	}

	renameFile(oldPath: string, newPath: string, newFile: TFile): void {
		const existing = this.data.libraryIndex[oldPath];
		if (existing) {
			delete this.data.libraryIndex[oldPath];
			this.data.libraryIndex[newPath] = { ...existing, vaultPath: newPath };
		} else {
			void this.scanFile(newFile).then(() => this.persist());
		}
	}

	getBook(vaultPath: string): BookMeta | undefined {
		return this.data.libraryIndex[vaultPath];
	}

	getAllBooks(): BookMeta[] {
		return Object.values(this.data.libraryIndex);
	}

	getRecentBooks(): BookMeta[] {
		return this.data.recentBooks
			.map((p) => this.data.libraryIndex[p])
			.filter((b): b is BookMeta => b !== undefined);
	}
}
