import type { Book, Rendition } from "epubjs";
import { ChevronLeft, ChevronRight, Heart, Sun, Type } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { READER, TIMING, resolveThemeColors } from "../constants";
import { t } from "../i18n";
import type { ForNowReaderSettings } from "../settings";
import { tip } from "../utils";
import { ThemePanel } from "./ThemePanel";
import type { NavItem } from "./TocOverlay";
import { TocOverlay } from "./TocOverlay";
import { TypographyPopover } from "./TypographyPopover";

interface EpubRendererProps {
  book: Book;
  settings: ForNowReaderSettings;
  initialCfi?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onProgress: (cfi: string, pct: number, chapterTitle?: string) => void;
  onSettingsChange: (
    partial: Partial<ForNowReaderSettings>,
  ) => void | Promise<void>;
}

// !important to override epubjs's inline styles from size()/columns().
function buildTypographyCss(s: ForNowReaderSettings): string {
  const sidePad = Math.max(
    0,
    Math.round((1 - s.textWidth / READER.MAX_TEXT_WIDTH_PX) * 50),
  );
  const { bg, fg: color } = resolveThemeColors(s.readerTheme);

  const lines = [
    `html { line-height: ${s.lineHeight} !important; }`,
    `body {`,
    `  padding-left: ${sidePad}% !important;`,
    `  padding-right: ${sidePad}% !important;`,
    `  box-sizing: border-box !important;`,
    `  font-size: ${s.fontSize}px !important;`,
    s.fontFamily ? `  font-family: ${s.fontFamily} !important;` : "",
    bg ? `  background: ${bg} !important;` : "",
    color ? `  color: ${color} !important;` : "",
    `}`,
    `p { margin-bottom: ${s.paragraphSpacing}px !important; }`,
    `img, video, svg, figure { max-width: 100% !important; height: auto !important; }`,
    `table { max-width: 100% !important; table-layout: fixed !important; word-break: break-word !important; }`,
    `pre, code { white-space: pre-wrap !important; word-break: break-all !important; max-width: 100% !important; }`,
  ];
  return lines.filter(Boolean).join("\n");
}

function applyTypography(r: Rendition, s: ForNowReaderSettings): void {
  const css = buildTypographyCss(s);
  r.getContents().forEach((c) => c.addStylesheetCss(css, "fnr-typography"));
}

export function EpubRenderer({
  book,
  settings,
  initialCfi,
  isFavorite,
  onToggleFavorite,
  onProgress,
  onSettingsChange,
}: EpubRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const readerWrapRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  });

  const [localSettings, setLocalSettings] =
    useState<ForNowReaderSettings>(settings);
  const localSettingsRef = useRef<ForNowReaderSettings>(settings);
  useEffect(() => {
    localSettingsRef.current = localSettings;
  }, [localSettings]);

  const [activePanel, setActivePanel] = useState<
    "toc" | "typography" | "theme" | null
  >(null);
  const activePanelRef = useRef<"toc" | "typography" | "theme" | null>(null);
  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);

  // Skip resize() calls mid-navigation — they blank the screen.
  const isNavigatingRef = useRef(false);

  // epubjs's relocated event drops the fragment from the href.
  const pendingTocHref = useRef<string | null>(null);

  const isPaginated = localSettings.readingMode === "paginated";

  const [progress, setProgress] = useState(0);
  const [isFirst, setIsFirst] = useState(false);
  const [isLast, setIsLast] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");
  const [currentHref, setCurrentHref] = useState("");
  const [displayedPage, setDisplayedPage] = useState(0);
  const [displayedTotal, setDisplayedTotal] = useState(0);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const navItemsRef = useRef<NavItem[]>([]);
  useEffect(() => {
    navItemsRef.current = navItems;
  }, [navItems]);

  // Pre-generate, `loc.start.percentage` is always 0; gate saves on this so
  // we don't overwrite the real saved percentage with 0 on every open.
  const locationsReadyRef = useRef(false);

  const chapterTitleRef = useRef<string>("");
  useEffect(() => {
    chapterTitleRef.current = chapterTitle;
  }, [chapterTitle]);

  // Resolve via navItems — onRelocated often fires before they've loaded.
  useEffect(() => {
    if (!currentHref || navItems.length === 0) return;
    const normalize = (h: string) =>
      h.split("#")[0].split("/").pop()?.toLowerCase() ?? h;
    function findLabel(items: NavItem[]): string | undefined {
      for (const item of items) {
        if (normalize(item.href) === normalize(currentHref))
          return item.label.trim();
        if (item.subitems?.length) {
          const found = findLabel(item.subitems);
          if (found) return found;
        }
      }
      return undefined;
    }
    const label = findLabel(navItems);
    if (label) setChapterTitle(label);
  }, [currentHref, navItems]);

  // null = use the CSS default width.
  const [tocWidth, setTocWidth] = useState<number | null>(null);

  const handleTocResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const wrap = readerWrapRef.current;
    if (!wrap) return;
    const wrapRect = wrap.getBoundingClientRect();

    const onMouseMove = (me: MouseEvent) => {
      const newW = me.clientX - wrapRect.left;
      const fontSize = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      const minW = READER.TOC_MIN_WIDTH_EM * fontSize;
      const maxW = wrapRect.width * READER.TOC_MAX_WIDTH_PCT;
      setTocWidth(Math.max(minW, Math.min(maxW, newW)));
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  const [toolbarVisible, setToolbarVisible] = useState(true);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const rendition: Rendition = book.renderTo(containerRef.current, {
      width: "100%",
      height: "100%",
      flow: isPaginated ? "paginated" : "scrolled-doc",
      // Two columns only when viewport >= 2 × textWidth.
      ...(isPaginated
        ? { spread: "auto", minSpreadWidth: settings.textWidth * 2 }
        : {}),
    });

    renditionRef.current = rendition;

    // Content hook fires before first paint. Don't re-inject on `rendered` —
    // replacing the same stylesheet causes a visible reflow.
    rendition.hooks.content.register((contents) => {
      contents.addStylesheetCss(
        buildTypographyCss(localSettingsRef.current),
        "fnr-typography",
      );
    });

    void book.loaded.navigation.then((nav) => {
      setNavItems(nav.toc as NavItem[]);
    });

    const onRelocated = (location: unknown) => {
      const loc = location as import("epubjs").EpubLocation;
      isNavigatingRef.current = false;

      const pct = loc.start.percentage ?? 0;
      const rawHref = loc.start.href ?? "";
      // Restore the fragment epubjs stripped (see pendingTocHref).
      const pending = pendingTocHref.current;
      pendingTocHref.current = null;
      if (
        pending &&
        pending.split("#")[0].split("/").pop() === rawHref.split("/").pop()
      ) {
        setCurrentHref(pending);
      } else {
        setCurrentHref(rawHref);
      }
      setProgress(pct * 100);
      setIsFirst(loc.atStart ?? false);
      setIsLast(loc.atEnd ?? false);
      setDisplayedPage(loc.start.displayed?.page ?? 0);
      setDisplayedTotal(loc.start.displayed?.total ?? 0);
      const fallbackTitle = loc.start.title ?? "";
      if (fallbackTitle) setChapterTitle(fallbackTitle);
      if (locationsReadyRef.current) {
        onProgressRef.current(loc.start.cfi, pct, fallbackTitle);
      }
    };

    rendition.on("relocated", onRelocated);

    if (initialCfi) {
      void rendition.display(initialCfi);
    } else {
      void rendition.display();
    }

    // Persist real percentage once locations land; relocated takes over after.
    void book.locations.generate(READER.CFI_GENERATION_POINTS).then(() => {
      locationsReadyRef.current = true;
      const loc = renditionRef.current?.currentLocation();
      if (loc?.start?.cfi) {
        const pct = loc.start.percentage ?? 0;
        setProgress(pct * 100);
        onProgressRef.current(
          loc.start.cfi,
          pct,
          chapterTitleRef.current || undefined,
        );
      }
    });

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePanel(null);
        return;
      }
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (!isInput && activePanelRef.current === null) {
        if (e.key === "ArrowLeft") {
          isNavigatingRef.current = true;
          void renditionRef.current?.prev();
        } else if (e.key === "ArrowRight") {
          isNavigatingRef.current = true;
          void renditionRef.current?.next();
        }
      }
    };
    document.addEventListener("keydown", handleKeydown);
    // Iframe-originated keydowns come via passEvents().
    const onIframeKeydown = (...args: unknown[]) =>
      handleKeydown(args[0] as KeyboardEvent);
    rendition.on("keydown", onIframeKeydown);

    // Debounced resize: epubjs needs pixel sizes and breaks if called mid-nav.
    let pendingSize: { w: number; h: number } | null = null;
    let resizeTimer: number | null = null;
    let ro: ResizeObserver | null = null;
    // RO's initial fire matches the mount size — skip to avoid post-paint flicker.
    let skipInitialResize = true;
    if (containerRef.current) {
      ro = new ResizeObserver((entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        if (skipInitialResize) {
          skipInitialResize = false;
          return;
        }
        pendingSize = {
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        };
        if (resizeTimer !== null) clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          if (pendingSize && !isNavigatingRef.current && renditionRef.current) {
            try {
              renditionRef.current.resize(pendingSize.w, pendingSize.h);
            } catch {
              /* rendition partially destroyed during cleanup */
            }
            pendingSize = null;
          }
          resizeTimer = null;
        }, TIMING.RESIZE_DEBOUNCE_MS);
      });
      ro.observe(containerRef.current);
    }

    return () => {
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      ro?.disconnect();
      rendition.off("keydown", onIframeKeydown);
      try {
        rendition.destroy();
      } catch {
        /* partially-initialized rendition */
      }
      renditionRef.current = null;
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [book]); // eslint-disable-line react-hooks/exhaustive-deps

  // Skip initial run: localSettings is seeded from settings, so this would
  // schedule a redundant render and flicker.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const merged = { ...localSettingsRef.current, ...settings };
    localSettingsRef.current = merged;
    setLocalSettings(merged);
    const r = renditionRef.current;
    if (!r) return;
    applyTypography(r, merged);
  }, [
    settings.readerTheme,
    settings.fontSize,
    settings.lineHeight,
    settings.paragraphSpacing,
    settings.textWidth,
    settings.fontFamily,
    settings.toolbarAutoHide,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSettingsChange = useCallback(
    (partial: Partial<ForNowReaderSettings>) => {
      void onSettingsChange(partial);
      const merged = { ...localSettings, ...partial };
      localSettingsRef.current = merged;
      setLocalSettings(merged);
      // readingMode and (paginated) textWidth need a fresh rendition; ReaderView handles it.
      const needsRebuild =
        "readingMode" in partial ||
        ("textWidth" in partial && localSettings.readingMode === "paginated");
      if (needsRebuild) return;
      const r = renditionRef.current;
      if (!r) return;
      applyTypography(r, merged);
    },
    [onSettingsChange, localSettings],
  );

  useEffect(() => {
    if (activePanel !== null) {
      if (hideTimerRef.current !== null) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setToolbarVisible(true);
    }
  }, [activePanel]);

  useEffect(() => {
    if (!localSettings.toolbarAutoHide) return;
    if (activePanel !== null) return;
    const id = window.setTimeout(
      () => setToolbarVisible(false),
      TIMING.TOOLBAR_AUTOHIDE_MS,
    );
    return () => clearTimeout(id);
  }, [localSettings.toolbarAutoHide, activePanel]);

  const showToolbar = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setToolbarVisible(true);
  }, []);

  const hideToolbar = useCallback(() => {
    if (activePanelRef.current !== null) return;
    hideTimerRef.current = window.setTimeout(
      () => setToolbarVisible(false),
      TIMING.TOOLBAR_HIDE_DELAY_MS,
    );
  }, []);

  const toolbarClass = `fnr-toolbar${localSettings.toolbarAutoHide ? ` fnr-toolbar--autohide${toolbarVisible ? " is-visible" : ""}` : ""}`;

  return (
    <div className="fnr-reader-wrap" ref={readerWrapRef}>
      {localSettings.toolbarAutoHide && (
        <div
          className={`fnr-autohide-zone${toolbarVisible ? " is-inactive" : ""}`}
          onMouseEnter={showToolbar}
        />
      )}

      <div
        className={toolbarClass}
        onMouseEnter={localSettings.toolbarAutoHide ? showToolbar : undefined}
        onMouseLeave={localSettings.toolbarAutoHide ? hideToolbar : undefined}
      >
        <button
          className="fnr-toolbar-btn"
          disabled={isFirst}
          ref={
            tip(
              t(
                localSettings.readingMode === "paginated"
                  ? "toolbar.prevPage"
                  : "toolbar.prevChapter",
              ),
            ) as React.Ref<HTMLButtonElement>
          }
          onClick={() => {
            isNavigatingRef.current = true;
            renditionRef.current?.prev();
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <button
          className={`fnr-toolbar-btn fnr-toolbar-chapter${activePanel === "toc" ? " is-active" : ""}`}
          ref={tip(t("toolbar.toc")) as React.Ref<HTMLButtonElement>}
          onClick={() => setActivePanel((p) => (p === "toc" ? null : "toc"))}
        >
          <span className="fnr-chapter-title">
            {chapterTitle || t("toolbar.toc")}
          </span>
          <span className="fnr-chapter-meta">
            {isPaginated && displayedTotal > 0
              ? `${displayedPage}/${displayedTotal}`
              : progress > 0
                ? `${Math.round(progress)}%`
                : ""}
          </span>
        </button>

        <button
          className="fnr-toolbar-btn"
          disabled={isLast}
          ref={
            tip(
              t(
                localSettings.readingMode === "paginated"
                  ? "toolbar.nextPage"
                  : "toolbar.nextChapter",
              ),
            ) as React.Ref<HTMLButtonElement>
          }
          onClick={() => {
            isNavigatingRef.current = true;
            renditionRef.current?.next();
          }}
        >
          <ChevronRight size={16} />
        </button>

        <button
          className={`fnr-toolbar-btn${activePanel === "typography" ? " is-active" : ""}`}
          ref={tip(t("toolbar.typography")) as React.Ref<HTMLButtonElement>}
          onClick={() =>
            setActivePanel((p) => (p === "typography" ? null : "typography"))
          }
        >
          <Type size={16} />
        </button>

        <button
          className={`fnr-toolbar-btn${activePanel === "theme" ? " is-active" : ""}`}
          ref={tip(t("toolbar.theme")) as React.Ref<HTMLButtonElement>}
          onClick={() =>
            setActivePanel((p) => (p === "theme" ? null : "theme"))
          }
        >
          <Sun size={16} />
        </button>

        <button
          className={`fnr-toolbar-btn fnr-favorite-btn${isFavorite ? " is-favorited" : ""}`}
          ref={
            tip(
              t(
                isFavorite
                  ? "library.favorites.tooltip.remove"
                  : "library.favorites.tooltip.add",
              ),
            ) as React.Ref<HTMLButtonElement>
          }
          onClick={onToggleFavorite}
        >
          <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div
        ref={containerRef}
        className="fnr-epub-container"
        style={{ background: resolveThemeColors(localSettings.readerTheme).bg }}
      />

      {activePanel !== null && (
        <div
          className="fnr-overlay-backdrop"
          onClick={() => setActivePanel(null)}
        />
      )}
      {activePanel === "toc" && (
        <div
          className="fnr-overlay-panel fnr-toc-panel-wrap"
          style={tocWidth !== null ? { width: `${tocWidth}px` } : undefined}
        >
          <div
            className="fnr-toc-resize-handle"
            onMouseDown={handleTocResizeStart}
          />
          <TocOverlay
            navItems={navItems}
            activeHref={currentHref}
            onSelect={(href) => {
              // epubjs handles fragments poorly; try base first, fall back.
              const baseHref = href.split("#")[0];
              void renditionRef.current?.display(baseHref).catch(() => {
                void renditionRef.current?.display(href);
              });
              setActivePanel(null);
            }}
            onClose={() => setActivePanel(null)}
          />
        </div>
      )}
      {activePanel === "typography" && (
        <div className="fnr-overlay-panel fnr-typography-panel-wrap">
          <TypographyPopover
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
          />
        </div>
      )}
      {activePanel === "theme" && (
        <div className="fnr-overlay-panel fnr-theme-panel-wrap">
          <ThemePanel
            currentTheme={localSettings.readerTheme}
            onSelect={(theme) => {
              handleSettingsChange({ readerTheme: theme });
              setActivePanel(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
