import type { ReaderTheme } from "./models/types";

import { setTooltip } from "obsidian";

import { THEME_COLORS } from "./constants";

export function tip<T extends HTMLElement>(label: string): (el: T | null) => void {
  return (el: T | null) => {
    if (el) setTooltip(el, label);
  };
}

export function formatDateShort(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// epubjs hrefs vary: 'OEBPS/chap-1.xhtml', './chap-1.xhtml#anchor', 'chap-1.xhtml'.
// Strip path/fragment, lowercase the leaf so TOC-vs-current matches.
export function normalizeHref(href: string): string {
  return href.split("#")[0].split("/").pop()?.toLowerCase() ?? href;
}

export function resolveThemeColors(theme: ReaderTheme): { bg: string; fg: string } {
  if (theme === "adaptive") {
    const styles = getComputedStyle(document.body);
    return {
      bg: styles.getPropertyValue("--background-primary").trim(),
      fg: styles.getPropertyValue("--text-normal").trim(),
    };
  }
  return THEME_COLORS[theme];
}

export function rangePct(
  value: number,
  range: { min: number; max: number },
): number {
  return Math.round(((value - range.min) / (range.max - range.min)) * 100);
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number,
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  };
}
