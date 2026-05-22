import type { TranslationKey } from "../i18n/en";
import type { ReaderTheme } from "../data/types";

export const THEME_OPTIONS: ReadonlyArray<{
  value: ReaderTheme;
  labelKey: TranslationKey;
}> = [
  { value: "adaptive", labelKey: "theme.adaptive" },
  { value: "light", labelKey: "theme.light" },
  { value: "dark", labelKey: "theme.dark" },
  { value: "sepia", labelKey: "theme.sepia" },
  { value: "cream", labelKey: "theme.cream" },
  { value: "night", labelKey: "theme.night" },
];

export const THEME_VALUES: ReadonlyArray<ReaderTheme> = THEME_OPTIONS.map((o) => o.value);

export const THEME_COLORS: Record<Exclude<ReaderTheme, "adaptive">, { bg: string; fg: string }> = {
  light: { bg: "#ffffff", fg: "#1a1a1a" },
  dark: { bg: "#1e1e1e", fg: "#d4d4d4" },
  sepia: { bg: "#f4ecd8", fg: "#3b2f2f" },
  cream: { bg: "#FAF7EF", fg: "#3D3427" },
  night: { bg: "#111111", fg: "#999999" },
};

export function resolveThemeColors(theme: ReaderTheme): {
  bg: string;
  fg: string;
} {
  if (theme === "adaptive") {
    const styles = getComputedStyle(document.body);
    return {
      bg: styles.getPropertyValue("--background-primary").trim(),
      fg: styles.getPropertyValue("--text-normal").trim(),
    };
  }
  return THEME_COLORS[theme];
}
