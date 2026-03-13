import { setTooltip } from "obsidian";

export function tip(label: string) {
	return (el: HTMLElement | null) => {
		if (el) setTooltip(el, label);
	};
}

export function formatDateShort(timestamp: number): string {
	return new Date(timestamp).toLocaleString(undefined, {
		dateStyle: "short",
		timeStyle: "short",
	});
}
