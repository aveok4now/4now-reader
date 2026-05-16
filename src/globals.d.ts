interface FontData {
  readonly family: string;
  readonly fullName: string;
  readonly postscriptName: string;
  readonly style: string;
}

interface Window {
  queryLocalFonts?(): Promise<FontData[]>;
}

declare module 'epubjs' {
  export interface Contents {
    addStylesheetRules(rules: Record<string, Record<string, string>>): void;
    addStylesheetCss(serializedCss: string, key: string): void;
  }

  /** Mirrors epubjs Section / SpineItem shape (subset we rely on) */
  export interface SpineItem {
    href: string;
    index: number;
    linear: string;
    properties: string[];
  }

  /** Mirrors epubjs PageListItem */
  export interface PageListItem {
    href: string;
    label: string;
    cfi?: string;
  }

  /** Location info from the relocated event and currentLocation() */
  export interface EpubLocation {
    start: {
      cfi: string;
      href: string;
      percentage?: number;
      title?: string;
      displayed?: { page: number; total: number };
    };
    end: {
      cfi: string;
      href: string;
      percentage?: number;
      displayed?: { page: number; total: number };
    };
    atStart?: boolean;
    atEnd?: boolean;
  }

  /** Subset of epubjs Locations API we use */
  export interface EpubLocations {
    generate(chars: number): Promise<string[]>;
  }

  /** Subset of epubjs Hook API */
  export interface EpubHook {
    register(fn: (contents: Contents) => void): void;
  }

  export interface Rendition {
    display(target?: string): Promise<void>;
    prev(): Promise<void>;
    next(): Promise<void>;
    destroy(): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    getContents(): Contents[];
    resize(width: string | number, height: string | number): void;
    currentLocation(): EpubLocation | null;
    hooks: {
      content: EpubHook;
    };
    themes: {
      default(styles: Record<string, unknown>): void;
      register(name: string, styles: Record<string, unknown>): void;
      select(name: string): void;
      fontSize(size: string): void;
      font(family: string): void;
    };
  }

  export interface BookMetadata {
    title: string;
    creator: string;
  }

  export interface NavItem {
    id: string;
    href: string;
    label: string;
    subitems?: NavItem[];
  }

  export interface Navigation {
    toc: NavItem[];
  }

  export interface Book {
    renderTo(
      element: HTMLElement,
      options?: Record<string, unknown>,
    ): Rendition;
    destroy(): void;
    /** Resolves when the book is fully open; rejects on any load failure. */
    opened: Promise<Book>;
    locations: EpubLocations;
    loaded: {
      metadata: Promise<BookMetadata>;
      navigation: Promise<Navigation>;
      spine: Promise<SpineItem[]>;
      cover: Promise<string | null>;
      pageList: Promise<PageListItem[]>;
      resources: Promise<string[]>;
      manifest: Promise<Record<string, { href: string; type: string }>>;
    };
  }

  function ePub(
    data: ArrayBuffer | string,
    options?: Record<string, unknown>,
  ): Book;

  export default ePub;
}
