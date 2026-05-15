import type React from "react";
import type { ForNowReaderSettings } from "../../settings";
import type { NavItem } from "../TocOverlay";
import type { PanelKey } from "./ReaderToolbar";

import { ThemePanel } from "../ThemePanel";
import { TocOverlay } from "../TocOverlay";
import { TypographyPopover } from "../TypographyPopover";

interface ReaderOverlaysProps {
  activePanel: PanelKey | null;
  navItems: NavItem[];
  currentHref: string;
  tocWidth: number | null;
  settings: ForNowReaderSettings;
  onClose: () => void;
  onTocResizeStart: (e: React.MouseEvent) => void;
  onTocSelect: (href: string) => void;
  onSettingsChange: (partial: Partial<ForNowReaderSettings>) => void;
}

export function ReaderOverlays({
  activePanel,
  navItems,
  currentHref,
  tocWidth,
  settings,
  onClose,
  onTocResizeStart,
  onTocSelect,
  onSettingsChange,
}: ReaderOverlaysProps) {
  if (activePanel === null) return null;
  return (
    <>
      <div className="fnr-overlay-backdrop" onClick={onClose} />
      {activePanel === "toc" && (
        <div
          className="fnr-overlay-panel fnr-toc-panel-wrap"
          style={tocWidth !== null ? { width: `${tocWidth}px` } : undefined}
        >
          <div className="fnr-toc-resize-handle" onMouseDown={onTocResizeStart} />
          <TocOverlay
            navItems={navItems}
            activeHref={currentHref}
            onSelect={(href) => {
              onTocSelect(href);
              onClose();
            }}
            onClose={onClose}
          />
        </div>
      )}
      {activePanel === "typography" && (
        <div className="fnr-overlay-panel fnr-typography-panel-wrap">
          <TypographyPopover
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        </div>
      )}
      {activePanel === "theme" && (
        <div className="fnr-overlay-panel fnr-theme-panel-wrap">
          <ThemePanel
            currentTheme={settings.readerTheme}
            onSelect={(theme) => {
              onSettingsChange({ readerTheme: theme });
              onClose();
            }}
          />
        </div>
      )}
    </>
  );
}
