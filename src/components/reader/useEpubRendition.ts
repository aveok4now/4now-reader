import type { Book, EpubLocation, Rendition } from "epubjs";
import type { RefObject } from "react";
import type { ForNowReaderSettings } from "../../settings";
import type { NavItem } from "../TocOverlay";

import { useEffect, useRef, useState } from "react";

import { READER, TIMING } from "../../constants";
import {
  applyTypography,
  buildTypographyCss,
  TYPOGRAPHY_STYLESHEET_KEY,
} from "../../renderer/typography";
import { normalizeHref } from "../../utils";

export interface RenditionState {
  progress: number;
  isFirst: boolean;
  isLast: boolean;
  chapterTitle: string;
  currentHref: string;
  displayedPage: number;
  displayedTotal: number;
  navItems: NavItem[];
}

export interface RenditionController {
  rendition: () => Rendition | null;
  next: () => void;
  prev: () => void;
  displayHref: (href: string) => void;
  applySettings: (settings: ForNowReaderSettings) => void;
}

interface UseEpubRenditionParams {
  book: Book;
  containerRef: RefObject<HTMLDivElement | null>;
  isPaginated: boolean;
  initialSettings: ForNowReaderSettings;
  settingsRef: RefObject<ForNowReaderSettings | null>;
  initialCfi?: string;
  onProgress: (cfi: string, pct: number, chapterTitle?: string) => void;
}

export function useEpubRendition({
  book,
  containerRef,
  isPaginated,
  initialSettings,
  settingsRef,
  initialCfi,
  onProgress,
}: UseEpubRenditionParams): {
  state: RenditionState;
  controller: RenditionController;
} {
  const renditionRef = useRef<Rendition | null>(null);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  });

  const isNavigatingRef = useRef(false);
  const pendingTocHref = useRef<string | null>(null);
  const locationsReadyRef = useRef(false);

  const [progress, setProgress] = useState(0);
  const [isFirst, setIsFirst] = useState(false);
  const [isLast, setIsLast] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");
  const [currentHref, setCurrentHref] = useState("");
  const [displayedPage, setDisplayedPage] = useState(0);
  const [displayedTotal, setDisplayedTotal] = useState(0);
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  const chapterTitleRef = useRef("");
  useEffect(() => {
    chapterTitleRef.current = chapterTitle;
  }, [chapterTitle]);

  useEffect(() => {
    if (!currentHref || navItems.length === 0) return;
    const target = normalizeHref(currentHref);
    function findLabel(items: NavItem[]): string | undefined {
      for (const item of items) {
        if (normalizeHref(item.href) === target) return item.label.trim();
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

  useEffect(() => {
    if (!containerRef.current) return;

    const rendition: Rendition = book.renderTo(containerRef.current, {
      width: "100%",
      height: "100%",
      flow: isPaginated ? "paginated" : "scrolled-doc",
      // Two columns only when viewport >= 2 × textWidth.
      ...(isPaginated
        ? { spread: "auto", minSpreadWidth: initialSettings.textWidth * 2 }
        : {}),
    });

    renditionRef.current = rendition;

    // Content hook fires before first paint. Don't re-inject on `rendered` —
    // replacing the same stylesheet causes a visible reflow.
    rendition.hooks.content.register((contents) => {
      const s = settingsRef.current ?? initialSettings;
      contents.addStylesheetCss(
        buildTypographyCss(s),
        TYPOGRAPHY_STYLESHEET_KEY,
      );
    });

    void book.loaded.navigation.then((nav) => {
      setNavItems(nav.toc as NavItem[]);
    });

    const onRelocated = (location: unknown) => {
      const loc = location as EpubLocation;
      isNavigatingRef.current = false;

      const pct = loc.start.percentage ?? 0;
      const rawHref = loc.start.href ?? "";
      const pending = pendingTocHref.current;
      pendingTocHref.current = null;
      setCurrentHref(
        pending && normalizeHref(pending) === normalizeHref(rawHref)
          ? pending
          : rawHref,
      );
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
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (isInput) return;
      if (e.key === "ArrowLeft") {
        isNavigatingRef.current = true;
        void renditionRef.current?.prev();
      } else if (e.key === "ArrowRight") {
        isNavigatingRef.current = true;
        void renditionRef.current?.next();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: rendition lifecycle is tied to the book identity; settings/refs are read mutably.
  }, [book]);

  const controller: RenditionController = {
    rendition: () => renditionRef.current,
    next: () => {
      isNavigatingRef.current = true;
      void renditionRef.current?.next();
    },
    prev: () => {
      isNavigatingRef.current = true;
      void renditionRef.current?.prev();
    },
    displayHref: (href: string) => {
      pendingTocHref.current = href;
      const baseHref = href.split("#")[0];
      // epubjs handles fragments poorly; try base first, fall back.
      void renditionRef.current?.display(baseHref).catch(() => {
        void renditionRef.current?.display(href);
      });
    },
    applySettings: (s: ForNowReaderSettings) => {
      const r = renditionRef.current;
      if (r) applyTypography(r, s);
    },
  };

  return {
    state: {
      progress,
      isFirst,
      isLast,
      chapterTitle,
      currentHref,
      displayedPage,
      displayedTotal,
      navItems,
    },
    controller,
  };
}
