/**
 * The benchmark premium: what the second-lowest-cost silver plan costs the
 * household, which is the one figure the credit is a share of and the one
 * figure no statute publishes.
 *
 * The household's own figure when the reader has one, and otherwise the
 * national average scaled to the household's ages along the curve every
 * insurer in a default-curve state is required to use.
 */
import type { CoverageYear } from './types';
import { defaultCoverageYear } from './years';
import { resolveScenario } from './scenario';
import type { Scenario } from './scenario';

/**
 * The federal default standard age curve, 45 CFR 147.102(e) as set in CMS's
 * guidance of 16 December 2016 (Appendix I), which every state without a curve
 * of its own has used since plan year 2018.
 *
 * Age 21 is 1.000 and 64 and older is 3.000 — the 3:1 ratio the statute
 * allows — and everyone under 15 is 0.765. Indexed by age from 15 to 63, with
 * the two flat ends handled in `ageFactor`. States that rate on their own
 * curve, or not on age at all — New York and Vermont among them — are the
 * reason the reader can override the premium this produces.
 */
export const AGE_CURVE: Readonly<Record<number, number>> = {
  15: 0.833, 16: 0.859, 17: 0.885, 18: 0.913, 19: 0.941, 20: 0.97,
  21: 1.0, 22: 1.0, 23: 1.0, 24: 1.0, 25: 1.004, 26: 1.024, 27: 1.048,
  28: 1.087, 29: 1.119, 30: 1.135, 31: 1.159, 32: 1.183, 33: 1.198,
  34: 1.214, 35: 1.222, 36: 1.23, 37: 1.238, 38: 1.246, 39: 1.262,
  40: 1.278, 41: 1.302, 42: 1.325, 43: 1.357, 44: 1.397, 45: 1.444,
  46: 1.5, 47: 1.563, 48: 1.635, 49: 1.706, 50: 1.786, 51: 1.865,
  52: 1.952, 53: 2.04, 54: 2.135, 55: 2.23, 56: 2.333, 57: 2.437,
  58: 2.548, 59: 2.603, 60: 2.714, 61: 2.81, 62: 2.873, 63: 2.952,
};

/** The factor for anyone 0 through 14, and the one applied to each dependent here. */
export const CHILD_AGE_FACTOR = 0.765;

/** The factor for anyone 64 or older: the top of the 3:1 band. */
export const TOP_AGE_FACTOR = 3.0;

/** At most three children under 21 are charged for on one policy (45 CFR 147.102(c)(1)). */
export const MAX_RATED_CHILDREN = 3;

/** The premium ratio for one person of a given age, on the default curve. */
export function ageFactor(age: number): number {
  const whole = Math.floor(age);
  if (whole < 15) return CHILD_AGE_FACTOR;
  if (whole >= 64) return TOP_AGE_FACTOR;
  return AGE_CURVE[whole];
}

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
   * county, weighted by plan selections. KFF publishes this figure each
   * autumn from the rate filings; it is the one number on this page that is
   * a market average rather than a statutory one.
   */
  monthlyAt40: number;
}

/**
 * The benchmark by coverage year. Its own table, because it comes from a
 * different publisher on a different schedule; `Record<CoverageYear, …>`
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

/**
 * The national-average benchmark for a household of these ages, monthly, in
 * whole dollars: KFF's 40-year-old figure divided by the 40-year-old's factor
 * gives the curve's unit, and each person on the plan is that unit times
 * their own factor, children at the child factor and at most three of them.
 */
export function averageBenchmarkMonthly(
  ages: number[],
  dependents = 0,
  year: CoverageYear = defaultCoverageYear(),
): number {
  const unit = BENCHMARK_YEAR_PARAMS[year].monthlyAt40 / ageFactor(BENCHMARK_REFERENCE_AGE);
  const adults = ages.reduce((sum, age) => sum + ageFactor(age), 0);
  const children = Math.min(MAX_RATED_CHILDREN, Math.max(0, dependents)) * CHILD_AGE_FACTOR;
  return Math.round(unit * (adults + children));
}

/** The benchmark this household is priced against, monthly. */
export function benchmarkMonthlyFor(scenario: Scenario = {}): number {
  const { benchmarkPremium, ages, dependents, year } = resolveScenario(scenario);
  return benchmarkPremium ?? averageBenchmarkMonthly(ages, dependents, year);
}

/** The same figure for the year, which is what the credit is measured against. */
export function benchmarkAnnualFor(scenario: Scenario = {}): number {
  return benchmarkMonthlyFor(scenario) * 12;
}
