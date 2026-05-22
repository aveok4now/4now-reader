import type { ReadingMode } from "../../data/types";

import { ChevronLeft, ChevronRight, Heart, Sun, Type } from "lucide-react";

import { t } from "../../i18n";
import { tip } from "../../shared/tooltip";

export type PanelKey = "toc" | "typography" | "theme";

interface ReaderToolbarProps {
  readingMode: ReadingMode;
  autoHide: boolean;
  visible: boolean;
  isFirst: boolean;
  isLast: boolean;
  isPaginated: boolean;
  chapterTitle: string;
  progress: number;
  displayedPage: number;
  displayedTotal: number;
  activePanel: PanelKey | null;
  isFavorite: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPanelToggle: (panel: PanelKey) => void;
  onToggleFavorite: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function ReaderToolbar({
  readingMode,
  autoHide,
  visible,
  isFirst,
  isLast,
  isPaginated,
  chapterTitle,
  progress,
  displayedPage,
  displayedTotal,
  activePanel,
  isFavorite,
  onPrev,
  onNext,
  onPanelToggle,
  onToggleFavorite,
  onMouseEnter,
  onMouseLeave,
}: ReaderToolbarProps) {
  const className = `fnr-toolbar${autoHide ? ` fnr-toolbar--autohide${visible ? " is-visible" : ""}` : ""}`;
  const prevLabel = t(
    readingMode === "paginated" ? "toolbar.prevPage" : "toolbar.prevChapter",
  );
  const nextLabel = t(
    readingMode === "paginated" ? "toolbar.nextPage" : "toolbar.nextChapter",
  );

  return (
    <div
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        className="fnr-toolbar-btn"
        disabled={isFirst}
        ref={tip<HTMLButtonElement>(prevLabel)}
        onClick={onPrev}
      >
        <ChevronLeft size={16} />
      </button>

      <button
        className={`fnr-toolbar-btn fnr-toolbar-chapter${activePanel === "toc" ? " is-active" : ""}`}
        ref={tip<HTMLButtonElement>(t("toolbar.toc"))}
        onClick={() => onPanelToggle("toc")}
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
        ref={tip<HTMLButtonElement>(nextLabel)}
        onClick={onNext}
      >
        <ChevronRight size={16} />
      </button>

      <button
        className={`fnr-toolbar-btn${activePanel === "typography" ? " is-active" : ""}`}
        ref={tip<HTMLButtonElement>(t("toolbar.typography"))}
        onClick={() => onPanelToggle("typography")}
      >
        <Type size={16} />
      </button>

      <button
        className={`fnr-toolbar-btn${activePanel === "theme" ? " is-active" : ""}`}
        ref={tip<HTMLButtonElement>(t("toolbar.theme"))}
        onClick={() => onPanelToggle("theme")}
      >
        <Sun size={16} />
      </button>

      <button
        className={`fnr-toolbar-btn fnr-favorite-btn${isFavorite ? " is-favorited" : ""}`}
        ref={tip<HTMLButtonElement>(
          t(
            isFavorite
              ? "library.favorites.tooltip.remove"
              : "library.favorites.tooltip.add",
          ),
        )}
        onClick={onToggleFavorite}
      >
        <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
