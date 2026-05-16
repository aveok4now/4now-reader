const en = {
  // Reader
  "reader.title": "Reader",
  "reader.opening": "Opening book…",
  "reader.error.title": "Could not open book",
  "reader.error.notFound": "File not found",

  // Toolbar
  "toolbar.toc": "Table of contents",
  "toolbar.theme": "Theme",
  "toolbar.typography": "Typography",
  "toolbar.prevChapter": "Previous chapter",
  "toolbar.nextChapter": "Next chapter",
  "toolbar.prevPage": "Previous page",
  "toolbar.nextPage": "Next page",
  "toolbar.autoHide": "Auto-hide toolbar",

  // Reading modes
  "mode.scroll": "Scroll",
  "mode.paginated": "Paginated",

  // Themes
  "theme.adaptive": "Adaptive",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.sepia": "Sepia",
  "theme.cream": "Cream",
  "theme.night": "Night",

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
  "settings.fontFamily.placeholder": "Book's own font",
  "settings.paragraphSpacing.name": "Paragraph spacing",
  "settings.paragraphSpacing.desc": "Space between paragraphs in pixels.",
  "settings.textWidth.name": "Text width",
  "settings.textWidth.desc": "Maximum content width in pixels.",
  "settings.exportFolder.name": "Export folder",
  "settings.exportFolder.desc":
    "Vault path where annotation exports are saved.",
  "settings.scanOnStartup.name": "Scan vault on startup",
  "settings.scanOnStartup.desc": "Index EPUB files when Obsidian opens.",
  "settings.openInNewLeaf.name": "Open book in new tab",
  "settings.openInNewLeaf.desc": "When disabled, reuses the current tab.",
  "settings.toolbarAutoHide.desc": "Hides the toolbar until you hover over the reader area.",
  "settings.locale.name": "Interface language",
  "settings.locale.desc": "Language used in the plugin interface.",
  "settings.locale.auto": "Auto (follow Obsidian)",
  "settings.locale.en": "English",
  "settings.locale.ru": "Russian",

  // Library
  "library.title": "Library",
  "library.empty": "No books found in vault",
  "library.scanning": "Scanning vault…",
  "library.recent": "Recent",
  "library.allBooks": "All books",
  "library.search": "Search by title, author, or path…",
  "library.noResults": "No books match your search",
  "library.sort.titleAsc": "Title A → Z",
  "library.sort.titleDesc": "Title Z → A",
  "library.sort.authorAsc": "Author A → Z",
  "library.sort.lastOpened": "Recently opened",
  "library.sort.label": "Sort",
  "library.tabs.recent": "Recent",
  "library.tabs.all": "All Books",
  "library.tabs.favorites": "Favorites",
  "library.recent.empty": "No books opened yet",
  "library.favorites.empty": "No favorites yet",
  "library.favorites.tooltip.add": "Add to favorites",
  "library.favorites.tooltip.remove": "Remove from favorites",
  "library.scanFailed": "Could not read EPUB: {path}",

  // Settings reset
  "settings.reset.tooltip": "Reset to default",
  "settings.reset.allButton": "Reset reading settings",
  "settings.reset.confirmMessage": "Reset all reading and appearance settings to defaults?",
  "settings.reset.confirmYes": "Reset",
  "settings.reset.confirmNo": "Cancel",
  "settings.reset.tooltipAlreadyDefault": "Reading settings are already at defaults",
  "settings.reset.alreadyDefault": "Reading settings are already at defaults",
  "settings.reset.success": "Reading settings reset to defaults",

  // Commands
  "command.openEpub": "Open EPUB book",
  "command.openLibrary": "Open library",
} as const;

export type TranslationKey = keyof typeof en;
export default en;
