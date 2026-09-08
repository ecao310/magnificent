import { describe, expect, it } from 'vitest';
import {
  AGE_CURVE,
  BENCHMARK_YEAR_PARAMS,
  CHILD_AGE_FACTOR,
  MAX_RATED_CHILDREN,
  TOP_AGE_FACTOR,
  ageFactor,
  averageBenchmarkMonthly,
  benchmarkAnnualFor,
  benchmarkAt40,
  benchmarkMonthlyFor,
} from './index';

describe('the age curve', () => {
  it('is CMS’s default curve at its landmarks', () => {
    expect(ageFactor(21)).toBe(1);
    expect(ageFactor(40)).toBe(1.278);
    expect(ageFactor(50)).toBe(1.786);
    expect(ageFactor(60)).toBe(2.714);
    expect(ageFactor(63)).toBe(2.952);
  });

  it('is flat at both ends: 0.765 through 14, 3.000 from 64', () => {
    expect(ageFactor(0)).toBe(CHILD_AGE_FACTOR);
    expect(ageFactor(14)).toBe(CHILD_AGE_FACTOR);
    expect(ageFactor(15)).toBe(0.833);
    expect(ageFactor(64)).toBe(TOP_AGE_FACTOR);
    expect(ageFactor(70)).toBe(TOP_AGE_FACTOR);
  });

  it('has every age from 15 to 63 and never falls with age', () => {
    let last = 0;
    for (let age = 15; age <= 63; age += 1) {
      expect(AGE_CURVE[age]).toBeDefined();
      expect(AGE_CURVE[age]).toBeGreaterThanOrEqual(last);
      last = AGE_CURVE[age];
    }
  });

  it('takes a whole age from a fractional one', () => {
    expect(ageFactor(50.9)).toBe(ageFactor(50));
  });
});

describe('the national-average benchmark', () => {
  it('is KFF’s figure for a 40-year-old, exactly', () => {
    expect(averageBenchmarkMonthly([40], 0, 2026)).toBe(625);
    expect(averageBenchmarkMonthly([40], 0, 2025)).toBe(497);
    expect(BENCHMARK_YEAR_PARAMS[2026].monthlyAt40).toBe(625);
  });

  it('scales along the curve for other ages and adds up across people', () => {
    expect(averageBenchmarkMonthly([21], 0, 2026)).toBe(Math.round(625 / 1.278));
    expect(averageBenchmarkMonthly([50, 50], 0, 2026)).toBe(1_747);
    expect(averageBenchmarkMonthly([64, 64], 0, 2026)).toBe(Math.round((625 / 1.278) * 6));
  });

  it('charges children at the child factor, and at most three of them', () => {
    const unit = 625 / 1.278;
    expect(averageBenchmarkMonthly([50], 1, 2026)).toBe(Math.round(unit * (1.786 + 0.765)));
    expect(averageBenchmarkMonthly([50], 3, 2026)).toBe(Math.round(unit * (1.786 + 3 * 0.765)));
    expect(averageBenchmarkMonthly([50], 5, 2026)).toBe(
      averageBenchmarkMonthly([50], MAX_RATED_CHILDREN, 2026),
    );
  });
});

describe('a state’s benchmark', () => {
  it('is KFF’s figure for that state for a 40-year-old, exactly', () => {
    expect(benchmarkAt40(2026, 'TX')).toBe(661);
    expect(benchmarkAt40(2026, null)).toBe(625);
    expect(averageBenchmarkMonthly([40], 0, 2026, 'TX')).toBe(661);
    expect(averageBenchmarkMonthly([40], 0, 2025, 'TX')).toBe(489);
    expect(averageBenchmarkMonthly([40], 0, 2026, 'VT')).toBe(1_299);
  });

  it('scales along the same curve as the national figure', () => {
    expect(averageBenchmarkMonthly([50, 50], 0, 2026, 'TX')).toBe(Math.round((661 / 1.278) * 2 * 1.786));
    expect(averageBenchmarkMonthly([64], 0, 2026, 'WY')).toBe(Math.round((1_090 / 1.278) * 3));
  });

  it('is flat across the ages where the state does not price by age', () => {
    expect(averageBenchmarkMonthly([64], 0, 2026, 'VT')).toBe(1_299);
    expect(averageBenchmarkMonthly([21], 0, 2026, 'VT')).toBe(1_299);
    expect(averageBenchmarkMonthly([21, 64], 0, 2026, 'NY')).toBe(817 * 2);
    expect(averageBenchmarkMonthly([40], 1, 2026, 'NY')).toBe(Math.round((817 / 1.278) * (1.278 + 0.765)));
  });

  it('leaves the national figure alone', () => {
    expect(averageBenchmarkMonthly([50, 50], 0, 2026)).toBe(averageBenchmarkMonthly([50, 50], 0, 2026, null));
    expect(averageBenchmarkMonthly([50, 50], 0, 2026)).toBe(1_747);
  });
});

describe('the household’s benchmark', () => {
  it('is the reader’s own figure when they gave one', () => {
    expect(benchmarkMonthlyFor({ ages: [50], benchmarkPremium: 900 })).toBe(900);
    expect(benchmarkAnnualFor({ ages: [50], benchmarkPremium: 900 })).toBe(10_800);
  });

  it('is the average for the household’s ages otherwise, a couple of the same age when only one is given', () => {
    expect(benchmarkMonthlyFor({ adults: 2, ages: [50], year: 2026 })).toBe(1_747);
    expect(benchmarkMonthlyFor({ adults: 1, ages: [50, 60], year: 2026 })).toBe(
      averageBenchmarkMonthly([50], 0, 2026),
    );
  });

  it('is the state’s average when the household has a state', () => {
    expect(benchmarkMonthlyFor({ adults: 2, ages: [50], year: 2026, state: 'TX' })).toBe(
      averageBenchmarkMonthly([50, 50], 0, 2026, 'TX'),
    );
    expect(benchmarkMonthlyFor({ ages: [50], year: 2026, state: 'TX', benchmarkPremium: 900 })).toBe(900);
  });
});
