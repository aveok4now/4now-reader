import React, { useEffect, useRef } from "react";
import { READER } from "../constants";

export interface NavItem {
	id: string;
	href: string;
	label: string;
	subitems?: NavItem[];
}

interface TocOverlayProps {
	navItems: NavItem[];
	activeHref: string;
	onSelect: (href: string) => void;
	onClose: () => void;
}

function normalizeHref(h: string): string {
	return h.split("#")[0].split("/").pop()?.toLowerCase() ?? h;
}

// Returns the raw href of the single best-matching item in the tree.
// Depth-first: prefers the most specific (deepest) match so that when
// a child item matches, the parent is NOT also highlighted.
function findBestMatch(items: NavItem[], target: string): string | undefined {
	const normTarget = normalizeHref(target);
	for (const item of items) {
		// Check subitems first — a child match is more specific than a parent match
		if (item.subitems?.length) {
			const found = findBestMatch(item.subitems, target);
			if (found !== undefined) return found;
		}
		if (normalizeHref(item.href) === normTarget) return item.href;
	}
	return undefined;
}

export function TocOverlay({
	navItems,
	activeHref,
	onSelect,
	onClose,
}: TocOverlayProps) {
	const activeRef = useRef<HTMLButtonElement | null>(null);

	// Wait for next animation frame so the DOM is ready before scrolling.
	// Without this, scrollIntoView fires before React has painted the buttons.
	useEffect(() => {
		const raf = requestAnimationFrame(() => {
			activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
		});
		return () => cancelAnimationFrame(raf);
	}, [activeHref]);

	const bestMatchHref = findBestMatch(navItems, activeHref);

	function renderItems(items: NavItem[], depth = 0): React.ReactNode {
		return items.map((item) => {
			const isActive = item.href === bestMatchHref;
			return (
				<React.Fragment key={item.id}>
					<button
						ref={isActive ? activeRef : null}
						className={`fnr-toc-item${isActive ? " is-active" : ""}`}
						style={{ paddingLeft: `${READER.TOC_ITEM_BASE_PAD_PX + depth * READER.TOC_ITEM_DEPTH_STEP_PX}px` }}
						onClick={() => {
							onSelect(item.href);
							onClose();
						}}
					>
						{item.label.trim()}
					</button>
					{item.subitems &&
						item.subitems.length > 0 &&
						renderItems(item.subitems, depth + 1)}
				</React.Fragment>
			);
		});
	}

	return <>{renderItems(navItems)}</>;
}
