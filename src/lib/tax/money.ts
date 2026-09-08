/**
 * Rounds to whole cents, so premium arithmetic does not leak float dust.
 *
 * Applied to the credit and the household's share of the benchmark, which are
 * money somebody is actually billed, where a tax figure is rounded to whole
 * dollars on the return itself.
 *
 * Deliberately not applied to anything the rate curve reads. `slopeCurve`
 * takes a marginal rate off a one-dollar difference, so half a cent of
 * rounding inside that figure would be half a percentage point on the chart.
 */
export function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}
