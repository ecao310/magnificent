import type { Adults } from './aca';

/**
 * How a household is described in words, in the one place every description
 * of it can read. Each of these is said in at least two places — on the page
 * and in the live region that reads the same thing aloud, or in step 1's
 * recap and again in the close — and two hand-written copies are two chances
 * to describe two different households.
 */

/** How the adults are labelled on the strip that asks for them. */
export const ADULTS_LABELS: Record<Adults, string> = {
  1: 'One adult',
  2: 'Two adults',
};

/** How the adults read inside a sentence. */
export const ADULTS_PROSE: Record<Adults, string> = {
  1: 'one adult',
  2: 'a couple',
};

/** How the ages read inside a sentence: "aged 50", "both 50", or "aged 52 and 48". */
export const agesProse = (ages: number[]): string =>
  ages.length === 1
    ? `aged ${ages[0]}`
    : ages[0] === ages[1]
      ? `both ${ages[0]}`
      : `aged ${ages[0]} and ${ages[1]}`;

/** "one person", "2 people": the household as the poverty line counts it. */
export const householdProse = (size: number): string =>
  size === 1 ? 'one person' : `${size} people`;

/**
 * The separator that goes before item `i` of an `n`-item English list: nothing,
 * then ", ", then " and " or ", and " in front of the last one.
 */
export const listSeparator = (i: number, n: number): string =>
  i === 0 ? '' : i < n - 1 ? ', ' : n > 2 ? ', and ' : ' and ';

/** The list as flat text, for anything read aloud rather than looked at. */
export function joinProse(parts: string[]): string {
  return parts.map((part, i) => listSeparator(i, parts.length) + part).join('');
}
