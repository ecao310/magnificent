/**
 * Chapter 1 of the code, as far as a household under 65 needs it: the rate
 * schedule, the standard deduction, and the long-term-gain stacking that runs
 * alongside it.
 *
 * `totalTax` is where the chain lands, and it is the only tax figure this app
 * quotes. The premium tax credit is not in it — that is a credit against the
 * premium, reconciled on Form 8962, and it has a module of its own — but the
 * two are added together everywhere the page prices a dollar, because the
 * reader pays both.
 */
import { filingParamsFor, resolveScenario } from './scenario';
import type { Scenario } from './scenario';

/**
 * The two halves the tax chain wants, at the reader's own point: what is
 * charged under the ordinary schedule and what is charged under the gains
 * schedule, with the block added to whichever half its kind names.
 */
export interface IncomeSplit {
  ordinary: number;
  gains: number;
}

/** The split at the reader's own point, block included. */
export function splitFor(scenario: Scenario = {}): IncomeSplit {
  const { ordinaryIncome, qualifiedIncome, added, addedKind } = resolveScenario(scenario);
  return {
    ordinary: ordinaryIncome + (addedKind === 'conversion' ? added : 0),
    gains: qualifiedIncome + (addedKind === 'harvest' ? added : 0),
  };
}

/**
 * The ordinary-income tax on an already-computed taxable income, under the
 * scenario's filing status and tax year.
 */
export function federalIncomeTax(taxableIncome: number, scenario: Scenario = {}): number {
  let tax = 0;
  let lower = 0;
  for (const { upTo, rate } of filingParamsFor(scenario).brackets) {
    if (taxableIncome <= lower) break;
    tax += (Math.min(taxableIncome, upTo) - lower) * rate;
    lower = upTo;
  }
  return tax;
}

/**
 * Total federal income tax on a given split, under the scenario's status and
 * year.
 *
 * Ordinary income fills the ordinary brackets first; the gains are then taxed
 * at their preferential rates, but the gain thresholds are measured against
 * the *full* taxable income, ordinary and gains together. So an ordinary
 * dollar added under a stack of gains does two things: it is taxed at its own
 * bracket, and it pushes the top dollar of the stack up through the 0% band's
 * ceiling — 12% plus 15% on one dollar, which is the stacking effect a Roth
 * conversion meets in a taxable-account household.
 *
 * The standard deduction offsets ordinary income first; whatever is left over
 * offsets the gains stacked on top of it. Form 1040 subtracts the deduction
 * from AGI once, and the Qualified Dividends and Capital Gain Tax Worksheet
 * caps the preferentially-taxed amount at total taxable income, so the gains
 * band is [ordinaryTaxable, totalTaxable] — narrower than the gains exactly
 * when ordinary income underruns the deduction.
 */
export function taxOnSplit({ ordinary, gains }: IncomeSplit, scenario: Scenario = {}): number {
  const { standardDeduction, ltcgBrackets } = filingParamsFor(scenario);
  const ordinaryTaxable = Math.max(0, ordinary - standardDeduction);
  const totalTaxable = Math.max(0, ordinary + gains - standardDeduction);

  let gainsTax = 0;
  let lower = 0;
  for (const { upTo, rate } of ltcgBrackets) {
    const bandStart = Math.max(ordinaryTaxable, lower);
    const bandEnd = Math.min(totalTaxable, upTo);
    if (bandEnd > bandStart) gainsTax += (bandEnd - bandStart) * rate;
    lower = upTo;
  }

  return federalIncomeTax(ordinaryTaxable, scenario) + gainsTax;
}

/** Total federal income tax at the reader's own point, block included. */
export function totalTax(scenario: Scenario = {}): number {
  return taxOnSplit(splitFor(scenario), scenario);
}

/**
 * Adjusted gross income at the reader's own point: everything on the return,
 * since nothing here is excluded from it.
 */
export function agiFor(scenario: Scenario = {}): number {
  const { ordinary, gains } = splitFor(scenario);
  return ordinary + gains;
}

/**
 * Household income for IRC 36B — the MAGI the credit is measured on — at the
 * reader's own point.
 *
 * 36B(d)(2)(B) takes AGI and adds back tax-exempt interest, excluded foreign
 * earnings and the untaxed part of any Social Security benefit. None of those
 * is a field here: a household this page is drawn for is under 65 and living
 * on a brokerage account and a conversion, and the page before this one has
 * the benefit and the interest for a reader who has either. So on this page
 * the two figures are the same number, and this is the name for it wherever
 * the credit is what is being asked about.
 */
export function householdIncomeFor(scenario: Scenario = {}): number {
  return agiFor(scenario);
}

/** Household income before the block: what the reader has regardless. */
export function baseIncomeFor(scenario: Scenario = {}): number {
  const { ordinaryIncome, qualifiedIncome } = resolveScenario(scenario);
  return ordinaryIncome + qualifiedIncome;
}
