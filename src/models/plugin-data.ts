import type { BookMeta, Bookmark, Highlight, ReadingProgress } from './types';
import type { Read4sidianSettings } from '../settings';

export interface PluginData {
  settings: Read4sidianSettings;
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
}
