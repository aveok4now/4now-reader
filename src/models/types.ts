export type ReadingMode = "scroll" | "paginated";

export type ReaderTheme = "adaptive" | "light" | "dark" | "sepia" | "cream" | "night";

export type HighlightColor =
	| "yellow"
	| "green"
	| "blue"
	| "pink"
	| "orange"
	| "purple"
	| (string & {});

export interface BookMeta {
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
