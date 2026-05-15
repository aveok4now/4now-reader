import type { Rendition } from "epubjs";
import type { ForNowReaderSettings } from "../settings";

import { READER, resolveThemeColors } from "../constants";

export const TYPOGRAPHY_STYLESHEET_KEY = "fnr-typography";

// !important to override epubjs's inline styles from size()/columns().
export function buildTypographyCss(s: ForNowReaderSettings): string {
  const sidePad = Math.max(
    0,
    Math.round((1 - s.textWidth / READER.MAX_TEXT_WIDTH_PX) * 50),
  );
  const { bg, fg: color } = resolveThemeColors(s.readerTheme);

  const lines = [
    `html { line-height: ${s.lineHeight} !important; }`,
    `body {`,
    `  padding-left: ${sidePad}% !important;`,
    `  padding-right: ${sidePad}% !important;`,
    `  box-sizing: border-box !important;`,
    `  font-size: ${s.fontSize}px !important;`,
    s.fontFamily ? `  font-family: ${s.fontFamily} !important;` : "",
    bg ? `  background: ${bg} !important;` : "",
    color ? `  color: ${color} !important;` : "",
    `}`,
    `p { margin-bottom: ${s.paragraphSpacing}px !important; }`,
    `img, video, svg, figure { max-width: 100% !important; height: auto !important; }`,
    `table { max-width: 100% !important; table-layout: fixed !important; word-break: break-word !important; }`,
    `pre, code { white-space: pre-wrap !important; word-break: break-all !important; max-width: 100% !important; }`,
  ];
  return lines.filter(Boolean).join("\n");
}

export function applyTypography(r: Rendition, s: ForNowReaderSettings): void {
  const css = buildTypographyCss(s);
  r.getContents().forEach((c) =>
    c.addStylesheetCss(css, TYPOGRAPHY_STYLESHEET_KEY),
  );
}
