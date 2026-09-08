import type { Adults } from './aca';

/**
 * How a household is described in words, in the one place every description
 * of it can read. Each of these is said in at least two places — on the page
 * and in the live region that reads the same thing aloud, or under the
 * figures and again in a note — and two hand-written copies are two chances
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
