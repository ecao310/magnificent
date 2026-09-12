import { describe, expect, it } from 'vitest';
import {
  COVERAGE_YEARS,
  PAGE_COVERAGE_YEAR,
  adultAges,
  axisMax,
  costCurve,
  creditFloorMagi,
  defaultCoverageYear,
  householdSizeFor,
  netPremiumAt,
  premiumTaxCredit,
  ptcCliffMagi,
  resolveScenario,
} from './index';
import type { Scenario } from './index';

const COUPLE: Scenario = { adults: 2, ages: [50, 50], income: 50_000, year: 2026 };

describe('the years on file', () => {
  it('are 2025 and 2026, and the page prices the later one', () => {
    expect(COVERAGE_YEARS).toEqual([2025, 2026]);
    expect(PAGE_COVERAGE_YEAR).toBe(2026);
  });

  it('start on the calendar year when it is on file, and clamp otherwise', () => {
    expect(defaultCoverageYear(2025)).toBe(2025);
    expect(defaultCoverageYear(2026)).toBe(2026);
    expect(defaultCoverageYear(2024)).toBe(2025);
    expect(defaultCoverageYear(2031)).toBe(2026);
  });
});

describe('the scenario', () => {
  it('fills every default', () => {
    const resolved = resolveScenario({});
    expect(resolved.adults).toBe(1);
    expect(resolved.ages).toEqual([50]);
    expect(resolved.income).toBe(0);
    expect(resolved.dependents).toBe(0);
    expect(resolved.benchmarkPremium).toBeNull();
    expect(resolved.expansionState).toBe(true);
  });

  it('gives a couple two ages and one adult one', () => {
    expect(adultAges(2, [52])).toEqual([52, 52]);
    expect(adultAges(2, [52, 48])).toEqual([52, 48]);
    expect(adultAges(1, [52, 48])).toEqual([52]);
    expect(adultAges(2)).toEqual([50, 50]);
  });

  it('counts the household from the adults and the dependents', () => {
    expect(householdSizeFor({ adults: 1 })).toBe(1);
    expect(householdSizeFor({ adults: 2 })).toBe(2);
    expect(householdSizeFor({ adults: 2, dependents: 2.7 })).toBe(4);
    expect(householdSizeFor({ adults: 1, dependents: -1 })).toBe(1);
  });
});

describe('the curve', () => {
  const curve = costCurve(COUPLE, { maxMagi: axisMax(COUPLE), step: 250 });
  const at = (magi: number) => curve.find((p) => p.magi === magi)!;

  it('samples every step from $0 to the right edge, ascending, without duplicates', () => {
    expect(curve[0].magi).toBe(0);
    expect(curve[curve.length - 1].magi).toBe(axisMax(COUPLE));
    for (let i = 1; i < curve.length; i += 1) expect(curve[i].magi).toBeGreaterThan(curve[i - 1].magi);
    expect(at(50_000)).toBeDefined();
    expect(at(50_250)).toBeDefined();
  });

  it('inserts the floor and the cliff exactly, with the dollar on either side', () => {
    const floor = Math.round(creditFloorMagi(COUPLE));
    const cliff = ptcCliffMagi(COUPLE)!;
    expect(at(floor - 1).cost).toBeNull();
    expect(at(floor).cost).toBeGreaterThan(0);
    expect(at(cliff).cost).toBe(Math.round((0.0996 * cliff) / 12));
    expect(at(cliff + 1).cost).toBe(1_747);
  });

  it('is a gap on Medicaid and the whole benchmark past the line', () => {
    expect(at(0).cost).toBeNull();
    expect(at(20_000).cost).toBeNull();
    expect(at(20_000).credit).toBe(0);
    expect(at(120_000).cost).toBe(1_747);
    expect(at(120_000).credit).toBe(0);
  });

  it('carries the monthly cost, the year’s cost, the credit and the share at each point', () => {
    const point = at(60_000);
    expect(point.costAnnual).toBe(Math.round(netPremiumAt(60_000, COUPLE)!));
    expect(point.cost).toBe(Math.round(netPremiumAt(60_000, COUPLE)! / 12));
    expect(point.credit).toBe(Math.round(premiumTaxCredit(60_000, COUPLE)));
    expect(point.share).toBeCloseTo(0.0946, 3);
    expect(point.fplMultiple).toBeCloseTo(60_000 / 21_150, 6);
  });

  it('never falls as income rises, until it is nothing at all', () => {
    let last = 0;
    for (const point of curve) {
      if (point.cost === null) continue;
      expect(point.cost).toBeGreaterThanOrEqual(last);
      last = point.cost;
    }
  });

  it('draws the coverage gap as the whole benchmark in a state without expansion', () => {
    const gap = costCurve({ ...COUPLE, expansionState: false }, { maxMagi: 40_000, step: 250 });
    expect(gap[0].cost).toBe(1_747);
    expect(gap.find((p) => p.magi === 21_150)!.cost).toBe(Math.round((0.021 * 21_150) / 12));
  });
});

describe('the axis', () => {
  it('runs half again past the line, rounded up to $10,000', () => {
    expect(axisMax(COUPLE)).toBe(130_000);
    expect(axisMax({ adults: 1, year: 2026 })).toBe(100_000);
  });

  it('always contains the reader’s own point', () => {
    expect(axisMax({ ...COUPLE, income: 150_000 })).toBe(160_000);
  });

  it('sizes a year without a cliff from where the line would be', () => {
    expect(axisMax({ ...COUPLE, year: 2025 })).toBe(130_000);
  });
});
