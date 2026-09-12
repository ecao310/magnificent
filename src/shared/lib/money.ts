/**
 * Rounds to whole cents, so premium arithmetic does not leak float dust.
 *
 * Both engines quote a few figures to the cent — Medicare's premiums, the
 * subsidy and the household's share of the benchmark, 36B's capped
 * contribution — because each is money somebody is actually billed, where a
 * tax figure is rounded to whole dollars on the return itself.
 *
 * Deliberately not applied to anything a rate curve reads. Each page takes a
 * marginal rate off a one-dollar difference, and half a cent of rounding
 * inside that figure would be half a percentage point on the chart.
 */
export function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}
