import React from 'react';
import { ItemView, WorkspaceLeaf, TFile, type ViewStateResult } from 'obsidian';
import { createRoot } from 'react-dom/client';
import ePub from 'epubjs';
import { EpubRenderer } from '../components/EpubRenderer';
import { ReaderSessionService } from '../services/ReaderSessionService';
import type { Read4sidianSettings } from '../settings';
import { t } from '../i18n';
import type { ReadingProgress } from '../models/types';

export const READER_VIEW_TYPE = 'read4sidian-reader';

export class ReaderView extends ItemView {
  private root: ReturnType<typeof createRoot> | null = null;
  private currentTitle: string | null = null;
  private currentFile: TFile | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private sessionService: ReaderSessionService,
    private settings: Read4sidianSettings,
    private loadProgress: (vaultPath: string) => Promise<ReadingProgress | undefined>,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return READER_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.currentTitle ?? t('reader.title');
  }

  getIcon(): string {
    return 'book-open';
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);
    const { file } = state as { file?: string };
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
    this.root.render(<div className="r4s-state-screen" />);
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
    await this.sessionService.flush();
  }

  async openBook(file: TFile): Promise<void> {
    this.currentFile = file;
    const arrayBuffer = await this.app.vault.readBinary(file);
    const book = ePub(arrayBuffer);

    const metadata = await book.loaded.metadata;
    this.currentTitle = metadata.title || file.basename;

    const progress = await this.loadProgress(file.path);

    this.root?.render(
      <EpubRenderer
        book={book}
        settings={this.settings}
        initialCfi={progress?.cfi}
        onProgress={(cfi, pct, chapter) => {
          this.sessionService.recordProgress(file.path, cfi, pct, chapter);
        }}
      />,
    );

    await this.sessionService.updateRecent(file.path);
  }

  updateSettings(settings: Read4sidianSettings): void {
    this.settings = settings;
  }
}
