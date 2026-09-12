import { PAGES, hrefFor } from '../lib/pages';
import type { PageId } from '../lib/pages';

export interface SiteNavProps {
  /** The page this strip is on, which it marks rather than links. */
  current: PageId;
}

/**
 * The strip between the pages: the two names under the card's top rule,
 * this page's marked.
 *
 * A `nav` inside the banner, ahead of the title, because it is about the
 * site and not about this page — a reader jumping by landmark finds it
 * where a masthead's section line would be, and the skip link still comes
 * first. Plain links, not a tab list: each name is another document, fetched
 * whole, and the browser's own Back is the way back. The one showing is
 * still a link to itself, marked `aria-current` rather than dropped, so the
 * strip reads as the same two words on either page.
 */
export const SiteNav: React.FC<SiteNavProps> = ({ current }) => (
  <nav className="site-nav" aria-label="Pages">
    <ul>
      {PAGES.map((page) => (
        <li key={page.id}>
          <a href={hrefFor(page.id)} aria-current={page.id === current ? 'page' : undefined}>
            {page.name}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);
