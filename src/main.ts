import type { PluginData } from "./data/PluginData";

import { Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";

import { DEFAULT_DATA } from "./data/PluginData";
import { migrate } from "./data/migrations";
import { setLocale, t } from "./i18n";
import { LIBRARY_VIEW_TYPE, LibraryView } from "./library/LibraryView";
import { LibraryIndexService } from "./library/LibraryIndexService";
import {
  findReaderReuseTarget,
  READER_VIEW_TYPE,
  ReaderView,
  type ReaderViewState,
} from "./reader/ReaderView";
import { ReaderSessionService } from "./reader/ReaderSessionService";
import { ForNowReaderSettingsTab } from "./settings/SettingsTab";

export default class ForNowReaderPlugin extends Plugin {
  data: PluginData = { ...DEFAULT_DATA };
  private sessionService!: ReaderSessionService;
  private libraryService!: LibraryIndexService;
  private lastActiveReaderPath: string | null = null;
  private internalOpenDepth = 0;

  async onload(): Promise<void> {
    await this.loadPluginData();
    setLocale(this.data.settings.locale);

    const persist = () => this.savePluginData();
    this.sessionService = new ReaderSessionService(this.data, persist, () => this.invalidateLibraryView());
    this.libraryService = new LibraryIndexService(this.app.vault, this.data, persist);

    this.registerView(
      READER_VIEW_TYPE,
      (leaf) =>
        new ReaderView(leaf, {
          sessionService: this.sessionService,
          settings: this.data.settings,
          saveSettings: persist,
          isFavorite: (path) => this.isFavorite(path),
          toggleFavorite: (path) => this.toggleFavorite(path),
          isInternalOpen: () => this.internalOpenDepth > 0,
          setInternalOpen: (v) => {
            this.internalOpenDepth += v ? 1 : -1;
          },
        }),
    );

    this.registerView(
      LIBRARY_VIEW_TYPE,
      (leaf) =>
        new LibraryView(leaf, {
          data: this.data,
          openBook: (path, newTab) => this.openEpubByPath(path, newTab),
          persist,
          getRecentPaths: () => this.sessionService.getRecentPaths(),
          toggleFavorite: (path) => this.toggleFavorite(path),
        }),
    );

    this.registerExtensions(["epub"], READER_VIEW_TYPE);

    this.addRibbonIcon("library", t("command.openLibrary"), () => this.activateLibraryView());

    this.addCommand({
      id: "open-library",
      name: t("command.openLibrary"),
      callback: () => this.activateLibraryView(),
    });

    this.addSettingTab(new ForNowReaderSettingsTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof TFile && file.extension === "epub") {
          menu.addItem((item) => {
            item
              .setTitle(t("command.openEpub"))
              .setIcon("book-open")
              .onClick(() => this.openEpubFile(file));
          });
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (file instanceof TFile && file.extension === "epub") {
          void this.ingestEpub(file);
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file instanceof TFile && file.extension === "epub") {
          this.libraryService.removeFile(file.path);
          void this.savePluginData().then(() => this.invalidateLibraryView());
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (file instanceof TFile && file.extension === "epub") {
          const renamed = this.libraryService.renameFile(oldPath, file.path);
          if (renamed) {
            void this.savePluginData().then(() => this.invalidateLibraryView());
          } else {
            void this.ingestEpub(file);
          }
        }
      }),
    );

    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.updateLibraryActiveBook()));
    this.registerEvent(this.app.workspace.on("layout-change", () => this.updateLibraryActiveBook()));

    this.app.workspace.onLayoutReady(() => {
      if (this.data.settings.scanOnStartup) {
        void this.scanLibrary();
      }
      this.updateLibraryActiveBook();
    });
  }

  async onunload(): Promise<void> {
    await this.sessionService.flush();
  }

  async loadPluginData(): Promise<void> {
    this.data = migrate(await this.loadData());
  }

  async savePluginData(): Promise<void> {
    await this.saveData(this.data);
  }

  async openEpubFile(file: TFile, forceNewLeaf?: boolean): Promise<void> {
    if (this.data.libraryIndex[file.path]) {
      this.data.libraryIndex[file.path].lastOpened = Date.now();
      void this.savePluginData();
    }

    const openNew = forceNewLeaf ?? this.data.settings.openInNewLeaf;

    const leaf = openNew
      ? this.app.workspace.getLeaf("tab")
      : (findReaderReuseTarget(this.app.workspace, file.path) ?? this.app.workspace.getLeaf("tab"));

    this.internalOpenDepth++;
    try {
      await leaf.setViewState({
        type: READER_VIEW_TYPE,
        state: { file: file.path },
        active: true,
      });
    } finally {
      this.internalOpenDepth--;
    }
    this.app.workspace.revealLeaf(leaf);

    this.lastActiveReaderPath = file.path;
    this.setLibraryActiveBook(file.path);
    this.invalidateLibraryView();
  }

  private async openEpubByPath(vaultPath: string, forceNewLeaf?: boolean): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(vaultPath);
    if (file instanceof TFile) {
      await this.openEpubFile(file, forceNewLeaf);
    }
  }

  private async activateLibraryView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(LIBRARY_VIEW_TYPE);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getLeftLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: LIBRARY_VIEW_TYPE, active: true });
      this.app.workspace.revealLeaf(leaf);
    }
  }

  private async scanLibrary(): Promise<void> {
    await this.libraryService.scanVault();
    this.invalidateLibraryView();
  }

  private async ingestEpub(file: TFile): Promise<void> {
    const ok = await this.libraryService.scanFile(file);
    if (!ok) {
      if (this.app.workspace.layoutReady) {
        new Notice(t("library.scanFailed", { path: file.path }));
      }
      return;
    }
    await this.savePluginData();
    this.invalidateLibraryView();
  }

  private invalidateLibraryView(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(LIBRARY_VIEW_TYPE)) {
      if (leaf.view instanceof LibraryView) leaf.view.invalidate();
    }
  }

  private setLibraryActiveBook(path: string | null): void {
    for (const leaf of this.app.workspace.getLeavesOfType(LIBRARY_VIEW_TYPE)) {
      if (leaf.view instanceof LibraryView) leaf.view.setActiveBook(path);
    }
  }

  private updateLibraryActiveBook(): void {
    const readerView = this.app.workspace.getActiveViewOfType(ReaderView);
    if (readerView) {
      const file = (readerView.getState() as ReaderViewState).file;
      if (file) this.lastActiveReaderPath = file;
    } else {
      const readerFiles = new Set<string>();
      for (const leaf of this.app.workspace.getLeavesOfType(READER_VIEW_TYPE)) {
        const state = leaf.getViewState().state as { file?: string } | undefined;
        if (state?.file) readerFiles.add(state.file);
      }
      if (readerFiles.size === 0) {
        this.lastActiveReaderPath = null;
      } else if (this.lastActiveReaderPath === null || !readerFiles.has(this.lastActiveReaderPath)) {
        this.lastActiveReaderPath = readerFiles.values().next().value ?? null;
      }
    }
    this.setLibraryActiveBook(this.lastActiveReaderPath);
  }

  propagateSettingsToViews(): void {
    this.app.workspace.getLeavesOfType(READER_VIEW_TYPE).forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof ReaderView) {
        view.updateSettings(this.data.settings);
      }
    });
  }

  isFavorite(vaultPath: string): boolean {
    return this.data.favorites[vaultPath] === true;
  }

  toggleFavorite(vaultPath: string): void {
    if (this.data.favorites[vaultPath]) {
      delete this.data.favorites[vaultPath];
    } else {
      this.data.favorites[vaultPath] = true;
    }
    void this.savePluginData();
    this.invalidateLibraryView();
    this.propagateFavoriteToViews(vaultPath);
  }

  private propagateFavoriteToViews(vaultPath: string): void {
    for (const leaf of this.app.workspace.getLeavesOfType(READER_VIEW_TYPE)) {
      if (leaf.view instanceof ReaderView) {
        leaf.view.refreshFavoriteFor(vaultPath);
      }
    }
  }
}
