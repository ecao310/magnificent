/**
 * Which years are on file, and which one the page prices.
 */
import type { CoverageYear } from './types';

/** Every coverage year this app has figures for, ascending. */
export const COVERAGE_YEARS: CoverageYear[] = [2025, 2026];

/**
 * The one year the page prices.
 *
 * A constant rather than `defaultCoverageYear()`: that function follows the
 * wall calendar, so a page built on it would silently re-price itself the
 * January after a new year's figures landed, and a link sent in December
 * would mean something different in January. A constant means the year moves
 * when someone changes this line, which is the same moment they check the
 * figures.
 *
 * The year matters here. 2026 is the first year since 2020 with a 400% cliff
 * in it, and the applicable-percentage table that sets the slope under the
 * cliff roughly doubled from the 2025 one. Every module stays parameterized
 * by year regardless — the engine prices both years on file and the tests
 * exercise both — so the contrast is one line away.
 */
export const PAGE_COVERAGE_YEAR: CoverageYear = 2026;

/**
 * The year to start on: the calendar year, when there are figures for it,
 * clamped into `COVERAGE_YEARS` otherwise.
 */
export function defaultCoverageYear(calendarYear = new Date().getFullYear()): CoverageYear {
  const first = COVERAGE_YEARS[0];
  const last = COVERAGE_YEARS[COVERAGE_YEARS.length - 1];
  if (calendarYear <= first) return first;
  if (calendarYear >= last) return last;
  return COVERAGE_YEARS.find((y) => y === calendarYear) ?? last;
}
