/**
 * The fifty states and the District, and the three things about each one
 * that move a figure on this page: what its benchmark plan costs, whether it
 * expanded Medicaid, and how it prices by age.
 *
 * Three publishers, one table. The benchmark is KFF's, the expansion status
 * is KFF's tracker, and the age rating is CMS's list of the states that do
 * not use the federal curve — whose own curves are in `ageCurves.ts`.
 * Alaska and Hawaii also carry their own poverty guidelines — see
 * `guidelineFor` in `ptc.ts`.
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

/** Everything the engine knows about one state. */
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
  /**
   * The average monthly premium of the second-lowest-cost silver plan for a
   * 40-year-old, weighted by county plan selections. KFF, Marketplace
   * Average Benchmark Premiums,
   * https://www.kff.org/affordable-care-act/state-indicator/marketplace-average-benchmark-premiums/
   * — the state rows of the same table the national figure in `premium.ts`
   * is the US row of.
   */
  benchmarkAt40: Record<CoverageYear, number>;
}

const state = (
  code: StateCode,
  name: string,
  benchmark2025: number,
  benchmark2026: number,
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
  benchmarkAt40: { 2025: benchmark2025, 2026: benchmark2026 },
});

/** Every state, by code. */
export const STATES: Record<StateCode, StateParams> = {
  AK: state('AK', 'Alaska', 1_045, 1_032, { guidelineRegion: 'alaska' }),
  AL: state('AL', 'Alabama', 535, 645, { expandedMedicaid: false, ageRating: 'own' }),
  AR: state('AR', 'Arkansas', 458, 774),
  AZ: state('AZ', 'Arizona', 410, 532),
  CA: state('CA', 'California', 512, 570),
  CO: state('CO', 'Colorado', 463, 557),
  CT: state('CT', 'Connecticut', 693, 870),
  DC: state('DC', 'District of Columbia', 578, 610, { ageRating: 'own' }),
  DE: state('DE', 'Delaware', 534, 691),
  FL: state('FL', 'Florida', 515, 683, { expandedMedicaid: false }),
  GA: state('GA', 'Georgia', 493, 615, { expandedMedicaid: false }),
  HI: state('HI', 'Hawaii', 493, 541, { guidelineRegion: 'hawaii' }),
  IA: state('IA', 'Iowa', 429, 501),
  ID: state('ID', 'Idaho', 436, 490),
  IL: state('IL', 'Illinois', 474, 646),
  IN: state('IN', 'Indiana', 382, 474),
  KS: state('KS', 'Kansas', 513, 670, { expandedMedicaid: false }),
  KY: state('KY', 'Kentucky', 442, 590),
  LA: state('LA', 'Louisiana', 524, 646),
  MA: state('MA', 'Massachusetts', 447, 494, { ageRating: 'own' }),
  MD: state('MD', 'Maryland', 365, 414),
  ME: state('ME', 'Maine', 546, 709),
  MI: state('MI', 'Michigan', 404, 523),
  MN: state('MN', 'Minnesota', 363, 448, { ageRating: 'own' }),
  MO: state('MO', 'Missouri', 489, 605),
  MS: state('MS', 'Mississippi', 485, 662, { expandedMedicaid: false, ageRating: 'own' }),
  MT: state('MT', 'Montana', 554, 692),
  NC: state('NC', 'North Carolina', 507, 638),
  ND: state('ND', 'North Dakota', 537, 570),
  NE: state('NE', 'Nebraska', 600, 710),
  NH: state('NH', 'New Hampshire', 325, 401),
  NJ: state('NJ', 'New Jersey', 492, 545),
  NM: state('NM', 'New Mexico', 515, 623),
  NV: state('NV', 'Nevada', 414, 497),
  NY: state('NY', 'New York', 790, 817, { ageRating: 'none' }),
  OH: state('OH', 'Ohio', 441, 513),
  OK: state('OK', 'Oklahoma', 501, 604),
  OR: state('OR', 'Oregon', 510, 543, { ageRating: 'own' }),
  PA: state('PA', 'Pennsylvania', 461, 572),
  RI: state('RI', 'Rhode Island', 425, 506),
  SC: state('SC', 'South Carolina', 471, 564, { expandedMedicaid: false }),
  SD: state('SD', 'South Dakota', 619, 655),
  TN: state('TN', 'Tennessee', 516, 711, { expandedMedicaid: false }),
  TX: state('TX', 'Texas', 489, 661, { expandedMedicaid: false }),
  UT: state('UT', 'Utah', 547, 640, { ageRating: 'own' }),
  VA: state('VA', 'Virginia', 372, 455),
  VT: state('VT', 'Vermont', 1_277, 1_299, { ageRating: 'none' }),
  WA: state('WA', 'Washington', 434, 612),
  WI: state('WI', 'Wisconsin', 495, 611, { expandedMedicaid: false }),
  WV: state('WV', 'West Virginia', 919, 1_073),
  WY: state('WY', 'Wyoming', 871, 1_090, { expandedMedicaid: false }),
};

/** Every code, in the order a list of names reads: alphabetical by name. */
export const STATE_CODES: StateCode[] = (Object.keys(STATES) as StateCode[]).sort((a, b) =>
  STATES[a].name.localeCompare(STATES[b].name, 'en'),
);

/** Whether a string is a code in the table. Case-sensitive: codes are upper. */
export function isStateCode(value: string): value is StateCode {
  return Object.prototype.hasOwnProperty.call(STATES, value);
}
