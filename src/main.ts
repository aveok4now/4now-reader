import { Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { setLocale, t } from "./i18n";
import { DEFAULT_LIBRARY_UI_STATE, type PluginData } from "./models/plugin-data";
import type { ReadingProgress } from "./models/types";
import { LibraryIndexService } from "./services/LibraryIndexService";
import { ReaderSessionService } from "./services/ReaderSessionService";
import { DEFAULT_SETTINGS, FourNowReaderSettingsTab } from "./settings";
import { LIBRARY_VIEW_TYPE, LibraryView } from "./views/LibraryView";
import { READER_VIEW_TYPE, ReaderView } from "./views/ReaderView";

const DEFAULT_DATA: PluginData = {
	settings: { ...DEFAULT_SETTINGS },
	libraryIndex: {},
	recentBooks: [],
	readingProgress: {},
	bookmarks: {},
	highlights: {},
	libraryUiState: { ...DEFAULT_LIBRARY_UI_STATE },
};

export default class FourNowReaderPlugin extends Plugin {
	data: PluginData = { ...DEFAULT_DATA, settings: { ...DEFAULT_SETTINGS } };
	private sessionService!: ReaderSessionService;
	private libraryService!: LibraryIndexService;
	// Holds the library's active-book highlight while focus is in the library pane.
	private lastActiveReaderPath: string | null = null;

	async onload(): Promise<void> {
		await this.loadPluginData();
		setLocale(this.data.settings.locale);

		this.sessionService = new ReaderSessionService(this, this.data, () =>
			this.invalidateLibraryView(),
		);
		this.libraryService = new LibraryIndexService(
			this.app.vault,
			this.data,
			() => this.savePluginData(),
		);

		this.registerView(
			READER_VIEW_TYPE,
			(leaf) =>
				new ReaderView(
					leaf,
					this.sessionService,
					this.data.settings,
					(vaultPath) => this.getProgress(vaultPath),
					() => this.savePluginData(),
				),
		);

		this.registerView(
			LIBRARY_VIEW_TYPE,
			(leaf) =>
				new LibraryView(
					leaf,
					this.data,
					(vaultPath, newTab) => this.openEpubByPath(vaultPath, newTab),
					() => this.savePluginData(),
				),
		);

		this.registerExtensions(["epub"], READER_VIEW_TYPE);

		this.addRibbonIcon("library", t("command.openLibrary"), () =>
			this.activateLibraryView(),
		);

		this.addCommand({
			id: "open-library",
			name: t("command.openLibrary"),
			callback: () => this.activateLibraryView(),
		});

		this.addSettingTab(new FourNowReaderSettingsTab(this.app, this));

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
					void this.libraryService
						.scanFile(file)
						.then(() => this.savePluginData())
						.then(() => this.invalidateLibraryView());
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
					this.libraryService.renameFile(oldPath, file.path, file);
					void this.savePluginData().then(() => this.invalidateLibraryView());
				}
			}),
		);

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () =>
				this.updateLibraryActiveBook(),
			),
		);

		this.app.workspace.onLayoutReady(() => {
			if (this.data.settings.scanOnStartup) {
				void this.scanLibrary();
			}
		});
	}

	async onunload(): Promise<void> {
		await this.sessionService.flush();
	}

	async loadPluginData(): Promise<void> {
		const saved = (await this.loadData()) as Partial<PluginData> | null;
		this.data = {
			...DEFAULT_DATA,
			...saved,
			settings: { ...DEFAULT_SETTINGS, ...(saved?.settings ?? {}) },
			libraryUiState: { ...DEFAULT_LIBRARY_UI_STATE, ...(saved?.libraryUiState ?? {}) },
		};
	}

	async savePluginData(): Promise<void> {
		await this.saveData(this.data);
	}

	async openEpubFile(file: TFile, forceNewLeaf?: boolean): Promise<void> {
		if (this.data.libraryIndex[file.path]) {
			this.data.libraryIndex[file.path].lastOpened = Date.now();
		}

		const openNew = forceNewLeaf ?? this.data.settings.openInNewLeaf;
		const leaf: WorkspaceLeaf = openNew
			? this.app.workspace.getLeaf("tab")
			: (this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit) ?? this.app.workspace.getLeaf("tab"));

		await leaf.setViewState({ type: READER_VIEW_TYPE, state: { file: file.path }, active: true });
		this.app.workspace.revealLeaf(leaf);

		// active-leaf-change fires before ReaderView.setState() resolves, so set here.
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
			this.lastActiveReaderPath =
				(readerView.getState() as { file?: string }).file ?? null;
		}
		// Propagate the cached path so library clicks don't clear the highlight.
		this.setLibraryActiveBook(this.lastActiveReaderPath);
	}

	propagateSettingsToViews(): void {
		this.app.workspace
			.getLeavesOfType(READER_VIEW_TYPE)
			.forEach((leaf) => {
				const view = leaf.view;
				if (view instanceof ReaderView) {
					view.updateSettings(this.data.settings);
				}
			});
	}

	private getProgress(vaultPath: string): Promise<ReadingProgress | undefined> {
		return Promise.resolve(this.data.readingProgress?.[vaultPath]);
	}
}
