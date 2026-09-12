/**
 * One entry in a page's reading list: a title and its publisher, nothing
 * more. A publisher refreshes an article, and a date or a summary here would
 * go stale while the link did not. Each page keeps its own list in its own
 * `lib/furtherReading.ts`; the footer that renders one is shared.
 */
export interface Reading {
  href: string;
  title: string;
  /** Who published it, as a reader would name them. */
  source: string;
}
