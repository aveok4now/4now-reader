import type { PluginData } from "../data/PluginData";
import type { ReadingProgress } from "../data/types";

import { LIBRARY } from "../library/constants";
import { TIMING } from "../shared/timing";

export class ReaderSessionService {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly data: PluginData,
    private readonly persist: () => Promise<void>,
    private readonly onChange?: () => void,
  ) {}

  getProgress(vaultPath: string): ReadingProgress | undefined {
    return this.data.readingProgress[vaultPath];
  }

  getRecentPaths(): string[] {
    return Object.values(this.data.readingProgress)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, LIBRARY.RECENT_BOOKS_LIMIT)
      .map((p) => p.vaultPath);
  }

  recordProgress(
    vaultPath: string,
    cfi: string,
    percentage: number,
    chapterTitle?: string,
  ): void {
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
      void this.persist();
    }, TIMING.SESSION_SAVE_DEBOUNCE_MS);
  }

  async flush(): Promise<void> {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      await this.persist();
    }
  }
}
