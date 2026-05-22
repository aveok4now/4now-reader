import type { KeyboardEvent } from "react";
import type { ReaderTheme } from "../../data/types";

import { t } from "../../i18n";
import { THEME_COLORS, THEME_OPTIONS } from "../../shared/theme";
import { tip } from "../../shared/tooltip";

interface ThemePanelProps {
  currentTheme: ReaderTheme;
  onSelect: (theme: ReaderTheme) => void;
}

export function ThemePanel({ currentTheme, onSelect }: ThemePanelProps) {
  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = THEME_OPTIONS.findIndex((o) => o.value === currentTheme);
    if (i < 0) return;
    const next =
      e.key === "ArrowRight"
        ? (i + 1) % THEME_OPTIONS.length
        : (i - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length;
    onSelect(THEME_OPTIONS[next].value);
  };

  return (
    <div className="fnr-theme-swatches" role="radiogroup" onKeyDown={handleKey}>
      {THEME_OPTIONS.map(({ value, labelKey }) => {
        const label = t(labelKey);
        const checked = value === currentTheme;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            ref={tip(label)}
            tabIndex={checked ? 0 : -1}
            className={`fnr-theme-swatch fnr-theme-swatch--${value}`}
            style={swatchStyle(value)}
            onClick={() => onSelect(value)}
          />
        );
      })}
    </div>
  );
}

function swatchStyle(theme: ReaderTheme): React.CSSProperties | undefined {
  if (theme === "adaptive") return undefined;
  return { background: THEME_COLORS[theme].bg };
}
