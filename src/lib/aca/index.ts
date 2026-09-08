/**
 * The engine's public surface, in the order the year runs it: the household,
 * its premium, its credit, the curve through all of it.
 */

export type { CoverageYear } from './types';
export { COVERAGE_YEARS, PAGE_COVERAGE_YEAR, defaultCoverageYear } from './years';

export type { Adults, Scenario, ResolvedScenario } from './scenario';
export { DEFAULT_AGE, resolveScenario, adultAges, householdSizeFor } from './scenario';

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
  averageBenchmarkMonthly,
  benchmarkMonthlyFor,
  benchmarkAnnualFor,
} from './premium';

export type { ApplicableBand, PtcYearParams, CsrTier, SubsidyLine, PtcAssessment } from './ptc';
export {
  PTC_CLIFF_PERCENT,
  EXPANSION_FLOOR_MULTIPLE,
  STATUTORY_FLOOR_MULTIPLE,
  FPL_GUIDELINE_LOOKBACK_YEARS,
  FPL_YEAR_PARAMS,
  CSR_TIERS,
  creditFloorMultiple,
  fplGuidelineYear,
  povertyLine,
  povertyLineFor,
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
  csrTierFor,
  subsidyLines,
  ptcFor,
} from './ptc';

export type { CostPoint, CostCurveRange } from './curve';
export { costCurve } from './curve';

export { MIN_AXIS_MAGI, AXIS_ROUNDING, PAST_CLIFF, PAST_HERE, axisMax } from './axis';
