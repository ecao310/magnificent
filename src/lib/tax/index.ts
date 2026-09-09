/**
 * The tax chapter's public surface, in the order the return runs it: the
 * status, the schedule, the tax, and the tax and the premium together.
 */

export type { FilingStatus, TaxYear } from './types';

export type { Bracket, FilingYearParams, ChildTaxCreditParams, TaxYearParams } from './params';
export { TAX_YEAR_PARAMS, filingParams } from './params';

export { FILING_STATUSES, FILING_STATUS_PROSE, filingStatusFor } from './filing';

export {
  standardDeductionFor,
  taxableIncomeFor,
  bracketTax,
  bracketRateAt,
  childTaxCreditFor,
  incomeTaxFor,
  incomeTaxSlopeAt,
} from './incomeTax';

export type { AllInAssessment, RatePoint, RateCurveRange } from './allIn';
export { MIN_RATE_AXIS, premiumForRate, allInFor, rateCurve, rateAxis } from './allIn';
