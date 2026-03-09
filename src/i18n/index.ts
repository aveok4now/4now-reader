import { moment } from 'obsidian';
import en, { type TranslationKey } from './en';
import ru from './ru';

export type SupportedLocale = 'auto' | 'en' | 'ru';

const catalogs: Record<string, Partial<Record<TranslationKey, string>>> = { en, ru };

let _locale: SupportedLocale = 'auto';

export function setLocale(locale: SupportedLocale): void {
  _locale = locale;
}

function resolveLocale(): string {
  if (_locale !== 'auto') return _locale;

  const momentLang = (moment.locale() ?? '').split('-')[0].toLowerCase();
  if (momentLang && momentLang in catalogs) return momentLang;

  const navLang = (navigator.language ?? 'en').split('-')[0].toLowerCase();
  return navLang in catalogs ? navLang : 'en';
}

export function t(key: TranslationKey): string {
  const locale = resolveLocale();
  return catalogs[locale]?.[key] ?? en[key];
}