import type { PluginData } from "../data/PluginData";

import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot } from "react-dom/client";

import { t } from "../i18n";

import { LibraryPanel } from "./components/LibraryPanel";

export const LIBRARY_VIEW_TYPE = "4now-reader-library";

export interface LibraryViewDeps {
  data: PluginData;
  openBook: (vaultPath: string, newTab?: boolean) => Promise<void>;
  persist: () => Promise<void>;
  getRecentPaths: () => string[];
  toggleFavorite: (vaultPath: string) => void;
}

export class LibraryView extends ItemView {
  private root: ReturnType<typeof createRoot> | null = null;
  private activeVaultPath: string | null = null;
  private readonly data: PluginData;
  private readonly openBook: (
    vaultPath: string,
    newTab?: boolean,
  ) => Promise<void>;
  private readonly persist: () => Promise<void>;
  private readonly getRecentPaths: () => string[];
  private readonly toggleFavorite: (vaultPath: string) => void;

  constructor(leaf: WorkspaceLeaf, deps: LibraryViewDeps) {
    super(leaf);
    this.data = deps.data;
    this.openBook = deps.openBook;
    this.persist = deps.persist;
    this.getRecentPaths = deps.getRecentPaths;
    this.toggleFavorite = deps.toggleFavorite;
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
        getRecentPaths={this.getRecentPaths}
        onToggleFavorite={this.toggleFavorite}
      />,
    );
  }
}
