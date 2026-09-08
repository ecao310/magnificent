/**
 * The one primitive every other module in this directory is keyed by.
 *
 * A coverage year is the axis the whole engine is indexed along: the poverty
 * line, the applicable-percentage table and the benchmark premium are each a
 * table keyed by it. It lives on its own because everything depends on it and
 * it depends on nothing.
 */

/** A coverage year this app has published figures for. See `FPL_YEAR_PARAMS`. */
export type CoverageYear = 2025 | 2026;
