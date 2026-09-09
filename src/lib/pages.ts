/**
 * The two pages of the site, and the way from one to the other with the
 * household in hand.
 *
 * Both pages price the same seven values and both read them from the query
 * string, so the link between them carries the string across: a reader who
 * has set up their household on one page lands on the other already priced
 * for it. The paths are relative to the site's base, which vite supplies —
 * `/super-duper-broccoli/` in production, `/super-duper-broccoli/preview/`
 * for the preview build — so a link never has to know which build it is in.
 */
import { encodeScenario } from './scenarioUrl';
import type { PageScenario } from './scenarioUrl';

/** Each page's path under the base. The cost page is the site's root. */
export const PAGES = {
  cost: '',
  rate: 'effective-rate/',
} as const;

export type PageId = keyof typeof PAGES;

/** The address of a page, priced for a household. */
export function pageHref(page: PageId, scenario: PageScenario): string {
  const query = encodeScenario(scenario);
  return `${import.meta.env.BASE_URL}${PAGES[page]}${query ? `?${query}` : ''}`;
}
