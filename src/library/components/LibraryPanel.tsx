import type {
  LibrarySortOrder,
  LibraryTab,
  LibraryUiState,
  PluginData,
} from "../../data/PluginData";
import type { BookMeta } from "../../data/types";

import { useEffect, useRef, useState } from "react";

import { t } from "../../i18n";
import { sortBooks } from "../sort";

import { BookCard } from "./BookCard";
import { TabBar } from "./TabBar";

interface LibraryPanelProps {
  data: PluginData;
  activeVaultPath: string | null;
  onOpenBook: (vaultPath: string) => void;
  onOpenBookNewTab: (vaultPath: string) => void;
  onUiStateChange: (changes: Partial<LibraryUiState>) => void;
  getRecentPaths: () => string[];
  onToggleFavorite: (vaultPath: string) => void;
}

export function LibraryPanel({
  data,
  activeVaultPath,
  onOpenBook,
  onOpenBookNewTab,
  onUiStateChange,
  getRecentPaths,
  onToggleFavorite,
}: LibraryPanelProps) {
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<LibrarySortOrder>(data.libraryUiState.sortOrder);
  const [activeTab, setActiveTab] = useState<LibraryTab>(data.libraryUiState.activeTab);
  const [recentSnapshot, setRecentSnapshot] = useState<string[]>(() => getRecentPaths());

  const prevActiveRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeTab === "recent" && activeVaultPath !== null && prevActiveRef.current === null) {
      setRecentSnapshot(getRecentPaths());
    }
    prevActiveRef.current = activeVaultPath;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVaultPath]);

  const handleTabChange = (tab: LibraryTab) => {
    if (tab === "recent" && activeTab !== "recent") {
      setRecentSnapshot(getRecentPaths());
    }
    setActiveTab(tab);
    onUiStateChange({ activeTab: tab });
  };

  const handleSortChange = (order: LibrarySortOrder) => {
    setSortOrder(order);
    onUiStateChange({ sortOrder: order });
  };

  const books = Object.values(data.libraryIndex);
  const q = query.toLowerCase();
  const matchesQuery = (b: BookMeta): boolean =>
    !query || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.vaultPath.toLowerCase().includes(q);

  const recentBooks = recentSnapshot
    .map((p) => data.libraryIndex[p])
    .filter((b): b is BookMeta => b !== undefined)
    .filter(matchesQuery);

  const filteredAll = query ? books.filter(matchesQuery) : sortBooks(books, sortOrder);

  const favBooks =
    activeTab === "favorites"
      ? sortBooks(
          Object.keys(data.favorites)
            .map((p) => data.libraryIndex[p])
            .filter((b): b is BookMeta => b !== undefined)
            .filter(matchesQuery),
          sortOrder,
        )
      : [];

  const visibleCount = activeTab === "recent" ? recentBooks.length : activeTab === "favorites" ? favBooks.length : filteredAll.length;

  const renderContent = () => {
    const cardFor = (b: BookMeta) => (
      <BookCard
        key={b.vaultPath}
        book={b}
        progress={data.readingProgress[b.vaultPath]}
        isActive={b.vaultPath === activeVaultPath}
        isFavorite={data.favorites[b.vaultPath] === true}
        onClick={() => onOpenBook(b.vaultPath)}
        onNewTabClick={() => onOpenBookNewTab(b.vaultPath)}
        onToggleFavorite={() => onToggleFavorite(b.vaultPath)}
      />
    );

    if (activeTab === "recent") {
      if (recentBooks.length === 0) {
        return <div className="fnr-library-empty">{query ? t("library.noResults") : t("library.recent.empty")}</div>;
      }
      return recentBooks.map(cardFor);
    }

    if (activeTab === "favorites") {
      if (favBooks.length === 0) {
        return <div className="fnr-library-empty">{query ? t("library.noResults") : t("library.favorites.empty")}</div>;
      }
      return favBooks.map(cardFor);
    }

    if (filteredAll.length === 0) {
      return <div className="fnr-library-empty">{query ? t("library.noResults") : t("library.empty")}</div>;
    }
    return filteredAll.map(cardFor);
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
        showSort={visibleCount > 0}
        onSortChange={handleSortChange}
      />
      <div className="fnr-library-body">{renderContent()}</div>
    </div>
  );
}
