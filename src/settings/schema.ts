import type { SupportedLocale } from "../i18n";
import type { ReaderTheme, ReadingMode } from "../data/types";

export interface ForNowReaderSettings {
  readingMode: ReadingMode;
  readerTheme: ReaderTheme;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  textWidth: number;
  exportFolder: string;
  scanOnStartup: boolean;
  openInNewLeaf: boolean;
  toolbarAutoHide: boolean;
  locale: SupportedLocale;
}

export const DEFAULT_SETTINGS: ForNowReaderSettings = {
  readingMode: "scroll",
  readerTheme: "adaptive",
  fontFamily: "Georgia, serif",
  fontSize: 16,
  lineHeight: 1.6,
  paragraphSpacing: 10,
  textWidth: 504,
  exportFolder: "Reading/Exports",
  scanOnStartup: true,
  openInNewLeaf: false,
  toolbarAutoHide: false,
  locale: "auto",
};

export function resetSetting<K extends keyof ForNowReaderSettings>(target: ForNowReaderSettings, key: K): void {
  target[key] = DEFAULT_SETTINGS[key];
}
