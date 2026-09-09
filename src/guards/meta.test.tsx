import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FURTHER_READING } from '../lib/furtherReading';

/**
 * The surfaces a reader meets before the page: the link preview, the search
 * snippet, the README's front door — and the agreement between each of them
 * and what the repo actually does.
 */
const root = process.cwd();
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const rateHtml = readFileSync(resolve(root, 'effective-rate/index.html'), 'utf8');
const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
const workflow = readFileSync(resolve(root, '.github/workflows/deploy.yml'), 'utf8');
const viteConfig = readFileSync(resolve(root, 'vite.config.ts'), 'utf8');

const metaIn = (doc: string, attr: 'name' | 'property', key: string): string | undefined =>
  new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`, 's').exec(doc)?.[1];
const meta = (attr: 'name' | 'property', key: string): string | undefined => metaIn(html, attr, key);

describe('the link preview', () => {
  it('names itself, describes itself and carries a card', () => {
    expect(meta('property', 'og:site_name')).toBeTruthy();
    expect(meta('property', 'og:title')).toBeTruthy();
    expect(meta('property', 'og:description')).toBeTruthy();
    expect(meta('property', 'og:image')).toMatch(/og-cover\.png$/);
    expect(meta('property', 'og:image:width')).toBe('1200');
    expect(meta('property', 'og:image:height')).toBe('630');
    expect(meta('property', 'og:image:alt')).toBeTruthy();
  });

  it('says the same thing on both surfaces', () => {
    expect(meta('name', 'twitter:title')).toBe(meta('property', 'og:title'));
    expect(meta('name', 'twitter:description')).toBe(meta('property', 'og:description'));
    expect(meta('name', 'twitter:image')).toBe(meta('property', 'og:image'));
  });

  it('gives the crawler absolute URLs, built through the base', () => {
    expect(meta('property', 'og:url')).toBe('https://ecao310.github.io%BASE_URL%');
    expect(meta('property', 'og:image')).toBe('https://ecao310.github.io%BASE_URL%og-cover.png');
    expect(html).toMatch(/href="%BASE_URL%favicon\.svg"/);
    expect(html).toMatch(/href="%BASE_URL%apple-touch-icon\.png"/);
  });

  it('shares its title with the README', () => {
    expect(readme.split('\n')[0]).toBe(`# ${meta('property', 'og:title')}`);
  });
});

describe('the cover', () => {
  /** A PNG's size, read out of its IHDR chunk. */
  const pngSize = (path: string): [number, number] => {
    const png = readFileSync(resolve(root, path));
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    return [png.readUInt32BE(16), png.readUInt32BE(20)];
  };

  it('ships every file the document links to, at the size it declares', () => {
    expect(pngSize('public/og-cover.png')).toEqual([
      Number(meta('property', 'og:image:width')),
      Number(meta('property', 'og:image:height')),
    ]);
    expect(pngSize('public/apple-touch-icon.png')).toEqual([180, 180]);
    expect(readFileSync(resolve(root, 'public/favicon.svg'), 'utf8')).toMatch(/<svg/);
  });
});

describe('the search snippet', () => {
  it('is short enough to be shown whole on a result page, on both pages', () => {
    for (const doc of [html, rateHtml]) {
      const description = metaIn(doc, 'name', 'description') ?? '';
      expect(description.length).toBeGreaterThan(50);
      expect(description.length).toBeLessThanOrEqual(160);
    }
  });
});

describe('the second page', () => {
  it('is the rate page, at the path the build writes it to', () => {
    expect(rateHtml).toMatch(/<title>The All-In Rate<\/title>/);
    expect(rateHtml).toMatch(/src="\/src\/rate\.tsx"/);
    expect(metaIn(rateHtml, 'property', 'og:url')).toBe(
      'https://ecao310.github.io%BASE_URL%effective-rate/',
    );
    expect(rateHtml).toMatch(/href="%BASE_URL%favicon\.svg"/);
    expect(rateHtml).toMatch(/href="%BASE_URL%apple-touch-icon\.png"/);
  });

  it('says the same thing on both card surfaces', () => {
    expect(metaIn(rateHtml, 'name', 'twitter:title')).toBe(metaIn(rateHtml, 'property', 'og:title'));
    expect(metaIn(rateHtml, 'name', 'twitter:description')).toBe(
      metaIn(rateHtml, 'property', 'og:description'),
    );
  });
});

describe('the front door', () => {
  const base = /base:\s*'([^']+)'/.exec(viteConfig)?.[1] ?? '';
  const env = Object.fromEntries(
    Array.from(workflow.matchAll(/^\s{2}(PRODUCTION_BRANCH|PREVIEW_BRANCH|PREVIEW_BASE):\s*(\S+)\s*$/gm)).map((m) => [
      m[1],
      m[2],
    ]),
  );
  const pushBranches = (/branches:\s*\[\s*([^\]]+)\]/.exec(workflow)?.[1] ?? '')
    .split(',')
    .map((b) => b.trim());
  const publishes: Record<string, string> = {
    [env.PRODUCTION_BRANCH]: `https://ecao310.github.io${base}`,
    [env.PREVIEW_BRANCH]: `https://ecao310.github.io${env.PREVIEW_BASE}`,
  };
  /**
   * The pages under each root: every nested html entry the build is given,
   * `effective-rate/index.html` as `effective-rate/`. A README may name a
   * root, or a page under one, and nothing else.
   */
  const pages = Array.from(viteConfig.matchAll(/'([\w-]+(?:\/[\w-]+)*)\/index\.html'/g)).map(
    (m) => `${m[1]}/`,
  );
  const published = Object.values(publishes).flatMap((url) => [url, ...pages.map((page) => url + page)]);

  it('is published by one workflow, from the branches it declares', () => {
    expect(env.PRODUCTION_BRANCH).toBe('main');
    expect(pushBranches.sort()).toEqual([env.PRODUCTION_BRANCH, env.PREVIEW_BRANCH].sort());
    expect(env.PREVIEW_BASE.startsWith(base)).toBe(true);
  });

  it('gives each branch the URL the workflow publishes it at', () => {
    for (const [branch, url] of Object.entries(publishes)) {
      const sentence = new RegExp(`push to \`${branch}\`[^\\n]*\\n[^\\n]*\\n?[^\\n]*?(https://\\S+?)\\s`, 's');
      const found = sentence.exec(readme)?.[1];
      expect(found, `README names where a push to ${branch} lands`).toBe(url);
    }
  });

  it('points Live: at a URL some branch publishes', () => {
    const live = /\*\*Live:\*\*\s*(\S+)/.exec(readme)?.[1];
    expect(Object.values(publishes)).toContain(live);
  });

  it('names no Pages URL that no workflow publishes', () => {
    expect(pages).toContain('effective-rate/');
    const named = Array.from(readme.matchAll(/https:\/\/ecao310\.github\.io\/super-duper-broccoli\/\S*/g)).map(
      (m) => m[0].replace(/[).,]+$/, ''),
    );
    for (const url of named) expect(published).toContain(url);
  });
});

describe('the reading list', () => {
  it('is five long, and the README links the companion', () => {
    expect(FURTHER_READING).toHaveLength(5);
    expect(readme).toContain('https://ecao310.github.io/congenial-octo-spork/');
  });

  it('has no duplicate links and a source for each', () => {
    const hrefs = FURTHER_READING.map((r) => r.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const reading of FURTHER_READING) {
      expect(reading.title.length).toBeGreaterThan(10);
      expect(reading.source.length).toBeGreaterThan(2);
      expect(reading.href).toMatch(/^https:\/\//);
    }
  });
});
