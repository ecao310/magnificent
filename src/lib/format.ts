/**
 * Every figure this app renders, in the shapes it renders them in.
 *
 * One module rather than one per caller, because the same figure appears in
 * more than one place and has to read the same way in all of them: a rate on
 * the chart's y-axis and the same rate in the sentence under the slider, a
 * dollar figure in a tooltip and the same figure in the close.
 */

/** Whole dollars, with the sign: what every figure on the page is quoted in. */
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

/**
 * A rate given as a fraction, to one decimal: `7.9%`.
 *
 * One place, because a second decimal is a figure nobody reads and a whole
 * number hides the thing the page is about — the share moving as income does.
 */
export const formatPercent = (rate: number): string => `${(rate * 100).toFixed(1)}%`;

/** The same rounding, read as cents given back per extra dollar earned. */
export const formatCents = (rate: number): string => `${(rate * 100).toFixed(1)}¢`;

/** A multiple of the poverty line, whole: 2.36 is `236%`. */
export const formatFpl = (multiple: number): string => `${Math.round(multiple * 100)}%`;

/** Short enough for an axis tick, and still money: $25,000 as `$25K`. */
export const formatAxisMoney = (value: number): string =>
  value === 0 ? '$0' : `$${Math.round(value / 1_000)}K`;
