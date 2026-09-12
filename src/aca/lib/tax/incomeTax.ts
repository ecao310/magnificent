/**
 * Federal income tax on the household's income, priced the short way a
 * return with nothing unusual on it is priced: the standard deduction off
 * the top, the rate schedule on what is left, and the child tax credit off
 * the result.
 *
 * The income is the same figure the subsidy is measured on — the modified
 * AGI of 36B(d)(2) — taken as all ordinary and all in AGI. What that leaves
 * out is listed on the page; what it keeps is the part of the return that
 * every household on the page has.
 */
import { resolveScenario } from '../aca';
import type { Scenario } from '../aca';
import { filingStatusFor } from './filing';
import { TAX_YEAR_PARAMS, filingParams } from './params';
import type { FilingStatus, TaxYear } from './types';

/** The standard deduction this household takes, IRC 63(c). */
export function standardDeductionFor(scenario: Scenario = {}): number {
  const { year } = resolveScenario(scenario);
  return filingParams(year, filingStatusFor(scenario)).standardDeduction;
}

/** Income after the standard deduction, never below zero: what the schedule is applied to. */
export function taxableIncomeFor(magi: number, scenario: Scenario = {}): number {
  return Math.max(0, magi - standardDeductionFor(scenario));
}

/** The rate schedule applied to a taxable income, band by band. */
export function bracketTax(taxableIncome: number, year: TaxYear, filingStatus: FilingStatus): number {
  let tax = 0;
  let lower = 0;
  for (const { upTo, rate } of filingParams(year, filingStatus).brackets) {
    if (taxableIncome <= lower) break;
    tax += (Math.min(taxableIncome, upTo) - lower) * rate;
    lower = upTo;
  }
  return tax;
}

/**
 * The rate of the band the household's last dollar of taxable income falls
 * in — the figure a reader means by "my bracket". Zero under the standard
 * deduction, where no band has been reached. Not the rate on the next
 * dollar, which the child tax credit's phase-out can raise; that is
 * `incomeTaxSlopeAt`.
 */
export function bracketRateAt(magi: number, scenario: Scenario = {}): number {
  const { year } = resolveScenario(scenario);
  const taxable = taxableIncomeFor(magi, scenario);
  if (taxable <= 0) return 0;
  const { brackets } = filingParams(year, filingStatusFor(scenario));
  return (brackets.find((band) => taxable <= band.upTo) ?? brackets[brackets.length - 1]).rate;
}

/**
 * The child tax credit before the tax it can offset: one credit per child,
 * phased out at 5 cents on the dollar over the threshold for the return.
 *
 * Every child on the plan is taken to qualify — under 17 at the end of the
 * year, and at home for more than half of it. The credit is claimed only
 * against tax: the refundable part of it, the additional child tax credit
 * of 24(d), is left out with the rest of the refundable credits, so the tax
 * on the page never goes below zero. See `incomeTaxFor`.
 */
export function childTaxCreditFor(magi: number, scenario: Scenario = {}): number {
  const { year, dependents } = resolveScenario(scenario);
  if (dependents === 0) return 0;
  const { perChild, phaseoutStart, phaseoutRate } = TAX_YEAR_PARAMS[year].childTaxCredit;
  const excess = Math.max(0, magi - phaseoutStart[filingStatusFor(scenario)]);
  return Math.max(0, perChild * dependents - phaseoutRate * excess);
}

/**
 * Federal income tax for the year at a household income: the schedule on
 * income after the standard deduction, less the child tax credit, never
 * below zero.
 *
 * Unrounded, because `incomeTaxSlopeAt` reads a one-dollar difference off
 * it. Round it where it is quoted.
 */
export function incomeTaxFor(magi: number, scenario: Scenario = {}): number {
  const { year } = resolveScenario(scenario);
  const tax = bracketTax(taxableIncomeFor(magi, scenario), year, filingStatusFor(scenario));
  return Math.max(0, tax - childTaxCreditFor(magi, scenario));
}

/**
 * Income tax on the next dollar of household income, as a fraction of it.
 *
 * Read off a one-dollar difference rather than from the bracket, because
 * the bracket is not the whole price: over $200,000 ($400,000 on a joint
 * return) the same dollar takes 5 cents of child tax credit with it.
 */
export function incomeTaxSlopeAt(magi: number, scenario: Scenario = {}): number {
  return Math.max(0, incomeTaxFor(magi + 1, scenario) - incomeTaxFor(magi, scenario));
}
