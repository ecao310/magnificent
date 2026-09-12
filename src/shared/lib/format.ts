/**
 * The one figure both pages quote the same way: whole dollars, with the sign.
 *
 * Only this is shared. Each page has a `formatPercent` and a `formatCents` of
 * its own, and they disagree on purpose — the Tax Torpedo shows a marginal
 * rate to two decimals, because 22.2% and 22.22% are different claims about
 * a bracket; the Subsidy Slope shows a share of income to one, because a
 * second decimal there is a figure nobody reads. A shared helper would have
 * to pick one and be wrong on one page.
 */
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
