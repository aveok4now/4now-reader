import type React from "react";
import type { BookMeta, ReadingProgress } from "../../data/types";

import { Heart } from "lucide-react";

import { t } from "../../i18n";
import { tip } from "../../shared/tooltip";

function formatDateShort(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

interface BookCardProps {
  book: BookMeta;
  progress?: ReadingProgress;
  isActive: boolean;
  isFavorite: boolean;
  onClick: () => void;
  onNewTabClick: () => void;
  onToggleFavorite: () => void;
}

export function BookCard({ book, progress, isActive, isFavorite, onClick, onNewTabClick, onToggleFavorite }: BookCardProps) {
  const pct = progress ? Math.round(progress.percentage * 100) : 0;
  const lastOpened = book.lastOpened ? formatDateShort(book.lastOpened) : null;

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      onNewTabClick();
    } else {
      onClick();
    }
  };

  return (
    <div
      className={`fnr-book-card${isActive ? " is-active" : ""}`}
      onClick={handleClick}
      onAuxClick={(e) => e.button === 1 && onNewTabClick()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <button
        type="button"
        className={`fnr-book-card-favorite${isFavorite ? " is-favorited" : ""}`}
        ref={tip(t(isFavorite ? "library.favorites.tooltip.remove" : "library.favorites.tooltip.add"))}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
      >
        <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
      </button>
      <div className="fnr-book-card-info">
        <div className="fnr-book-card-title">{book.title || book.vaultPath}</div>
        {book.author && <div className="fnr-book-card-author">{book.author}</div>}
        {lastOpened && <div className="fnr-book-card-meta">{lastOpened}</div>}
      </div>
      {progress && (
        <div className="fnr-book-card-progress">
          <div className="fnr-progress-bar">
            <div className="fnr-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="fnr-book-card-pct">{pct}%</span>
        </div>
      )}
    </div>
  );
}
