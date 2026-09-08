/**
 * The household every other module in this directory prices, and the defaults
 * it is read through.
 *
 * Nothing here computes tax or a credit. What it does is settle the question
 * every function downstream would otherwise have to answer for itself — what
 * an unset field means — in one place, so that a scenario is a complete
 * household by the time any arithmetic sees it.
 */
import type { AddedKind, FilingStatus, TaxYear } from './types';
import { defaultTaxYear, filingParams } from './params';
import type { FilingYearParams } from './params';

/** The age the page opens on: some way short of Medicare, where the credit ends. */
export const DEFAULT_AGE = 50;

/**
 * Every input a scenario has, as named fields.
 *
 * Every field is optional and defaults to the un-set case: no income, nothing
 * added, a conversion if something is, filing single, one adult at
 * `DEFAULT_AGE`, no dependents, the national-average benchmark, a state that
 * expanded Medicaid, the current tax year.
 */
export interface Scenario {
  /**
   * Ordinary income the household has before it decides anything: interest,
   * part-time wages, a pension, rent, non-qualified dividends. The base the
   * block is added to, charged under the ordinary schedule.
   */
  ordinaryIncome?: number;
  /**
   * Qualified dividends and long-term gains the household has before it
   * decides anything — what a taxable brokerage account throws off. Charged
   * under IRC 1(h), stacked on top of the ordinary income.
   */
  qualifiedIncome?: number;
  /** The block being decided: how much to convert or harvest this year. */
  added?: number;
  /** What the block is. See `AddedKind`. */
  addedKind?: AddedKind;
  filingStatus?: FilingStatus;
  /**
   * The adults on the plan, by age: `[filer]` or `[filer, spouse]`. Ages set
   * the benchmark premium — see `premium.ts` — and nothing else; the tax code
   * does not ask until 65, and at 65 the credit is gone. A list shorter than
   * the filing status implies is padded with its first entry, so a joint
   * return with one age given is a couple of the same age.
   */
  ages?: number[];
  /**
   * Children on the plan and on the return. Each one moves the poverty line
   * by one person and adds a child's premium to the benchmark; what a
   * dependent does to the tax — the child tax credit, most of all — is not
   * priced here.
   */
  dependents?: number;
  /**
   * The benchmark silver premium, monthly, for the household's ages and
   * county; `null` to derive one from the ages and the national average. The
   * one figure on this page that is a fact about where the reader lives
   * rather than about the tax code, and the reason the page before this one
   * could draw the cliff but not price it.
   */
  benchmarkPremium?: number | null;
  /**
   * Whether the household's state expanded Medicaid. Forty states and DC
   * have, so it is the default; in those states the credit begins at 138% of
   * the poverty line rather than 100%, and below the line the household is on
   * Medicaid. See `creditFloorMultiple`.
   */
  expansionState?: boolean;
  /** Which year's brackets, table and poverty line to use. */
  year?: TaxYear;
}

/** A scenario with every default filled in. `benchmarkPremium` stays nullable. */
export type ResolvedScenario = Required<Omit<Scenario, 'benchmarkPremium'>> & {
  benchmarkPremium: number | null;
};

/**
 * Fills in the defaults. Written out field by field rather than spread over a
 * defaults object, because `{ ...DEFAULTS, ...scenario }` would let an explicit
 * `{ added: undefined }` overwrite the default with `undefined`.
 */
export function resolveScenario(scenario: Scenario = {}): ResolvedScenario {
  const filingStatus = scenario.filingStatus ?? 'single';
  return {
    ordinaryIncome: scenario.ordinaryIncome ?? 0,
    qualifiedIncome: scenario.qualifiedIncome ?? 0,
    added: scenario.added ?? 0,
    addedKind: scenario.addedKind ?? 'conversion',
    filingStatus,
    ages: adultAges(filingStatus, scenario.ages),
    dependents: Math.max(0, Math.floor(scenario.dependents ?? 0)),
    benchmarkPremium: scenario.benchmarkPremium ?? null,
    expansionState: scenario.expansionState ?? true,
    year: scenario.year ?? defaultTaxYear(),
  };
}

/** The same, read straight off a scenario. */
export function filingParamsFor(scenario: Scenario = {}): FilingYearParams {
  const { year, filingStatus } = resolveScenario(scenario);
  return filingParams(year, filingStatus);
}

/** How many adults a filing status puts on the plan: one, or a couple. */
export function adultCount(filingStatus: FilingStatus = 'single'): number {
  return filingStatus === 'mfj' ? 2 : 1;
}

/**
 * The adults' ages, exactly as many as the status implies.
 *
 * Padded from the first entry and truncated to the count, so a joint return
 * given one age is two people of that age and a single return given two is
 * the filer alone — the second age is the spouse's, and a single return has
 * no spouse to be that old.
 */
export function adultAges(
  filingStatus: FilingStatus = 'single',
  ages: number[] = [],
): number[] {
  const count = adultCount(filingStatus);
  const first = ages[0] ?? DEFAULT_AGE;
  return Array.from({ length: count }, (_, i) => ages[i] ?? first);
}

/**
 * People in the tax household, which is what the poverty line is sized for:
 * the adults the filing status implies plus the dependents (26 CFR
 * 1.36B-1(d)).
 */
export function householdSizeFor(scenario: Scenario = {}): number {
  const { filingStatus, dependents } = resolveScenario(scenario);
  return adultCount(filingStatus) + dependents;
}
