import type { ForNowReaderSettings } from "../models/settings";

import { useEffect, useState } from "react";
import { SLIDER_LIMITS } from "../constants";
import { t } from "../i18n";
import { rangePct } from "../utils";
import { FontPicker } from "./FontPicker";

interface TypographyPopoverProps {
  settings: ForNowReaderSettings;
  onSettingsChange: (
    partial: Partial<ForNowReaderSettings>,
  ) => void | Promise<void>;
}

export function TypographyPopover({
  settings,
  onSettingsChange,
}: TypographyPopoverProps) {
  const [systemFonts, setSystemFonts] = useState<string[]>([]);

  useEffect(() => {
    if (!window.queryLocalFonts) return;
    void window
      .queryLocalFonts()
      .then((fonts) => {
        const families = [...new Set(fonts.map((f) => f.family))].sort();
        setSystemFonts(families);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="fnr-typography-popover">
      {/* Reading mode segmented toggle */}
      <div className="fnr-popover-row fnr-popover-row--label">
        <span>{t("settings.readingMode.name")}</span>
      </div>
      <div className="fnr-mode-toggle">
        <button
          className={`fnr-mode-btn${settings.readingMode === "scroll" ? " is-active" : ""}`}
          onClick={() => onSettingsChange({ readingMode: "scroll" })}
        >
          {t("mode.scroll")}
        </button>
        <button
          className={`fnr-mode-btn${settings.readingMode === "paginated" ? " is-active" : ""}`}
          onClick={() => onSettingsChange({ readingMode: "paginated" })}
        >
          {t("mode.paginated")}
        </button>
      </div>

      {/* Font size */}
      <div className="fnr-popover-row">
        <span>{t("settings.fontSize.name")}</span>
        <span className="fnr-popover-value">{settings.fontSize}</span>
      </div>
      <input
        type="range"
        min={SLIDER_LIMITS.fontSize.min}
        max={SLIDER_LIMITS.fontSize.max}
        step={SLIDER_LIMITS.fontSize.step}
        value={settings.fontSize}
        onChange={(e) => onSettingsChange({ fontSize: Number(e.target.value) })}
      />

      {/* Line height */}
      <div className="fnr-popover-row">
        <span>{t("settings.lineHeight.name")}</span>
        <span className="fnr-popover-value">
          {rangePct(settings.lineHeight, SLIDER_LIMITS.lineHeight)}%
        </span>
      </div>
      <input
        type="range"
        min={SLIDER_LIMITS.lineHeight.min}
        max={SLIDER_LIMITS.lineHeight.max}
        step={SLIDER_LIMITS.lineHeight.step}
        value={settings.lineHeight}
        onChange={(e) =>
          onSettingsChange({ lineHeight: Number(e.target.value) })
        }
      />

      {/* Paragraph spacing */}
      <div className="fnr-popover-row">
        <span>{t("settings.paragraphSpacing.name")}</span>
        <span className="fnr-popover-value">{settings.paragraphSpacing}px</span>
      </div>
      <input
        type="range"
        min={SLIDER_LIMITS.paragraphSpacing.min}
        max={SLIDER_LIMITS.paragraphSpacing.max}
        step={SLIDER_LIMITS.paragraphSpacing.step}
        value={settings.paragraphSpacing}
        onChange={(e) =>
          onSettingsChange({ paragraphSpacing: Number(e.target.value) })
        }
      />

      {/* Text width - paginated mode sizes pages to the container, so the slider has no effect. */}
      <div className="fnr-popover-row">
        <span>{t("settings.textWidth.name")}</span>
        <span className="fnr-popover-value">
          {Math.round((settings.textWidth / SLIDER_LIMITS.textWidth.max) * 100)}
          %
        </span>
      </div>
      <input
        type="range"
        min={SLIDER_LIMITS.textWidth.min}
        max={SLIDER_LIMITS.textWidth.max}
        step={SLIDER_LIMITS.textWidth.step}
        value={settings.textWidth}
        disabled={settings.readingMode === "paginated"}
        onChange={(e) =>
          onSettingsChange({ textWidth: Number(e.target.value) })
        }
      />

      {/* Font family */}
      <div className="fnr-popover-row fnr-popover-row--label">
        <span>{t("settings.fontFamily.name")}</span>
      </div>
      <FontPicker
        value={settings.fontFamily}
        onChange={(font) => onSettingsChange({ fontFamily: font })}
        fonts={systemFonts}
        placeholder={t("settings.fontFamily.placeholder")}
      />
    </div>
  );
}
