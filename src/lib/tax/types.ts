/**
 * The three primitives every other module in this directory is keyed by.
 *
 * They live on their own because everything depends on them and they depend on
 * nothing: a status, a year and a kind of dollar are the axes the whole engine
 * is indexed along, so putting them anywhere with an implementation in it
 * would make that file the root of the import graph for reasons having
 * nothing to do with what it computes.
 */

/**
 * The filing statuses this app prices.
 *
 * Two of the code's four, for the reason the page before this one gave: a
 * head of household and a separate return each cost a bracket table, a
 * standard deduction and a paragraph per explainer, for returns almost nobody
 * who opens a page about the Marketplace files. Everything downstream is
 * exhaustive over this union, so adding one back is adding it here and fixing
 * every `Record<FilingStatus, …>` the compiler then reports.
 */
export type FilingStatus = 'single' | 'mfj';

/** A tax year this app has published figures for. See `TAX_YEAR_PARAMS`. */
export type TaxYear = 2025 | 2026;

/**
 * What the next dollar is.
 *
 * The whole page turns on this distinction. A Roth conversion is ordinary
 * income and is charged under the ordinary schedule; a harvested gain is a
 * long-term capital gain and is charged under its own, which starts at 0%.
 * Household income under IRC 36B does not care which — a dollar is a dollar to
 * the premium tax credit — so the two curves the page draws share their slope
 * and differ only in the tax stacked on top of it.
 */
export type AddedKind = 'conversion' | 'harvest';
