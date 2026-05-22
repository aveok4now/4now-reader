import { setTooltip } from "obsidian";

export function tip<T extends HTMLElement>(label: string): (el: T | null) => void {
  return (el: T | null) => {
    if (el) setTooltip(el, label);
  };
}
