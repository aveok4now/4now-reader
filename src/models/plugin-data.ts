import type { BookMeta, Bookmark, Highlight, ReadingProgress } from './types';
import type { FourNowReaderSettings } from '../settings';

export type LibrarySortOrder = "title-asc" | "title-desc" | "author-asc" | "last-opened";
export type LibraryTab = "recent" | "all" | "favorites";

export interface LibraryUiState {
  sortOrder: LibrarySortOrder;
  activeTab: LibraryTab;
}

export const DEFAULT_LIBRARY_UI_STATE: LibraryUiState = {
  sortOrder: "title-asc",
  activeTab: "all",
};

export interface PluginData {
  settings: FourNowReaderSettings;
  /** vaultPath -> BookMeta */
  libraryIndex: Record<string, BookMeta>;
  /** vaultPaths, most recent first (max 20) */
  recentBooks: string[];
  /** vaultPath -> ReadingProgress */
  readingProgress: Record<string, ReadingProgress>;
  /** vaultPath -> Bookmark[] */
  bookmarks: Record<string, Bookmark[]>;
  /** vaultPath -> Highlight[] */
  highlights: Record<string, Highlight[]>;
  libraryUiState: LibraryUiState;
}
