import { describe, expect, it } from 'vitest';
import {
  axisMax,
  blockCost,
  cliffCost,
  creditSlopeAt,
  nextDollarAt,
  premiumTaxCredit,
  ptcCliffMagi,
  slopeCurve,
  splitAt,
  totalTax,
} from './index';
import type { Scenario } from './index';

const COUPLE: Scenario = {
  filingStatus: 'mfj',
  ages: [50, 50],
  ordinaryIncome: 10_000,
  qualifiedIncome: 40_000,
  added: 10_000,
  addedKind: 'harvest',
  year: 2026,
};

describe('the composition of a point on the axis', () => {
  it('scales the base down below it and adds the block’s kind above it', () => {
    expect(splitAt(25_000, COUPLE)).toEqual({ ordinary: 5_000, gains: 20_000 });
    expect(splitAt(50_000, COUPLE)).toEqual({ ordinary: 10_000, gains: 40_000 });
    expect(splitAt(70_000, COUPLE)).toEqual({ ordinary: 10_000, gains: 60_000 });
    expect(splitAt(70_000, { ...COUPLE, addedKind: 'conversion' })).toEqual({
      ordinary: 30_000,
      gains: 40_000,
    });
  });

  it('is all of the kind when there is no base to scale', () => {
    expect(splitAt(20_000, { addedKind: 'conversion' })).toEqual({ ordinary: 20_000, gains: 0 });
    expect(splitAt(0, COUPLE)).toEqual({ ordinary: 0, gains: 0 });
  });
});

describe('the next dollar', () => {
  it('shares the credit between kinds and splits the tax', () => {
    const next = nextDollarAt(50_000, COUPLE);
    expect(next.credit).toBeCloseTo(creditSlopeAt(50_000, COUPLE), 10);
    // Under the deduction either way, so no tax on either dollar.
    expect(next.conversionTax).toBeCloseTo(0, 6);
    expect(next.harvestTax).toBeCloseTo(0, 6);
    expect(next.tax).toBe(0);
    expect(next.creditHere).toBeCloseTo(premiumTaxCredit(50_000, COUPLE), 6);
  });

  it('prices the conversion dollar at its bracket once the deduction is spent', () => {
    const conversions = { ...COUPLE, addedKind: 'conversion' as const };
    // $80,000 as a conversion household: ordinary $40,000, taxable $7,800 — the 10% band.
    const next = nextDollarAt(80_000, conversions);
    expect(next.conversionTax).toBeCloseTo(0.1, 6);
    expect(next.harvestTax).toBeCloseTo(0, 6);
  });
});

describe('the curves', () => {
  const curve = slopeCurve(COUPLE, { maxMagi: axisMax(COUPLE), step: 250 });

  it('sample every step from $0 to the right edge', () => {
    expect(curve[0].magi).toBe(0);
    expect(curve[curve.length - 1].magi).toBe(axisMax(COUPLE));
    expect(curve[1].magi - curve[0].magi).toBe(250);
  });

  it('never put the gain dollar above the conversion dollar', () => {
    for (const point of curve) {
      expect(point.harvestRate).toBeLessThanOrEqual(point.conversionRate + 1e-9);
    }
  });

  it('are the credit alone where there is no tax, and nothing at all below the floor', () => {
    const at = (magi: number) => curve.find((p) => p.magi === magi)!;
    expect(at(20_000).creditRate).toBe(0);
    expect(at(20_000).harvestRate).toBe(0);
    expect(at(50_000).creditRate).toBeCloseTo(16.64, 1);
    expect(at(50_000).harvestRate).toBe(at(50_000).creditRate);
  });

  it('plateau at 9.96% between 300% and 400% and fall to nothing past the line', () => {
    const cliff = ptcCliffMagi(COUPLE)!;
    const plateau = curve.filter((p) => p.magi > 3 * 21_150 && p.magi <= cliff);
    expect(plateau.length).toBeGreaterThan(10);
    for (const point of plateau) expect(point.creditRate).toBeCloseTo(9.96, 1);
    const past = curve.filter((p) => p.magi > cliff);
    expect(past.length).toBeGreaterThan(10);
    for (const point of past) expect(point.creditRate).toBe(0);
  });

  it('carry the year’s tax and credit at each point, in whole dollars', () => {
    const point = curve.find((p) => p.magi === 60_000)!;
    expect(point.credit).toBe(Math.round(premiumTaxCredit(60_000, COUPLE)));
    expect(point.tax).toBe(Math.round(totalTax({ ...COUPLE, added: 10_000 })));
  });
});

describe('the block', () => {
  it('prices the thread’s $10,000 harvest: no tax, about $1,709 of credit, 17.1%', () => {
    const cost = blockCost(COUPLE);
    expect(cost.kind).toBe('harvest');
    expect(cost.from).toBe(50_000);
    expect(cost.to).toBe(60_000);
    expect(cost.added).toBe(10_000);
    expect(cost.tax).toBe(0);
    expect(cost.credit).toBe(1_709);
    expect(cost.total).toBe(1_709);
    expect(cost.rate!).toBeCloseTo(0.1709, 3);
    expect(cost.crossesCliff).toBe(false);
  });

  it('prices the other kind from the same scenario', () => {
    const conversion = blockCost(COUPLE, 'conversion');
    expect(conversion.kind).toBe('conversion');
    expect(conversion.credit).toBe(1_709);
    // The deduction absorbs the whole conversion, so it costs the same today.
    expect(conversion.tax).toBe(0);
  });

  it('has no rate when nothing was added', () => {
    const cost = blockCost({ ...COUPLE, added: 0 });
    expect(cost.added).toBe(0);
    expect(cost.rate).toBeNull();
    expect(cost.total).toBe(0);
  });

  it('charges the whole credit when the block crosses the line', () => {
    const cliff = ptcCliffMagi(COUPLE)!;
    const cost = blockCost({ ...COUPLE, added: cliff - 50_000 + 1_000 });
    expect(cost.crossesCliff).toBe(true);
    expect(cost.credit).toBe(Math.round(premiumTaxCredit(50_000, COUPLE)));
    expect(cost.credit).toBeGreaterThan(cliffCost(COUPLE)!);
    expect(cost.rate!).toBeGreaterThan(0.4);
  });

  it('stops exactly at the line without crossing it', () => {
    const cliff = ptcCliffMagi(COUPLE)!;
    const cost = blockCost({ ...COUPLE, added: cliff - 50_000 });
    expect(cost.to).toBe(cliff);
    expect(cost.crossesCliff).toBe(false);
    expect(cost.credit).toBeLessThan(6_000);
  });
});

describe('the axis', () => {
  it('runs half again past the line, rounded up to $10,000', () => {
    // A couple’s line is $84,600; ×1.5 is $126,900; rounds to $130,000.
    expect(axisMax(COUPLE)).toBe(130_000);
    // A single filer’s is $62,600; ×1.5 is $93,900; the floor of $100,000 wins.
    expect(axisMax({ filingStatus: 'single', year: 2026 })).toBe(100_000);
  });

  it('always contains the reader’s own point', () => {
    expect(axisMax({ ...COUPLE, added: 150_000 })).toBe(210_000);
  });

  it('sizes a year without a cliff from where the line would be', () => {
    // 2025, couple: $20,440 × 4 × 1.5 = $122,640 → $130,000.
    expect(axisMax({ ...COUPLE, year: 2025 })).toBe(130_000);
  });
});
