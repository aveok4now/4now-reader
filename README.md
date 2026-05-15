# 4now Reader

An [Obsidian](https://obsidian.md) plugin that opens EPUB books from your
vault in a dedicated reader pane. A personal side project — I built it to
read inside Obsidian, got through a couple of books with it, and that's
where my motivation to keep developing it ended. It works for what it is;
the repository is here mostly as a record of the work.

The plugin is not published to the Obsidian community catalog and isn't
planned to be. Desktop Obsidian only.

Stack: TypeScript, React 19, [epub.js](https://github.com/futurepress/epub.js),
bundled with esbuild.

## What works

- EPUB rendering with continuous-scroll and paginated reading modes.
- Reading position is persisted per book (EPUB CFI).
- Typography panel: font family, size, line height, paragraph spacing,
  text width — defaults in settings, per-book overrides in the reader.
- Six themes (`adaptive`, `light`, `dark`, `sepia`, `cream`, `night`);
  `adaptive` follows the active Obsidian theme.
- Library view with recent / all / favorites tabs, search, and sort.
- Bilingual UI (English, Russian; follows Obsidian locale by default).

## What was planned but isn't here

The original scope was broader. The following were designed but never
finished — there's no UI or persistence wired up for them, only scaffolding
in places:

- Bookmarks and highlights.
- Export of annotations to Markdown.
- Additional formats (PDF, FB2, MOBI, AZW3) through a pluggable renderer.
- Mobile support.
- Cover thumbnails.

## Build and try it locally

Requires Node 18+. The committed lockfile is `pnpm-lock.yaml`, so `pnpm`
gives the most reproducible install, but `npm` or `yarn` work equally well.

```bash
pnpm install   # or: npm install / yarn
pnpm build     # or: npm run build / yarn build
```

The build produces `main.js` next to the existing `manifest.json` and
`styles.css` at the repo root. Copy those three files into
`<your-vault>/.obsidian/plugins/4now-reader/`, then in Obsidian enable the
plugin under **Settings → Community plugins → Installed plugins**.

For iterating against a real vault, point the build at the plugin folder
directly:

```bash
OBSIDIAN_PLUGIN_DIR="<your-vault>/.obsidian/plugins/4now-reader" pnpm dev
```

The dev script watches the sources and copies `main.js`, `manifest.json`,
and `styles.css` into that folder on every rebuild. Pair it with
[hot-reload](https://github.com/pjeby/hot-reload) in the same vault for
automatic plugin reload.

## License

MIT — see [LICENSE](./LICENSE).

---

# 4now Reader (по-русски)

Плагин для [Obsidian](https://obsidian.md), открывающий EPUB-книги прямо
из хранилища в отдельной панели. Личный pet-проект — собрал, чтобы читать
внутри Obsidian, прочитал пару книг и на этом мотивация развивать дальше
иссякла. Для своих задач работает; репозиторий лежит скорее как след о
проделанной работе.

В каталог сообщества Obsidian не публикуется и публиковаться не планируется.
Работает только в десктопной версии Obsidian.

Стек: TypeScript, React 19,
[epub.js](https://github.com/futurepress/epub.js), сборка через esbuild.

## Что работает

- Рендеринг EPUB в двух режимах: прокрутка и постраничный.
- Позиция чтения сохраняется по каждой книге (EPUB CFI).
- Панель типографики: шрифт, размер, межстрочный интервал, отступ между
  абзацами, ширина текста — значения по умолчанию в настройках,
  переопределение для конкретной книги — внутри читалки.
- Шесть тем (`adaptive`, `light`, `dark`, `sepia`, `cream`, `night`);
  `adaptive` подстраивается под активную тему Obsidian.
- Библиотека с вкладками «Недавние», «Все», «Избранное», поиск и сортировка.
- Двуязычный UI (английский, русский; по умолчанию следует за локалью
  Obsidian).

## Что планировалось, но не доделано

Изначальная задумка была шире. Перечисленное ниже было спроектировано, но не
доведено до рабочего состояния — где-то остался каркас, но ни UI, ни
сохранения нет:

- Закладки и подсветки.
- Экспорт аннотаций в Markdown.
- Другие форматы (PDF, FB2, MOBI, AZW3) через подключаемый рендерер.
- Поддержка мобильных.
- Превью обложек.

## Сборка и локальная проверка

Нужен Node 18+. В репозиторий закоммичен `pnpm-lock.yaml`, поэтому `pnpm`
даёт наиболее воспроизводимую установку, но `npm` и `yarn` тоже работают.

```bash
pnpm install   # или: npm install / yarn
pnpm build     # или: npm run build / yarn build
```

Сборка кладёт `main.js` рядом с уже существующими `manifest.json` и
`styles.css` в корне репозитория. Скопируйте эти три файла в
`<хранилище>/.obsidian/plugins/4now-reader/` и включите плагин в Obsidian
через **Настройки → Сторонние плагины → Установленные плагины**.

Для итеративной работы против реального хранилища укажите путь до папки
плагина:

```bash
OBSIDIAN_PLUGIN_DIR="<хранилище>/.obsidian/plugins/4now-reader" pnpm dev
```

Dev-скрипт следит за исходниками и копирует `main.js`, `manifest.json`,
`styles.css` в указанную папку при каждой пересборке. С
[hot-reload](https://github.com/pjeby/hot-reload) в том же хранилище плагин
будет перезагружаться автоматически.

## Лицензия

MIT — см. [LICENSE](./LICENSE).
