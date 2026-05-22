import type React from "react";
import type { LibrarySortOrder, LibraryTab } from "../../data/PluginData";

import { ArrowUpDown, BookOpen, Clock, Heart } from "lucide-react";
import { Menu } from "obsidian";

import { t } from "../../i18n";
import { tip } from "../../shared/tooltip";

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
  showSort: boolean;
}

export function TabBar({ activeTab, onTabChange, sortOrder, onSortChange, showSort }: TabBarProps) {
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
      {activeTab !== "recent" && showSort && (
        <button ref={tip(t("library.sort.label"))} className="fnr-tab-btn" onClick={openSortMenu}>
          <ArrowUpDown size={16} />
        </button>
      )}
    </div>
  );
}
