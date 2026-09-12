import { describe, expect, it } from 'vitest';
import { axisMax, creditFloorMagi, ptcCliffMagi, ptcFor } from '../aca';
import type { Scenario } from '../aca';
import { MIN_RATE_AXIS, allInFor, premiumForRate, rateAxis, rateCurve } from './index';

const COUPLE: Scenario = { adults: 2, ages: [50, 50], income: 50_000, year: 2026 };

describe('the premium on this page', () => {
  it('is what the household pays on the slope and over the cliff, and nothing under the floor', () => {
    expect(premiumForRate(ptcFor(50_000, COUPLE))).toBeCloseTo(0.0794 * 50_000, -1);
    expect(premiumForRate(ptcFor(90_000, COUPLE))).toBeCloseTo(1_747 * 12, -1);
    expect(premiumForRate(ptcFor(20_000, COUPLE))).toBeNull();
    // Under 100% in a state that did not expand: the cost chart draws the full premium, this one leaves a gap.
    expect(premiumForRate(ptcFor(12_000, { ...COUPLE, state: 'TX' }))).toBeNull();
    expect(premiumForRate(ptcFor(22_000, { ...COUPLE, state: 'TX' }))).not.toBeNull();
  });
});

describe('the assessment', () => {
  it('adds the tax and the premium, and reads both as shares of income', () => {
    const here = allInFor(50_000, COUPLE);
    expect(here.filingStatus).toBe('mfj');
    expect(here.standardDeduction).toBe(32_200);
    expect(here.taxableIncome).toBe(17_800);
    expect(here.incomeTax).toBe(1_780);
    expect(here.incomeTaxShare).toBeCloseTo(0.0356, 4);
    expect(here.bracketRate).toBe(0.1);
    expect(here.premium).toBeCloseTo(3_969.88, 1);
    expect(here.premiumShare).toBeCloseTo(0.0794, 3);
    expect(here.allIn).toBeCloseTo(1_780 + (here.premium ?? 0), 2);
    expect(here.allInShare).toBeCloseTo(here.incomeTaxShare + (here.premiumShare ?? 0), 9);
    expect(here.allInSlope).toBeCloseTo(0.1 + here.ptc.slope, 9);
    expect(here.ptc.fplMultiple).toBeCloseTo(50_000 / 21_150, 6);
  });

  it('has no all-in figure under the floor, and a whole premium over the cliff', () => {
    const under = allInFor(20_000, COUPLE);
    expect(under.premium).toBeNull();
    expect(under.premiumShare).toBeNull();
    expect(under.allIn).toBeNull();
    expect(under.allInShare).toBeNull();
    expect(under.incomeTax).toBe(0);
    expect(under.allInSlope).toBe(0);

    const over = allInFor(90_000, COUPLE);
    expect(over.ptc.overCliff).toBe(true);
    expect(over.premium).toBe(1_747 * 12);
    expect(over.premiumShare).toBeCloseTo((1_747 * 12) / 90_000, 6);
    expect(over.premiumSlope).toBe(0);
    expect(over.allInSlope).toBeCloseTo(0.12, 6);
  });

  it('takes the child tax credit only against the tax there is', () => {
    const family = allInFor(60_000, { adults: 2, dependents: 2, year: 2026 });
    expect(family.bracketTax).toBeCloseTo(2_840, 2);
    expect(family.childTaxCredit).toBeCloseTo(2_840, 2);
    expect(family.incomeTax).toBe(0);
    expect(family.incomeTaxShare).toBe(0);
  });

  it('reads nothing as a share of nothing', () => {
    const nothing = allInFor(0, COUPLE);
    expect(nothing.incomeTaxShare).toBe(0);
    expect(nothing.premiumShare).toBeNull();
  });
});

describe('the curve', () => {
  it('samples every step and inserts the subsidy’s edges exactly', () => {
    const max = axisMax(COUPLE);
    const curve = rateCurve(COUPLE, { maxMagi: max, step: 250 });
    const xs = curve.map((point) => point.magi);
    expect(xs[0]).toBe(0);
    expect(xs[xs.length - 1]).toBe(max);
    for (let i = 1; i < xs.length; i += 1) expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    const floor = Math.round(creditFloorMagi(COUPLE));
    const cliff = ptcCliffMagi(COUPLE) as number;
    for (const edge of [floor - 1, floor, cliff, cliff + 1]) expect(xs).toContain(edge);
  });

  it('is a gap under the floor and a jump at the cliff', () => {
    const curve = rateCurve(COUPLE, { maxMagi: axisMax(COUPLE) });
    const floor = Math.round(creditFloorMagi(COUPLE));
    const cliff = ptcCliffMagi(COUPLE) as number;
    const at = (magi: number) => curve.find((point) => point.magi === magi)!;
    expect(at(floor - 1).premiumShare).toBeNull();
    expect(at(floor - 1).allInShare).toBeNull();
    expect(at(floor).premiumShare).not.toBeNull();
    expect((at(cliff + 1).allInShare ?? 0) - (at(cliff).allInShare ?? 0)).toBeGreaterThan(0.1);
    expect(at(floor - 1).incomeTaxShare).toBe(0);
  });

  it('has no cliff in a year without one', () => {
    const curve = rateCurve({ ...COUPLE, year: 2025 }, { maxMagi: 150_000 });
    for (let i = 1; i < curve.length; i += 1) {
      const step = (curve[i].allInShare ?? 0) - (curve[i - 1].allInShare ?? 0);
      expect(Math.abs(step)).toBeLessThan(0.01);
    }
  });
});

describe('the rate axis', () => {
  it('rounds the peak up to a tick, in tens under 60% and twenties over', () => {
    const couple = rateAxis(rateCurve(COUPLE, { maxMagi: axisMax(COUPLE) }));
    expect(couple.max).toBe(0.4);
    expect(couple.ticks).toEqual([0, 0.1, 0.2, 0.3, 0.4]);
    // Two sixty-four-year-olds on Wyoming's average: the premium alone is most of the income past the cliff.
    const steep: Scenario = { adults: 2, ages: [64, 64], state: 'WY', year: 2026 };
    const wyoming = rateAxis(rateCurve(steep, { maxMagi: axisMax(steep) }));
    expect(wyoming.max).toBeGreaterThan(0.6);
    expect(wyoming.ticks[1]).toBe(0.2);
    expect(wyoming.ticks.length).toBeLessThanOrEqual(8);
  });

  it('makes room for the reader’s own point, and is never narrower than one tick', () => {
    expect(rateAxis([], null).max).toBe(MIN_RATE_AXIS);
    expect(rateAxis([], 0.55).max).toBe(0.6);
  });
});
