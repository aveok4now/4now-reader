import React, { useEffect, useRef } from "react";

import { READER } from "../constants";
import { normalizeHref } from "../utils";

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

// Depth-first: deepest match wins so a parent doesn't shadow its child.
function findBestMatch(items: NavItem[], target: string): string | undefined {
	const normTarget = normalizeHref(target);
	for (const item of items) {
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
