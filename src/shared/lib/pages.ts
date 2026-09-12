/**
 * The site's two pages, and the address of each.
 *
 * One site, two calculators of the same question — what the next dollar of
 * income costs — asked of two households: a retiree's return, and a
 * Marketplace household's. Each is its own HTML entry with its own card,
 * its own rail and its own engine, and the two share a shell. This is the
 * one place that says what the pages are called and where they live, for
 * the strip in the masthead that moves between them and for the note on
 * each that points at the other.
 *
 * An address is the site's base and then the page's path, never a bare `/`:
 * the same build is served at the root of a Netlify domain and under
 * /magnificent/ on GitHub Pages (and /magnificent/preview/ for the preview
 * branch), and `import.meta.env.BASE_URL` is whichever of those the build
 * was made for. `the pages` in src/guards/pages.test.tsx holds every link
 * to that.
 */
export type PageId = 'torpedo' | 'aca';

export interface Page {
  id: PageId;
  /** The page's path under the site's base: nothing for the front page. */
  path: '' | 'aca/';
  /** What the strip calls the page: the name its link-preview card carries. */
  name: string;
}

/** The two pages, in the order the strip offers them. */
export const PAGES: readonly Page[] = [
  { id: 'torpedo', path: '', name: 'Tax Torpedo' },
  { id: 'aca', path: 'aca/', name: 'Subsidy Slope' },
];

export const pageFor = (id: PageId): Page => PAGES.find((page) => page.id === id) ?? PAGES[0];

/** Where a page is, under whatever base this build was made for. */
export const hrefFor = (id: PageId): string => `${import.meta.env.BASE_URL}${pageFor(id).path}`;

/** A page, opened on a query string: the other page's keys, written by the caller. */
export const linkTo = (id: PageId, query = ''): string =>
  `${hrefFor(id)}${query ? `?${query}` : ''}`;
