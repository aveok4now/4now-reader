import type { Book } from "epubjs";
import type { ForNowReaderSettings } from "../settings";
import type { PanelKey } from "./reader/ReaderToolbar";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { READER, TIMING, resolveThemeColors } from "../constants";

import { ReaderOverlays } from "./reader/ReaderOverlays";
import { ReaderToolbar } from "./reader/ReaderToolbar";
import { useEpubRendition } from "./reader/useEpubRendition";

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

  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  const activePanelRef = useRef<PanelKey | null>(null);
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

  const togglePanel = (panel: PanelKey) =>
    setActivePanel((p) => (p === panel ? null : panel));

  return (
    <div className="fnr-reader-wrap" ref={readerWrapRef}>
      {localSettings.toolbarAutoHide && (
        <div
          className={`fnr-autohide-zone${toolbarVisible ? " is-inactive" : ""}`}
          onMouseEnter={showToolbar}
        />
      )}

      <ReaderToolbar
        readingMode={localSettings.readingMode}
        autoHide={localSettings.toolbarAutoHide}
        visible={toolbarVisible}
        isFirst={state.isFirst}
        isLast={state.isLast}
        isPaginated={isPaginated}
        chapterTitle={state.chapterTitle}
        progress={state.progress}
        displayedPage={state.displayedPage}
        displayedTotal={state.displayedTotal}
        activePanel={activePanel}
        isFavorite={isFavorite}
        onPrev={controller.prev}
        onNext={controller.next}
        onPanelToggle={togglePanel}
        onToggleFavorite={onToggleFavorite}
        onMouseEnter={localSettings.toolbarAutoHide ? showToolbar : undefined}
        onMouseLeave={localSettings.toolbarAutoHide ? hideToolbar : undefined}
      />

      <div
        ref={containerRef}
        className="fnr-epub-container"
        style={{ background: resolveThemeColors(localSettings.readerTheme).bg }}
      />

      <ReaderOverlays
        activePanel={activePanel}
        navItems={state.navItems}
        currentHref={state.currentHref}
        tocWidth={tocWidth}
        settings={localSettings}
        onClose={() => setActivePanel(null)}
        onTocResizeStart={handleTocResizeStart}
        onTocSelect={controller.displayHref}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}
