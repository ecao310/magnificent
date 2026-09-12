import { describe, expect, it } from 'vitest';
import {
  AGE_CURVE,
  BENCHMARK_YEAR_PARAMS,
  CHILD_AGE_FACTOR,
  DEFAULT_AGE_CURVE,
  MAX_RATED_CHILDREN,
  STATES,
  STATE_AGE_CURVES,
  STATE_CODES,
  TOP_AGE_FACTOR,
  ageCurveFor,
  ageFactor,
  averageBenchmarkMonthly,
  benchmarkAnnualFor,
  benchmarkAt40,
  benchmarkMonthlyFor,
} from './index';
import type { StateCode } from './index';

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

describe('the state curves', () => {
  const own = Object.keys(STATE_AGE_CURVES).sort() as StateCode[];

  it('are on file for exactly the states the table says rate on their own', () => {
    expect(own).toEqual(STATE_CODES.filter((code) => STATES[code].ageRating === 'own'));
    expect(ageCurveFor('TX')).toBe(DEFAULT_AGE_CURVE);
    expect(ageCurveFor(null)).toBe(DEFAULT_AGE_CURVE);
    expect(ageCurveFor('MA')).toBe(STATE_AGE_CURVES.MA);
  });

  it('are CMS’s, at their landmarks', () => {
    const at = (state: StateCode, age: number): number => ageFactor(age, ageCurveFor(state));
    // Four are the default from 21 up, with everyone under 21 at one flat factor.
    for (const state of ['AL', 'MS', 'OR'] as StateCode[]) {
      expect(at(state, 0)).toBe(0.635);
      expect(at(state, 20)).toBe(0.635);
      expect(at(state, 21)).toBe(1);
      expect(at(state, 50)).toBe(1.786);
      expect(at(state, 64)).toBe(3);
    }
    expect(at('MN', 0)).toBe(0.89);
    expect(at('MN', 20)).toBe(0.89);
    expect(at('MN', 40)).toBe(1.278);
    // The District: 3:1 on a shape of its own, reached at 61.
    expect(at('DC', 0)).toBe(0.654);
    expect(at('DC', 21)).toBe(0.727);
    expect(at('DC', 40)).toBe(0.975);
    expect(at('DC', 61)).toBe(2.181);
    expect(at('DC', 64)).toBe(2.181);
    expect(at('DC', 64) / at('DC', 21)).toBeCloseTo(3, 2);
    // Massachusetts: 2:1.
    expect(at('MA', 0)).toBe(0.751);
    expect(at('MA', 21)).toBe(1.183);
    expect(at('MA', 40)).toBe(1.393);
    expect(at('MA', 60)).toBe(2.365);
    expect(at('MA', 64)).toBe(2.365);
    expect(at('MA', 64) / at('MA', 21)).toBeCloseTo(2, 2);
    // Utah: steep through the twenties, at the top from 59.
    expect(at('UT', 0)).toBe(0.793);
    expect(at('UT', 21)).toBe(1);
    expect(at('UT', 26)).toBe(1.363);
    expect(at('UT', 40)).toBe(1.479);
    expect(at('UT', 59)).toBe(3);
    expect(at('UT', 64)).toBe(3);
  });

  it('each run from 15 to 63, never fall with age, and stay inside the 3:1 band', () => {
    for (const state of own) {
      const curve = ageCurveFor(state);
      let last = curve.child;
      for (let age = 15; age <= 63; age += 1) {
        expect(curve.ratios[age], `${state} at ${age}`).toBeDefined();
        expect(curve.ratios[age], `${state} at ${age}`).toBeGreaterThanOrEqual(last);
        last = curve.ratios[age];
      }
      expect(curve.top).toBeGreaterThanOrEqual(last);
      expect(curve.top / curve.ratios[21]).toBeLessThanOrEqual(3.0001);
    }
  });

  it('price a household in one of the seven on the state’s own curve', () => {
    // Massachusetts at 40 is $494; two fifty-year-olds are 2 × 1.741 / 1.393 of that.
    expect(averageBenchmarkMonthly([50, 50], 0, 2026, 'MA')).toBe(Math.round((494 / 1.393) * 2 * 1.741));
    // Utah at 40 is $640; a 26-year-old is 1.363 / 1.479 of that — on the default it would be 1.024 / 1.278.
    expect(averageBenchmarkMonthly([26], 0, 2026, 'UT')).toBe(Math.round((640 / 1.479) * 1.363));
    expect(averageBenchmarkMonthly([26], 0, 2026, 'UT')).toBeGreaterThan(Math.round((640 / 1.278) * 1.024));
    // The District at 40 is $610; two sixty-four-year-olds top out at 2.181 each.
    expect(averageBenchmarkMonthly([64, 64], 0, 2026, 'DC')).toBe(Math.round((610 / 0.975) * 2 * 2.181));
    // Alabama at 40 is $645; a child is 0.635 of a 21-year-old there, not 0.765.
    expect(averageBenchmarkMonthly([40], 1, 2026, 'AL')).toBe(Math.round((645 / 1.278) * (1.278 + 0.635)));
    // A 40-year-old is KFF's figure exactly, on any curve.
    for (const state of own) {
      expect(averageBenchmarkMonthly([40], 0, 2026, state)).toBe(STATES[state].benchmarkAt40[2026]);
    }
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
