import { describe, expect, it } from 'vitest';
import { COVERAGE_YEARS } from '../aca';
import type { Scenario } from '../aca';
import {
  FILING_STATUSES,
  TAX_YEAR_PARAMS,
  bracketRateAt,
  bracketTax,
  childTaxCreditFor,
  filingStatusFor,
  incomeTaxFor,
  incomeTaxSlopeAt,
  standardDeductionFor,
  taxableIncomeFor,
} from './index';

/** The household the cost page opens on: a couple, both fifty, on $50,000. */
const COUPLE: Scenario = { adults: 2, ages: [50, 50], income: 50_000, year: 2026 };

describe('the tables', () => {
  it('have a row for every coverage year and every status', () => {
    for (const year of COVERAGE_YEARS) {
      const params = TAX_YEAR_PARAMS[year];
      expect(params.source.length).toBeGreaterThan(10);
      for (const status of FILING_STATUSES) {
        const { standardDeduction, brackets } = params.filing[status];
        expect(standardDeduction).toBeGreaterThan(0);
        expect(brackets).toHaveLength(7);
        expect(brackets[brackets.length - 1].upTo).toBe(Infinity);
        for (let i = 1; i < brackets.length; i += 1) {
          expect(brackets[i].upTo).toBeGreaterThan(brackets[i - 1].upTo);
          expect(brackets[i].rate).toBeGreaterThan(brackets[i - 1].rate);
        }
      }
    }
  });

  it('carry the published corners', () => {
    expect(TAX_YEAR_PARAMS[2026].filing.single.standardDeduction).toBe(16_100);
    expect(TAX_YEAR_PARAMS[2026].filing.hoh.standardDeduction).toBe(24_150);
    expect(TAX_YEAR_PARAMS[2026].filing.mfj.standardDeduction).toBe(32_200);
    expect(TAX_YEAR_PARAMS[2025].filing.single.standardDeduction).toBe(15_750);
    expect(TAX_YEAR_PARAMS[2025].filing.hoh.standardDeduction).toBe(23_625);
    expect(TAX_YEAR_PARAMS[2025].filing.mfj.standardDeduction).toBe(31_500);
    expect(TAX_YEAR_PARAMS[2026].filing.mfj.brackets[1]).toEqual({ upTo: 100_800, rate: 0.12 });
    expect(TAX_YEAR_PARAMS[2026].filing.hoh.brackets[4]).toEqual({ upTo: 256_200, rate: 0.32 });
    expect(TAX_YEAR_PARAMS[2026].filing.single.brackets[4]).toEqual({ upTo: 256_225, rate: 0.32 });
    expect(TAX_YEAR_PARAMS[2026].childTaxCredit.perChild).toBe(2_200);
    expect(TAX_YEAR_PARAMS[2025].childTaxCredit.perChild).toBe(2_200);
    expect(TAX_YEAR_PARAMS[2026].childTaxCredit.phaseoutStart).toEqual({
      single: 200_000,
      hoh: 200_000,
      mfj: 400_000,
    });
  });
});

describe('the filing status', () => {
  it('follows from who is on the plan', () => {
    expect(filingStatusFor({ adults: 2 })).toBe('mfj');
    expect(filingStatusFor({ adults: 2, dependents: 3 })).toBe('mfj');
    expect(filingStatusFor({ adults: 1 })).toBe('single');
    expect(filingStatusFor({ adults: 1, dependents: 1 })).toBe('hoh');
    expect(filingStatusFor({})).toBe('single');
  });

  it('sets the standard deduction', () => {
    expect(standardDeductionFor(COUPLE)).toBe(32_200);
    expect(standardDeductionFor({ adults: 1, year: 2026 })).toBe(16_100);
    expect(standardDeductionFor({ adults: 1, dependents: 2, year: 2026 })).toBe(24_150);
    expect(standardDeductionFor({ adults: 1, year: 2025 })).toBe(15_750);
  });
});

describe('the schedule', () => {
  it('fills each band before the next', () => {
    expect(bracketTax(0, 2026, 'single')).toBe(0);
    expect(bracketTax(12_400, 2026, 'single')).toBe(1_240);
    expect(bracketTax(50_400, 2026, 'single')).toBeCloseTo(1_240 + 38_000 * 0.12, 6);
    expect(bracketTax(100_800, 2026, 'mfj')).toBeCloseTo(2_480 + 76_000 * 0.12, 6);
    expect(bracketTax(17_700, 2026, 'hoh')).toBe(1_770);
    expect(bracketTax(1_000_000, 2026, 'mfj')).toBeCloseTo(
      24_800 * 0.1 +
        76_000 * 0.12 +
        110_600 * 0.22 +
        192_150 * 0.24 +
        108_900 * 0.32 +
        256_250 * 0.35 +
        231_300 * 0.37,
      6,
    );
  });

  it('is applied to income after the deduction, never to a negative one', () => {
    expect(taxableIncomeFor(50_000, COUPLE)).toBe(17_800);
    expect(taxableIncomeFor(20_000, COUPLE)).toBe(0);
    expect(incomeTaxFor(20_000, COUPLE)).toBe(0);
    expect(incomeTaxFor(50_000, COUPLE)).toBe(1_780);
  });

  it('names the band the last dollar lands in', () => {
    expect(bracketRateAt(20_000, COUPLE)).toBe(0);
    expect(bracketRateAt(50_000, COUPLE)).toBe(0.1);
    expect(bracketRateAt(57_000, COUPLE)).toBe(0.1);
    expect(bracketRateAt(57_001, COUPLE)).toBe(0.12);
    expect(bracketRateAt(200_000, COUPLE)).toBe(0.22);
    expect(bracketRateAt(200_000, { adults: 1, year: 2026 })).toBe(0.24);
  });
});

describe('the child tax credit', () => {
  const FAMILY: Scenario = { adults: 2, dependents: 2, year: 2026 };

  it('is one credit per child, and none with no children', () => {
    expect(childTaxCreditFor(50_000, COUPLE)).toBe(0);
    expect(childTaxCreditFor(50_000, FAMILY)).toBe(4_400);
    expect(childTaxCreditFor(50_000, { adults: 1, dependents: 1, year: 2025 })).toBe(2_200);
  });

  it('comes off the tax, and never takes it below zero', () => {
    // $60,000 less $32,200 is $27,800 taxable: $2,480 plus 12% of $3,000.
    expect(incomeTaxFor(60_000, { ...FAMILY, income: 60_000 })).toBe(0);
    expect(incomeTaxFor(60_000, COUPLE)).toBeCloseTo(2_840, 6);
    // $100,000 less $32,200 is $67,800: $2,480 + 12% of $43,000 = $7,640, less $4,400.
    expect(incomeTaxFor(100_000, FAMILY)).toBeCloseTo(3_240, 6);
  });

  it('phases out at five cents on the dollar over the threshold', () => {
    const parent: Scenario = { adults: 1, dependents: 1, year: 2026 };
    expect(childTaxCreditFor(200_000, parent)).toBe(2_200);
    expect(childTaxCreditFor(220_000, parent)).toBeCloseTo(1_200, 6);
    expect(childTaxCreditFor(244_000, parent)).toBe(0);
    expect(childTaxCreditFor(300_000, parent)).toBe(0);
    expect(childTaxCreditFor(300_000, FAMILY)).toBe(4_400);
  });
});

describe('the next dollar', () => {
  it('is the bracket rate on the slope', () => {
    expect(incomeTaxSlopeAt(20_000, COUPLE)).toBe(0);
    expect(incomeTaxSlopeAt(50_000, COUPLE)).toBeCloseTo(0.1, 6);
    expect(incomeTaxSlopeAt(80_000, COUPLE)).toBeCloseTo(0.12, 6);
    expect(incomeTaxSlopeAt(150_000, COUPLE)).toBeCloseTo(0.22, 6);
  });

  it('carries the credit’s phase-out on top of the bracket', () => {
    const parent: Scenario = { adults: 1, dependents: 1, year: 2026 };
    expect(incomeTaxSlopeAt(150_000, parent)).toBeCloseTo(0.24, 6);
    expect(incomeTaxSlopeAt(210_000, parent)).toBeCloseTo(0.24 + 0.05, 6);
  });
});
