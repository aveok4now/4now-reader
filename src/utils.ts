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

// epubjs hrefs vary: 'OEBPS/chap-1.xhtml', './chap-1.xhtml#anchor', 'chap-1.xhtml'.
// Strip path/fragment, lowercase the leaf so TOC-vs-current matches.
export function normalizeHref(href: string): string {
	return href.split("#")[0].split("/").pop()?.toLowerCase() ?? href;
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
