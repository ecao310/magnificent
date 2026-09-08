/**
 * The federal income-tax figures one tax year is priced from, and the
 * accessors that reach them.
 *
 * This is the only module in the directory that holds no arithmetic: adding a
 * year is an entry in `TAX_YEAR_PARAMS` and nothing else. The poverty
 * guidelines, the applicable-percentage table and the benchmark premium are
 * years of their own, published by other agencies on other schedules — see
 * `ptc.ts` and `premium.ts` for why they are separate tables rather than
 * fields on this one.
 *
 * These figures are the ones the page before this one priced, less the Social
 * Security columns: nobody on a Marketplace plan is on Medicare, and a reader
 * who has started a benefit before 65 has the other page for what it does to
 * the tax base.
 */
import type { FilingStatus, TaxYear } from './types';

/** One rate band. `upTo` is the top of the band; the last band is Infinity. */
export interface Bracket {
  upTo: number;
  rate: number;
}

/** The inflation-adjusted figures for one filing status in one tax year. */
export interface FilingYearParams {
  /** Base standard deduction, IRC 63(c) as amended by the OBBBA. */
  standardDeduction: number;
  /** Ordinary-income rate schedule, IRC 1(j). */
  brackets: Bracket[];
  /**
   * Long-term capital gain and qualified dividend rate schedule, IRC 1(h).
   * The `upTo` values refer to total taxable income (ordinary + gains).
   */
  ltcgBrackets: Bracket[];
}

/** Everything about a tax year that this app needs from the autumn Rev. Proc. */
export interface TaxYearParams {
  year: TaxYear;
  /** Where the inflation-adjusted figures come from. */
  source: string;
  filing: Record<FilingStatus, FilingYearParams>;
}

/**
 * Federal parameters by tax year.
 *
 * Adding a year means adding one entry here; nothing downstream changes.
 */
export const TAX_YEAR_PARAMS: Record<TaxYear, TaxYearParams> = {
  2025: {
    year: 2025,
    source: 'Rev. Proc. 2024-40; OBBBA standard deductions',
    filing: {
      single: {
        standardDeduction: 15_750,
        brackets: [
          { upTo: 11_925, rate: 0.1 },
          { upTo: 48_475, rate: 0.12 },
          { upTo: 103_350, rate: 0.22 },
          { upTo: 197_300, rate: 0.24 },
          { upTo: 250_525, rate: 0.32 },
          { upTo: 626_350, rate: 0.35 },
          { upTo: Infinity, rate: 0.37 },
        ],
        ltcgBrackets: [
          { upTo: 48_350, rate: 0 },
          { upTo: 533_400, rate: 0.15 },
          { upTo: Infinity, rate: 0.2 },
        ],
      },
      mfj: {
        standardDeduction: 31_500,
        brackets: [
          { upTo: 23_850, rate: 0.1 },
          { upTo: 96_950, rate: 0.12 },
          { upTo: 206_700, rate: 0.22 },
          { upTo: 394_600, rate: 0.24 },
          { upTo: 501_050, rate: 0.32 },
          { upTo: 751_600, rate: 0.35 },
          { upTo: Infinity, rate: 0.37 },
        ],
        ltcgBrackets: [
          { upTo: 96_700, rate: 0 },
          { upTo: 600_050, rate: 0.15 },
          { upTo: Infinity, rate: 0.2 },
        ],
      },
    },
  },
  2026: {
    year: 2026,
    source: 'Rev. Proc. 2025-32',
    filing: {
      single: {
        standardDeduction: 16_100,
        // The OBBBA gave the bottom two brackets an extra inflation adjustment
        // (roughly 4% against 2.3% for the rest), so the 12% band widened by
        // more than the bands above it.
        brackets: [
          { upTo: 12_400, rate: 0.1 },
          { upTo: 50_400, rate: 0.12 },
          { upTo: 105_700, rate: 0.22 },
          { upTo: 201_775, rate: 0.24 },
          { upTo: 256_225, rate: 0.32 },
          { upTo: 640_600, rate: 0.35 },
          { upTo: Infinity, rate: 0.37 },
        ],
        ltcgBrackets: [
          { upTo: 49_450, rate: 0 },
          { upTo: 545_500, rate: 0.15 },
          { upTo: Infinity, rate: 0.2 },
        ],
      },
      mfj: {
        standardDeduction: 32_200,
        brackets: [
          { upTo: 24_800, rate: 0.1 },
          { upTo: 100_800, rate: 0.12 },
          { upTo: 211_400, rate: 0.22 },
          { upTo: 403_550, rate: 0.24 },
          { upTo: 512_450, rate: 0.32 },
          { upTo: 768_700, rate: 0.35 },
          { upTo: Infinity, rate: 0.37 },
        ],
        ltcgBrackets: [
          { upTo: 98_900, rate: 0 },
          { upTo: 613_700, rate: 0.15 },
          { upTo: Infinity, rate: 0.2 },
        ],
      },
    },
  },
};

/** Every year this app has figures for, ascending. */
export const TAX_YEARS: TaxYear[] = [2025, 2026];

/**
 * Every filing status this app prices, in the order they are offered.
 *
 * The inhabitants of `FilingStatus`, written out: a union cannot be iterated,
 * and the strip that asks the question and the link that carries the answer
 * both need to walk the same list in the same order.
 */
export const FILING_STATUSES: FilingStatus[] = ['single', 'mfj'];

/**
 * The one year the page prices.
 *
 * A constant rather than `defaultTaxYear()`, for the reason the page before
 * this one gave: that function follows the wall calendar, so a page built on
 * it would silently re-price itself the January after a new year's Rev. Proc.
 * landed, and a link sent in December would mean something different in
 * January. A constant means the year moves when someone changes this line,
 * which is the same moment they check the figures.
 *
 * The year matters more here than it did there. 2026 is the first year since
 * 2020 with a 400% cliff in it, and the applicable-percentage table that sets
 * the slope under the cliff roughly doubled from the 2025 one. Every module
 * stays parameterized by year regardless — the engine prices both years on
 * file and the tests exercise both — so the contrast is one line away.
 */
export const PAGE_TAX_YEAR: TaxYear = 2026;

/**
 * The year to start on: the calendar year, when there are figures for it.
 *
 * Clamped into `TAX_YEARS` rather than left to fail, so the engine keeps
 * working in January of a year whose Rev. Proc. has not been published yet.
 */
export function defaultTaxYear(calendarYear = new Date().getFullYear()): TaxYear {
  const first = TAX_YEARS[0];
  const last = TAX_YEARS[TAX_YEARS.length - 1];
  if (calendarYear <= first) return first;
  if (calendarYear >= last) return last;
  return TAX_YEARS.find((y) => y === calendarYear) ?? last;
}

/** The parameters for one tax year. */
export function taxYearParams(year: TaxYear = defaultTaxYear()): TaxYearParams {
  return TAX_YEAR_PARAMS[year];
}

/** The parameters for one filing status in one tax year. */
export function filingParams(
  year: TaxYear = defaultTaxYear(),
  filingStatus: FilingStatus = 'single',
): FilingYearParams {
  return TAX_YEAR_PARAMS[year].filing[filingStatus];
}
