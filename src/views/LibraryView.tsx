import { ArrowUpDown, BookOpen, Clock, Heart } from "lucide-react";
import { ItemView, Menu, WorkspaceLeaf } from "obsidian";
import type React from "react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { t } from "../i18n";
import { formatDateShort, tip } from "../utils";
import type {
	LibrarySortOrder,
	LibraryTab,
	LibraryUiState,
	PluginData,
} from "../models/plugin-data";
import type { BookMeta, ReadingProgress } from "../models/types";

export const LIBRARY_VIEW_TYPE = "4now-reader-library";

function sortBooks(books: BookMeta[], order: LibrarySortOrder): BookMeta[] {
	return [...books].sort((a, b) => {
		switch (order) {
			case "title-asc":
				return a.title.localeCompare(b.title);
			case "title-desc":
				return b.title.localeCompare(a.title);
			case "author-asc":
				return a.author.localeCompare(b.author);
			case "last-opened":
				return (b.lastOpened ?? 0) - (a.lastOpened ?? 0);
		}
	});
}

const SORT_OPTIONS: { value: LibrarySortOrder; label: () => string }[] = [
	{ value: "title-asc", label: () => t("library.sort.titleAsc") },
	{ value: "title-desc", label: () => t("library.sort.titleDesc") },
	{ value: "author-asc", label: () => t("library.sort.authorAsc") },
	{ value: "last-opened", label: () => t("library.sort.lastOpened") },
];

interface TabBarProps {
	activeTab: LibraryTab;
	onTabChange: (tab: LibraryTab) => void;
	sortOrder: LibrarySortOrder;
	onSortChange: (order: LibrarySortOrder) => void;
}

function TabBar({ activeTab, onTabChange, sortOrder, onSortChange }: TabBarProps) {
	const openSortMenu = (e: React.MouseEvent) => {
		e.stopPropagation();
		const menu = new Menu();
		for (const opt of SORT_OPTIONS) {
			menu.addItem((item) =>
				item
					.setTitle(opt.label())
					.setChecked(sortOrder === opt.value)
					.onClick(() => onSortChange(opt.value)),
			);
		}
		menu.showAtMouseEvent(e.nativeEvent);
	};

	return (
		<div className="fnr-tab-bar">
			<button
				ref={tip(t("library.tabs.recent"))}
				className={`fnr-tab-btn${activeTab === "recent" ? " is-active" : ""}`}
				onClick={() => onTabChange("recent")}
			>
				<Clock size={16} />
			</button>
			<button
				ref={tip(t("library.tabs.all"))}
				className={`fnr-tab-btn${activeTab === "all" ? " is-active" : ""}`}
				onClick={() => onTabChange("all")}
			>
				<BookOpen size={16} />
			</button>
			<button
				ref={tip(t("library.tabs.favorites"))}
				className={`fnr-tab-btn${activeTab === "favorites" ? " is-active" : ""}`}
				onClick={() => onTabChange("favorites")}
			>
				<Heart size={16} />
			</button>
			<div className="fnr-tab-spacer" />
			{activeTab !== "recent" && (
				<button
					ref={tip(t("library.sort.label"))}
					className="fnr-tab-btn"
					onClick={openSortMenu}
				>
					<ArrowUpDown size={16} />
				</button>
			)}
		</div>
	);
}

interface BookCardProps {
	book: BookMeta;
	progress?: ReadingProgress;
	isActive: boolean;
	onClick: () => void;
	onNewTabClick: () => void;
}

function BookCard({ book, progress, isActive, onClick, onNewTabClick }: BookCardProps) {
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
			<div className="fnr-book-card-info">
				<div className="fnr-book-card-title">{book.title || book.vaultPath}</div>
				{book.author && (
					<div className="fnr-book-card-author">{book.author}</div>
				)}
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

interface LibraryPanelProps {
	data: PluginData;
	activeVaultPath: string | null;
	onOpenBook: (vaultPath: string) => void;
	onOpenBookNewTab: (vaultPath: string) => void;
	onUiStateChange: (changes: Partial<LibraryUiState>) => void;
	onFlushRecentReorder: () => void;
}

function LibraryPanel({
	data,
	activeVaultPath,
	onOpenBook,
	onOpenBookNewTab,
	onUiStateChange,
	onFlushRecentReorder,
}: LibraryPanelProps) {
	const [query, setQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<LibrarySortOrder>(
		data.libraryUiState.sortOrder,
	);
	const [activeTab, setActiveTab] = useState<LibraryTab>(
		data.libraryUiState.activeTab,
	);

	// Frozen list order; refreshed only on entry to the Recent tab.
	const [recentSnapshot, setRecentSnapshot] = useState<string[]>(() => {
		if (data.libraryUiState.activeTab === "recent") {
			onFlushRecentReorder();
		}
		return [...data.recentBooks];
	});

	const handleTabChange = (tab: LibraryTab) => {
		if (tab === "recent" && activeTab !== "recent") {
			onFlushRecentReorder();
			setRecentSnapshot([...data.recentBooks]);
		}
		setActiveTab(tab);
		onUiStateChange({ activeTab: tab });
	};

	const handleSortChange = (order: LibrarySortOrder) => {
		setSortOrder(order);
		onUiStateChange({ sortOrder: order });
	};

	const books = Object.values(data.libraryIndex);
	const recentBooks = recentSnapshot
		.map((p) => data.libraryIndex[p])
		.filter((b): b is BookMeta => b !== undefined);

	const q = query.toLowerCase();
	const filteredAll = query
		? books.filter(
				(b) =>
					b.title.toLowerCase().includes(q) ||
					b.author.toLowerCase().includes(q) ||
					b.vaultPath.toLowerCase().includes(q),
			)
		: sortBooks(books, sortOrder);

	const renderContent = () => {
		if (activeTab === "recent") {
			if (recentBooks.length === 0) {
				return (
					<div className="fnr-library-empty">{t("library.recent.empty")}</div>
				);
			}
			return recentBooks.map((b) => (
				<BookCard
					key={b.vaultPath}
					book={b}
					progress={data.readingProgress[b.vaultPath]}
					isActive={b.vaultPath === activeVaultPath}
					onClick={() => onOpenBook(b.vaultPath)}
					onNewTabClick={() => onOpenBookNewTab(b.vaultPath)}
				/>
			));
		}

		if (activeTab === "favorites") {
			return (
				<div className="fnr-library-empty">{t("library.favorites.empty")}</div>
			);
		}

		if (filteredAll.length === 0) {
			return (
				<div className="fnr-library-empty">
					{query ? t("library.noResults") : t("library.empty")}
				</div>
			);
		}
		return filteredAll.map((b) => (
			<BookCard
				key={b.vaultPath}
				book={b}
				progress={data.readingProgress[b.vaultPath]}
				isActive={b.vaultPath === activeVaultPath}
				onClick={() => onOpenBook(b.vaultPath)}
					onNewTabClick={() => onOpenBookNewTab(b.vaultPath)}
			/>
		));
	};

	return (
		<div className="fnr-library">
			<div className="fnr-library-toolbar">
				<div className="search-input-container">
					<input
						type="search"
						className="fnr-library-search"
						placeholder={t("library.search")}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>
			</div>
			<TabBar
				activeTab={activeTab}
				onTabChange={handleTabChange}
				sortOrder={sortOrder}
				onSortChange={handleSortChange}
			/>
			<div className="fnr-library-body">{renderContent()}</div>
		</div>
	);
}

export class LibraryView extends ItemView {
	private root: ReturnType<typeof createRoot> | null = null;
	private activeVaultPath: string | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly data: PluginData,
		private readonly openBook: (vaultPath: string, newTab?: boolean) => Promise<void>,
		private readonly persist: () => Promise<void>,
		private readonly flushRecentReorder: () => void,
	) {
		super(leaf);
	}

	getViewType(): string {
		return LIBRARY_VIEW_TYPE;
	}
	getDisplayText(): string {
		return t("library.title");
	}
	getIcon(): string {
		return "library";
	}

	async onOpen(): Promise<void> {
		this.root = createRoot(this.containerEl.children[1] as HTMLElement);
		this.render();
	}

	async onClose(): Promise<void> {
		this.root?.unmount();
	}

	setActiveBook(vaultPath: string | null): void {
		this.activeVaultPath = vaultPath;
		this.render();
	}

	invalidate(): void {
		this.render();
	}

	private render(): void {
		this.root?.render(
			<LibraryPanel
				data={this.data}
				activeVaultPath={this.activeVaultPath}
				onOpenBook={(path) => this.openBook(path)}
				onOpenBookNewTab={(path) => this.openBook(path, true)}
				onUiStateChange={(changes) => {
					Object.assign(this.data.libraryUiState, changes);
					void this.persist();
				}}
				onFlushRecentReorder={this.flushRecentReorder}
			/>,
		);
	}
}
