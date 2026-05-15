import type { Book } from "epubjs";
import type { ForNowReaderSettings } from "../settings";

import { ChevronLeft, ChevronRight, Heart, Sun, Type } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { TIMING, resolveThemeColors } from "../constants";
import { t } from "../i18n";
import { READER } from "../constants";
import { tip } from "../utils";

import { useEpubRendition } from "./reader/useEpubRendition";
import { ThemePanel } from "./ThemePanel";
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

  const [localSettings, setLocalSettings] =
    useState<ForNowReaderSettings>(settings);
  const localSettingsRef = useRef<ForNowReaderSettings>(settings);
  useEffect(() => {
    localSettingsRef.current = localSettings;
  }, [localSettings]);

  const [activePanel, setActivePanel] = useState<
    "toc" | "typography" | "theme" | null
  >(null);
  const activePanelRef = useRef<typeof activePanel>(null);
  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);

  const isPaginated = localSettings.readingMode === "paginated";

  const { state, controller } = useEpubRendition({
    book,
    containerRef,
    isPaginated,
    initialSettings: settings,
    settingsRef: localSettingsRef,
    initialCfi,
    onProgress,
  });
  const {
    progress,
    isFirst,
    isLast,
    chapterTitle,
    currentHref,
    displayedPage,
    displayedTotal,
    navItems,
  } = state;

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

  // Esc closes any open overlay panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivePanel(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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
    controller.applySettings(merged);
  }, [
    settings.readerTheme,
    settings.fontSize,
    settings.lineHeight,
    settings.paragraphSpacing,
    settings.textWidth,
    settings.fontFamily,
    settings.toolbarAutoHide,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only react to setting-value changes, not controller reference churn.
  ]);

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
      controller.applySettings(merged);
    },
    [onSettingsChange, localSettings, controller],
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
          onClick={controller.prev}
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
          onClick={controller.next}
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
              controller.displayHref(href);
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
