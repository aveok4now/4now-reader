import { App, PluginSettingTab, Setting } from "obsidian";
import { setLocale, t, type SupportedLocale } from "../i18n";
import type { TranslationKey } from "../i18n/en";
import type Read4sidianPlugin from "../main";
import type { ReaderTheme, ReadingMode } from "../models/types";

export interface Read4sidianSettings {
	readingMode: ReadingMode;
	readerTheme: ReaderTheme;
	fontFamily: string;
	fontSize: number;
	lineHeight: number;
	textWidth: number;
	exportFolder: string;
	scanOnStartup: boolean;
	footnoteBehavior: "popover" | "inline";
	openInNewLeaf: boolean;
	locale: SupportedLocale;
}

export const DEFAULT_SETTINGS: Read4sidianSettings = {
	readingMode: "scroll",
	readerTheme: "adaptive",
	fontFamily: "",
	fontSize: 16,
	lineHeight: 1.6,
	textWidth: 700,
	exportFolder: "Reading/Exports",
	scanOnStartup: true,
	footnoteBehavior: "popover",
	openInNewLeaf: false,
	locale: "auto",
};

export class Read4sidianSettingsTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: Read4sidianPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Reading
		new Setting(containerEl)
			.setHeading()
			.setName(t("settings.heading.reading"));

		new Setting(containerEl)
			.setName(t("settings.readingMode.name"))
			.setDesc(t("settings.readingMode.desc"))
			.addDropdown((d) =>
				d
					.addOption("scroll", t("mode.scroll"))
					.addOption("paginated", t("mode.paginated"))
					.setValue(this.plugin.data.settings.readingMode)
					.onChange(async (v) => {
						this.plugin.data.settings.readingMode = v as ReadingMode;
						await this.plugin.savePluginData();
					}),
			);

		// Appearance
		new Setting(containerEl)
			.setHeading()
			.setName(t("settings.heading.appearance"));

		new Setting(containerEl)
			.setName(t("settings.theme.name"))
			.setDesc(t("settings.theme.desc"))
			.addDropdown((d) => {
				const themes: [ReaderTheme, TranslationKey][] = [
					["adaptive", "theme.adaptive"],
					["light", "theme.light"],
					["dark", "theme.dark"],
					["sepia", "theme.sepia"],
				];
				themes.forEach(([val, key]) => d.addOption(val, t(key)));
				return d
					.setValue(this.plugin.data.settings.readerTheme)
					.onChange(async (v) => {
						this.plugin.data.settings.readerTheme = v as ReaderTheme;
						await this.plugin.savePluginData();
					});
			});

		new Setting(containerEl)
			.setName(t("settings.fontSize.name"))
			.setDesc(t("settings.fontSize.desc"))
			.addSlider((s) =>
				s
					.setLimits(12, 28, 1)
					.setValue(this.plugin.data.settings.fontSize)
					.setDynamicTooltip()
					.onChange(async (v) => {
						this.plugin.data.settings.fontSize = v;
						await this.plugin.savePluginData();
					}),
			);

		new Setting(containerEl)
			.setName(t("settings.lineHeight.name"))
			.setDesc(t("settings.lineHeight.desc"))
			.addSlider((s) =>
				s
					.setLimits(1.2, 2.4, 0.1)
					.setValue(this.plugin.data.settings.lineHeight)
					.setDynamicTooltip()
					.onChange(async (v) => {
						this.plugin.data.settings.lineHeight = v;
						await this.plugin.savePluginData();
					}),
			);

		new Setting(containerEl)
			.setName(t("settings.textWidth.name"))
			.setDesc(t("settings.textWidth.desc"))
			.addSlider((s) =>
				s
					.setLimits(400, 1200, 50)
					.setValue(this.plugin.data.settings.textWidth)
					.setDynamicTooltip()
					.onChange(async (v) => {
						this.plugin.data.settings.textWidth = v;
						await this.plugin.savePluginData();
					}),
			);

		// TODO: dropdown instead of text input
		new Setting(containerEl)
			.setName(t("settings.fontFamily.name"))
			.setDesc(t("settings.fontFamily.desc"))
			.addText((inp) =>
				inp
					.setPlaceholder("Georgia, serif")
					.setValue(this.plugin.data.settings.fontFamily)
					.onChange(async (v) => {
						this.plugin.data.settings.fontFamily = v;
						await this.plugin.savePluginData();
					}),
			);

		// Library
		new Setting(containerEl)
			.setHeading()
			.setName(t("settings.heading.library"));

		new Setting(containerEl)
			.setName(t("settings.scanOnStartup.name"))
			.setDesc(t("settings.scanOnStartup.desc"))
			.addToggle((tog) =>
				tog
					.setValue(this.plugin.data.settings.scanOnStartup)
					.onChange(async (v) => {
						this.plugin.data.settings.scanOnStartup = v;
						await this.plugin.savePluginData();
					}),
			);

		new Setting(containerEl)
			.setName(t("settings.exportFolder.name"))
			.setDesc(t("settings.exportFolder.desc"))
			.addText((inp) =>
				inp
					.setPlaceholder("Reading/Exports")
					.setValue(this.plugin.data.settings.exportFolder)
					.onChange(async (v) => {
						this.plugin.data.settings.exportFolder = v;
						await this.plugin.savePluginData();
					}),
			);

		// Behaviour
		new Setting(containerEl)
			.setHeading()
			.setName(t("settings.heading.behaviour"));

		new Setting(containerEl)
			.setName(t("settings.openInNewLeaf.name"))
			.setDesc(t("settings.openInNewLeaf.desc"))
			.addToggle((tog) =>
				tog
					.setValue(this.plugin.data.settings.openInNewLeaf)
					.onChange(async (v) => {
						this.plugin.data.settings.openInNewLeaf = v;
						await this.plugin.savePluginData();
					}),
			);

		new Setting(containerEl)
			.setName(t("settings.footnoteBehavior.name"))
			.setDesc(t("settings.footnoteBehavior.desc"))
			.addDropdown((d) =>
				d
					.addOption("popover", t("settings.footnoteBehavior.popover"))
					.addOption("inline", t("settings.footnoteBehavior.inline"))
					.setValue(this.plugin.data.settings.footnoteBehavior)
					.onChange(async (v) => {
						this.plugin.data.settings.footnoteBehavior = v as
							| "popover"
							| "inline";
						await this.plugin.savePluginData();
					}),
			);

		// Language
		new Setting(containerEl)
			.setHeading()
			.setName(t("settings.heading.language"));

		new Setting(containerEl)
			.setName(t("settings.locale.name"))
			.setDesc(t("settings.locale.desc"))
			.addDropdown((d) =>
				d
					.addOption("auto", t("settings.locale.auto"))
					.addOption("en", t("settings.locale.en"))
					.addOption("ru", t("settings.locale.ru"))
					.setValue(this.plugin.data.settings.locale)
					.onChange(async (v) => {
						this.plugin.data.settings.locale = v as SupportedLocale;
						setLocale(v as SupportedLocale);
						await this.plugin.savePluginData();
						this.display(); // re-render with new language
					}),
			);
	}
}
