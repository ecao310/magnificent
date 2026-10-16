/**
 * The fifty states and the District, and the three things about each one
 * that move a figure on this page: what its benchmark plan costs, whether it
 * expanded Medicaid, and how it prices by age.
 *
 * Three publishers, two tables. The benchmark is KFF's, in
 * `BENCHMARK_AT_40`; the expansion status is KFF's tracker, and the age
 * rating is CMS's list of the states that do not use the federal curve —
 * whose own curves are in `ageCurves.ts` — both on each state's row in
 * `STATES`. Alaska and Hawaii also carry their own poverty guidelines — see
 * `guidelineFor` in `ptc.ts`.
 *
 * The benchmarks are a table per year, in the shape KFF publishes them — a
 * row per state — rather than a figure on each state's row. Adding a coverage
 * year is then one block of fifty-one numbers and nothing else: no helper
 * signature to widen, no call site to touch.
 *
 * Two figures in the table look wrong and are not. Alaska's benchmark fell
 * from 2025 to 2026 ($1,045 to $1,032) while every other state's rose, and
 * Arkansas's rose 69% ($458 to $774) against a national 26%. Both are what
 * KFF published from the filings; neither is a typo to correct.
 */
import type { CoverageYear } from './types';

/** The two-letter postal code of a state, or of the District. */
export type StateCode =
  | 'AK' | 'AL' | 'AR' | 'AZ' | 'CA' | 'CO' | 'CT' | 'DC' | 'DE' | 'FL'
  | 'GA' | 'HI' | 'IA' | 'ID' | 'IL' | 'IN' | 'KS' | 'KY' | 'LA' | 'MA'
  | 'MD' | 'ME' | 'MI' | 'MN' | 'MO' | 'MS' | 'MT' | 'NC' | 'ND' | 'NE'
  | 'NH' | 'NJ' | 'NM' | 'NV' | 'NY' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI'
  | 'SC' | 'SD' | 'TN' | 'TX' | 'UT' | 'VA' | 'VT' | 'WA' | 'WI' | 'WV'
  | 'WY';

/**
 * Which of HHS's three poverty guidelines a state reads. The contiguous 48
 * and DC share one; Alaska and Hawaii each have their own, higher.
 */
export type GuidelineRegion = 'contiguous' | 'alaska' | 'hawaii';

/**
 * How a state's insurers may price by age: on the federal default curve, on
 * a curve of the state's own, or not at all — New York and Vermont are
 * community rated, and a 25-year-old and a 64-year-old pay the same.
 */
export type AgeRating = 'default' | 'own' | 'none';

/** Everything the engine knows about one state besides its benchmark. */
export interface StateParams {
  code: StateCode;
  name: string;
  /**
   * Whether the state covers adults to 138% of the poverty line under the
   * ACA expansion, which is where the credit's floor sits. KFF, Status of
   * State Medicaid Expansion Decisions, as of August 2026: forty states and
   * DC have. Georgia and Wisconsin, which cover adults to 100% under waivers,
   * are counted as not expanded — between 100% and 138% their households are
   * on the Marketplace.
   */
  expandedMedicaid: boolean;
  /**
   * CMS, State Specific Age Curve Variations (45 CFR 147.102(e)). Six states
   * and DC rate on a curve of their own, each on file in `ageCurves.ts`; two
   * do not rate on age.
   */
  ageRating: AgeRating;
  guidelineRegion: GuidelineRegion;
}

const state = (
  code: StateCode,
  name: string,
  {
    expandedMedicaid = true,
    ageRating = 'default',
    guidelineRegion = 'contiguous',
  }: Partial<Pick<StateParams, 'expandedMedicaid' | 'ageRating' | 'guidelineRegion'>> = {},
): StateParams => ({
  code,
  name,
  expandedMedicaid,
  ageRating,
  guidelineRegion,
});

/** Every state, by code. */
export const STATES: Record<StateCode, StateParams> = {
  AK: state('AK', 'Alaska', { guidelineRegion: 'alaska' }),
  AL: state('AL', 'Alabama', { expandedMedicaid: false, ageRating: 'own' }),
  AR: state('AR', 'Arkansas'),
  AZ: state('AZ', 'Arizona'),
  CA: state('CA', 'California'),
  CO: state('CO', 'Colorado'),
  CT: state('CT', 'Connecticut'),
  DC: state('DC', 'District of Columbia', { ageRating: 'own' }),
  DE: state('DE', 'Delaware'),
  FL: state('FL', 'Florida', { expandedMedicaid: false }),
  GA: state('GA', 'Georgia', { expandedMedicaid: false }),
  HI: state('HI', 'Hawaii', { guidelineRegion: 'hawaii' }),
  IA: state('IA', 'Iowa'),
  ID: state('ID', 'Idaho'),
  IL: state('IL', 'Illinois'),
  IN: state('IN', 'Indiana'),
  KS: state('KS', 'Kansas', { expandedMedicaid: false }),
  KY: state('KY', 'Kentucky'),
  LA: state('LA', 'Louisiana'),
  MA: state('MA', 'Massachusetts', { ageRating: 'own' }),
  MD: state('MD', 'Maryland'),
  ME: state('ME', 'Maine'),
  MI: state('MI', 'Michigan'),
  MN: state('MN', 'Minnesota', { ageRating: 'own' }),
  MO: state('MO', 'Missouri'),
  MS: state('MS', 'Mississippi', { expandedMedicaid: false, ageRating: 'own' }),
  MT: state('MT', 'Montana'),
  NC: state('NC', 'North Carolina'),
  ND: state('ND', 'North Dakota'),
  NE: state('NE', 'Nebraska'),
  NH: state('NH', 'New Hampshire'),
  NJ: state('NJ', 'New Jersey'),
  NM: state('NM', 'New Mexico'),
  NV: state('NV', 'Nevada'),
  NY: state('NY', 'New York', { ageRating: 'none' }),
  OH: state('OH', 'Ohio'),
  OK: state('OK', 'Oklahoma'),
  OR: state('OR', 'Oregon', { ageRating: 'own' }),
  PA: state('PA', 'Pennsylvania'),
  RI: state('RI', 'Rhode Island'),
  SC: state('SC', 'South Carolina', { expandedMedicaid: false }),
  SD: state('SD', 'South Dakota'),
  TN: state('TN', 'Tennessee', { expandedMedicaid: false }),
  TX: state('TX', 'Texas', { expandedMedicaid: false }),
  UT: state('UT', 'Utah', { ageRating: 'own' }),
  VA: state('VA', 'Virginia'),
  VT: state('VT', 'Vermont', { ageRating: 'none' }),
  WA: state('WA', 'Washington'),
  WI: state('WI', 'Wisconsin', { expandedMedicaid: false }),
  WV: state('WV', 'West Virginia'),
  WY: state('WY', 'Wyoming', { expandedMedicaid: false }),
};

/**
 * The average monthly premium of the second-lowest-cost silver plan for a
 * 40-year-old, weighted by county plan selections, one table per coverage
 * year. KFF, Marketplace Average Benchmark Premiums,
 * https://www.kff.org/affordable-care-act/state-indicator/marketplace-average-benchmark-premiums/
 * — the state rows of the same table the national figure in `premium.ts` is
 * the US row of.
 *
 * `Record<CoverageYear, …>` makes the year exhaustive and
 * `Record<StateCode, …>` makes each year's table complete, so a year added to
 * `COVERAGE_YEARS` fails to compile until all fifty-one of its figures are
 * here.
 */
export const BENCHMARK_AT_40: Record<CoverageYear, Record<StateCode, number>> = {
  2025: {
    AK: 1_045, AL: 535, AR: 458, AZ: 410, CA: 512, CO: 463, CT: 693, DC: 578,
    DE: 534, FL: 515, GA: 493, HI: 493, IA: 429, ID: 436, IL: 474, IN: 382,
    KS: 513, KY: 442, LA: 524, MA: 447, MD: 365, ME: 546, MI: 404, MN: 363,
    MO: 489, MS: 485, MT: 554, NC: 507, ND: 537, NE: 600, NH: 325, NJ: 492,
    NM: 515, NV: 414, NY: 790, OH: 441, OK: 501, OR: 510, PA: 461, RI: 425,
    SC: 471, SD: 619, TN: 516, TX: 489, UT: 547, VA: 372, VT: 1_277, WA: 434,
    WI: 495, WV: 919, WY: 871,
  },
  2026: {
    AK: 1_032, AL: 645, AR: 774, AZ: 532, CA: 570, CO: 557, CT: 870, DC: 610,
    DE: 691, FL: 683, GA: 615, HI: 541, IA: 501, ID: 490, IL: 646, IN: 474,
    KS: 670, KY: 590, LA: 646, MA: 494, MD: 414, ME: 709, MI: 523, MN: 448,
    MO: 605, MS: 662, MT: 692, NC: 638, ND: 570, NE: 710, NH: 401, NJ: 545,
    NM: 623, NV: 497, NY: 817, OH: 513, OK: 604, OR: 543, PA: 572, RI: 506,
    SC: 564, SD: 655, TN: 711, TX: 661, UT: 640, VA: 455, VT: 1_299, WA: 612,
    WI: 611, WV: 1_073, WY: 1_090,
  },
};

/** Every code, in the order a list of names reads: alphabetical by name. */
export const STATE_CODES: StateCode[] = (Object.keys(STATES) as StateCode[]).sort((a, b) =>
  STATES[a].name.localeCompare(STATES[b].name, 'en'),
);

/** Whether a string is a code in the table. Case-sensitive: codes are upper. */
export function isStateCode(value: string): value is StateCode {
  return Object.prototype.hasOwnProperty.call(STATES, value);
}
