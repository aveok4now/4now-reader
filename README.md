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
