import type { BookMeta, ReadingProgress } from "./types";
import type { LibrarySortOrder, LibraryTab, PluginData } from "./plugin-data";

import {
  LOCALES,
  READING_MODES,
  SLIDER_LIMITS,
  THEME_VALUES,
} from "../constants";
import { DEFAULT_DATA, DEFAULT_LIBRARY_UI_STATE } from "./plugin-data";
import { DEFAULT_SETTINGS } from "./settings";

type Dict = Record<string, unknown>;

const isObject = (v: unknown): v is Dict =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isString = (v: unknown): v is string => typeof v === "string";
const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

const isMember = <T extends string>(
  v: unknown,
  members: ReadonlyArray<T>,
): v is T => typeof v === "string" && (members as ReadonlyArray<string>).includes(v);

export function migrate(raw: unknown): PluginData {
  if (!isObject(raw)) return { ...DEFAULT_DATA };

  return {
    schemaVersion: isFiniteNumber(raw.schemaVersion)
      ? raw.schemaVersion
      : DEFAULT_DATA.schemaVersion,
    settings: migrateSettings(raw.settings),
    libraryIndex: migrateLibraryIndex(raw.libraryIndex),
    readingProgress: migrateReadingProgress(raw.readingProgress),
    favorites: migrateFavorites(raw.favorites),
    libraryUiState: migrateLibraryUiState(raw.libraryUiState),
  };
}

function migrateSettings(raw: unknown): PluginData["settings"] {
  const base = { ...DEFAULT_SETTINGS };
  if (!isObject(raw)) return base;

  if (isMember(raw.readingMode, READING_MODES)) {
    base.readingMode = raw.readingMode;
  }
  if (isMember(raw.readerTheme, THEME_VALUES)) {
    base.readerTheme = raw.readerTheme;
  }
  if (isString(raw.fontFamily)) base.fontFamily = raw.fontFamily;
  if (isFiniteNumber(raw.fontSize)) {
    base.fontSize = clamp(
      raw.fontSize,
      SLIDER_LIMITS.fontSize.min,
      SLIDER_LIMITS.fontSize.max,
    );
  }
  if (isFiniteNumber(raw.lineHeight)) {
    base.lineHeight = clamp(
      raw.lineHeight,
      SLIDER_LIMITS.lineHeight.min,
      SLIDER_LIMITS.lineHeight.max,
    );
  }
  if (isFiniteNumber(raw.paragraphSpacing)) {
    base.paragraphSpacing = clamp(
      raw.paragraphSpacing,
      SLIDER_LIMITS.paragraphSpacing.min,
      SLIDER_LIMITS.paragraphSpacing.max,
    );
  }
  if (isFiniteNumber(raw.textWidth)) {
    base.textWidth = clamp(
      raw.textWidth,
      SLIDER_LIMITS.textWidth.min,
      SLIDER_LIMITS.textWidth.max,
    );
  }
  if (isString(raw.exportFolder)) base.exportFolder = raw.exportFolder;
  if (typeof raw.scanOnStartup === "boolean")
    base.scanOnStartup = raw.scanOnStartup;
  if (typeof raw.openInNewLeaf === "boolean")
    base.openInNewLeaf = raw.openInNewLeaf;
  if (typeof raw.toolbarAutoHide === "boolean")
    base.toolbarAutoHide = raw.toolbarAutoHide;
  if (isMember(raw.locale, LOCALES)) {
    base.locale = raw.locale;
  }
  return base;
}

function migrateLibraryIndex(raw: unknown): Record<string, BookMeta> {
  if (!isObject(raw)) return {};
  const out: Record<string, BookMeta> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isObject(value)) continue;
    if (!isString(value.vaultPath)) continue;
    out[key] = {
      vaultPath: value.vaultPath,
      title: isString(value.title) ? value.title : "",
      author: isString(value.author) ? value.author : "",
      coverUrl: isString(value.coverUrl) ? value.coverUrl : undefined,
      lastOpened: isFiniteNumber(value.lastOpened)
        ? value.lastOpened
        : undefined,
    };
  }
  return out;
}

function migrateReadingProgress(
  raw: unknown,
): Record<string, ReadingProgress> {
  if (!isObject(raw)) return {};
  const out: Record<string, ReadingProgress> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isObject(value)) continue;
    if (!isString(value.vaultPath) || !isString(value.cfi)) continue;
    out[key] = {
      vaultPath: value.vaultPath,
      cfi: value.cfi,
      percentage: isFiniteNumber(value.percentage)
        ? clamp(value.percentage, 0, 1)
        : 0,
      chapterTitle: isString(value.chapterTitle)
        ? value.chapterTitle
        : undefined,
      updatedAt: isFiniteNumber(value.updatedAt) ? value.updatedAt : Date.now(),
    };
  }
  return out;
}

function migrateFavorites(raw: unknown): Record<string, true> {
  if (!isObject(raw)) return {};
  const out: Record<string, true> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === true) out[key] = true;
  }
  return out;
}

function migrateLibraryUiState(raw: unknown): PluginData["libraryUiState"] {
  const base = { ...DEFAULT_LIBRARY_UI_STATE };
  if (!isObject(raw)) return base;
  const sorts: ReadonlyArray<LibrarySortOrder> = [
    "title-asc",
    "title-desc",
    "author-asc",
    "last-opened",
  ];
  const tabs: ReadonlyArray<LibraryTab> = ["recent", "all", "favorites"];
  if (isMember(raw.sortOrder, sorts)) base.sortOrder = raw.sortOrder;
  if (isMember(raw.activeTab, tabs)) base.activeTab = raw.activeTab;
  return base;
}
