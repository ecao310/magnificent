/**
 * The engine's public surface, in the order the year runs it: the household,
 * its premium, its credit, the curve through all of it.
 */

export type { CoverageYear } from './types';
export { COVERAGE_YEARS, PAGE_COVERAGE_YEAR, defaultCoverageYear } from './years';

export type { StateCode, StateParams, GuidelineRegion, AgeRating } from './states';
export { STATES, STATE_CODES, isStateCode } from './states';

export type { Adults, Scenario, ResolvedScenario } from './scenario';
export { DEFAULT_AGE, resolveScenario, expansionFor, adultAges, householdSizeFor } from './scenario';

export type { BenchmarkYearParams } from './premium';
export {
  AGE_CURVE,
  CHILD_AGE_FACTOR,
  TOP_AGE_FACTOR,
  MAX_RATED_CHILDREN,
  MIN_ADULT_AGE,
  MAX_ADULT_AGE,
  BENCHMARK_YEAR_PARAMS,
  BENCHMARK_REFERENCE_AGE,
  ageFactor,
  benchmarkAt40,
  averageBenchmarkMonthly,
  benchmarkMonthlyFor,
  benchmarkAnnualFor,
} from './premium';

export type {
  ApplicableBand,
  PovertyGuideline,
  PtcYearParams,
  SubsidyLine,
  PtcAssessment,
} from './ptc';
export {
  PTC_CLIFF_PERCENT,
  EXPANSION_FLOOR_MULTIPLE,
  STATUTORY_FLOOR_MULTIPLE,
  FPL_GUIDELINE_LOOKBACK_YEARS,
  FPL_YEAR_PARAMS,
  creditFloorMultiple,
  fplGuidelineYear,
  guidelineFor,
  guidelineRegionFor,
  povertyLine,
  povertyLineFor,
  perAdditionalPersonFor,
  fplMultipleOf,
  applicablePercentage,
  creditFloorMagi,
  ptcCliffMagi,
  expectedContribution,
  premiumTaxCredit,
  netPremiumAt,
  creditSlopeAt,
  creditLostBetween,
  cliffCost,
  subsidyLines,
  ptcFor,
} from './ptc';

export { toCents } from './money';

export type { CostPoint, CostCurveRange } from './curve';
export { costCurve } from './curve';

export { MIN_AXIS_MAGI, AXIS_ROUNDING, PAST_CLIFF, PAST_HERE, axisMax } from './axis';
