import { Plugin } from "obsidian";
import type { PluginData } from "../models/plugin-data";
import type { ReadingProgress } from "../models/types";

export class ReaderSessionService {
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(
		private readonly plugin: Plugin,
		private readonly data: PluginData,
	) {}

	getProgress(vaultPath: string): ReadingProgress | undefined {
		return this.data.readingProgress?.[vaultPath];
	}

	recordProgress(
		vaultPath: string,
		cfi: string,
		percentage: number,
		chapterTitle?: string,
	): void {
		this.data.readingProgress ??= {};
		this.data.readingProgress[vaultPath] = {
			vaultPath,
			cfi,
			percentage,
			chapterTitle,
			updatedAt: Date.now(),
		};

		if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = null;
			void this.plugin.saveData(this.data);
		}, 1500);
	}

	async flush(): Promise<void> {
		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
			await this.plugin.saveData(this.data);
		}
	}

	async updateRecent(vaultPath: string): Promise<void> {
		const deduped = (this.data.recentBooks ?? []).filter(
			(p) => p !== vaultPath,
		);
		this.data.recentBooks = [vaultPath, ...deduped].slice(0, 20);
		await this.plugin.saveData(this.data);
	}
}
