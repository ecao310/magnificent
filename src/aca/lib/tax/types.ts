/**
 * The two primitives the tax chapter is keyed by.
 *
 * The tax year is the coverage year: the page prices one year, and the
 * income that sets the subsidy is the income the return is filed on. One
 * alias rather than a second union, so a year added to the engine is added
 * once, in `src/lib/aca/types.ts`, and both tables are then expected to
 * have a row for it.
 */
import type { CoverageYear } from '../aca';

/** A year the rate schedule is on file for: the same years the subsidy is. */
export type TaxYear = CoverageYear;

/**
 * The filing statuses a household on this page can have. Derived, not
 * asked: two adults on one plan file jointly, one adult with children is a
 * head of household, and one adult alone is single. See `filingStatusFor`.
 */
export type FilingStatus = 'single' | 'hoh' | 'mfj';
