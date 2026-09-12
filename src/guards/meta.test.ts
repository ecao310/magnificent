import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { GUARDED_PAGES, SITE_CARD, SITE_SHEET } from './pages';
import type { GuardedPage } from './pages';
import { marginalRateCurve, incomeAxisMax } from '../torpedo/lib/tax';
import { defaultScenario } from '../torpedo/lib/scenarioUrl';

/**
 * What the link says about itself before anyone opens it.
 *
 * Everything here lives in files no test otherwise reads — `index.html`,
 * `public/`, and a generator script that CI never runs — which is exactly why
 * it needs holding down. A `<meta>` tag cannot fail: a typo'd property name, a
 * relative `og:image` a crawler will not resolve, an image whose declared size
 * stopped matching the file, a favicon href pointing at an asset that was
 * deleted — every one of them renders a perfectly valid page and shows up
 * only in someone else's chat window, days later, as a bare URL.
 *
 * Read off disk for the same reason `the stylesheet` reads `index.css` off
 * disk: these are not modules, so there is nothing to import. The run's cwd
 * is the project root, which is where `vite.config.ts` roots the test glob.
 */
const root = (path: string) => resolve(process.cwd(), path);

/**
 * A page's document: every `<meta>` in it, by whichever of `property`/`name`
 * it uses, and every `href` it asks the origin for. Two pages, two documents,
 * two cards, so every claim about a card below is made of one page's own
 * HTML, and the pages are the rows of `GUARDED_PAGES`.
 */
const documentOf = (page: GuardedPage) => {
  const html = readFileSync(root(page.html), 'utf8');
  const metaTags: Record<string, string> = Object.fromEntries(
    (html.match(/<meta\s[^>]*>/g) ?? []).flatMap((tag) => {
      const key = /(?:property|name)="([^"]+)"/.exec(tag)?.[1];
      const content = /content="([^"]*)"/s.exec(tag)?.[1];
      return key && content !== undefined ? [[key, content]] : [];
    }),
  );
  const hrefs = (html.match(/href="([^"]+)"/g) ?? []).map((h) => h.slice(6, -1));
  return { metaTags, hrefs };
};

const torpedo = documentOf(GUARDED_PAGES[0]);

/**
 * The origin the card's absolute URLs are built on, as `.env` declares it:
 * the site's own. Vite reads the same file, so this is what
 * `%VITE_SITE_ORIGIN%` becomes in any build that does not set the variable
 * itself — production's, and a local one. netlify.toml sets it to the
 * deploy's own address for a branch deploy and a deploy preview.
 */
const siteOrigin = /^VITE_SITE_ORIGIN=(\S+)/m.exec(readFileSync(root('.env'), 'utf8'))?.[1];

/** How the card addresses itself: the origin placeholder, then the base one. */
const ORIGIN_AND_BASE = /^%VITE_SITE_ORIGIN%%BASE_URL%/;

/**
 * A PNG's own idea of its size, straight out of the IHDR chunk: 8 bytes of
 * signature, then a 4-byte length and the `IHDR` tag, then width and height as
 * big-endian 32-bit integers. Cheaper than a dependency, and it is the only
 * figure that can disagree with `og:image:width` without anything else noticing.
 */
const pngSize = (path: string) => {
  const png = readFileSync(root(path));
  expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
  expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR');
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

describe.each(GUARDED_PAGES)('$name’s link preview', (page) => {
  const { metaTags, hrefs } = documentOf(page);

  /** How this page's card addresses itself: the origin, the base, then its own path. */
  const here = `%VITE_SITE_ORIGIN%%BASE_URL%${page.prefix}`;

  it('names itself, describes itself and carries a card', () => {
    expect(metaTags['og:type']).toBe('website');
    expect(metaTags['og:site_name']).toBeTruthy();
    expect(metaTags['og:title']).toBeTruthy();
    expect(metaTags['og:description']).toBeTruthy();
    expect(metaTags['og:url']).toBeTruthy();
    expect(metaTags['og:image']).toBeTruthy();
    expect(metaTags['og:image:alt']).toBeTruthy();
    expect(metaTags['twitter:card']).toBe('summary_large_image');
  });

  it('says the same thing on both surfaces', () => {
    expect(metaTags['twitter:title']).toBe(metaTags['og:title']);
    expect(metaTags['twitter:description']).toBe(metaTags['og:description']);
    expect(metaTags['twitter:image']).toBe(metaTags['og:image']);
  });

  /* Slack and iMessage cut a preview's second line off somewhere around 200
     characters, and a description that ends mid-clause reads worse than a
     shorter one that finishes its sentence. */
  it('keeps the description short enough to be shown whole', () => {
    expect(metaTags['og:description'].length).toBeLessThanOrEqual(200);
  });

  /* A crawler fetches the card out of band, with no page to resolve a
     relative path against. So the URLs are absolute, and both halves are
     placeholders vite fills at build time. `%BASE_URL%` is the base the build
     was made for — `/` for every deploy today, and `/magnificent/` for the
     years the site was on GitHub Pages. `%VITE_SITE_ORIGIN%` is the site's own
     origin from `.env` unless the build sets it, which netlify.toml does for a
     branch deploy and a deploy preview, to the deploy's own address, so a
     preview's card is its own rather than production's. */
  it('gives the crawler absolute URLs, built through the origin and the base', () => {
    for (const key of ['og:url', 'og:image', 'twitter:image']) {
      expect(metaTags[key]).toMatch(ORIGIN_AND_BASE);
    }
    expect(siteOrigin).toMatch(/^https:\/\/[^/]+$/);
  });

  /* `%BASE_URL%` is the site's base, not the page's directory, so a page
     under the base spells its own path after it — and the card it names is
     its own, not the front page's. */
  it('addresses the card to its own page', () => {
    expect(metaTags['og:url']).toBe(here);
    expect(metaTags['og:image'].startsWith(here)).toBe(true);
    expect(metaTags['twitter:image'].startsWith(here)).toBe(true);
  });

  it('asks the origin for nothing outside the base', () => {
    for (const href of hrefs) {
      expect(href.startsWith('/') && !href.startsWith('//')).toBe(false);
    }
  });
});

describe.each(GUARDED_PAGES)('$name’s cover', (page) => {
  const { metaTags, hrefs } = documentOf(page);
  const shipped = ['og-cover.png', 'apple-touch-icon.png', 'favicon.svg'].map(
    (file) => `${page.publicDir}/${file}`,
  );

  it('ships every file the document links to', () => {
    const linked = [
      ...hrefs.filter((h) => h.startsWith('%BASE_URL%')).map((h) => h.replace('%BASE_URL%', '')),
      metaTags['og:image'].replace(ORIGIN_AND_BASE, ''),
    ];
    for (const file of linked) {
      expect(existsSync(root(`public/${file}`))).toBe(true);
    }
    for (const file of shipped) {
      expect(existsSync(root(file))).toBe(true);
    }
  });

  /* An og:image whose declared size is wrong is worse than one with no size
     declared: Slack lays the card out from the numbers before the bytes
     arrive, and then reflows. So the numbers are read back off the file. */
  it('declares the size the file actually is', () => {
    const { width, height } = pngSize(`${page.publicDir}/og-cover.png`);
    expect(width).toBe(1200);
    expect(height).toBe(630);
    expect(metaTags['og:image:width']).toBe(String(width));
    expect(metaTags['og:image:height']).toBe(String(height));
  });

  it('rasterises the touch icon at the size iOS asks for', () => {
    expect(pngSize(`${page.publicDir}/apple-touch-icon.png`)).toEqual({ width: 180, height: 180 });
  });

  /**
   * The mark, the card and the browser chrome are all painted in the site's
   * own two colours, and none of the three files can read `:root` — an SVG
   * attribute takes a literal, and a `<meta>` tag takes a string. Same
   * argument `palette.ts` makes about the charts, and the same remedy: the
   * copies are held together by a test that reads the original. The card's
   * copy lives in the module both cover scripts draw on, so the page's
   * script is held to drawing on it rather than to carrying the colours.
   */
  it('is painted in the palette the site is', () => {
    const css = readFileSync(root(SITE_SHEET), 'utf8');
    const token = (name: string) =>
      new RegExp(`--${name}:\\s*(#[0-9a-f]{3,8})`, 'i').exec(css)?.[1] ?? `--${name} is missing`;
    const surface = token('surface');
    const accent = token('accent');

    for (const file of [`${page.publicDir}/favicon.svg`, SITE_CARD]) {
      const source = readFileSync(root(file), 'utf8');
      expect(source).toContain(surface);
      expect(source).toContain(accent);
    }
    expect(readFileSync(root(page.cover), 'utf8')).toMatch(/from '\.\/card\.mjs'/);
    expect(metaTags['theme-color']).toBe(surface);
  });

});

/**
 * The torpedo's card quotes a rate. It is drawn from `marginalRateCurve`
 * rather than by hand for exactly this reason — but the *description* beside
 * it is prose, and prose does not get redrawn when a bracket moves. So the
 * figure the copy names has to still be the figure the arithmetic reaches on
 * the scenario the page opens on. If this fails, the numbers moved: re-run
 * `node scripts/og-cover.mjs` and re-read the sentence.
 */
describe('the torpedo’s card', () => {
  const { metaTags } = torpedo;

  it('quotes a rate the opening scenario still reaches', () => {
    const opening = defaultScenario();
    const scenario = {
      filingStatus: opening.filingStatus,
      ssBenefit: opening.ssBenefit,
      // What the engine reads is a count, not the two boxes: the page
      // opens with the filer at 65, and a card drawn for a filer under it
      // would be a card for a return the page never opens on.
      seniors: opening.isSenior ? (opening.spouseIsSenior ? 2 : 1) : 0,
      muniInterest: opening.muniInterest,
    };
    const curve = marginalRateCurve(scenario, { maxIncome: incomeAxisMax(scenario), step: 250 });

    const fallBack = curve.findIndex((p, i) => i > 0 && p.marginalRate < curve[i - 1].marginalRate);
    expect(fallBack).toBeGreaterThan(0);
    const hump = curve[fallBack - 1].marginalRate;
    const valley = curve[fallBack].marginalRate;

    expect(metaTags['og:description']).toContain(`${hump}%`);
    expect(metaTags['og:description']).toContain(`${valley}%`);
    expect(metaTags['og:image:alt']).toContain(`${hump}%`);
  });
});

/**
 * What a search engine reads, which is not what a chat window reads.
 *
 * `the link preview` above holds `og:` and `twitter:` against each other, so
 * the two of them cannot drift apart — but `name="description"` is a third
 * surface, checked against neither, and it spent two backlogs advertising
 * capital-gains stacking after the step came off the page. Every part of that
 * failure is silent: the tag is well-formed, the page renders, and the only
 * reader who sees the promise broken arrives from a result page.
 *
 * So the copy is held against the page rather than against the other tags.
 * The snippet ends on the list of sections it promises; this reads that list
 * back out of the prose and looks for each entry in a heading the rendered app
 * actually has. Naming a section that came off the page therefore fails here,
 * and so does taking a section off the page without rewriting the tag.
 */
describe.each(GUARDED_PAGES)('$name’s search snippet', (page) => {
  const description = documentOf(page).metaTags['description'];

  /**
   * The sections the snippet promises: everything after the last colon, split
   * on the list's own punctuation. Parsed rather than duplicated so that the
   * copy stays a sentence someone would write, and so that rewriting it is
   * enough — there is no second list to keep in step.
   */
  const advertised = (sentence: string) =>
    sentence
      .slice(sentence.lastIndexOf(':') + 1)
      .replace(/\.\s*$/, '')
      .split(/,\s*|\s+and\s+/)
      .map((topic) => topic.trim().toLowerCase())
      .filter(Boolean);

  /* Google shows about 160 characters of a description and cuts the rest, and
     a promise cut in half is worse than a shorter one that lands. The share
     card gets its own, looser limit above: chat previews are wider. */
  it('is short enough to be shown whole on a result page', () => {
    expect(description).toBeTruthy();
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('promises only sections the page still has', () => {
    render(createElement(page.App));
    const headings = screen.getAllByRole('heading').map((h) => h.textContent?.toLowerCase() ?? '');

    const topics = advertised(description);
    expect(topics.length).toBeGreaterThan(1);
    for (const topic of topics) {
      // Falls back to a sentence rather than `undefined` so a failure reads as
      // the topic against the page rather than as a lookup that missed. The
      // sentence must not itself contain the topic, or `toContain` passes on
      // the fallback and the assertion checks nothing.
      expect(headings.find((h) => h.includes(topic)) ?? 'no heading on the page says').toContain(
        topic,
      );
    }
  });
});

/**
 * The repo's own front door, which is a different surface from the page's.
 *
 * `README.md:12` named the bare Pages URL as **Live:** for the whole rewrite.
 * That URL served `main`, which was seventy-odd commits behind `dev` and still
 * opened as *Marginal Tax Rate* out of a package called `growth-projector`, so
 * every reader who followed the front-door link landed on the app this one was
 * rewritten out of. Nothing caught it because nothing here read `README.md`
 * and no build breaks: both URLs were live, both returned 200, and the wrong
 * one was a perfectly good page.
 *
 * The fix is a link, and a link rots the moment the branch under it moves. So
 * this reads the README's own account of what deploys where — every "push to
 * `branch`" sentence in its Deployment section, paired with the URL that
 * sentence gives — and holds it to where Netlify serves a branch: production
 * at the site's origin, the one `.env` addresses the card to, and any other
 * branch at `<branch>--<host>`. **Live:** must then be the production URL.
 * Which branch is production, and which others deploy, is set in Netlify's
 * dashboard, where nothing here can read it; the README is the copy that can
 * be held, and `PRODUCTION_BRANCH` is the one fact this file has to carry.
 *
 * The site was GitHub Pages until September 2026, and the addresses it had
 * there are still in links people kept. So the second half holds the
 * forwarders: `pages/`, one file per address the README says the site used
 * to have, each sending the reader on to a page a branch publishes with the
 * query string intact, and the one workflow, which publishes that tree from
 * the production branch and builds nothing.
 */
describe('the front door', () => {
  const readme = readFileSync(root('README.md'), 'utf8');

  /** The branch Netlify's dashboard calls production; the forwarders publish from it too. */
  const PRODUCTION_BRANCH = 'main';

  /** Where the site was, for as long as it was on GitHub Pages. */
  const PAGES_SITE = 'https://ecao310.github.io/magnificent/';

  const origin = siteOrigin ?? '';
  const host = origin.replace(/^https:\/\//, '');
  const literal = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  /** A URL on the site, or on a branch deploy of it. */
  const SITE_URL = `https://(?:[\\w-]+--)?${literal(host)}/[\\w./-]*`;
  const slashed = (url: string) => (url.endsWith('/') ? url : `${url}/`);

  /** Where Netlify serves a branch: production at the origin, any other at `<branch>--<host>`. */
  const baseOf = (branch: string) =>
    branch === PRODUCTION_BRANCH ? `${origin}/` : `https://${branch}--${host}/`;

  /** The URL under **Live:**. */
  const liveUrl = /^\*\*Live:\*\*\s+(\S+)/m.exec(readme)?.[1];

  /**
   * What the README says deploys where: each branch its Deployment section
   * names in a "push to `branch`" sentence, with the first site URL that
   * follows it. Non-greedy so that each URL is claimed by the nearest branch
   * before it rather than the first one in the section.
   */
  const deployment = readme.slice(readme.indexOf('## Deployment'));
  const described = [
    ...deployment.matchAll(new RegExp(`push to\\s+\`([\\w.-]+)\`[\\s\\S]*?(${SITE_URL})`, 'g')),
  ].map(([, branch, url]) => ({ branch, url: slashed(url) }));

  const configBase = /^\s*base:\s*'([^']+)'/m.exec(
    readFileSync(root('vite.config.ts'), 'utf8'),
  )?.[1];

  /** Each described branch's base, and under it, each page. */
  const publishes = described.flatMap(({ branch }) =>
    GUARDED_PAGES.map((page) => ({ branch, page: page.id, url: `${baseOf(branch)}${page.prefix}` })),
  );
  const published = new Set(publishes.map((p) => p.url));

  it('is the whole of its domain, on the origin the card is addressed to', () => {
    expect(configBase).toBe('/');
    expect(origin).toMatch(/^https:\/\/[^/]+$/);
    expect(liveUrl).toBe(`${origin}/`);
  });

  it('says which branches deploy, and where', () => {
    expect(described.map((d) => d.branch)).toContain(PRODUCTION_BRANCH);
    for (const { branch, url } of described) {
      // With the branch alongside, so a failure names it rather than diffing
      // two long URLs.
      expect({ branch, url }).toEqual({ branch, url: baseOf(branch) });
    }
  });

  /* Each branch publishes both pages, and the section says where each is. */
  it('names each page under each branch', () => {
    for (const { url } of publishes) {
      expect(deployment).toContain(url);
    }
  });

  /* The README is the site's, so the front of it names each page by the
     title its card carries — the one a reader will have seen in a preview. */
  it('names each page by the title its card carries', () => {
    for (const page of GUARDED_PAGES) {
      const title = documentOf(page).metaTags['og:title'];
      expect(title).toBeTruthy();
      expect(readme).toContain(title);
    }
  });

  it('names no URL on the site that no branch publishes', () => {
    const named = new Set((readme.match(new RegExp(SITE_URL, 'g')) ?? []).map(slashed));

    expect([...named].filter((u) => !published.has(u))).toEqual([]);
    expect(named).toEqual(published);
  });

  /* The card's footer sets the address in type, so it is the one the README
     sends a reader to, and not the one the site left. */
  it('is the address the card’s footer prints', () => {
    const card = readFileSync(root(SITE_CARD), 'utf8');
    expect(card).toContain(`>${host}\${path}<`);
    expect(card).not.toContain('github.io');
  });

  /** Every file under `pages/`, which is the tree Pages serves. */
  const forwarders = (dir = 'pages'): string[] =>
    readdirSync(root(dir), { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? forwarders(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`],
    );

  /* One forwarder per Pages address the README names, at that address's
     path, and nothing under `pages/` the README does not name. */
  it('forwards each address the site used to have, and no other', () => {
    const named = new Set(
      (readme.match(new RegExp(`${literal(PAGES_SITE)}[\\w./-]*`, 'g')) ?? []).map(slashed),
    );
    const files = forwarders();
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) expect(file.endsWith('/index.html')).toBe(true);

    const served = new Set(
      files.map((f) => `${PAGES_SITE}${f.slice('pages/'.length, -'index.html'.length)}`),
    );
    expect(served).toEqual(named);
  });

  /* Each forwarder sends the reader to a page some branch publishes — the
     same page, under the same path — three ways, all agreeing: the canonical
     link for a crawler, the refresh for a reader with no script, and the
     script, which alone can carry the query string across. */
  it('forwards each to the same page on the site, query string and all', () => {
    for (const file of forwarders()) {
      const html = readFileSync(root(file), 'utf8');
      const target = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1] ?? 'no canonical link';
      const page = file.endsWith('aca/index.html') ? 'aca' : 'torpedo';

      expect({ file, target, page }).toEqual({
        file,
        target,
        page: publishes.find((p) => p.url === target)?.page,
      });
      expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${target}" />`);
      expect(html).toContain(`location.replace('${target}' + location.search + location.hash)`);
    }
  });

  /**
   * The workflow, as the branches it fires on and the tree it uploads. It is
   * the only one, it fires on the production branch alone — the forwarders
   * are the site's, not a branch's — and it runs no build: what is committed
   * is what is served.
   */
  it('publishes the forwarders from the production branch, and builds nothing', () => {
    expect(readdirSync(root('.github/workflows'))).toEqual(['deploy.yml']);
    const yaml = readFileSync(root('.github/workflows/deploy.yml'), 'utf8');
    const triggers = (/branches:\s*\[([^\]]*)\]/.exec(yaml)?.[1] ?? '')
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    expect(triggers).toEqual([PRODUCTION_BRANCH]);
    expect(yaml).toMatch(/^\s*path:\s*pages\s*$/m);
    expect(yaml).not.toMatch(/\b(npm|npx|vite)\b/);
  });
});

/**
 * Where the site is served from, held to the few things the file has to say.
 *
 * The build is vite.config.ts's own — `the front door` holds its `base` to
 * `/` — so what netlify.toml adds is small, and every piece of it fails
 * silently. The card's origin is handed to the build on the command line,
 * per deploy context: production's `URL`, and the deploy's own
 * `DEPLOY_PRIME_URL` for a branch deploy or a deploy preview, so a preview's
 * card is its own; a context that lost its command would fall back to
 * production's and address every preview's card to the live site. Tests run
 * before the build in each, so nothing publishes that fails them. And the one
 * header keeps `/assets/` for a year, which is only safe because everything
 * Vite puts there carries a content hash — `the build it emits` in
 * build.test.ts holds the build to that — and only right if nothing else is
 * kept, since a page held for a year would name chunks a later deploy no
 * longer has.
 */
describe('the Netlify build', () => {
  const toml = readFileSync(root('netlify.toml'), 'utf8');

  /** One table's lines: from `[name]` to the next header. */
  const table = (name: string) => {
    const start = toml.indexOf(`[${name}]\n`);
    if (start < 0) return '';
    const rest = toml.slice(start + name.length + 3);
    const end = rest.search(/^\[/m);
    return end < 0 ? rest : rest.slice(0, end);
  };
  const commandUnder = (name: string) =>
    /^\s*command\s*=\s*(['"])(.*)\1\s*$/m.exec(table(name))?.[2] ?? '';

  it('publishes what vite builds', () => {
    expect(table('build')).toMatch(/^\s*publish\s*=\s*['"]dist['"]/m);
  });

  it.each([
    ['build', '$URL'],
    ['context.deploy-preview', '$DEPLOY_PRIME_URL'],
    ['context.branch-deploy', '$DEPLOY_PRIME_URL'],
  ])('builds [%s] after the tests, with the card addressed to %s', (name, variable) => {
    const command = commandUnder(name);
    expect(command).toContain(`VITE_SITE_ORIGIN="${variable}" npm run build`);
    expect(command.indexOf('npm run test')).toBeGreaterThanOrEqual(0);
    expect(command.indexOf('npm run test')).toBeLessThan(command.indexOf('npm run build'));
    expect(command).not.toContain('--base');
  });

  it('keeps the hashed assets for a year, and revalidates everything else', () => {
    expect(toml.match(/^\[\[headers\]\]/gm)).toHaveLength(1);
    const rule = toml.slice(toml.indexOf('[[headers]]'));
    expect(rule).toMatch(/^\s*for\s*=\s*"\/assets\/\*"/m);
    expect(rule).toMatch(/^\s*Cache-Control\s*=\s*"public, max-age=31536000, immutable"/m);
  });
});
