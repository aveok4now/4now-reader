import React from "react";
import { t } from "../i18n";
import type { TranslationKey } from "../i18n/en";
import type { FourNowReaderSettings } from "../settings";

const THEMES: Array<[FourNowReaderSettings["readerTheme"], TranslationKey]> = [
	["adaptive", "theme.adaptive"],
	["light",    "theme.light"],
	["dark",     "theme.dark"],
	["sepia",    "theme.sepia"],
	["cream",    "theme.cream"],
	["night",    "theme.night"],
];

interface ThemePanelProps {
	currentTheme: FourNowReaderSettings["readerTheme"];
	onSelect: (theme: FourNowReaderSettings["readerTheme"]) => void;
}

export function ThemePanel({ currentTheme, onSelect }: ThemePanelProps) {
	return (
		<div className="fnr-typography-popover">
			<div className="fnr-mode-toggle fnr-theme-toggle">
				{THEMES.map(([value, key]) => (
					<button
						key={value}
						className={`fnr-mode-btn${currentTheme === value ? " is-active" : ""}`}
						onClick={() => onSelect(value)}
					>
						{t(key)}
					</button>
				))}
			</div>
		</div>
	);
}
