import { Plugin } from "obsidian";
import { LIBRARY, TIMING } from "../constants";
import type { PluginData } from "../models/plugin-data";
import type { ReadingProgress } from "../models/types";

export class ReaderSessionService {
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(
		private readonly plugin: Plugin,
		private readonly data: PluginData,
		// Fired whenever the in-memory data changes (progress, recents) — used to
		// invalidate dependent views. Decoupled from the throttled disk save so
		// the library can update live as the user reads.
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
			// Preserve the prior chapter title when the caller can't supply one
			// (e.g. the post book.locations.generate callback fires before the
			// reactive title resolver in the renderer has settled).
			chapterTitle: chapterTitle ?? previous?.chapterTitle,
			updatedAt: Date.now(),
		};

		// Fire the UI update immediately so the library reflects live progress
		// while the user is reading; the disk save below stays debounced for IO.
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

	async updateRecent(vaultPath: string): Promise<void> {
		const deduped = (this.data.recentBooks ?? []).filter(
			(p) => p !== vaultPath,
		);
		this.data.recentBooks = [vaultPath, ...deduped].slice(0, LIBRARY.RECENT_BOOKS_LIMIT);
		await this.plugin.saveData(this.data);
		this.onChange?.();
	}
}
