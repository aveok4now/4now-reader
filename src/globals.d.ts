declare module 'epubjs' {
  interface RelocatedLocation {
    start: {
      cfi: string;
      href: string;
      percentage?: number;
    };
  }

  export interface Contents {
    addStylesheetRules(rules: Record<string, Record<string, string>>): void;
  }

  export interface Rendition {
    display(target?: string): Promise<void>;
    destroy(): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    getContents(): Contents[];
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

  export interface Book {
    renderTo(
      element: HTMLElement,
      options?: Record<string, unknown>,
    ): Rendition;
    destroy(): void;
    loaded: {
      metadata: Promise<BookMetadata>;
    };
  }

  function ePub(
    data: ArrayBuffer | string,
    options?: Record<string, unknown>,
  ): Book;

  export default ePub;
}
