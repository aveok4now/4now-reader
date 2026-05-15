export const READER = {
	MAX_TEXT_WIDTH_PX: 1200,
	CFI_GENERATION_POINTS: 150,
	TOC_MIN_WIDTH_EM: 10,
	TOC_MAX_WIDTH_PCT: 0.6,
	TOC_ITEM_BASE_PAD_PX: 12,
	TOC_ITEM_DEPTH_STEP_PX: 16,
} as const;

export const TIMING = {
	RESIZE_DEBOUNCE_MS: 400,
	TOOLBAR_AUTOHIDE_MS: 2000,
	TOOLBAR_HIDE_DELAY_MS: 300,
	SESSION_SAVE_DEBOUNCE_MS: 1500,
	SETTINGS_SAVE_DEBOUNCE_MS: 500,
} as const;

export const LIBRARY = {
	RECENT_BOOKS_LIMIT: 20,
} as const;

export const SLIDER_LIMITS = {
	fontSize:         { min: 12,  max: 28,   step: 1   },
	lineHeight:       { min: 1.2, max: 2.4,  step: 0.1 },
	paragraphSpacing: { min: 0,   max: 24,   step: 2   },
	textWidth:        { min: 400, max: 1200, step: 50  },
} as const;

export function rangePct(value: number, range: { min: number; max: number }): number {
	return Math.round(((value - range.min) / (range.max - range.min)) * 100);
}
