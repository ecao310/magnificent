import { describe, expect, it } from 'vitest';
import {
  CSR_TIERS,
  EXPANSION_FLOOR_MULTIPLE,
  FPL_YEAR_PARAMS,
  PTC_CLIFF_PERCENT,
  TAX_YEARS,
  applicablePercentage,
  cliffCost,
  creditFloorMagi,
  creditSlopeAt,
  csrTierFor,
  expectedContribution,
  fplGuidelineYear,
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
const COUPLE: Scenario = {
  filingStatus: 'mfj',
  ages: [50, 50],
  ordinaryIncome: 10_000,
  qualifiedIncome: 40_000,
  year: 2026,
};

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

  it('sizes the household from the filing status and the dependents', () => {
    expect(povertyLineFor({ filingStatus: 'single', year: 2026 })).toBe(15_650);
    expect(povertyLineFor({ filingStatus: 'mfj', year: 2026 })).toBe(21_150);
    expect(povertyLineFor({ filingStatus: 'mfj', dependents: 2, year: 2026 })).toBe(32_150);
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
    // Halfway through 200–250%: halfway from 6.60% to 8.44%.
    expect(applicablePercentage(2.25, 2026)).toBeCloseTo(0.0752, 6);
    // Halfway through 133–150%.
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
    for (const year of TAX_YEARS) {
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
    const lost = premiumTaxCredit(50_000, COUPLE) - premiumTaxCredit(60_000, COUPLE);
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
    // The same income in an expansion state is Medicaid, not the Marketplace.
    expect(premiumTaxCredit(25_000, COUPLE)).toBe(0);
    expect(premiumTaxCredit(25_000, gap)).toBeGreaterThan(0);
  });

  it('has no cliff on a 2025 return, and tapers under ARPA’s 8.5% instead', () => {
    const last = { ...COUPLE, year: 2025 as const };
    expect(ptcCliffMagi(last)).toBeNull();
    expect(cliffCost(last)).toBeNull();
    const line = povertyLineFor(last);
    // 4 × 2 people × 2024 guidelines.
    expect(line).toBe(20_440);
    // Just over 400% the credit is still paid: the 2025 benchmark for two
    // fifty-year-olds is $1,389/mo, and 8.5% of $82,000 is under that.
    expect(premiumTaxCredit(4 * line + 1_000, last)).toBeGreaterThan(0);
    // It runs out where 8.5% of income reaches the benchmark, not at a line.
    expect(premiumTaxCredit(1_389 * 12 / 0.085 + 1, last)).toBe(0);
  });

  it('can be switched to read the table as if it had no top', () => {
    const cliff = ptcCliffMagi(COUPLE)!;
    expect(premiumTaxCredit(cliff + 1, COUPLE, { cliff: false })).toBeGreaterThan(0);
    expect(premiumTaxCredit(cliff + 1, COUPLE, { cliff: true })).toBe(0);
  });

  it('runs out before the line for a household whose share reaches the benchmark first', () => {
    // A 25-year-old’s benchmark is $491/mo, $5,892/yr; 9.96% of income
    // reaches that at $59,157, short of the $62,600 line.
    const young: Scenario = { filingStatus: 'single', ages: [25], year: 2026 };
    expect(premiumTaxCredit(59_000, young)).toBeGreaterThan(0);
    expect(premiumTaxCredit(60_000, young)).toBe(0);
    expect(cliffCost(young)).toBe(0);
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
    expect(premiumTaxCredit(cliff, COUPLE) - premiumTaxCredit(cliff + 1, COUPLE)).toBeCloseTo(cost, 1);
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
    expect(csrTierFor(1.2 * povertyLineFor(COUPLE), { ...COUPLE, expansionState: false })?.actuarialValue).toBe(94);
  });
});

describe('the lines on the axis', () => {
  it('are the floor, the three tiers and the cliff, ascending, in a cliff year', () => {
    const lines = subsidyLines(COUPLE);
    expect(lines.map((l) => l.id)).toEqual(['floor', 'csr-150', 'csr-200', 'csr-250', 'cliff']);
    expect(lines.map((l) => l.multiple)).toEqual([1.38, 1.5, 2, 2.5, 4]);
    for (let i = 1; i < lines.length; i += 1) {
      expect(lines[i].magi).toBeGreaterThan(lines[i - 1].magi);
    }
    expect(lines[0].label).toMatch(/138% FPL/);
    expect(lines[4].label).toMatch(/400% FPL/);
  });

  it('have no cliff in 2025 and a 100% floor without expansion', () => {
    expect(subsidyLines({ ...COUPLE, year: 2025 }).map((l) => l.id)).not.toContain('cliff');
    const gap = subsidyLines({ ...COUPLE, expansionState: false });
    expect(gap[0].multiple).toBe(1);
    expect(gap[0].label).toBe('100% FPL');
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
  });
});
