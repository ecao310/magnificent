import { describe, expect, it } from 'vitest';
import {
  COVERAGE_YEARS,
  CSR_TIERS,
  EXPANSION_FLOOR_MULTIPLE,
  FPL_YEAR_PARAMS,
  PTC_CLIFF_PERCENT,
  applicablePercentage,
  cliffCost,
  creditFloorMagi,
  creditLostBetween,
  creditSlopeAt,
  csrTierFor,
  expectedContribution,
  fplGuidelineYear,
  guidelineFor,
  guidelineRegionFor,
  netPremiumAt,
  perAdditionalPersonFor,
  povertyLine,
  povertyLineFor,
  premiumTaxCredit,
  ptcCliffMagi,
  ptcFor,
  subsidyLines,
} from './index';
import type { Scenario } from './index';

/**
 * The household the thread this page answers was about: a couple with
 * $50,000 of household income asking what $10,000 more costs them. Priced at
 * the national-average benchmark for two fifty-year-olds.
 */
const COUPLE: Scenario = { adults: 2, ages: [50, 50], income: 50_000, year: 2026 };

describe('the poverty line', () => {
  it('reads the guidelines published the January before the coverage year', () => {
    expect(fplGuidelineYear(2026)).toBe(2025);
    expect(FPL_YEAR_PARAMS[2026].guidelineYear).toBe(2025);
    expect(FPL_YEAR_PARAMS[2025].guidelineYear).toBe(2024);
  });

  it('is linear past the first person', () => {
    expect(povertyLine(1, 2026)).toBe(15_650);
    expect(povertyLine(2, 2026)).toBe(21_150);
    expect(povertyLine(4, 2026)).toBe(32_150);
    expect(povertyLine(0, 2026)).toBe(15_650);
  });

  it('sizes the household from the adults and the dependents', () => {
    expect(povertyLineFor({ adults: 1, year: 2026 })).toBe(15_650);
    expect(povertyLineFor({ adults: 2, year: 2026 })).toBe(21_150);
    expect(povertyLineFor({ adults: 2, dependents: 2, year: 2026 })).toBe(32_150);
  });

  it('is higher in Alaska and Hawaii, from the same notice', () => {
    expect(guidelineFor(2026, 'alaska')).toEqual({ firstPerson: 19_550, perAdditionalPerson: 6_880 });
    expect(guidelineFor(2026, 'hawaii')).toEqual({ firstPerson: 17_990, perAdditionalPerson: 6_330 });
    expect(guidelineFor(2025, 'alaska')).toEqual({ firstPerson: 18_810, perAdditionalPerson: 6_730 });
    expect(guidelineFor(2025, 'hawaii')).toEqual({ firstPerson: 17_310, perAdditionalPerson: 6_190 });
    expect(guidelineFor(2026)).toEqual({ firstPerson: 15_650, perAdditionalPerson: 5_500 });
    expect(povertyLine(2, 2026, 'alaska')).toBe(26_430);
    expect(povertyLine(2, 2026, 'hawaii')).toBe(24_320);
    expect(povertyLine(2, 2026, 'contiguous')).toBe(21_150);
  });

  it('reads the region off the household’s state', () => {
    expect(guidelineRegionFor({ state: 'AK' })).toBe('alaska');
    expect(guidelineRegionFor({ state: 'HI' })).toBe('hawaii');
    expect(guidelineRegionFor({ state: 'TX' })).toBe('contiguous');
    expect(guidelineRegionFor({})).toBe('contiguous');
    expect(povertyLineFor({ adults: 2, year: 2026, state: 'AK' })).toBe(26_430);
    expect(povertyLineFor({ adults: 2, year: 2026, state: 'TX' })).toBe(21_150);
    expect(perAdditionalPersonFor({ state: 'AK', year: 2026 })).toBe(6_880);
    expect(perAdditionalPersonFor({ year: 2026 })).toBe(5_500);
  });

  it('puts the floor at 100% in a state that did not expand, unless the reader says otherwise', () => {
    expect(creditFloorMagi({ adults: 1, year: 2026, state: 'TX' })).toBe(15_650);
    expect(creditFloorMagi({ adults: 1, year: 2026, state: 'TX', expansionState: true })).toBe(
      1.38 * 15_650,
    );
    expect(creditFloorMagi({ adults: 1, year: 2026, state: 'OH' })).toBe(1.38 * 15_650);
    expect(ptcFor(15_000, { adults: 1, year: 2026, state: 'TX' }).belowFloor).toBe(true);
    expect(ptcFor(16_000, { adults: 1, year: 2026, state: 'TX' }).belowFloor).toBe(false);
  });
});

describe('the applicable percentage', () => {
  it('reads Rev. Proc. 2025-25 at every corner of the 2026 table', () => {
    expect(applicablePercentage(1, 2026)).toBeCloseTo(0.021, 6);
    expect(applicablePercentage(1.32, 2026)).toBeCloseTo(0.021, 6);
    expect(applicablePercentage(1.33, 2026)).toBeCloseTo(0.0314, 6);
    expect(applicablePercentage(1.5, 2026)).toBeCloseTo(0.0419, 6);
    expect(applicablePercentage(2, 2026)).toBeCloseTo(0.066, 6);
    expect(applicablePercentage(2.5, 2026)).toBeCloseTo(0.0844, 6);
    expect(applicablePercentage(3, 2026)).toBeCloseTo(0.0996, 6);
    expect(applicablePercentage(3.5, 2026)).toBeCloseTo(0.0996, 6);
    expect(applicablePercentage(4, 2026)).toBeCloseTo(0.0996, 6);
  });

  it('interpolates linearly inside a band', () => {
    expect(applicablePercentage(2.25, 2026)).toBeCloseTo(0.0752, 6);
    expect(applicablePercentage(1.415, 2026)).toBeCloseTo((0.0314 + 0.0419) / 2, 6);
  });

  it('reads ARPA’s table for 2025: nothing under 150%, 8.5% at and past 400%', () => {
    expect(applicablePercentage(1, 2025)).toBe(0);
    expect(applicablePercentage(1.49, 2025)).toBe(0);
    expect(applicablePercentage(2, 2025)).toBeCloseTo(0.02, 6);
    expect(applicablePercentage(3, 2025)).toBeCloseTo(0.06, 6);
    expect(applicablePercentage(4, 2025)).toBeCloseTo(0.085, 6);
    expect(applicablePercentage(6, 2025)).toBeCloseTo(0.085, 6);
  });

  it('carries the last percentage on flat past a cliff year’s table', () => {
    expect(applicablePercentage(4.5, 2026)).toBeCloseTo(0.0996, 6);
  });

  it('never falls as income rises, in either year', () => {
    for (const year of COVERAGE_YEARS) {
      let last = -1;
      for (let m = 0; m <= 5; m += 0.01) {
        const here = applicablePercentage(m, year);
        expect(here).toBeGreaterThanOrEqual(last - 1e-12);
        last = here;
      }
    }
  });
});

describe('the credit', () => {
  it('is the benchmark less the household’s share', () => {
    // Two fifty-year-olds: 2 × 1.786 / 1.278 × $625 = $1,747/mo, $20,964/yr.
    const here = ptcFor(50_000, COUPLE);
    expect(here.benchmarkMonthly).toBe(1_747);
    expect(here.benchmarkAnnual).toBe(20_964);
    expect(here.fplMultiple).toBeCloseTo(50_000 / 21_150, 6);
    expect(here.credit).toBeCloseTo(20_964 - expectedContribution(50_000, COUPLE), 1);
    expect(here.netPremiumAnnual).toBeCloseTo(expectedContribution(50_000, COUPLE), 1);
  });

  it('reproduces the thread’s example: $10,000 more costs the couple about $1,700 of credit', () => {
    const lost = creditLostBetween(50_000, 60_000, COUPLE);
    // The post said $1,716; the 2026 table and the 2025 guidelines say $1,709.
    expect(lost).toBeGreaterThan(1_690);
    expect(lost).toBeLessThan(1_730);
    expect(lost / 10_000).toBeCloseTo(0.171, 2);
  });

  it('is zero below the floor and zero over the cliff', () => {
    const floor = creditFloorMagi(COUPLE);
    const cliff = ptcCliffMagi(COUPLE);
    expect(floor).toBeCloseTo(EXPANSION_FLOOR_MULTIPLE * 21_150, 6);
    expect(cliff).toBe(PTC_CLIFF_PERCENT * 21_150);
    expect(premiumTaxCredit(floor - 1, COUPLE)).toBe(0);
    expect(premiumTaxCredit(floor, COUPLE)).toBeGreaterThan(0);
    expect(premiumTaxCredit(cliff!, COUPLE)).toBeGreaterThan(0);
    expect(premiumTaxCredit(cliff! + 1, COUPLE)).toBe(0);
  });

  it('begins at 100% of the line in a state that did not expand Medicaid', () => {
    const gap: Scenario = { ...COUPLE, expansionState: false };
    expect(creditFloorMagi(gap)).toBe(21_150);
    expect(premiumTaxCredit(21_149, gap)).toBe(0);
    expect(premiumTaxCredit(21_150, gap)).toBeGreaterThan(0);
    expect(premiumTaxCredit(25_000, COUPLE)).toBe(0);
    expect(premiumTaxCredit(25_000, gap)).toBeGreaterThan(0);
  });

  it('has no cliff on 2025 coverage, and tapers under ARPA’s 8.5% instead', () => {
    const last = { ...COUPLE, year: 2025 as const };
    expect(ptcCliffMagi(last)).toBeNull();
    expect(cliffCost(last)).toBeNull();
    const line = povertyLineFor(last);
    expect(line).toBe(20_440);
    expect(premiumTaxCredit(4 * line + 1_000, last)).toBeGreaterThan(0);
    expect(premiumTaxCredit((1_389 * 12) / 0.085 + 1, last)).toBe(0);
  });

  it('runs out before the line for a household whose share reaches the benchmark first', () => {
    // A 25-year-old’s benchmark is $491/mo, $5,892/yr; 9.96% of income
    // reaches that at $59,157, short of the $62,600 line.
    const young: Scenario = { adults: 1, ages: [25], year: 2026 };
    expect(premiumTaxCredit(59_000, young)).toBeGreaterThan(0);
    expect(premiumTaxCredit(60_000, young)).toBe(0);
    expect(cliffCost(young)).toBe(0);
  });
});

describe('what the household pays', () => {
  it('is its share of income under the line and the whole benchmark over it', () => {
    expect(netPremiumAt(50_000, COUPLE)).toBeCloseTo(expectedContribution(50_000, COUPLE), 6);
    const cliff = ptcCliffMagi(COUPLE)!;
    expect(netPremiumAt(cliff, COUPLE)).toBeCloseTo(0.0996 * cliff, 6);
    expect(netPremiumAt(cliff + 1, COUPLE)).toBe(20_964);
  });

  it('is nothing to quote on Medicaid, and the whole benchmark in the gap', () => {
    expect(netPremiumAt(25_000, COUPLE)).toBeNull();
    expect(netPremiumAt(20_000, { ...COUPLE, expansionState: false })).toBe(20_964);
    expect(netPremiumAt(25_000, { ...COUPLE, expansionState: false })).toBeCloseTo(
      expectedContribution(25_000, COUPLE),
      6,
    );
  });
});

describe('the slope', () => {
  it('is the percentage plus the income times the percentage’s own rise', () => {
    // $50,000 is 236% of a couple's line. In 200–250% the percentage rises
    // 1.84 points over half a poverty line: slope = a(f) + magi × (0.0184 /
    // (0.5 × L)) — 7.9% of income, 16.6 cents on the next dollar.
    const magi = 50_000;
    const line = povertyLineFor(COUPLE);
    const f = magi / line;
    const a = 0.066 + (0.0844 - 0.066) * ((f - 2) / 0.5);
    const analytic = a + magi * (0.0184 / (0.5 * line));
    expect(creditSlopeAt(magi, COUPLE)).toBeCloseTo(analytic, 4);
    expect(analytic).toBeGreaterThan(0.16);
    expect(analytic).toBeLessThan(0.18);
  });

  it('is flat at 2.1% under 133% in a state without expansion, and nothing under the floor with it', () => {
    const gap: Scenario = { ...COUPLE, expansionState: false };
    expect(creditSlopeAt(25_000, gap)).toBeCloseTo(0.021, 4);
    expect(creditSlopeAt(25_000, COUPLE)).toBe(0);
  });

  it('drops back at each band boundary and settles at 9.96% between 300% and 400%', () => {
    const line = povertyLineFor(COUPLE);
    const justUnder = (m: number) => creditSlopeAt(Math.floor(m * line) - 5, COUPLE);
    const justOver = (m: number) => creditSlopeAt(Math.ceil(m * line) + 5, COUPLE);
    expect(justUnder(2)).toBeGreaterThan(justOver(2));
    expect(justUnder(2.5)).toBeGreaterThan(justOver(2.5));
    expect(justUnder(3)).toBeGreaterThan(justOver(3));
    expect(justUnder(3)).toBeGreaterThan(0.19);
    expect(justOver(3)).toBeCloseTo(0.0996, 4);
    expect(creditSlopeAt(80_000, COUPLE)).toBeCloseTo(0.0996, 4);
  });

  it('reads the plateau at the line itself, and nothing past it', () => {
    const cliff = ptcCliffMagi(COUPLE)!;
    expect(creditSlopeAt(cliff, COUPLE)).toBeCloseTo(0.0996, 4);
    expect(creditSlopeAt(cliff + 1, COUPLE)).toBe(0);
    expect(creditSlopeAt(cliff + 10_000, COUPLE)).toBe(0);
  });

  it('is what the dollar past the line does not cost: that dollar costs the whole credit', () => {
    const cliff = ptcCliffMagi(COUPLE)!;
    const cost = cliffCost(COUPLE)!;
    expect(cost).toBeCloseTo(20_964 - 0.0996 * cliff, 1);
    expect(cost).toBeGreaterThan(12_000);
    expect(creditLostBetween(cliff, cliff + 1, COUPLE)).toBeCloseTo(cost, 1);
  });
});

describe('the cost-sharing tiers', () => {
  it('step at 150%, 200% and 250% of the line, inclusive at the top', () => {
    const line = povertyLineFor(COUPLE);
    expect(CSR_TIERS.map((t) => t.actuarialValue)).toEqual([94, 87, 73]);
    expect(csrTierFor(1.4 * line, COUPLE)?.actuarialValue).toBe(94);
    expect(csrTierFor(1.5 * line, COUPLE)?.actuarialValue).toBe(94);
    expect(csrTierFor(1.5 * line + 1, COUPLE)?.actuarialValue).toBe(87);
    expect(csrTierFor(2 * line, COUPLE)?.actuarialValue).toBe(87);
    expect(csrTierFor(2.5 * line, COUPLE)?.actuarialValue).toBe(73);
    expect(csrTierFor(2.5 * line + 1, COUPLE)).toBeNull();
  });

  it('are not offered under the floor', () => {
    expect(csrTierFor(1.2 * povertyLineFor(COUPLE), COUPLE)).toBeNull();
    expect(
      csrTierFor(1.2 * povertyLineFor(COUPLE), { ...COUPLE, expansionState: false })?.actuarialValue,
    ).toBe(94);
  });
});

describe('the lines on the axis', () => {
  it('are the floor, the three tiers and the cliff, ascending, in a cliff year', () => {
    const lines = subsidyLines(COUPLE);
    expect(lines.map((l) => l.id)).toEqual(['floor', 'csr-150', 'csr-200', 'csr-250', 'cliff']);
    expect(lines.map((l) => l.multiple)).toEqual([1.38, 1.5, 2, 2.5, 4]);
    expect(lines.map((l) => l.label)).toEqual([
      'Subsidy starts · 138%',
      'Tier · 150%',
      'Tier · 200%',
      'Tier · 250%',
      'Subsidy ends · 400%',
    ]);
    for (let i = 1; i < lines.length; i += 1) {
      expect(lines[i].magi).toBeGreaterThan(lines[i - 1].magi);
    }
    expect(lines[0].label).toBe('Subsidy starts · 138%');
    expect(lines[4].label).toBe('Subsidy ends · 400%');
  });

  it('have no cliff in 2025 and a 100% floor without expansion', () => {
    expect(subsidyLines({ ...COUPLE, year: 2025 }).map((l) => l.id)).not.toContain('cliff');
    const gap = subsidyLines({ ...COUPLE, expansionState: false });
    expect(gap[0].multiple).toBe(1);
    expect(gap[0].label).toBe('Subsidy starts · 100%');
  });
});

describe('the assessment', () => {
  it('says where a household stands, with the distance to the line', () => {
    const cliff = ptcCliffMagi(COUPLE)!;
    const here = ptcFor(60_000, COUPLE);
    expect(here.householdSize).toBe(2);
    expect(here.belowFloor).toBe(false);
    expect(here.overCliff).toBe(false);
    expect(here.headroom).toBe(cliff - 60_000);
    expect(here.csrTier).toBeNull();
    expect(here.slope).toBeCloseTo(creditSlopeAt(60_000, COUPLE), 8);
    const over = ptcFor(cliff + 1, COUPLE);
    expect(over.overCliff).toBe(true);
    expect(over.headroom).toBe(0);
    expect(over.credit).toBe(0);
    expect(over.netPremiumAnnual).toBe(over.benchmarkAnnual);
    const medicaid = ptcFor(25_000, COUPLE);
    expect(medicaid.belowFloor).toBe(true);
    expect(medicaid.netPremiumAnnual).toBeNull();
  });
});
