import { STATES } from './aca';
import type { Adults, StateCode } from './aca';
import { formatCurrency } from './format';

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

/**
 * "a couple, both 50" or "a couple, both 50, in Texas": the household in one
 * phrase, with its state when it has one. No state is not named as such —
 * the national average is what the page opens on, not a place.
 */
export const householdPhrase = (adults: Adults, ages: number[], state: StateCode | null): string =>
  `${ADULTS_PROSE[adults]}, ${agesProse(ages)}${state === null ? '' : `, in ${STATES[state].name}`}`;

/** "1 child", "3 children", or nothing at all for none. */
export const childrenProse = (count: number): string =>
  count === 0 ? '' : `${count} ${count === 1 ? 'child' : 'children'}`;

/**
 * The household in one line, for the row it folds to on a narrow screen:
 * who is on the plan, where the premium comes from, and what it is.
 * "A couple, both 50 · national average · benchmark $1,747/mo", or
 * "One adult, aged 64, with 5 children · Texas · benchmark $2,739/mo".
 */
export function householdSummary(
  adults: Adults,
  ages: number[],
  dependents: number,
  state: StateCode | null,
  benchmarkMonthly: number,
): string {
  const who = `${ADULTS_PROSE[adults]}, ${agesProse(ages)}${
    dependents > 0 ? `, with ${childrenProse(dependents)}` : ''
  }`;
  const where = state === null ? 'national average' : STATES[state].name;
  const line = `${who} · ${where} · benchmark ${formatCurrency(benchmarkMonthly)}/mo`;
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** "one person", "2 people": the household as the poverty line counts it. */
export const householdProse = (size: number): string =>
  size === 1 ? 'one person' : `${size} people`;
