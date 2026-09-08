/**
 * The household every other module in this directory prices, and the defaults
 * it is read through.
 *
 * Nothing here computes a credit. What it does is settle the question every
 * function downstream would otherwise have to answer for itself — what an
 * unset field means — in one place, so that a scenario is a complete
 * household by the time any arithmetic sees it.
 */
import type { CoverageYear } from './types';
import { defaultCoverageYear } from './years';

/** The age the page opens on: some way short of Medicare, where the credit ends. */
export const DEFAULT_AGE = 50;

/** How many adults a plan can carry here: one, or a couple. */
export type Adults = 1 | 2;

/**
 * Every input a scenario has, as named fields.
 *
 * Every field is optional and defaults to the un-set case: one adult at
 * `DEFAULT_AGE`, no income, no dependents, the national-average benchmark, a
 * state that expanded Medicaid, the current coverage year.
 */
export interface Scenario {
  /** The adults on the plan: one, or a couple. Sizes the household and the premium. */
  adults?: Adults;
  /**
   * The adults' ages: `[first]` or `[first, second]`. Ages set the benchmark
   * premium — see `premium.ts` — and nothing else; a list shorter than
   * `adults` implies is padded with its first entry.
   */
  ages?: number[];
  /**
   * Household income for the year: the modified adjusted gross income of IRC
   * 36B(d)(2), which is what the credit is measured on. Everyone on the
   * return's income, before any deduction, with tax-exempt interest and the
   * untaxed part of any Social Security benefit added back.
   */
  income?: number;
  /**
   * Children on the plan. Each one moves the poverty line by one person and
   * adds a child's premium to the benchmark.
   */
  dependents?: number;
  /**
   * The benchmark silver premium, monthly, for the household's ages and
   * county; `null` to derive one from the ages and the national average.
   */
  benchmarkPremium?: number | null;
  /**
   * Whether the household's state expanded Medicaid. Forty states and DC
   * have, so it is the default; there the credit begins at 138% of the
   * poverty line rather than 100%. See `creditFloorMultiple`.
   */
  expansionState?: boolean;
  /** Which year's poverty line, table and benchmark to use. */
  year?: CoverageYear;
}

/** A scenario with every default filled in. `benchmarkPremium` stays nullable. */
export type ResolvedScenario = Required<Omit<Scenario, 'benchmarkPremium'>> & {
  benchmarkPremium: number | null;
};

/** Fills in the defaults, field by field, so an explicit `undefined` cannot overwrite one. */
export function resolveScenario(scenario: Scenario = {}): ResolvedScenario {
  const adults = scenario.adults ?? 1;
  return {
    adults,
    ages: adultAges(adults, scenario.ages),
    income: Math.max(0, scenario.income ?? 0),
    dependents: Math.max(0, Math.floor(scenario.dependents ?? 0)),
    benchmarkPremium: scenario.benchmarkPremium ?? null,
    expansionState: scenario.expansionState ?? true,
    year: scenario.year ?? defaultCoverageYear(),
  };
}

/**
 * The adults' ages, exactly as many as there are adults: padded from the
 * first entry and truncated to the count, so a couple given one age is two
 * people of that age and one adult given two ages is that adult alone.
 */
export function adultAges(adults: Adults = 1, ages: number[] = []): number[] {
  const first = ages[0] ?? DEFAULT_AGE;
  return Array.from({ length: adults }, (_, i) => ages[i] ?? first);
}

/**
 * People in the household the poverty line is sized for: the adults plus the
 * dependents (26 CFR 1.36B-1(d)).
 */
export function householdSizeFor(scenario: Scenario = {}): number {
  const { adults, dependents } = resolveScenario(scenario);
  return adults + dependents;
}
