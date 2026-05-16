export type ReadingMode = "scroll" | "paginated";

export type ReaderTheme = "adaptive" | "light" | "dark" | "sepia" | "cream" | "night";

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
