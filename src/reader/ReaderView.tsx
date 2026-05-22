import type { Book } from "epubjs";
import type { ForNowReaderSettings } from "../settings/schema";
import type { Workspace } from "obsidian";

import ePub from "epubjs";
import { ItemView, TFile, type ViewStateResult, WorkspaceLeaf } from "obsidian";
import { createRoot } from "react-dom/client";

import { t } from "../i18n";

import { EpubRenderer } from "./components/EpubRenderer";
import { ReaderSessionService } from "./ReaderSessionService";

export const READER_VIEW_TYPE = "4now-reader-view";

export interface ReaderViewState {
  file?: string;
}

export interface ReaderViewDeps {
  sessionService: ReaderSessionService;
  settings: ForNowReaderSettings;
  saveSettings: () => Promise<void>;
  isFavorite: (vaultPath: string) => boolean;
  toggleFavorite: (vaultPath: string) => void;
  isInternalOpen: () => boolean;
  setInternalOpen: (value: boolean) => void;
}

export function findReaderReuseTarget(
  workspace: Workspace,
  file: string,
  excludeLeaf?: WorkspaceLeaf,
): WorkspaceLeaf | null {
  const readerLeaves = workspace.getLeavesOfType(READER_VIEW_TYPE);

  const sameFile = readerLeaves.find((l) => {
    if (l === excludeLeaf) return false;
    const state = l.getViewState().state as { file?: string } | undefined;
    return state?.file === file;
  });
  if (sameFile) return sameFile;

  const mostRecent = workspace.getMostRecentLeaf(workspace.rootSplit);
  if (mostRecent && mostRecent !== excludeLeaf) return mostRecent;

  const otherReader = readerLeaves.find((l) => l !== excludeLeaf);
  if (otherReader) return otherReader;

  let mainAny: WorkspaceLeaf | null = null;
  workspace.iterateRootLeaves((l) => {
    if (l !== excludeLeaf && !mainAny) mainAny = l;
  });
  return mainAny;
}

export class ReaderView extends ItemView {
  private root: ReturnType<typeof createRoot> | null = null;
  private currentTitle: string | null = null;
  private currentFile: TFile | null = null;
  private currentBook: Book | null = null;
  private currentCfi: string | undefined = undefined;
  private currentProgress: number | undefined = undefined;
  private currentIsUserInitiated = false;
  private openingPath: string | null = null;
  private sessionService: ReaderSessionService;
  private settings: ForNowReaderSettings;
  private saveSettings: () => Promise<void>;
  private isFavorite: (vaultPath: string) => boolean;
  private toggleFavorite: (vaultPath: string) => void;
  private isInternalOpen: () => boolean;
  private setInternalOpen: (value: boolean) => void;

  constructor(leaf: WorkspaceLeaf, deps: ReaderViewDeps) {
    super(leaf);
    this.sessionService = deps.sessionService;
    this.settings = deps.settings;
    this.saveSettings = deps.saveSettings;
    this.isFavorite = deps.isFavorite;
    this.toggleFavorite = deps.toggleFavorite;
    this.isInternalOpen = deps.isInternalOpen;
    this.setInternalOpen = deps.setInternalOpen;
  }

  refreshFavoriteFor(vaultPath: string): void {
    if (this.currentFile?.path === vaultPath && this.currentBook) {
      this.renderEpub(this.currentBook, this.currentCfi, this.currentFile);
    }
  }

  getViewType(): string {
    return READER_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.currentTitle ?? t("reader.title");
  }

  getIcon(): string {
    return "book-open";
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    const { file } = state as ReaderViewState;

    if (file && !this.isInternalOpen() && !this.settings.openInNewLeaf) {
      const target = findReaderReuseTarget(this.app.workspace, file, this.leaf);
      if (target) {
        this.app.workspace.setActiveLeaf(target, { focus: true });
        this.app.workspace.revealLeaf(target);
        const targetFile = (
          target.getViewState().state as { file?: string } | undefined
        )?.file;
        if (targetFile !== file) {
          this.setInternalOpen(true);
          try {
            await target.setViewState({
              type: READER_VIEW_TYPE,
              state: { file },
              active: true,
            });
          } finally {
            this.setInternalOpen(false);
          }
        }
        queueMicrotask(() => this.leaf.detach());
        return;
      }
    }

    await super.setState(state, result);
    if (file) {
      const tfile = this.app.vault.getAbstractFileByPath(file);
      if (tfile instanceof TFile) {
        await this.openBook(tfile);
      }
    }
  }

  getState(): Record<string, unknown> {
    return { file: this.currentFile?.path };
  }

  async onOpen(): Promise<void> {
    this.root = createRoot(this.containerEl.children[1] as HTMLElement);
    if (this.currentBook && this.currentFile) {
      this.renderEpub(this.currentBook, this.currentCfi, this.currentFile);
    } else {
      this.root.render(<div className="fnr-state-screen" />);
    }
  }

  async onClose(): Promise<void> {
    const book = this.currentBook;
    this.currentBook = null;
    this.root?.unmount();
    if (book) {
      try {
        book.destroy();
      } catch {}
    }
    await this.sessionService.flush();
  }

  async openBook(file: TFile): Promise<void> {
    if (this.openingPath === file.path) return;
    if (this.currentFile?.path === file.path && this.currentBook) return;
    this.openingPath = file.path;
    try {
      const previousBook = this.currentBook;
      this.currentBook = null;

      this.currentFile = file;
      this.currentTitle = file.basename;
      this.leaf.updateHeader();

      try {
        const arrayBuffer = await this.app.vault.readBinary(file);
        const book = ePub(arrayBuffer);
        this.currentBook = book;
        await book.opened;
        if (previousBook) {
          try {
            previousBook.destroy();
          } catch {}
        }
        const metadata = await book.loaded.metadata;

        this.currentTitle = metadata.title || file.basename;
        this.leaf.updateHeader();

        const saved = this.sessionService.getProgress(file.path);
        this.currentCfi = saved?.cfi;
        this.currentProgress = saved?.percentage;
        this.currentIsUserInitiated = this.app.workspace.layoutReady;
        this.renderEpub(book, this.currentCfi, file);
      } catch (err) {
        console.error(`[4now] failed to open ${file.path}:`, err);
        this.renderError(err);
        if (previousBook) {
          try {
            previousBook.destroy();
          } catch {}
        }
      }
    } finally {
      this.openingPath = null;
    }
  }

  private renderError(err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    this.root?.render(
      <div className="fnr-state-screen fnr-state-error">
        <h3>{t("reader.error.title")}</h3>
        <p>{message}</p>
      </div>,
    );
  }

  private renderEpub(book: Book, initialCfi?: string, file?: TFile): void {
    const f = file ?? this.currentFile;
    if (!f) return;

    const renditionKey = this.settings.readingMode;

    this.root?.render(
      <EpubRenderer
        key={renditionKey}
        book={book}
        settings={this.settings}
        initialCfi={initialCfi}
        initialProgress={this.currentProgress}
        isUserInitiated={this.currentIsUserInitiated}
        isFavorite={this.isFavorite(f.path)}
        onToggleFavorite={() => this.toggleFavorite(f.path)}
        onProgress={(cfi, pct, chapter) => {
          this.currentCfi = cfi;
          this.currentProgress = pct;
          this.sessionService.recordProgress(f.path, cfi, pct, chapter);
        }}
        onSettingsChange={this.handleSettingsChange}
      />,
    );
  }

  updateSettings(newSettings: ForNowReaderSettings): void {
    this.settings = newSettings;
    if (!this.currentBook || !this.currentFile) return;
    this.renderEpub(this.currentBook, this.currentCfi, this.currentFile);
  }

  private handleSettingsChange = async (
    partial: Partial<ForNowReaderSettings>,
  ): Promise<void> => {
    Object.assign(this.settings, partial);
    await this.saveSettings();
    if ("readingMode" in partial && this.currentBook && this.currentFile) {
      this.renderEpub(this.currentBook, this.currentCfi, this.currentFile);
    }
  };
}
