/**
 * The benchmark premium: what the second-lowest-cost silver plan costs the
 * household, which is the one figure the credit is a share of and the one
 * figure no statute publishes.
 *
 * The household's own figure when the reader has one, and otherwise the
 * state's average — or the national one, with no state — scaled to the
 * household's ages along the curve every insurer in the state is required
 * to use: the federal default, or the state's own where it filed one.
 */
import type { CoverageYear } from './types';
import { defaultCoverageYear } from './years';
import { resolveScenario } from './scenario';
import type { Scenario } from './scenario';
import { STATES } from './states';
import type { StateCode } from './states';
import { ageCurveFor, ageFactor } from './ageCurves';

/** At most three children under 21 are charged for on one policy (45 CFR 147.102(c)(1)). */
export const MAX_RATED_CHILDREN = 3;

/** The youngest age the page offers. Under 18 a reader is somebody's dependent. */
export const MIN_ADULT_AGE = 18;

/**
 * The oldest age the page offers: the last year before Medicare. At 65 the
 * credit is gone — 36B(c)(2)(B) — and so is the subject of this page.
 */
export const MAX_ADULT_AGE = 64;

/** One coverage year's national benchmark, and where it comes from. */
export interface BenchmarkYearParams {
  source: string;
  /**
   * The average monthly benchmark premium for a 40-year-old across every
   * county in the country, weighted by plan selections. KFF publishes this
   * figure each autumn from the rate filings, one row per state and one for
   * the US; the state rows are in `states.ts`. It is the one kind of number
   * on this page that is a market average rather than a statutory one.
   */
  monthlyAt40: number;
}

/**
 * The national benchmark by coverage year. Its own table, because it comes
 * from a different publisher on a different schedule; `Record<CoverageYear, …>`
 * still makes it exhaustive.
 */
export const BENCHMARK_YEAR_PARAMS: Record<CoverageYear, BenchmarkYearParams> = {
  2025: {
    source: 'KFF, Marketplace Average Benchmark Premiums, 2025 (40-year-old, US average)',
    monthlyAt40: 497,
  },
  2026: {
    // Up 26% on the year: the largest one-year rise since 2018, which the
    // filings attributed in roughly equal parts to medical trend and to the
    // healthier enrollees insurers expected to lose when the enhanced credit
    // expired.
    source: 'KFF, Marketplace Average Benchmark Premiums, 2026 (40-year-old, US average)',
    monthlyAt40: 625,
  },
};

/** The age KFF's published average is for. */
export const BENCHMARK_REFERENCE_AGE = 40;

/** KFF's 40-year-old figure for a state, or the national one with no state. */
export function benchmarkAt40(year: CoverageYear, state: StateCode | null = null): number {
  return state === null
    ? BENCHMARK_YEAR_PARAMS[year].monthlyAt40
    : STATES[state].benchmarkAt40[year];
}

/**
 * The average benchmark for a household of these ages, monthly, in whole
 * dollars: KFF's 40-year-old figure divided by the 40-year-old's factor
 * gives the curve's unit, and each person on the plan is that unit times
 * their own factor, children at the child factor and at most three of them.
 *
 * The curve is the state's: the federal default in most, and in the seven
 * that filed one, their own — see `STATE_AGE_CURVES`. KFF's figure is what
 * a 40-year-old actually pays in the state, so dividing it by the state's
 * own factor for 40 gives the unit the state's insurers price from.
 *
 * One approximation remains. Where the state does not rate on age — New
 * York and Vermont — every adult is charged the 40-year-old's figure flat,
 * and a child the child's share of it: the nearest thing the default curve
 * has to a community rate.
 */
export function averageBenchmarkMonthly(
  ages: number[],
  dependents = 0,
  year: CoverageYear = defaultCoverageYear(),
  state: StateCode | null = null,
): number {
  const at40 = benchmarkAt40(year, state);
  const curve = ageCurveFor(state);
  const flat = state !== null && STATES[state].ageRating === 'none';
  const factor = (age: number): number =>
    ageFactor(flat ? BENCHMARK_REFERENCE_AGE : age, curve);
  const unit = at40 / ageFactor(BENCHMARK_REFERENCE_AGE, curve);
  const adults = ages.reduce((sum, age) => sum + factor(age), 0);
  const children = Math.min(MAX_RATED_CHILDREN, Math.max(0, dependents)) * curve.child;
  return Math.round(unit * (adults + children));
}

/** The benchmark this household is priced against, monthly. */
export function benchmarkMonthlyFor(scenario: Scenario = {}): number {
  const { benchmarkPremium, ages, dependents, year, state } = resolveScenario(scenario);
  return benchmarkPremium ?? averageBenchmarkMonthly(ages, dependents, year, state);
}

/** The same figure for the year, which is what the credit is measured against. */
export function benchmarkAnnualFor(scenario: Scenario = {}): number {
  return benchmarkMonthlyFor(scenario) * 12;
}
