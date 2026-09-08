import { describe, expect, it } from 'vitest';
import {
  TAX_YEARS,
  agiFor,
  baseIncomeFor,
  federalIncomeTax,
  filingParams,
  householdIncomeFor,
  splitFor,
  taxOnSplit,
  totalTax,
} from './index';
import type { Scenario } from './index';

const COUPLE: Scenario = {
  filingStatus: 'mfj',
  ordinaryIncome: 10_000,
  qualifiedIncome: 40_000,
  year: 2026,
};

describe('the split', () => {
  it('puts the block on the half its kind names', () => {
    expect(splitFor({ ...COUPLE, added: 10_000, addedKind: 'conversion' })).toEqual({
      ordinary: 20_000,
      gains: 40_000,
    });
    expect(splitFor({ ...COUPLE, added: 10_000, addedKind: 'harvest' })).toEqual({
      ordinary: 10_000,
      gains: 50_000,
    });
  });

  it('adds up to household income either way, and the base without the block', () => {
    expect(householdIncomeFor({ ...COUPLE, added: 10_000, addedKind: 'harvest' })).toBe(60_000);
    expect(agiFor({ ...COUPLE, added: 10_000, addedKind: 'conversion' })).toBe(60_000);
    expect(baseIncomeFor({ ...COUPLE, added: 10_000 })).toBe(50_000);
  });
});

describe('the ordinary schedule', () => {
  it('walks the brackets', () => {
    // 2026 single: 10% to $12,400, 12% to $50,400.
    expect(federalIncomeTax(12_400, { filingStatus: 'single', year: 2026 })).toBeCloseTo(1_240, 6);
    expect(federalIncomeTax(20_000, { filingStatus: 'single', year: 2026 })).toBeCloseTo(
      1_240 + 7_600 * 0.12,
      6,
    );
    expect(federalIncomeTax(0, { filingStatus: 'single', year: 2026 })).toBe(0);
  });
});

describe('the whole tax', () => {
  it('owes nothing on a couple living on $50,000 of mostly dividends', () => {
    // $10,000 ordinary is under the $32,200 deduction; the $40,000 of gains
    // stack from $0 to $17,800 of taxable income, all inside the 0% band.
    expect(totalTax(COUPLE)).toBe(0);
  });

  it('still owes nothing on a $10,000 conversion for that couple: the deduction absorbs it', () => {
    expect(totalTax({ ...COUPLE, added: 10_000, addedKind: 'conversion' })).toBe(0);
    expect(totalTax({ ...COUPLE, added: 10_000, addedKind: 'harvest' })).toBe(0);
  });

  it('charges a conversion at the bracket once the deduction is used up', () => {
    // Ordinary $40,000: taxable $7,800 at 10% = $780. Gains still in the 0% band.
    expect(totalTax({ ...COUPLE, added: 30_000, addedKind: 'conversion' })).toBeCloseTo(780, 6);
  });

  it('charges 15% on the gain dollar that clears the 0% band', () => {
    // 2026 joint 0% band tops out at $98,900 of taxable income; with the
    // deduction that is $131,100 of income when all of it past the deduction
    // is gains. One dollar over is 15 cents.
    const under = taxOnSplit({ ordinary: 10_000, gains: 121_100 }, COUPLE);
    const over = taxOnSplit({ ordinary: 10_000, gains: 121_101 }, COUPLE);
    expect(under).toBeCloseTo(0, 6);
    expect(over - under).toBeCloseTo(0.15, 6);
  });

  it('charges an ordinary dollar under a full stack of gains twice: its bracket, and the 15% it pushes out', () => {
    const under = taxOnSplit({ ordinary: 40_000, gains: 91_100 }, COUPLE);
    const over = taxOnSplit({ ordinary: 40_001, gains: 91_100 }, COUPLE);
    // 10% on the dollar itself, plus the top gain dollar moved from 0% to 15%.
    expect(over - under).toBeCloseTo(0.25, 6);
  });

  it('measures the gain bands against total taxable income in every year', () => {
    for (const year of TAX_YEARS) {
      for (const filingStatus of ['single', 'mfj'] as const) {
        const { standardDeduction, ltcgBrackets } = filingParams(year, filingStatus);
        const top = ltcgBrackets[0].upTo;
        const scenario = { filingStatus, year };
        const at = (gains: number) => taxOnSplit({ ordinary: 0, gains }, scenario);
        expect(at(standardDeduction + top)).toBeCloseTo(0, 6);
        expect(at(standardDeduction + top + 100) - at(standardDeduction + top)).toBeCloseTo(15, 6);
      }
    }
  });
});
