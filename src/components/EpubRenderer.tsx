import type { Book, Rendition } from "epubjs";
import React, { useEffect, useRef } from "react";
import type { Read4sidianSettings } from "../settings";

interface EpubRendererProps {
	book: Book;
	settings: Read4sidianSettings;
	initialCfi?: string;
	onProgress: (cfi: string, pct: number, chapterTitle?: string) => void;
}

function getThemeStyles(
	theme: Read4sidianSettings["readerTheme"],
): Record<string, string> {
	switch (theme) {
		case "light":
			return { background: "#ffffff", color: "#1a1a1a" };
		case "dark":
			return { background: "#1e1e1e", color: "#d4d4d4" };
		case "sepia":
			return { background: "#f4ecd8", color: "#3b2f2f" };
		case "adaptive":
		default:
			return {};
	}
}

export function EpubRenderer({
	book,
	settings,
	initialCfi,
	onProgress,
}: EpubRendererProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const rendition: Rendition = book.renderTo(containerRef.current, {
			width: "100%",
			height: "100%",
			flow: settings.readingMode === "scroll" ? "scrolled-doc" : "paginated",
		});

		const themeStyles = getThemeStyles(settings.readerTheme);

		rendition.themes.default({
			html: {
				"font-size": `${settings.fontSize}px`,
				"line-height": String(settings.lineHeight),
			},
			body: {
				"max-width": `${settings.textWidth}px`,
				margin: "0 auto",
				...(settings.fontFamily ? { "font-family": settings.fontFamily } : {}),
				...themeStyles,
			},
		});

		const applyTheme = () => {
			if (Object.keys(themeStyles).length === 0) return;
			rendition.getContents().forEach((contents) => {
				contents.addStylesheetRules({ body: themeStyles });
			});
		};

		rendition.on("rendered", applyTheme);

		const onRelocated = (location: unknown) => {
			const loc = location as {
				start: { cfi: string; percentage?: number; title?: string };
			};
			onProgress(loc.start.cfi, loc.start.percentage ?? 0, loc.start.title);
		};

		rendition.on("relocated", onRelocated);

		if (initialCfi) {
			rendition.display(initialCfi);
		} else {
			rendition.display();
		}

		return () => {
			rendition.destroy();
		};
	}, [book]);

	return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
