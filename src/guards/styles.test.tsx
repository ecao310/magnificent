import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';
import { CHART, PALETTE } from '../styles/palette';

/**
 * What no other test reads: the stylesheet, and its agreement with the
 * literals the chart hands to SVG attributes.
 */
const stylesheet = readFileSync(resolve(process.cwd(), 'src/styles/index.css'), 'utf8');
const uncommented = stylesheet.replace(/\/\*[\s\S]*?\*\//g, '');

/** The `:root` blocks, screen first and print second, as `--token: value` maps. */
const tokenBlocks = (): Record<string, string>[] =>
  Array.from(uncommented.matchAll(/:root\s*\{([^}]*)\}/g))
    .map((m) => m[1])
    .filter((body) => /--surface:/.test(body))
    .map((body) =>
      Object.fromEntries(
        Array.from(body.matchAll(/(--[\w-]+):\s*([^;]+);/g)).map((m) => [m[1], m[2].trim()]),
      ),
    );

const tsxUnder = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? tsxUnder(join(dir, entry.name))
      : entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')
        ? [join(dir, entry.name)]
        : [],
  );

const source = tsxUnder(resolve(process.cwd(), 'src'))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');

describe('the palette', () => {
  const [screenTokens, printTokens] = tokenBlocks();

  /** The colour tokens of a ground: the ones whose value is a colour. */
  const colours = (tokens: Record<string, string>): string[] =>
    Object.keys(tokens).filter((token) => /^#/.test(tokens[token])).sort();

  it('declares the same colours on screen and on paper', () => {
    expect(printTokens).toBeDefined();
    expect(colours(printTokens)).toEqual(colours(screenTokens));
  });

  it('is the one the chart paints with', () => {
    const named: Record<keyof typeof PALETTE, string> = {
      surface: '--surface',
      edge: '--edge',
      edgeStrong: '--edge-strong',
      inkMuted: '--ink-muted',
      accent: '--accent',
      amber: '--amber',
      fuchsia: '--fuchsia',
      fuchsiaBright: '--fuchsia-bright',
      violet: '--violet',
      violetDeep: '--violet-deep',
    };
    for (const [key, token] of Object.entries(named) as [keyof typeof PALETTE, string][]) {
      expect(screenTokens[token], token).toBe(PALETTE[key]);
    }
  });

  it('writes no colour literal outside the two grounds', () => {
    const outside = uncommented.replace(/:root\s*\{[^}]*\}/g, '');
    expect(outside.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
    expect(outside.match(/\b(?:rgb|hsl|oklch)a?\(/g) ?? []).toEqual([]);
  });

  it('spends every colour it declares, in a rule or in the chart', () => {
    const painted = new Set<string>(Object.values(PALETTE));
    for (const token of colours(screenTokens)) {
      const used = new RegExp(`var\\(${token}\\)`).test(uncommented) || painted.has(screenTokens[token]);
      expect(used, `${token} is spent somewhere`).toBe(true);
    }
  });
});

describe('the chart metrics', () => {
  it('give the y-axis the gutter the stylesheet reserves for it', () => {
    expect(/--chart-axis:\s*(\d+)px/.exec(stylesheet)?.[1]).toBe(String(CHART.axis));
  });
});

describe('the type scale', () => {
  const scale = ['5.75', '2.875', '2.75', '2.125', '1.75', '1.5', '1.375', '1.25', '1.0625', '1', '.875', '.8125', '.75'];

  it('is closed: every font-size is one of its steps', () => {
    const sizes = Array.from(uncommented.matchAll(/font-size:\s*([\d.]+)rem/g)).map((m) => m[1].replace(/^0/, ''));
    for (const size of sizes) expect(scale, `${size}rem`).toContain(size);
  });
});

describe('the corners', () => {
  it('are square: the only border-radius is the 0 that undoes a browser', () => {
    const radii = Array.from(uncommented.matchAll(/border-radius:\s*([^;]+);/g)).map((m) => m[1].trim());
    expect(new Set(radii)).toEqual(new Set(['0']));
  });
});

describe('the selectors', () => {
  const nested = (uncommented.match(/[^{}]+(?=\{)/g) ?? [])
    .flatMap((prelude) => prelude.split(','))
    .map((selector) => selector.trim().replace(/\s+/g, ' '))
    .filter((selector) => /^\.[\w-]+ \.[\w-]+$/.test(selector));

  it('name classes the markup actually writes', () => {
    expect(nested.length).toBeGreaterThanOrEqual(2);
    const classNames = new Set(
      Array.from(source.matchAll(/className=["'`]([^"'`$]+)["'`]/g)).flatMap((m) => m[1].split(/\s+/)),
    );
    // Classes written through a template or a conditional, named here so the
    // extractor above does not have to understand them.
    for (const dynamic of ['credit-edge', 'csr-tier', 'here-line']) classNames.add(dynamic);
    for (const selector of nested) {
      for (const cls of selector.match(/\.[\w-]+/g) ?? []) {
        const name = cls.slice(1);
        if (name.startsWith('recharts-')) continue;
        expect(classNames.has(name), `${selector}: .${name} is written by some component`).toBe(true);
      }
    }
  });

  it('render on the page where a default render can reach them', () => {
    render(<App />);
    const reachable = ['.step-config .input-group', '.answer-figure dd', '.explainer h3', '.chart-slider .slider-readout'];
    for (const selector of reachable) expect(document.querySelector(selector), selector).not.toBeNull();
  });
});
