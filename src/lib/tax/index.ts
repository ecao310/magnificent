/**
 * The engine's public surface, in the order the year runs it: the household,
 * its premium, its credit, its tax, the curve through all of it.
 *
 * Everything a page, a script or a test asks this directory for comes through
 * here, so that the modules behind it can be re-cut without a caller noticing.
 */

export type { AddedKind, FilingStatus, TaxYear } from './types';

export type { Bracket, FilingYearParams, TaxYearParams } from './params';
export {
  TAX_YEAR_PARAMS,
  TAX_YEARS,
  FILING_STATUSES,
  PAGE_TAX_YEAR,
  defaultTaxYear,
  taxYearParams,
  filingParams,
} from './params';

export type { Scenario, ResolvedScenario } from './scenario';
export {
  DEFAULT_AGE,
  resolveScenario,
  filingParamsFor,
  adultCount,
  adultAges,
  householdSizeFor,
} from './scenario';

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

export type { IncomeSplit } from './income';
export {
  splitFor,
  federalIncomeTax,
  taxOnSplit,
  totalTax,
  agiFor,
  householdIncomeFor,
  baseIncomeFor,
} from './income';

export type {
  ApplicableBand,
  PtcYearParams,
  CsrTier,
  SubsidyLine,
  PtcAssessment,
} from './ptc';
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
  creditSlopeAt,
  cliffCost,
  csrTierFor,
  subsidyLines,
  ptcFor,
} from './ptc';

export type { NextDollar, SlopePoint, SlopeCurveRange, BlockCost } from './curve';
export { splitAt, nextDollarAt, slopeCurve, blockCost } from './curve';

export {
  MIN_AXIS_MAGI,
  AXIS_ROUNDING,
  PAST_CLIFF,
  PAST_HERE,
  axisMax,
} from './axis';
