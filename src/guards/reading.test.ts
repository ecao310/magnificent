import { FURTHER_READING as TORPEDO_READING } from '../torpedo/lib/furtherReading';
import { FURTHER_READING as ACA_READING } from '../aca/lib/furtherReading';

/**
 * The two reading lists, held to the same shape.
 *
 * Each page keeps its own list in its own `lib/furtherReading.ts` and the
 * shared footer renders whichever it is handed, so nothing else reads both.
 * What a list owes a reader is the same on either page: a few pieces, each
 * somewhere else on the web over https, each named once and credited to
 * whoever published it. The torpedo's page suite asks more of its own list
 * in the rendered footer; this is the floor both lists stand on.
 */
const LISTS = [
  { name: 'the Tax Torpedo', readings: TORPEDO_READING },
  { name: 'the ACA Subsidy Slope', readings: ACA_READING },
];

describe.each(LISTS)('$name’s reading list', ({ readings }) => {
  it('is a few pieces, each somewhere else over https', () => {
    expect(readings.length).toBeGreaterThanOrEqual(3);
    for (const { href } of readings) {
      expect(href).toMatch(/^https:\/\//);
      expect(href).not.toContain('github.io');
      expect(href).not.toContain('netlify.app');
    }
  });

  it('names each piece once, and credits it', () => {
    expect(new Set(readings.map((r) => r.href)).size).toBe(readings.length);
    expect(new Set(readings.map((r) => r.title)).size).toBe(readings.length);
    for (const { title, source } of readings) {
      expect(title.trim().length).toBeGreaterThan(0);
      expect(source.trim().length).toBeGreaterThan(1);
    }
  });
});
