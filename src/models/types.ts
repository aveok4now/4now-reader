export type ReadingMode = "scroll" | "paginated";

// Phase 1: 4 themes. Extended set (cream, solarized, night, high-contrast) - Phase 3
export type ReaderTheme = "adaptive" | "light" | "dark" | "sepia";

/**
 * Preset highlight colors and arbitrary hex from color picker.
 * Full highlights implementation - Phase 4.
 */
export type HighlightColor =
	| "yellow"
	| "green"
	| "blue"
	| "pink"
	| "orange"
	| "purple"
	| (string & {}); // arbitrary hex

export interface BookMeta {
	// In MVP - vaultPath is used as stable key
	vaultPath: string;
	title: string;
	author: string;
	coverUrl?: string;
	lastOpened?: number;
}

export interface ReadingProgress {
	vaultPath: string;
	cfi: string;
	percentage: number;
	chapterTitle?: string;
	updatedAt: number;
}

export interface Bookmark {
	id: string;
	vaultPath: string;
	cfi: string;
	chapterTitle?: string;
	note?: string;
	createdAt: number;
}

export interface Highlight {
	id: string;
	vaultPath: string;
	cfi: string;
	text: string;
	color: HighlightColor;
	note?: string;
	chapterTitle?: string;
	createdAt: number;
}
