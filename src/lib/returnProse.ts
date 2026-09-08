import type { AddedKind, FilingStatus } from './tax';

/**
 * How a household is described in words, in the one place every description
 * of it can read.
 *
 * Each of these is said in at least two places — on the page and in the live
 * region that reads the same thing aloud, or in step 1's recap and again in
 * the close — and two hand-written copies are two chances to describe two
 * different households.
 */

/** How each status is labelled on the strip that asks for it. */
export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  mfj: 'Married Filing Jointly',
};

/** How each status reads inside a sentence. */
export const FILING_STATUS_PROSE: Record<FilingStatus, string> = {
  single: 'a single filer',
  mfj: 'a married couple filing jointly',
};

/** How each kind of block is labelled on the strip that asks for it. */
export const ADDED_KIND_LABELS: Record<AddedKind, string> = {
  conversion: 'Roth conversion',
  harvest: 'Harvested gain',
};

/** How each kind reads inside a sentence, after "as a". */
export const ADDED_KIND_PROSE: Record<AddedKind, string> = {
  conversion: 'a Roth conversion',
  harvest: 'a harvested gain',
};

/** The other kind, for the sentence that prices the block both ways. */
export const otherKind = (kind: AddedKind): AddedKind =>
  kind === 'conversion' ? 'harvest' : 'conversion';

/**
 * How the ages read inside a sentence: "aged 50", or "aged 52 and 48". A
 * couple of one age is still two people, so it is "both 50".
 */
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
