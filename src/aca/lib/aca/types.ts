/**
 * The one primitive every other module in this directory is keyed by.
 *
 * A coverage year is the axis the whole engine is indexed along: the poverty
 * line, the applicable-percentage table and the benchmark premium are each a
 * table keyed by it. It lives on its own because everything depends on it and
 * it depends on nothing.
 */

/**
 * Every coverage year this app has published figures for, ascending.
 *
 * The list and the type are declared together and the type is read off the
 * list, so the two cannot disagree. Adding a year is one entry here, and in
 * the same edit every `Record<CoverageYear, …>` table the compiler reports is
 * a table that now has to carry a row for it — see `FPL_YEAR_PARAMS`,
 * `BENCHMARK_YEAR_PARAMS` and `BENCHMARK_AT_40`.
 */
export const COVERAGE_YEARS = [2025, 2026] as const;

/** A coverage year this app has published figures for. See `FPL_YEAR_PARAMS`. */
export type CoverageYear = (typeof COVERAGE_YEARS)[number];
