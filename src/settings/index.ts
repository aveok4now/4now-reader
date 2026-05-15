import type { SupportedLocale } from "../i18n";
import type ForNowReaderPlugin from "../main";
import type { ReaderTheme, ReadingMode } from "../models/types";

import { App, Modal, Notice, PluginSettingTab, Setting } from "obsidian";
import { SLIDER_LIMITS, THEME_OPTIONS } from "../constants";
import { setLocale, t } from "../i18n";

export interface ForNowReaderSettings {
  readingMode: ReadingMode;
  readerTheme: ReaderTheme;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  textWidth: number;
  exportFolder: string;
  scanOnStartup: boolean;
  footnoteBehavior: "popover" | "inline";
  openInNewLeaf: boolean;
  toolbarAutoHide: boolean;
  locale: SupportedLocale;
}

export const DEFAULT_SETTINGS: ForNowReaderSettings = {
  readingMode: "scroll",
  readerTheme: "adaptive",
  fontFamily: "Georgia, serif",
  fontSize: 16,
  lineHeight: 1.6,
  paragraphSpacing: 10,
  textWidth: 504,
  exportFolder: "Reading/Exports",
  scanOnStartup: true,
  footnoteBehavior: "popover",
  openInNewLeaf: false,
  toolbarAutoHide: false,
  locale: "auto",
};

export class ForNowReaderSettingsTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: ForNowReaderPlugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const save = async () => {
      await this.plugin.savePluginData();
      this.plugin.propagateSettingsToViews();
    };

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
            await save();
          }),
      );

    new Setting(containerEl)
      .setName(t("toolbar.autoHide"))
      .setDesc(t("settings.toolbarAutoHide.desc"))
      .addToggle((tog) =>
        tog
          .setValue(this.plugin.data.settings.toolbarAutoHide)
          .onChange(async (v) => {
            this.plugin.data.settings.toolbarAutoHide = v;
            await save();
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
        for (const { value, labelKey } of THEME_OPTIONS) {
          d.addOption(value, t(labelKey));
        }
        return d
          .setValue(this.plugin.data.settings.readerTheme)
          .onChange(async (v) => {
            this.plugin.data.settings.readerTheme = v as ReaderTheme;
            await save();
          });
      });

    new Setting(containerEl)
      .setName(t("settings.fontSize.name"))
      .setDesc(t("settings.fontSize.desc"))
      .addSlider((s) =>
        s
          .setLimits(
            SLIDER_LIMITS.fontSize.min,
            SLIDER_LIMITS.fontSize.max,
            SLIDER_LIMITS.fontSize.step,
          )
          .setValue(this.plugin.data.settings.fontSize)
          .setDynamicTooltip()
          .onChange(async (v) => {
            this.plugin.data.settings.fontSize = v;
            await save();
          }),
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("rotate-ccw")
          .setTooltip(t("settings.reset.tooltip"))
          .onClick(async () => {
            this.plugin.data.settings.fontSize = DEFAULT_SETTINGS.fontSize;
            await save();
            this.display();
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.lineHeight.name"))
      .setDesc(t("settings.lineHeight.desc"))
      .addSlider((s) =>
        s
          .setLimits(
            SLIDER_LIMITS.lineHeight.min,
            SLIDER_LIMITS.lineHeight.max,
            SLIDER_LIMITS.lineHeight.step,
          )
          .setValue(this.plugin.data.settings.lineHeight)
          .setDynamicTooltip()
          .onChange(async (v) => {
            this.plugin.data.settings.lineHeight = v;
            await save();
          }),
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("rotate-ccw")
          .setTooltip(t("settings.reset.tooltip"))
          .onClick(async () => {
            this.plugin.data.settings.lineHeight = DEFAULT_SETTINGS.lineHeight;
            await save();
            this.display();
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.paragraphSpacing.name"))
      .setDesc(t("settings.paragraphSpacing.desc"))
      .addSlider((s) =>
        s
          .setLimits(
            SLIDER_LIMITS.paragraphSpacing.min,
            SLIDER_LIMITS.paragraphSpacing.max,
            SLIDER_LIMITS.paragraphSpacing.step,
          )
          .setValue(this.plugin.data.settings.paragraphSpacing)
          .setDynamicTooltip()
          .onChange(async (v) => {
            this.plugin.data.settings.paragraphSpacing = v;
            await save();
          }),
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("rotate-ccw")
          .setTooltip(t("settings.reset.tooltip"))
          .onClick(async () => {
            this.plugin.data.settings.paragraphSpacing =
              DEFAULT_SETTINGS.paragraphSpacing;
            await save();
            this.display();
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.textWidth.name"))
      .setDesc(t("settings.textWidth.desc"))
      .addSlider((s) =>
        s
          .setLimits(
            SLIDER_LIMITS.textWidth.min,
            SLIDER_LIMITS.textWidth.max,
            SLIDER_LIMITS.textWidth.step,
          )
          .setValue(this.plugin.data.settings.textWidth)
          .setDynamicTooltip()
          .onChange(async (v) => {
            this.plugin.data.settings.textWidth = v;
            await save();
          }),
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("rotate-ccw")
          .setTooltip(t("settings.reset.tooltip"))
          .onClick(async () => {
            this.plugin.data.settings.textWidth = DEFAULT_SETTINGS.textWidth;
            await save();
            this.display();
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.fontFamily.name"))
      .setDesc(t("settings.fontFamily.desc"))
      .addText((inp) =>
        inp
          .setPlaceholder(t("settings.fontFamily.placeholder"))
          .setValue(this.plugin.data.settings.fontFamily)
          .onChange(async (v) => {
            this.plugin.data.settings.fontFamily = v;
            await save();
          }),
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("rotate-ccw")
          .setTooltip(t("settings.reset.tooltip"))
          .onClick(async () => {
            this.plugin.data.settings.fontFamily = DEFAULT_SETTINGS.fontFamily;
            await save();
            this.display();
          }),
      );

    const resetKeys: (keyof ForNowReaderSettings)[] = [
      "readingMode",
      "readerTheme",
      "fontFamily",
      "fontSize",
      "lineHeight",
      "paragraphSpacing",
      "textWidth",
      "toolbarAutoHide",
    ];
    const isAlreadyDefault = (): boolean =>
      resetKeys.every(
        (k) => this.plugin.data.settings[k] === DEFAULT_SETTINGS[k],
      );

    new Setting(containerEl)
      .setName(t("settings.reset.allButton"))
      .addButton((btn) =>
        btn
          .setIcon("rotate-ccw")
          .setWarning()
          .setTooltip(
            t(
              isAlreadyDefault()
                ? "settings.reset.tooltipAlreadyDefault"
                : "settings.reset.tooltip",
            ),
          )
          .onClick(() => {
            if (isAlreadyDefault()) {
              new Notice(t("settings.reset.alreadyDefault"));
              return;
            }
            new ResetConfirmModal(this.app, async () => {
              const target = this.plugin.data.settings as unknown as Record<
                string,
                unknown
              >;
              for (const k of resetKeys) {
                target[k] = DEFAULT_SETTINGS[k];
              }
              await save();
              new Notice(t("settings.reset.success"));
              this.display();
            }).open();
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
            await save();
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
            await save();
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
            await save();
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
            await save();
            this.display(); // re-render with new language
          }),
      );
  }
}

class ResetConfirmModal extends Modal {
  constructor(
    app: App,
    private readonly onConfirm: () => void,
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.createEl("p", { text: t("settings.reset.confirmMessage") });
    new Setting(this.contentEl)
      .addButton((btn) =>
        btn
          .setButtonText(t("settings.reset.confirmYes"))
          .setCta()
          .onClick(() => {
            this.close();
            this.onConfirm();
          }),
      )
      .addButton((btn) =>
        btn
          .setButtonText(t("settings.reset.confirmNo"))
          .onClick(() => this.close()),
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
