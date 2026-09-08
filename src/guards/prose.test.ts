import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The page's own words, read off the source: no escape sequence or stray
 * markup sitting in prose the reader can see.
 */
const tsxUnder = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? tsxUnder(join(dir, entry.name))
      : entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')
        ? [join(dir, entry.name)]
        : [],
  );

const files = tsxUnder(resolve(process.cwd(), 'src/components'));

describe('the page’s own words', () => {
  it('leave no literal escape in JSX text', () => {
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      // JSX text between tags, roughly: anything after a `>` up to the next `<`.
      const segments = text.match(/>[^<{}]*</g) ?? [];
      for (const segment of segments) {
        expect(segment, `${file}: ${segment}`).not.toMatch(/\\n|\\t|&amp;amp;/);
      }
    }
  });

  it('use typographic quotes in prose, and no double space', () => {
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      const segments = text.match(/>[^<{}]*</g) ?? [];
      for (const segment of segments) {
        expect(segment, `${file}: ${segment}`).not.toMatch(/\w {2}\w/);
        expect(segment, `${file}: ${segment}`).not.toMatch(/\s"[^"]+"\s/);
      }
    }
  });

  it('name the year from the constant rather than by hand in a control label', () => {
    const household = readFileSync(resolve(process.cwd(), 'src/components/HouseholdStep.tsx'), 'utf8');
    const labels = household.match(/<label[^>]*>[^<]*<\/label>/g) ?? [];
    for (const label of labels) expect(label).not.toMatch(/20\d\d/);
  });
});
