const en = {
	// Reader
	"reader.title": "Reader",
	"reader.opening": "Opening book…",
	"reader.error.title": "Could not open book",
	"reader.error.notFound": "File not found",

	// Toolbar
	"toolbar.toc": "Table of contents",
	"toolbar.addBookmark": "Add bookmark",
	"toolbar.theme": "Theme",

	// Reading modes
	"mode.scroll": "Scroll",
	"mode.paginated": "Paginated",

	// Themes
	"theme.adaptive": "Adaptive",
	"theme.light": "Light",
	"theme.dark": "Dark",
	"theme.sepia": "Sepia",

	// Settings
	"settings.heading.reading": "Reading",
	"settings.heading.appearance": "Appearance",
	"settings.heading.library": "Library",
	"settings.heading.behaviour": "Behaviour",
	"settings.heading.language": "Language",
	"settings.readingMode.name": "Default reading mode",
	"settings.readingMode.desc": "Reading mode used when opening a book.",
	"settings.theme.name": "Default theme",
	"settings.theme.desc": "Visual theme for the reader.",
	"settings.fontSize.name": "Font size",
	"settings.fontSize.desc": "Base font size in pixels.",
	"settings.lineHeight.name": "Line height",
	"settings.lineHeight.desc": "Line spacing multiplier.",
	"settings.fontFamily.name": "Font family",
	"settings.fontFamily.desc": "Leave empty to use the book's own fonts.",
	"settings.textWidth.name": "Text width",
	"settings.textWidth.desc": "Maximum content width in pixels.",
	"settings.exportFolder.name": "Export folder",
	"settings.exportFolder.desc":
		"Vault path where annotation exports are saved.",
	"settings.scanOnStartup.name": "Scan vault on startup",
	"settings.scanOnStartup.desc": "Index EPUB files when Obsidian opens.",
	"settings.openInNewLeaf.name": "Open book in new tab",
	"settings.openInNewLeaf.desc": "When disabled, reuses the current tab.",
	"settings.footnoteBehavior.name": "Footnote behaviour",
	"settings.footnoteBehavior.desc": "How footnote links are handled.",
	"settings.footnoteBehavior.popover": "Show in popover",
	"settings.footnoteBehavior.inline": "Scroll to footnote",
	"settings.locale.name": "Interface language",
	"settings.locale.desc": "Language used in the plugin interface.",
	"settings.locale.auto": "Auto (follow Obsidian)",
	"settings.locale.en": "English",
	"settings.locale.ru": "Russian",

	// Commands
	"command.openEpub": "Open EPUB book",
} as const;

export type TranslationKey = keyof typeof en;
export default en;
