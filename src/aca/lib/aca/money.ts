/**
 * Rounds to whole cents, so premium arithmetic does not leak float dust.
 *
 * Applied to the credit and the household's share of the benchmark where
 * they are quoted, which are money somebody is actually billed. Deliberately
 * not applied inside `creditSlopeAt`, which reads a one-dollar difference:
 * half a cent of rounding there would be half a percentage point on the page.
 */
export function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}
