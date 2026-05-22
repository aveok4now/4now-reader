import type { LibrarySortOrder } from "../data/PluginData";
import type { BookMeta } from "../data/types";

export function sortBooks(
  books: BookMeta[],
  order: LibrarySortOrder,
): BookMeta[] {
  return [...books].sort((a, b) => {
    switch (order) {
      case "title-asc":
        return a.title.localeCompare(b.title);
      case "title-desc":
        return b.title.localeCompare(a.title);
      case "author-asc":
        return a.author.localeCompare(b.author);
      case "last-opened":
        return (b.lastOpened ?? 0) - (a.lastOpened ?? 0);
    }
  });
}
