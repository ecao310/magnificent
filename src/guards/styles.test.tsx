import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { render } from '@testing-library/react';
import { GUARDED_PAGES, SITE_SHEET } from './pages';
import type { GuardedPage } from './pages';
import { NARROW_MAX_WIDTH } from '../shared/lib/chartFrame';
import { RAIL_COLLAPSES_AT } from '../shared/lib/layout';

/**
 * A CSS rule that can never match is silent. Nothing throws, nothing warns,
 * the build is green and the only symptom is a box that does not draw — which
 * is exactly how `.hint-bubble .link-note` survived: the link note's whole
 * amber treatment was typed over a hint-bubble rule and kept its prefix, so
 * from the day it landed it styled an element that has never existed.
 *
 * Scoping one class under another is the one selector shape where that
 * happens by accident, because it is the shape you get by editing the wrong
 * half of a selector you copied. So every one of them has to point at
 * something the page actually renders.
 *
 * Every claim here is made about one page at a time. A page's stylesheet is
 * the site's sheet and then its own, in that order, which is what Vite
 * inlines the `@import` into and what a browser is handed; so each check
 * below reads the two files, joins each half — screen with screen, print with
 * print — and asks its question of the join. Site rules are checked twice,
 * once against each page's markup, which is the point: a site rule is a
 * claim about both pages.
 */
/* Read off disk rather than imported: Vite hands an imported `.css` to the
   test as a URL string, and under jsdom `import.meta.url` is an http one. The
   run's cwd is the project root, which is where `vite.config.ts` roots the
   test glob too. */
const read = (path: string): string => readFileSync(resolve(process.cwd(), path), 'utf8');
const stripped = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * The screen half of a stylesheet: everything ahead of `@media print`.
 *
 * The two halves paint from different palettes on purpose — paper re-declares
 * every colour token — so a claim about where colour comes from has to be
 * made about one of them at a time.
 */
const screenBlock = (css: string): string => {
  const plain = stripped(css);
  const print = plain.indexOf('@media print');
  return print === -1 ? plain : plain.slice(0, print);
};

/**
 * The body of every `@media` block with this prelude, joined.
 *
 * Read by balancing braces rather than by regex, because a media block is the
 * one thing in these files that nests — `leafRules` walks straight past the
 * prelude and into the rules inside, which is exactly what is wanted
 * everywhere else and not here. `@media print` nests twice over, holding an
 * `@page` of its own, which is the other reason this counts rather than
 * matching. Every occurrence, because a page sheet may carry a block of its
 * own under the same prelude as the site's.
 */
const mediaBlocks = (css: string, prelude: string): string => {
  const plain = stripped(css);
  const bodies: string[] = [];
  let from = 0;
  for (;;) {
    const at = plain.indexOf(prelude, from);
    if (at === -1) break;
    const open = plain.indexOf('{', at);
    let depth = 0;
    let end = -1;
    for (let i = open; i < plain.length; i += 1) {
      if (plain[i] === '{') depth += 1;
      else if (plain[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) break;
    bodies.push(plain.slice(open + 1, end));
    from = end + 1;
  }
  return bodies.join('\n');
};

/** The other ground: the same page on paper. */
const printBlock = (css: string): string => mediaBlocks(css, '@media print');

/** The site's sheet, and each page's own, as the page ships them. */
const site = read(SITE_SHEET);

interface Sheet {
  /** Both files, whole, in the order the page loads them. */
  all: string;
  /** The screen halves, joined, comments stripped. */
  screen: string;
  /** The print halves, joined, comments stripped. */
  print: string;
  /** The page's own file alone, its `@import` line taken off. */
  own: string;
}

const sheetFor = (page: GuardedPage): Sheet => {
  const own = read(page.sheet).replace(/^@import [^\n]*\n/m, '');
  return {
    all: `${site}\n${own}`,
    screen: `${screenBlock(site)}\n${screenBlock(own)}`,
    print: `${printBlock(site)}\n${printBlock(own)}`,
    own,
  };
};

/**
 * Every `.a .b` in a stylesheet, and only those.
 *
 * Pseudo-classes and the other combinators are left out on purpose rather
 * than overlooked: `:hover` and `:has()` describe states this render is not
 * in, and `>`/`+` selectors depend on sibling and child arrangements that a
 * single default render cannot stand in for. What is left is a plain claim
 * about nesting, which `querySelector` can settle outright.
 */
const nestedClassSelectors = (css: string): string[] =>
  (stripped(css).match(/[^{}]+(?=\{)/g) ?? [])
    .flatMap((prelude) => prelude.split(','))
    .map((selector) => selector.trim().replace(/\s+/g, ' '))
    .filter((selector) => /^\.[\w-]+ \.[\w-]+$/.test(selector));

/**
 * Every shipped `.tsx` a page is made of, concatenated, for the one question
 * a render cannot answer.
 *
 * A class can be alive and still be absent from a default render — the
 * Breakpoints panel's swatches are behind a button, the link note behind a
 * bad query string — so `querySelector` on one render cannot tell "not drawn
 * yet" from "not drawn ever". The source can, and only because every
 * `className` here is a literal string: no template, no helper, no
 * conditional join. The test below asserts that before it relies on it.
 *
 * A page is made of `src/shared` and its own directory, and nothing else:
 * reading the other page's markup too would let a site rule pass on the
 * strength of a class only the other page writes.
 */
const tsxUnder = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? tsxUnder(join(dir, entry.name))
      : entry.name.endsWith('.tsx') && !entry.name.includes('.test.')
        ? [join(dir, entry.name)]
        : [],
  );

const sourceOf = (page: GuardedPage): string =>
  ['src/shared', page.source]
    .flatMap((dir) => tsxUnder(resolve(process.cwd(), dir)))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');

/** Every class name a selector mentions, wherever in the selector it sits. */
const styledClasses = (css: string): Set<string> =>
  new Set(
    (stripped(css).match(/[^{}]+(?=\{)/g) ?? [])
      .flatMap((prelude) => Array.from(prelude.matchAll(/\.([\w-]+)/g)))
      .map(([, name]) => name),
  );

/**
 * Every rule with a body, and only the innermost ones.
 *
 * `[^{}]*` cannot span a nested `{`, so an `@media` prelude never completes a
 * match and the scan walks past it to the rules inside — which is what makes
 * this safe to run over a stylesheet that has an `@media print` block in it.
 */
const leafRules = (css: string): { selectors: string[]; body: string }[] =>
  Array.from(stripped(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)).map(([, prelude, body]) => ({
    selectors: prelude
      .split(',')
      .map((selector) => selector.trim().replace(/\s+/g, ' '))
      .filter(Boolean),
    body,
  }));

/**
 * A colour written out where it is used rather than named in `:root`.
 *
 * `rgba(var(--accent-rgb), 0.2)` is not one of these and `rgba(56, 189, 248,
 * 0.2)` is, which is why the test is for an `rgb(`/`rgba(` whose first
 * argument is a *number*. Keywords are left alone deliberately:
 * `transparent`, `currentColor` and `none` name a relationship rather than a
 * colour, and there is nothing about them to centralise.
 */
const looseColours = (css: string): string[] =>
  css.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d[^)]*\)/g) ?? [];

/** Every `:root` block in a stretch of stylesheet. */
const rootBlocks = (css: string): string[] => css.match(/:root\s*\{[^}]*\}/g) ?? [];

/**
 * Every custom property the `:root` blocks declare, and — of those — the ones
 * whose value is a colour.
 *
 * `--accent-rgb` is a colour and `--measure` is not: the first is a colour
 * written as three numbers so an `rgba()` can take an alpha to it, the second
 * is a length. Which side a token falls on is the difference between
 * something that has to be re-derived for paper and something that means the
 * same on either ground.
 */
const tokenNames = (css: string): string[] =>
  rootBlocks(css).flatMap((block) =>
    Array.from(block.matchAll(/(--[\w-]+):/g)).map(([, name]) => name),
  );

const colourTokens = (css: string): string[] =>
  rootBlocks(css).flatMap((block) =>
    Array.from(block.matchAll(/(--[\w-]+):\s*([^;]+);/g))
      .filter(([, name, value]) => /-rgb$/.test(name) || looseColours(value).length > 0)
      .map(([, name]) => name),
  );

/** Every custom property the screen `:root` blocks declare, name to value. */
const rootTokens = (screen: string): Record<string, string> =>
  Object.fromEntries(
    Array.from(rootBlocks(screen).join('\n').matchAll(/(--[\w-]+):\s*([^;]+);/g)).map(
      ([, name, value]) => [name, value.trim()],
    ),
  );

/** `surfaceRaised` is `--surface-raised`, and every name pairs that way. */
const custom = (name: string) => `--${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

/** Every size a stretch of stylesheet sets, in the order it sets them. */
const fontSizes = (css: string): string[] =>
  Array.from(css.matchAll(/font-size:\s*([^;}]+)/g)).map(([, size]) => size.trim());

/**
 * Every ring a stretch of stylesheet paints.
 *
 * A ring is an `outline` that is not `none`, or a `box-shadow` with no offset
 * and no blur — `0 0 0 Npx colour`, which is the shape of a border drawn
 * outside the box rather than of a shadow.
 */
const rings = (css: string): { selectors: string[]; property: string; value: string }[] =>
  leafRules(css).flatMap((rule) => {
    const outline = /(?:^|[;\s])outline:\s*([^;}]+)/.exec(rule.body)?.[1].trim();
    const shadow = /(?:^|[;\s])box-shadow:\s*([^;}]+)/.exec(rule.body)?.[1].trim();
    return [
      ...(outline && outline !== 'none'
        ? [{ selectors: rule.selectors, property: 'outline', value: outline }]
        : []),
      ...(shadow && /^0 0 0 /.test(shadow)
        ? [{ selectors: rule.selectors, property: 'box-shadow', value: shadow }]
        : []),
    ];
  });

/**
 * Every `width` and `max-width` a stretch of stylesheet sets, with what set it.
 *
 * `min-width` is left out: `body` sets a 320px floor, which is a statement
 * about the smallest window the page will try to draw in and not a measure
 * of a column. So is anything in a rule that clips — `.live-reading` is a box
 * shrunk to a pixel and clipped to nothing so that a live region stays in the
 * accessibility tree while being off the screen.
 */
const widths = (css: string): { selectors: string[]; property: string; value: string }[] =>
  leafRules(css)
    .filter((rule) => !rule.body.includes('clip-path'))
    .flatMap((rule) =>
      Array.from(rule.body.matchAll(/(?:^|[;\s])(max-width|width):\s*([^;}]+)/g)).map(
        ([, property, value]) => ({ selectors: rule.selectors, property, value: value.trim() }),
      ),
    );

/** Every left border a stretch of stylesheet draws, with what drew it. */
const leftBorders = (css: string): { selectors: string[]; property: string; value: string }[] =>
  leafRules(css).flatMap((rule) =>
    Array.from(rule.body.matchAll(/(?:^|[;\s])(border-left(?:-color)?):\s*([^;}]+)/g)).map(
      ([, property, value]) => ({ selectors: rule.selectors, property, value: value.trim() }),
    ),
  );

/** Every corner a stretch of stylesheet draws, one value per `border-radius`. */
const corners = (css: string): string[] =>
  Array.from(css.matchAll(/border-radius:\s*([^;}]+)/g)).flatMap(([, value]) =>
    value.trim().split(/\s+(?![^(]*\))/),
  );

/** A stretch of stylesheet with every `@media` block taken out: its base rules. */
const withoutMediaBlocks = (css: string): string => {
  const plain = stripped(css);
  let out = '';
  let i = 0;
  while (i < plain.length) {
    const at = plain.indexOf('@media', i);
    if (at === -1) {
      out += plain.slice(i);
      break;
    }
    out += plain.slice(i, at);
    const open = plain.indexOf('{', at);
    let depth = 0;
    let end = plain.length;
    for (let j = open; j < plain.length; j += 1) {
      if (plain[j] === '{') depth += 1;
      else if (plain[j] === '}') {
        depth -= 1;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }
    i = end + 1;
  }
  return out;
};

/** Every property a rule body sets. */
const properties = (body: string): string[] =>
  Array.from(body.matchAll(/(?:^|[;\s])([\w-]+)\s*:/g)).map(([, name]) => name);

describe.each(GUARDED_PAGES)('$name’s stylesheet', (page) => {
  const sheet = sheetFor(page);
  const source = sourceOf(page);

  describe('the stylesheet', () => {
    it('scopes no rule to a nesting the page never renders', () => {
      const selectors = nestedClassSelectors(sheet.all);
      // Guards the extractor itself: an empty list would pass vacuously.
      expect(selectors.length).toBeGreaterThan(0);

      const { container } = render(<page.App />);
      let dead = selectors.filter((selector) => !container.querySelector(selector));
      if (page.reveal && dead.length > 0) {
        page.reveal();
        dead = dead.filter((selector) => !container.querySelector(selector));
      }
      expect(dead).toEqual([]);
    });

    /**
     * The other half of the same silence. A rule scoped to a nesting that
     * never happens is caught above; this catches a rule whose class no render
     * path emits at all, which is what a section leaves behind when its markup
     * is deleted and its stylesheet is not. Run against the site's sheet
     * through each page's markup, it is also what keeps a page's class out of
     * the site's sheet: a rule for the chooser in site.css fails here for the
     * page that has no chooser.
     */
    it('writes no rule for a class the page never renders', () => {
      // The claim `styledClasses` rests on: className is always a literal here.
      expect(source).not.toMatch(/className=\{/);

      const rendered = new Set(
        Array.from(source.matchAll(/className="([^"]*)"/g)).flatMap(([, list]) =>
          list.split(/\s+/).filter(Boolean),
        ),
      );
      // Guards both extractors: either coming back empty would pass vacuously.
      expect(rendered.size).toBeGreaterThan(20);
      const styled = styledClasses(sheet.all);
      expect(styled.size).toBeGreaterThan(20);

      // recharts names its own SVG parts, and the print sheet re-colours the
      // grid and the ticks by the names the library emits. Nothing under `src`
      // writes one, and nothing should.
      const dead = Array.from(styled).filter(
        (name) => !rendered.has(name) && !name.startsWith('recharts-'),
      );
      expect(dead).toEqual([]);
    });
  });

  /**
   * The page's sheet comes after the site's, media blocks included, and a
   * media query adds no specificity. So a page rule at base level that sets
   * a property one of the site's media blocks sets on the same selector wins
   * over the block on every screen — the collapse un-sticks the rail, and a
   * page rule that restated `position: sticky` would pin it on a phone again.
   * What a page changes at a breakpoint or on paper goes in media blocks of
   * its own, at the foot of its own file.
   */
  describe('the cascade', () => {
    it('restates at base level no property the site changes in a media block', () => {
      const changed = new Map<string, Set<string>>();
      for (const prelude of stripped(site).match(/@media[^{]+/g) ?? []) {
        for (const rule of leafRules(mediaBlocks(site, prelude.trim()))) {
          for (const selector of rule.selectors) {
            const set = changed.get(selector) ?? new Set<string>();
            for (const property of properties(rule.body)) set.add(property);
            changed.set(selector, set);
          }
        }
      }
      // Guards the extractor itself: an empty map would pass vacuously.
      expect(changed.size).toBeGreaterThan(5);

      const restated = leafRules(withoutMediaBlocks(screenBlock(sheet.own))).flatMap((rule) =>
        rule.selectors.flatMap((selector) =>
          properties(rule.body)
            .filter((property) => changed.get(selector)?.has(property))
            .map((property) => `${selector} { ${property} }`),
        ),
      );
      expect(restated).toEqual([]);
    });
  });

  /**
   * Two headings used to paint their text with a `linear-gradient` background
   * and knock the glyphs out with `-webkit-text-fill-color: transparent`. On
   * paper, in a browser printing without background graphics, that was the
   * knockout without the paint — both headings came out as blank space. A
   * knockout is a heading a printer is free to drop, so the claim is that
   * there is nothing to repair.
   */
  describe('the headings', () => {
    it('paints none of them with a gradient a printer would drop', () => {
      const rules = leafRules(sheet.all);
      // Guards the extractor itself: an empty sheet would pass vacuously.
      expect(rules.length).toBeGreaterThan(50);

      const knockedOut = rules
        .filter((rule) =>
          /-webkit-text-fill-color:\s*transparent|background-clip:\s*text/.test(rule.body),
        )
        .flatMap((rule) => rule.selectors);

      expect(knockedOut).toEqual([]);
    });
  });

  /**
   * The palette lives in `:root` and nowhere else.
   *
   * This is the invariant that makes a restyle a bounded job instead of an
   * open-ended hunt. It bites in the direction that actually happens: nobody
   * adds a token they do not use, but everybody pastes a hex into the rule
   * they are already editing. That paste fails here. The site's `:root`
   * holds what both pages paint with and a page's own `:root` its own hues,
   * and a colour literal anywhere else fails for whichever page it is in.
   */
  describe('the screen stylesheet', () => {
    it('writes every colour it paints with in :root and nowhere else', () => {
      const declared = rootBlocks(sheet.screen);
      // Guards the extractor: no `:root` found would make the rest vacuous.
      expect(declared.length).toBeGreaterThan(0);
      expect(looseColours(declared.join('\n')).length).toBeGreaterThan(10);

      const used = declared.reduce((css, block) => css.replace(block, ''), sheet.screen);
      expect(looseColours(used)).toEqual([]);
    });
  });

  /**
   * The paper half, held to the same line as the screen half.
   *
   * Paper re-declares the tokens and every rule above paints itself. That
   * goes stale by a *token* being added to the screen ground and not to the
   * paper one — silent, because a custom property that paper never
   * re-points still resolves, to whatever value the screen gave it. So the
   * second `it` is the one that matters: every colour token a page declares
   * on screen, in the site's `:root` or its own, has a paper answer.
   */
  describe('the print stylesheet', () => {
    it('writes every colour it paints with in :root and nowhere else', () => {
      // Guards the extractor: an empty block would make both checks vacuous.
      expect(sheet.print.length).toBeGreaterThan(500);

      const declared = rootBlocks(sheet.print);
      expect(declared.length).toBeGreaterThan(0);
      expect(looseColours(declared.join('\n')).length).toBeGreaterThan(10);

      const used = declared.reduce((css, block) => css.replace(block, ''), sheet.print);
      expect(looseColours(used)).toEqual([]);
    });

    it('answers for every token the screen ground declares', () => {
      const screen = colourTokens(sheet.screen);
      // Guards the extractor itself: an empty list would pass vacuously.
      expect(screen.length).toBeGreaterThan(10);

      const paper = new Set(tokenNames(sheet.print));
      expect(screen.filter((name) => !paper.has(name))).toEqual([]);
    });
  });

  /**
   * `ResponsiveContainer` measures the box it is handed and renders nothing at
   * all when that box is zero high. The print sheet used to hand it zero, and
   * every plot unmounted on paper; recharts renders nothing under jsdom
   * either, so no render-based test can tell. What can be checked is the
   * rule: the print sheet may resize a chart, and may not take its height away.
   */
  describe('the print sheet’s charts', () => {
    const chartRules = () =>
      leafRules(sheet.print).filter((rule) =>
        rule.selectors.some((selector) => /chart-container|recharts/.test(selector)),
      );

    it('hands the plot a height it can measure', () => {
      const sized = chartRules().filter((rule) => /(?:^|[;\s])height:/.test(rule.body));
      expect(sized).toHaveLength(1);
      expect(/height:\s*([^;}]+)/.exec(sized[0].body)?.[1].trim()).toMatch(/^\d+px$/);
    });

    it('never resolves that height to nothing', () => {
      const zeroed = chartRules()
        .filter((rule) => /(?:^|[;\s])(?:height|max-height):\s*(auto|0)\b/.test(rule.body))
        .flatMap((rule) => rule.selectors);

      expect(zeroed).toEqual([]);
    });
  });

  /**
   * `palette.ts` and `:root` are the same palette written twice, once for CSS
   * and once for SVG. Two copies drift — silently, because a stale colour
   * still renders — so the only thing keeping them one palette is this.
   */
  describe('the palette', () => {
    it('gives the charts the same colours the stylesheet declares', () => {
      const declared = rootTokens(sheet.screen);
      // Guards the extractor: an empty map would make every check below vacuous.
      expect(Object.keys(declared).length).toBeGreaterThan(15);

      const disagreed = Object.entries(page.PALETTE)
        .map(([name, value]) => ({ name, value, css: declared[custom(name)] }))
        .filter((token) => token.css !== token.value);

      expect(disagreed).toEqual([]);
    });

    /**
     * There are exactly two ways a token earns its line: a `var()` somewhere
     * in the page's sheet, or a `PALETTE` entry, which is a chart spending it
     * in SVG where `var()` cannot reach. Asked of each page, this is also
     * what keeps the site's `:root` to what both pages spend: a hue only one
     * page draws with fails here for the other, and belongs in the one's own
     * sheet.
     */
    it('declares no colour with nothing on either side of it', () => {
      const plain = stripped(sheet.all);
      const twins = new Set(Object.keys(page.PALETTE).map(custom));

      const names = Object.keys(rootTokens(sheet.screen));
      expect(names.length).toBeGreaterThan(15);

      const orphaned = names.filter(
        (name) => !plain.includes(`var(${name})`) && !twins.has(name),
      );
      expect(orphaned).toEqual([]);
    });
  });

  /**
   * The gutter the plot holds back is the one measure the pages disagree on:
   * one y-axis is a percentage and the other a dollar figure. So the site's
   * ground does not set it, and each page's own does — a page that forgot
   * would inherit nothing, and every caption under its plot would start at
   * the plot's left edge instead of the plot area's.
   */
  describe('the split', () => {
    it('leaves the plot’s gutter to the page, and the page sets it', () => {
      expect(tokenNames(screenBlock(site))).not.toContain('--chart-axis');
      expect(tokenNames(screenBlock(sheet.own))).toContain('--chart-axis');
    });
  });

  /**
   * Two widths the markup has to know as well as the stylesheet.
   *
   * The rail folds to a row at the width the columns collapse to one, and the
   * plot takes its narrow frame at the width the phone rules turn on: each is
   * a `matchMedia` in a shared component and an `@media` in the sheet, and
   * the two copies of a number drift the same silent way two copies of a
   * colour do. Both numbers are the site's, so both are asked of each page's
   * whole sheet.
   */
  describe('the fold', () => {
    it('happens at the width the stylesheet collapses the columns', () => {
      expect(sheet.screen).toMatch(new RegExp(`@media \\(max-width: ${RAIL_COLLAPSES_AT}px\\)`));
    });

    it('narrows the plot at the width the stylesheet turns its phone rules on', () => {
      expect(sheet.screen).toMatch(new RegExp(`@media \\(max-width: ${NARROW_MAX_WIDTH}px\\)`));
    });
  });

  /**
   * `CHART` is the second copy of the page's plot measures, held to the first
   * the same way `PALETTE` is — by a test, because a stale number renders as
   * quietly as a stale colour. The y-axis gutter is one: an SVG that holds
   * back 44px and a caption that indents 44px are describing the same edge.
   * The label size is the other: 13px inside the plot is `0.8125rem` under it.
   */
  describe('the chart metrics', () => {
    it('holds back the same gutter the notes under the plot indent by', () => {
      const root = rootBlocks(sheet.screen).join('\n');
      expect(/--chart-axis:\s*([^;]+);/.exec(root)?.[1].trim()).toBe(`${page.CHART.axis}px`);
      if (page.CHART.axisNarrow !== undefined) {
        expect(/--chart-axis-narrow:\s*([^;]+);/.exec(root)?.[1].trim()).toBe(
          `${page.CHART.axisNarrow}px`,
        );
      }
    });

    it('sets the plot’s labels at the step its notes are set in', () => {
      // 13px is 0.8125rem, and the root font size is the browser's own 16px.
      const step = `${page.CHART.label / 16}rem`;
      expect(step).toBe('0.8125rem');

      const set = leafRules(sheet.screen)
        .filter((rule) => rule.selectors.some((selector) => page.chartNotes.includes(selector)))
        .map((rule) => ({
          selector: rule.selectors.join(', '),
          size: /font-size:\s*([^;}]+)/.exec(rule.body)?.[1].trim(),
        }));
      expect(set).toHaveLength(page.chartNotes.length);
      expect(set.filter((note) => note.size !== step)).toEqual([]);
    });
  });

  /**
   * Ten steps, and no eleventh.
   *
   * A scale does not drift by someone rewriting it; it drifts by a 1.05rem
   * typed into the one rule being edited, because from inside that rule
   * there is nothing to compare against. Here there is: a size that is not
   * on the list fails, so widening the scale becomes an edit to the list,
   * made once, on purpose. And every step has to be spent, so a step that
   * outlives its last user comes off the list rather than lingering.
   */
  describe('the type scale', () => {
    const STEPS = [
      '0.75rem',
      '0.8125rem',
      '0.875rem',
      '1.0625rem',
      '1.125rem',
      '1.25rem',
      '1.5rem',
      '2rem',
      '2.125rem',
      '2.75rem',
    ];

    it('sets every size from one closed list of steps', () => {
      const sizes = fontSizes(sheet.screen);
      // Guards the extractor itself: an empty list would pass vacuously.
      expect(sizes.length).toBeGreaterThan(20);

      expect([...new Set(sizes)].filter((size) => !STEPS.includes(size)).sort()).toEqual([]);
    });

    it('spends every step it declares', () => {
      const spent = new Set(fontSizes(sheet.screen));
      expect(STEPS.filter((step) => !spent.has(step))).toEqual([]);
    });
  });

  /**
   * One ring, and only on focus.
   *
   * The claim is the whole register in two parts: nothing rings except on
   * focus, and every ring is the same solid accent. Both fail in the
   * direction that actually happens — a ring pasted into the rule being
   * edited, carrying whatever alpha it had where it was copied from.
   */
  describe('the controls', () => {
    it('paints a ring in no state but focus', () => {
      const painted = rings(sheet.screen);
      // Guards the extractor itself: an empty list would pass vacuously.
      expect(painted.length).toBeGreaterThan(5);

      const unfocused = painted
        .filter((ring) => !ring.selectors.every((s) => s.includes(':focus')))
        .map((ring) => `${ring.selectors.join(', ')} { ${ring.property} }`);

      expect(unfocused).toEqual([]);
    });

    it('paints every ring in the same solid accent', () => {
      const washed = rings(sheet.screen)
        .filter((ring) => !/^\d+px solid var\(--accent\)$|var\(--accent\)$/.test(ring.value))
        .map((ring) => `${ring.selectors.join(', ')} { ${ring.property}: ${ring.value} }`);

      expect(washed).toEqual([]);
    });
  });

  /**
   * Two columns, three measures, and one place they are written down.
   *
   * The reading column and the configuration column are `:root` tokens and
   * `#root` is derived from them, so the page's width is a consequence of
   * its columns rather than a third number kept in step by hand. The first
   * `it` fails the way that actually happens — a `900px` typed into
   * whichever rule is being edited. The second is about what two columns
   * bring with them: the configuration column pins, and on a phone there is
   * one column and nothing may pin, so every `position: sticky` has to be
   * taken back off in the collapse.
   */
  describe('the shell', () => {
    const MEASURES = ['--measure', '--column', '--gutter'];

    it('sets every column width from the measures it names, never from a number', () => {
      const drawn = widths(sheet.screen);
      // Guards the extractor itself: an empty list would pass vacuously.
      expect(drawn.length).toBeGreaterThan(5);

      const hardCoded = drawn
        .filter((width) => /\d\s*px/.test(width.value))
        .map((width) => `${width.selectors.join(', ')} { ${width.property}: ${width.value} }`);

      expect(hardCoded).toEqual([]);
    });

    it('spends every measure it declares', () => {
      const spent = rootBlocks(sheet.screen).reduce((css, block) => css.replace(block, ''), sheet.screen);
      expect(MEASURES.filter((name) => !spent.includes(`var(${name})`))).toEqual([]);
    });

    it('unpins everything that pins where the grid collapses to one', () => {
      const pinned = leafRules(sheet.screen)
        .filter((rule) => /position:\s*sticky/.test(rule.body))
        .flatMap((rule) => rule.selectors);
      // Guards the extractor: no sticky found would make the check vacuous.
      expect(pinned.length).toBeGreaterThan(0);

      const released = leafRules(
        mediaBlocks(sheet.all, `@media (max-width: ${RAIL_COLLAPSES_AT}px)`),
      )
        .filter((rule) => /position:\s*static/.test(rule.body))
        .flatMap((rule) => rule.selectors);

      expect(pinned.filter((selector) => !released.includes(selector))).toEqual([]);
    });
  });

  /**
   * Two shapes of left border, and no third.
   *
   * A margin rule is 2px, and its colour is either the page's hairline or a
   * data token at exactly half alpha. A note box is the other shape — 3px of
   * a solid token down the side of something with a fill and a border of its
   * own — and it is allowed for explicitly rather than by omission.
   */
  describe('the margin rules', () => {
    const RULE = /^2px solid (var\(--edge\)|rgba\(var\(--[\w-]+-rgb\), 0\.5\))$/;
    const COLOUR = /^(var\(--edge\)|rgba\(var\(--[\w-]+-rgb\), 0\.5\))$/;
    const BOX = /^3px solid var\(--[\w-]+\)$/;

    it('draws every one of them at one weight and one alpha', () => {
      const drawn = leftBorders(sheet.screen);
      // Guards the extractor itself: an empty list would pass vacuously. One
      // rule takes this shape on every page — the link note's box.
      expect(drawn.length).toBeGreaterThan(0);

      const odd = drawn
        .filter((border) =>
          border.property === 'border-left-color'
            ? !COLOUR.test(border.value)
            : !RULE.test(border.value) && !BOX.test(border.value),
        )
        .map((border) => `${border.selectors.join(', ')} { ${border.property}: ${border.value} }`);

      expect(odd).toEqual([]);
    });
  });

  /**
   * A control nobody can see, in either of its two states.
   *
   * The skip link is clipped to a pixel at rest and unclipped by `:focus`, and
   * no render test can tell a link that unclips from one that does not,
   * because jsdom computes neither. `display: none` is called out by name
   * because it is the obvious way to write the first half and the wrong one:
   * it takes the tab stop away with the pixels.
   */
  describe('the skip link', () => {
    const rule = (selector: string) =>
      leafRules(sheet.screen).find((r) => r.selectors.includes(selector));

    it('is clipped at rest and unclipped by focus', () => {
      const resting = rule('.skip-link');
      const focused = rule('.skip-link:focus');
      expect(resting).toBeDefined();
      expect(focused).toBeDefined();

      expect(resting?.body).toMatch(/clip-path:\s*inset\(50%\)/);
      expect(resting?.body).not.toMatch(/display:\s*none/);
      expect(focused?.body).toMatch(/clip-path:\s*none/);
    });

    /** And drawn over everything, because what it unclips onto is whatever the reader had already opened. */
    it('lands above every other layer the page stacks', () => {
      const layers = Array.from(sheet.screen.matchAll(/z-index:\s*(\d+)/g)).map(([, value]) =>
        Number(value),
      );
      // Guards the extractor itself: an empty list would pass vacuously.
      expect(layers.length).toBeGreaterThan(0);

      const focused = Number(/z-index:\s*(\d+)/.exec(rule('.skip-link:focus')?.body ?? '')?.[1]);
      expect(focused).toBe(Math.max(...layers));
    });
  });

  /**
   * Two regions wait empty for a message: the reading, and the line under the
   * copy button. Neither may be `display: none` while it waits — that takes a
   * region out of the accessibility tree, and a message that lands as it comes
   * back in is not read out reliably — and neither may be `visibility:
   * hidden`, which does the same. Clipped to a pixel, or collapsed to no
   * width, is how a region stays in the tree and off the page.
   */
  describe('the live regions', () => {
    it('are never hidden outright while they wait empty', () => {
      const waiting = leafRules(sheet.screen).filter((rule) =>
        rule.selectors.some((selector) => /live-reading|answer-share-status/.test(selector)),
      );
      // Guards the extractor itself: an empty list would pass vacuously.
      expect(waiting.length).toBeGreaterThan(1);

      const hidden = waiting
        .filter((rule) => /display:\s*none|visibility:\s*hidden/.test(rule.body))
        .flatMap((rule) => rule.selectors);
      expect(hidden).toEqual([]);
    });
  });

  /**
   * None. The broadsheet is ink on paper, and a rule on paper is a line, not
   * a box — so the only `border-radius` the sheet writes is the `0` that
   * takes a browser's own rounding off a button.
   */
  describe('the corners', () => {
    it('draws every box square', () => {
      const drawn = corners(sheet.screen);
      // Guards the extractor itself: an empty list would pass vacuously.
      expect(drawn.length).toBeGreaterThan(0);

      expect([...new Set(drawn)]).toEqual(['0']);
    });
  });
});
