/**
 * The federal figures one tax year is priced from: the standard deduction,
 * the rate schedule, and the child tax credit, by filing status.
 *
 * The only module in this directory that holds no arithmetic. Adding a year
 * is an entry here and nothing else.
 */
import type { FilingStatus, TaxYear } from './types';

/** One rate band. `upTo` is the top of the band in taxable income; the last band is Infinity. */
export interface Bracket {
  upTo: number;
  rate: number;
}

/** The inflation-adjusted figures for one filing status in one tax year. */
export interface FilingYearParams {
  /** IRC 63(c), as amended by section 70102 of the One Big Beautiful Bill Act. */
  standardDeduction: number;
  /** The ordinary-income rate schedule, IRC 1(j). */
  brackets: Bracket[];
}

/**
 * The child tax credit, IRC 24, as one figure per child and a phase-out.
 *
 * The phase-out in the statute is $50 for each $1,000, or fraction of it,
 * that modified AGI runs over the threshold. The engine draws it as the 5%
 * line those steps approximate, the way the subsidy is drawn as the line
 * Form 8962's rounding approximates: a step of $50 read as a one-dollar
 * difference would put a 5,000% marginal rate on the page.
 */
export interface ChildTaxCreditParams {
  perChild: number;
  /** Modified AGI over which the credit starts to go: 24(b)(2), not indexed. */
  phaseoutStart: Record<FilingStatus, number>;
  /** Credit given back per dollar over the threshold. */
  phaseoutRate: number;
}

/** Everything about a tax year this page needs. */
export interface TaxYearParams {
  source: string;
  filing: Record<FilingStatus, FilingYearParams>;
  childTaxCredit: ChildTaxCreditParams;
}

/**
 * The phase-out of the child tax credit does not move with inflation:
 * 24(b)(2) names $400,000 for a joint return and $200,000 for every other,
 * and 24(h)(3) fixed both through 2025 before the OBBBA made them permanent.
 */
const CHILD_TAX_CREDIT_PHASEOUT: Record<FilingStatus, number> = {
  single: 200_000,
  hoh: 200_000,
  mfj: 400_000,
};

/**
 * Federal parameters by tax year.
 *
 * The 2025 standard deductions are the OBBBA's, which raised them for 2025
 * after Rev. Proc. 2024-40 had published smaller ones; the brackets are the
 * revenue procedure's. The 2026 figures are Rev. Proc. 2025-32's, the first
 * set indexed under the OBBBA, which gave the bottom two brackets an extra
 * inflation adjustment and so widened the 12% band by more than the bands
 * above it. The child tax credit is $2,200 in both years: section 70104 set
 * it there for 2025 and indexed it from 2026, and the first indexation
 * rounds back to $2,200.
 */
export const TAX_YEAR_PARAMS: Record<TaxYear, TaxYearParams> = {
  2025: {
    source: 'Rev. Proc. 2024-40 brackets; standard deductions and child tax credit per Pub. L. 119-21 sections 70102 and 70104',
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
      },
      hoh: {
        standardDeduction: 23_625,
        brackets: [
          { upTo: 17_000, rate: 0.1 },
          { upTo: 64_850, rate: 0.12 },
          { upTo: 103_350, rate: 0.22 },
          { upTo: 197_300, rate: 0.24 },
          { upTo: 250_500, rate: 0.32 },
          { upTo: 626_350, rate: 0.35 },
          { upTo: Infinity, rate: 0.37 },
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
      },
    },
    childTaxCredit: {
      perChild: 2_200,
      phaseoutStart: CHILD_TAX_CREDIT_PHASEOUT,
      phaseoutRate: 0.05,
    },
  },
  2026: {
    source: 'Rev. Proc. 2025-32 sections 3.01, 3.04 and 3.16',
    filing: {
      single: {
        standardDeduction: 16_100,
        brackets: [
          { upTo: 12_400, rate: 0.1 },
          { upTo: 50_400, rate: 0.12 },
          { upTo: 105_700, rate: 0.22 },
          { upTo: 201_775, rate: 0.24 },
          { upTo: 256_225, rate: 0.32 },
          { upTo: 640_600, rate: 0.35 },
          { upTo: Infinity, rate: 0.37 },
        ],
      },
      hoh: {
        standardDeduction: 24_150,
        brackets: [
          { upTo: 17_700, rate: 0.1 },
          { upTo: 67_450, rate: 0.12 },
          { upTo: 105_700, rate: 0.22 },
          { upTo: 201_775, rate: 0.24 },
          // $256,200, not the $256,225 of a single return: the two tables
          // are indexed separately and round separately.
          { upTo: 256_200, rate: 0.32 },
          { upTo: 640_600, rate: 0.35 },
          { upTo: Infinity, rate: 0.37 },
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
      },
    },
    childTaxCredit: {
      perChild: 2_200,
      phaseoutStart: CHILD_TAX_CREDIT_PHASEOUT,
      phaseoutRate: 0.05,
    },
  },
};

/** The parameters for one filing status in one tax year. */
export function filingParams(year: TaxYear, filingStatus: FilingStatus): FilingYearParams {
  return TAX_YEAR_PARAMS[year].filing[filingStatus];
}
