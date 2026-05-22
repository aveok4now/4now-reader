import type { BookMeta, ReadingProgress } from "./types";
import type { ForNowReaderSettings } from "../settings/schema";

import { DEFAULT_SETTINGS } from "../settings/schema";

export type LibrarySortOrder =
  | "title-asc"
  | "title-desc"
  | "author-asc"
  | "last-opened";
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
  schemaVersion: number;
  settings: ForNowReaderSettings;
  libraryIndex: Record<string, BookMeta>;
  readingProgress: Record<string, ReadingProgress>;
  favorites: Record<string, true>;
  libraryUiState: LibraryUiState;
}

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_DATA: PluginData = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  settings: { ...DEFAULT_SETTINGS },
  libraryIndex: {},
  readingProgress: {},
  favorites: {},
  libraryUiState: { ...DEFAULT_LIBRARY_UI_STATE },
};
