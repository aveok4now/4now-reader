# 4now Reader

Read EPUB books directly inside your Obsidian vault — no separate ebook app, no
context switching.

> Desktop only for the initial release. Mobile support is on the roadmap.

## Features

- Open any `.epub` file inside your vault in a dedicated reader pane.
- Paginated and continuous-scroll reading modes.
- Adjustable typography: font family, size, line height, paragraph spacing, text
  width.
- Six built-in themes that respect your Obsidian color scheme: `adaptive`,
  `light`, `dark`, `sepia`, `cream`, `night`.
- Auto-hiding toolbar, table of contents with a resizable side panel.
- Reading position is restored when you reopen a book.
- Library view of every EPUB in your vault, with recent / all / finished tabs
  and sort controls.
- Russian and English UI (Obsidian's `moment.locale` drives the choice).

## Installation

### From the Obsidian community plugin gallery

1. Settings → Community plugins → Browse.
2. Search for **4now Reader**.
3. Install, then enable.

### Manually (until accepted into the gallery)

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest
   [release](https://github.com/aveok4now/obsidian-4now-reader/releases).
2. Copy them into `<your-vault>/.obsidian/plugins/4now-reader/`.
3. In Obsidian: Settings → Community plugins → Reload → enable **4now Reader**.

## Usage

- Place `.epub` files anywhere inside your vault (a dedicated folder such as
  `Books/` works well).
- Click an EPUB in the file explorer, or open the **4now Reader: Library**
  command and pick a book.
- Use the toolbar to switch reading mode, change typography, jump in the table
  of contents, or pick a theme.

## Settings

- Default reading mode and theme.
- Default typography presets applied to new books.
- Auto-hide toolbar.
- Library scan on startup, scan root folder.
- UI language override.

Bookmarks and highlights, full mobile support, and export-to-Markdown are
planned for the next versions — see the issue tracker for the full backlog.

## Development

```bash
pnpm install
pnpm dev      # esbuild watch
pnpm build    # typecheck + production bundle
```

Symlink the project into a test vault to iterate:

```bash
ln -s "$PWD" "<your-test-vault>/.obsidian/plugins/4now-reader"
```

## Credits

- Built on [epub.js](https://github.com/futurepress/epub.js) — BSD-2-Clause.
- React 19 / React DOM — MIT.
- [lucide-react](https://lucide.dev) icons — ISC.

## License

MIT — see [LICENSE](./LICENSE).
