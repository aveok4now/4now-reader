import { Plugin } from "obsidian";
import type { PluginData } from "../models/plugin-data";
import type { ReadingProgress } from "../models/types";

export class ReaderSessionService {
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private pendingSave: PluginData | null = null;

	constructor(private readonly plugin: Plugin) {}

	private async loadData(): Promise<PluginData> {
		return (await this.plugin.loadData()) as PluginData;
	}

	getProgress(vaultPath: string): ReadingProgress | undefined {
		if (this.pendingSave) {
			return this.pendingSave.readingProgress?.[vaultPath];
		}
		return undefined;
	}

	recordProgress(
		vaultPath: string,
		cfi: string,
		percentage: number,
		chapterTitle?: string,
	): void {
		const progress: ReadingProgress = {
			vaultPath,
			cfi,
			percentage,
			chapterTitle,
			updatedAt: Date.now(),
		};

		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}

		if (this.pendingSave) {
			this.pendingSave.readingProgress[vaultPath] = progress;
		} else {
			// Schedule an async load + save in the debounce handler.
			// Store a sentinel so we know a save is queued.
		}

		this.debounceTimer = setTimeout(async () => {
			this.debounceTimer = null;
			await this._persist(vaultPath, progress);
		}, 1500);
	}

	async flush(): Promise<void> {
		if (this.debounceTimer === null && this.pendingSave === null) {
			return;
		}

		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}

		if (this.pendingSave !== null) {
			const data = this.pendingSave;
			this.pendingSave = null;
			await this.plugin.saveData(data);
		}
	}

	async updateRecent(vaultPath: string): Promise<void> {
		const data = await this.loadData();
		const recent: string[] = data.recentBooks ?? [];

		const deduped = recent.filter((p) => p !== vaultPath);

		data.recentBooks = [vaultPath, ...deduped].slice(0, 20);

		await this.plugin.saveData(data);
	}

	private async _persist(
		vaultPath: string,
		progress: ReadingProgress,
	): Promise<void> {
		const data = await this.loadData();
		data.readingProgress = data.readingProgress ?? {};
		data.readingProgress[vaultPath] = progress;
		this.pendingSave = data;
		await this.plugin.saveData(data);

		if (this.pendingSave === data) {
			this.pendingSave = null;
		}
	}
}
