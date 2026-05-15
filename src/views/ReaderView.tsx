import ePub from "epubjs";
import type { Book } from "epubjs";
import { ItemView, TFile, type ViewStateResult, WorkspaceLeaf } from "obsidian";
import { createRoot } from "react-dom/client";
import { EpubRenderer } from "../components/EpubRenderer";
import { t } from "../i18n";
import type { ReadingProgress } from "../models/types";
import { ReaderSessionService } from "../services/ReaderSessionService";
import type { FourNowReaderSettings } from "../settings";

export const READER_VIEW_TYPE = "4now-reader-view";

export class ReaderView extends ItemView {
	private root: ReturnType<typeof createRoot> | null = null;
	private currentTitle: string | null = null;
	private currentFile: TFile | null = null;
	private currentBook: Book | null = null;
	private currentCfi: string | undefined = undefined;
	// Obsidian fires setState twice during workspace restore / leaf reveal; this
	// flag de-dupes the concurrent openBook calls so we don't build two epubjs
	// instances and remount the rendition mid-flight (= the open-time flicker).
	private openingPath: string | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private sessionService: ReaderSessionService,
		private settings: FourNowReaderSettings,
		private loadProgress: (
			vaultPath: string,
		) => Promise<ReadingProgress | undefined>,
		private saveSettings: () => Promise<void>,
	) {
		super(leaf);
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
		// Hide Obsidian's view-header so the epub gets full leaf height.
		(this.containerEl.children[0] as HTMLElement).style.setProperty("display", "none", "important");
		this.root = createRoot(this.containerEl.children[1] as HTMLElement);
		this.root.render(<div className="fnr-state-screen" />);
	}

	async onClose(): Promise<void> {
		this.root?.unmount();
		(this.containerEl.children[0] as HTMLElement).style.removeProperty("display");
		if (this.currentBook) {
			try { this.currentBook.destroy(); } catch { /* partial-load races */ }
			this.currentBook = null;
		}
		await this.sessionService.flush();
	}

	async openBook(file: TFile): Promise<void> {
		if (this.openingPath === file.path) return;
		if (this.currentFile?.path === file.path && this.currentBook) return;
		this.openingPath = file.path;
		try {
			// Destroy the previous book's epubjs internals before creating a new one,
			// otherwise its in-flight section loads keep firing hooks against a torn-
			// down rendition and surface as `injectIdentifier` undefined-packaging errors.
			const previousBook = this.currentBook;
			this.currentBook = null;

			this.currentFile = file;
			this.currentTitle = file.basename;
			this.leaf.updateHeader();

			const arrayBuffer = await this.app.vault.readBinary(file);
			const book = ePub(arrayBuffer);
			this.currentBook = book;
			await book.opened;
			if (previousBook) {
				try { previousBook.destroy(); } catch { /* partial-load races */ }
			}
			const metadata = await book.loaded.metadata;

			this.currentTitle = metadata.title || file.basename;
			this.leaf.updateHeader();

			const progress = await this.loadProgress(file.path);
			this.currentCfi = progress?.cfi;
			this.renderEpub(book, this.currentCfi, file);

			this.sessionService.updateRecent(file.path);
		} finally {
			this.openingPath = null;
		}
	}

	private renderEpub(book: Book, initialCfi?: string, file?: TFile): void {
		const f = file ?? this.currentFile;
		if (!f) return;
		// `key` forces a fresh rendition when flow/column settings change.
		// textWidth is handled inside EpubRenderer via CSS — no remount.
		const renditionKey = this.settings.readingMode;
		this.root?.render(
			<EpubRenderer
				key={renditionKey}
				book={book}
				settings={this.settings}
				initialCfi={initialCfi}
				onProgress={(cfi, pct, chapter) => {
					this.currentCfi = cfi;
					this.sessionService.recordProgress(f.path, cfi, pct, chapter);
				}}
				onSettingsChange={this.handleSettingsChange}
			/>,
		);
	}

	updateSettings(newSettings: FourNowReaderSettings): void {
		this.settings = newSettings;
		if (!this.currentBook || !this.currentFile) return;
		this.renderEpub(this.currentBook, this.currentCfi, this.currentFile);
	}

	private handleSettingsChange = async (
		partial: Partial<FourNowReaderSettings>,
	): Promise<void> => {
		Object.assign(this.settings, partial);
		await this.saveSettings();
		// Rebuild only when readingMode changes (drives key=); other settings stay local.
		if ("readingMode" in partial && this.currentBook && this.currentFile) {
			this.renderEpub(this.currentBook, this.currentCfi, this.currentFile);
		}
	};
}
