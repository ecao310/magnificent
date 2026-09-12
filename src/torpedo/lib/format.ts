/**
 * Every figure this page renders, in the shapes it renders them in.
 *
 * One module rather than one per caller, because the same figure appears in
 * more than one place and has to read the same way in all of them: a rate in
 * the chart's y-axis and the same rate in the sentence under the slider, a
 * dollar figure in a tooltip and the same figure in the close. `scenarioUrl`
 * is the reason this is not simply local to the page — it has to name the
 * bound it clamped a shared link to, "$62,172" rather than "62172".
 *
 * Whole dollars come from the site; the rates are this page's own. A
 * marginal rate is shown to two decimals, because 22.2% and 22.22% are
 * different claims about a bracket, where the Subsidy Slope's share of income
 * is shown to one — so the two pages keep their own `formatPercent` rather
 * than share one that would be wrong on one of them.
 */
export { formatCurrency } from '../../shared/lib/format';

/** A rate given as a fraction, rendered the way the chart axis renders it. */
export const formatPercent = (rate: number): string =>
  `${Math.round(rate * 10_000) / 100}%`;

/** A rate given as a fraction, rendered as cents lost per dollar earned. */
export const formatCents = (rate: number): string =>
  `${Math.round(rate * 10_000) / 100}¢`;

/** Short enough for an axis tick: $150,000 as `150K`. */
export const formatCompact = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
