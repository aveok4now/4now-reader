import type { PluginData } from "../models/plugin-data";
import type { ReadingProgress } from "../models/types";
import type { Plugin } from "obsidian";

import { LIBRARY, TIMING } from "../constants";

export class ReaderSessionService {
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private pendingRecentMoves: string[] = [];

	constructor(
		private readonly plugin: Plugin,
		private readonly data: PluginData,
		private readonly onChange?: () => void,
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
		const previous = this.data.readingProgress[vaultPath];
		this.data.readingProgress[vaultPath] = {
			vaultPath,
			cfi,
			percentage,
			chapterTitle: chapterTitle ?? previous?.chapterTitle,
			updatedAt: Date.now(),
		};

		this.onChange?.();

		if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = null;
			void this.plugin.saveData(this.data);
		}, TIMING.SESSION_SAVE_DEBOUNCE_MS);
	}

	async flush(): Promise<void> {
		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
			await this.plugin.saveData(this.data);
		}
	}

	updateRecent(vaultPath: string): void {
		this.pendingRecentMoves.push(vaultPath);
	}

	flushRecentReorder(): void {
		if (this.pendingRecentMoves.length === 0) return;
		const moves = this.pendingRecentMoves;
		this.pendingRecentMoves = [];
		let recent = [...(this.data.recentBooks ?? [])];
		for (const path of moves) {
			recent = [path, ...recent.filter((p) => p !== path)];
		}
		this.data.recentBooks = recent.slice(0, LIBRARY.RECENT_BOOKS_LIMIT);
		void this.plugin.saveData(this.data);
		this.onChange?.();
	}
}
