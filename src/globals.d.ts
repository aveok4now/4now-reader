declare module 'epubjs' {
  interface RelocatedLocation {
    start: {
      cfi: string;
      href: string;
      percentage?: number;
    };
  }

  interface Rendition {
    display(target?: string): Promise<void>;
    destroy(): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    themes: {
      register(name: string, styles: Record<string, unknown>): void;
      select(name: string): void;
      fontSize(size: string): void;
      font(family: string): void;
    };
  }

  interface Book {
    renderTo(
      element: HTMLElement,
      options?: Record<string, unknown>,
    ): Rendition;
    destroy(): void;
  }

  function ePub(
    data: ArrayBuffer | string,
    options?: Record<string, unknown>,
  ): Book;

  export default ePub;
}
