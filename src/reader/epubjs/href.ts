// epubjs hrefs vary: 'OEBPS/chap-1.xhtml', './chap-1.xhtml#anchor', 'chap-1.xhtml'.
// Strip path/fragment, lowercase the leaf so TOC-vs-current matches.
export function normalizeHref(href: string): string {
  return href.split("#")[0].split("/").pop()?.toLowerCase() ?? href;
}
