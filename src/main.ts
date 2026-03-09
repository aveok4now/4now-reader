import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, Read4sidianSettingsTab } from './settings';
import type { PluginData } from './models/plugin-data';
import { setLocale, t } from './i18n';
import { ReaderSessionService } from './services/ReaderSessionService';
import { READER_VIEW_TYPE, ReaderView } from './views/ReaderView';
import type { ReadingProgress } from './models/types';

const DEFAULT_DATA: PluginData = {
	settings: { ...DEFAULT_SETTINGS },
	libraryIndex: {},
	recentBooks: [],
	readingProgress: {},
	bookmarks: {},
	highlights: {},
};

export default class Read4sidianPlugin extends Plugin {
	data: PluginData = { ...DEFAULT_DATA, settings: { ...DEFAULT_SETTINGS } };
	private sessionService!: ReaderSessionService;

	async onload(): Promise<void> {
		await this.loadPluginData();
		setLocale(this.data.settings.locale);

		this.sessionService = new ReaderSessionService(this);

		this.registerView(
			READER_VIEW_TYPE,
			(leaf) =>
				new ReaderView(
					leaf,
					this.sessionService,
					this.data.settings,
					(vaultPath) => this.getProgress(vaultPath),
				),
		);

		this.registerExtensions(['epub'], READER_VIEW_TYPE);

		this.addCommand({
			id: 'open-epub',
			name: t('command.openEpub'),
			callback: () => {
				new Notice(t('reader.opening'));
			},
		});

		this.addSettingTab(new Read4sidianSettingsTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (file instanceof TFile && file.extension === 'epub') {
					menu.addItem((item) => {
						item
							.setTitle(t('command.openEpub'))
							.setIcon('book-open')
							.onClick(() => this.openEpubFile(file));
					});
				}
			}),
		);
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
		};
	}

	async savePluginData(): Promise<void> {
		await this.saveData(this.data);
	}

	async openEpubFile(file: TFile): Promise<void> {
		const leaf: WorkspaceLeaf = this.data.settings.openInNewLeaf
			? this.app.workspace.getLeaf('tab')
			: this.app.workspace.getLeaf(false);

		await leaf.setViewState({ type: READER_VIEW_TYPE, active: true });
		this.app.workspace.revealLeaf(leaf);

		const view = leaf.view as ReaderView;
		await view.openBook(file);
	}

	private getProgress(vaultPath: string): Promise<ReadingProgress | undefined> {
		return Promise.resolve(this.data.readingProgress?.[vaultPath]);
	}
}
