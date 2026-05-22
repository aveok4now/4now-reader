import type { SupportedLocale } from "../i18n";

export type ReadingMode = "scroll" | "paginated";

export type ReaderTheme = "adaptive" | "light" | "dark" | "sepia" | "cream" | "night";

export const READING_MODES: ReadonlyArray<ReadingMode> = ["scroll", "paginated"];

export const LOCALES: ReadonlyArray<SupportedLocale> = ["auto", "en", "ru"];

export interface BookMeta {
  vaultPath: string;
  title: string;
  author: string;
  coverUrl?: string;
  lastOpened?: number;
}

export interface ReadingProgress {
  vaultPath: string;
  cfi: string;
  percentage: number;
  chapterTitle?: string;
  updatedAt: number;
}
