import { render, screen, within } from '@testing-library/react';
import { GUARDED_PAGES } from './pages';
import { PAGES, hrefFor, pageFor } from '../shared/lib/pages';
import { acaLink } from '../torpedo/lib/acaLink';
import { decodeScenario as decodeReturn } from '../torpedo/lib/scenarioUrl';
import { torpedoLink } from '../aca/lib/torpedoLink';
import { decodeScenario as decodeHousehold } from '../aca/lib/scenarioUrl';

/**
 * Two pages, one site, and the ways between them.
 *
 * The build is served at the root of its domain today and was served under
 * `/magnificent/` on GitHub Pages until September 2026, so every address one
 * page writes for the other has to be built on the base the build was made
 * for and never on a bare `/` — a link that works at the root and 404s under
 * a path is the failure this exists to catch, and nothing in a jsdom render
 * would notice it. The strip and the two
 * notes that link across are rendered and read back; the two notes' query
 * strings are decoded by the *other* page's decoder, which is the only
 * honest test of a contract written in one page's source about another's
 * keys.
 */
const query = (href: string): string => new URL(href, 'https://example.test').search;

describe('the pages', () => {
  it('are addressed under the site’s base, whatever this build’s base is', () => {
    expect(import.meta.env.BASE_URL).toMatch(/\/$/);
    expect(hrefFor('torpedo')).toBe(import.meta.env.BASE_URL);
    expect(hrefFor('aca')).toBe(`${import.meta.env.BASE_URL}aca/`);
  });

  it('are the pages the guards know, at the paths they are built for', () => {
    expect(PAGES.map((page) => page.id)).toEqual(GUARDED_PAGES.map((page) => page.id));
    for (const page of GUARDED_PAGES) expect(pageFor(page.id).path).toBe(page.prefix);
  });
});

describe.each(GUARDED_PAGES)('$name', (page) => {
  it('carries the strip in its banner, with itself marked and the other a link', () => {
    render(<page.App />);
    const nav = screen.getByRole('navigation', { name: 'Pages' });
    expect(screen.getByRole('banner')).toContainElement(nav);

    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      PAGES.map((other) => hrefFor(other.id)),
    );
    const current = links.filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(pageFor(page.id).name);
  });

  it('asks the origin for nothing outside the base', () => {
    const { container } = render(<page.App />);
    const rooted = Array.from(container.querySelectorAll('a[href^="/"]')).map(
      (link) => link.getAttribute('href') ?? '',
    );
    // Guards the extractor itself: the strip alone is two of these.
    expect(rooted.length).toBeGreaterThan(1);
    expect(rooted.filter((href) => !href.startsWith(import.meta.env.BASE_URL))).toEqual([]);
  });
});

describe('the links between the pages', () => {
  it('send the return’s household to the Subsidy Slope, and it arrives whole', () => {
    const single = acaLink({ magi: 61_234.6, filingStatus: 'single' });
    expect(single.startsWith(hrefFor('aca'))).toBe(true);
    const arrived = decodeHousehold(query(single));
    expect(arrived.notes).toEqual([]);
    expect(arrived.scenario.income).toBe(61_235);
    expect(arrived.scenario.adults).toBe(1);

    const joint = decodeHousehold(query(acaLink({ magi: 80_000, filingStatus: 'mfj' })));
    expect(joint.notes).toEqual([]);
    expect(joint.scenario.adults).toBe(2);
  });

  it('send the household’s return to the Tax Torpedo, and it arrives whole', () => {
    const joint = torpedoLink('mfj');
    expect(joint.startsWith(hrefFor('torpedo'))).toBe(true);
    const arrived = decodeReturn(query(joint));
    expect(arrived.notes).toEqual([]);
    expect(arrived.scenario.filingStatus).toBe('mfj');

    for (const status of ['single', 'hoh'] as const) {
      const single = decodeReturn(query(torpedoLink(status)));
      expect(single.notes).toEqual([]);
      expect(single.scenario.filingStatus).toBe('single');
    }
  });
});
