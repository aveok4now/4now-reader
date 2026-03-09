import type { TranslationKey } from './en';

const ru: Partial<Record<TranslationKey, string>> = {
  'reader.title': 'Читалка',
  'reader.opening': 'Открываю книгу…',
  'reader.error.title': 'Не удалось открыть книгу',
  'reader.error.notFound': 'Файл не найден',

  'toolbar.toc': 'Содержание',
  'toolbar.addBookmark': 'Добавить закладку',
  'toolbar.theme': 'Тема',

  'mode.scroll': 'Прокрутка',
  'mode.paginated': 'Постраничный',

  'theme.adaptive': 'Адаптивная',
  'theme.light': 'Светлая',
  'theme.dark': 'Тёмная',
  'theme.sepia': 'Сепия',

  'settings.heading.reading': 'Чтение',
  'settings.heading.appearance': 'Внешний вид',
  'settings.heading.library': 'Библиотека',
  'settings.heading.behaviour': 'Поведение',
  'settings.heading.language': 'Язык',
  'settings.readingMode.name': 'Режим чтения по умолчанию',
  'settings.readingMode.desc': 'Режим, используемый при открытии книги.',
  'settings.theme.name': 'Тема по умолчанию',
  'settings.theme.desc': 'Визуальная тема ридера.',
  'settings.fontSize.name': 'Размер шрифта',
  'settings.fontSize.desc': 'Базовый размер шрифта в пикселях.',
  'settings.lineHeight.name': 'Межстрочный интервал',
  'settings.lineHeight.desc': 'Множитель межстрочного расстояния.',
  'settings.fontFamily.name': 'Шрифт',
  'settings.fontFamily.desc': 'Оставьте пустым, чтобы использовать шрифты книги.',
  'settings.textWidth.name': 'Ширина текста',
  'settings.textWidth.desc': 'Максимальная ширина контента в пикселях.',
  'settings.exportFolder.name': 'Папка экспорта',
  'settings.exportFolder.desc': 'Путь в Vault для экспортированных аннотаций.',
  'settings.scanOnStartup.name': 'Сканировать Vault при запуске',
  'settings.scanOnStartup.desc': 'Индексировать EPUB-файлы при открытии Obsidian.',
  'settings.openInNewLeaf.name': 'Открывать в новой вкладке',
  'settings.openInNewLeaf.desc': 'Если выключено — переиспользует текущую вкладку.',
  'settings.footnoteBehavior.name': 'Поведение сносок',
  'settings.footnoteBehavior.desc': 'Как обрабатываются ссылки на сноски.',
  'settings.footnoteBehavior.popover': 'Показывать во всплывающем окне',
  'settings.footnoteBehavior.inline': 'Прокручивать к сноске',
  'settings.locale.name': 'Язык интерфейса',
  'settings.locale.desc': 'Язык интерфейса плагина.',
  'settings.locale.auto': 'Авто (как в Obsidian)',
  'settings.locale.en': 'Английский',
  'settings.locale.ru': 'Русский',

  'command.openEpub': 'Открыть EPUB-книгу',
};

export default ru;
