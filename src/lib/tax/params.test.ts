import { describe, expect, it } from 'vitest';
import {
  FILING_STATUSES,
  PAGE_TAX_YEAR,
  TAX_YEARS,
  TAX_YEAR_PARAMS,
  adultAges,
  defaultTaxYear,
  filingParams,
  householdSizeFor,
  resolveScenario,
  taxYearParams,
} from './index';

describe('the years on file', () => {
  it('are 2025 and 2026, and the page prices the later one', () => {
    expect(TAX_YEARS).toEqual([2025, 2026]);
    expect(PAGE_TAX_YEAR).toBe(2026);
    expect(taxYearParams(2026).year).toBe(2026);
  });

  it('start on the calendar year when it is on file, and clamp otherwise', () => {
    expect(defaultTaxYear(2025)).toBe(2025);
    expect(defaultTaxYear(2026)).toBe(2026);
    expect(defaultTaxYear(2024)).toBe(2025);
    expect(defaultTaxYear(2031)).toBe(2026);
  });

  it('carry the published figures at the corners', () => {
    expect(filingParams(2026, 'mfj').standardDeduction).toBe(32_200);
    expect(filingParams(2026, 'single').standardDeduction).toBe(16_100);
    expect(filingParams(2026, 'mfj').ltcgBrackets[0].upTo).toBe(98_900);
    expect(filingParams(2026, 'single').ltcgBrackets[0].upTo).toBe(49_450);
    expect(filingParams(2026, 'mfj').brackets[1]).toEqual({ upTo: 100_800, rate: 0.12 });
  });

  it('have brackets that ascend and end at infinity, for every status and year', () => {
    for (const year of TAX_YEARS) {
      for (const status of FILING_STATUSES) {
        for (const schedule of [
          TAX_YEAR_PARAMS[year].filing[status].brackets,
          TAX_YEAR_PARAMS[year].filing[status].ltcgBrackets,
        ]) {
          for (let i = 1; i < schedule.length; i += 1) {
            expect(schedule[i].upTo).toBeGreaterThan(schedule[i - 1].upTo);
            expect(schedule[i].rate).toBeGreaterThan(schedule[i - 1].rate);
          }
          expect(schedule[schedule.length - 1].upTo).toBe(Infinity);
        }
      }
    }
  });
});

describe('the scenario', () => {
  it('fills every default', () => {
    const resolved = resolveScenario({});
    expect(resolved.filingStatus).toBe('single');
    expect(resolved.ages).toEqual([50]);
    expect(resolved.dependents).toBe(0);
    expect(resolved.benchmarkPremium).toBeNull();
    expect(resolved.expansionState).toBe(true);
    expect(resolved.addedKind).toBe('conversion');
    expect(resolved.added).toBe(0);
  });

  it('gives a joint return two ages and a single return one', () => {
    expect(adultAges('mfj', [52])).toEqual([52, 52]);
    expect(adultAges('mfj', [52, 48])).toEqual([52, 48]);
    expect(adultAges('single', [52, 48])).toEqual([52]);
    expect(adultAges('mfj')).toEqual([50, 50]);
  });

  it('counts the household from the status and the dependents', () => {
    expect(householdSizeFor({ filingStatus: 'single' })).toBe(1);
    expect(householdSizeFor({ filingStatus: 'mfj' })).toBe(2);
    expect(householdSizeFor({ filingStatus: 'mfj', dependents: 2.7 })).toBe(4);
    expect(householdSizeFor({ filingStatus: 'single', dependents: -1 })).toBe(1);
  });
});
