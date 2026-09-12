import { describe, expect, it } from 'vitest';
import {
  BENCHMARK_YEAR_PARAMS,
  COVERAGE_YEARS,
  STATES,
  STATE_AGE_CURVES,
  STATE_CODES,
  expansionFor,
  isStateCode,
  resolveScenario,
} from './index';
import type { StateCode } from './index';

describe('the states', () => {
  it('are the fifty and the District, each with a benchmark for every year on file', () => {
    expect(STATE_CODES).toHaveLength(51);
    expect(new Set(STATE_CODES).size).toBe(51);
    for (const code of STATE_CODES) {
      expect(STATES[code].code).toBe(code);
      for (const year of COVERAGE_YEARS) {
        expect(STATES[code].benchmarkAt40[year], `${code} ${year}`).toBeGreaterThan(0);
      }
    }
  });

  it('list in the order their names read', () => {
    const names = STATE_CODES.map((code) => STATES[code].name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
    expect(STATE_CODES[0]).toBe('AL');
    expect(STATE_CODES[STATE_CODES.length - 1]).toBe('WY');
  });

  it('read KFF’s table at its corners', () => {
    expect(STATES.TX.benchmarkAt40).toEqual({ 2025: 489, 2026: 661 });
    expect(STATES.VT.benchmarkAt40[2026]).toBe(1_299);
    expect(STATES.NH.benchmarkAt40[2026]).toBe(401);
    // Two figures that look wrong and are not: Alaska fell, Arkansas rose 69%.
    expect(STATES.AK.benchmarkAt40[2026]).toBeLessThan(STATES.AK.benchmarkAt40[2025]);
    expect(STATES.AR.benchmarkAt40[2026] / STATES.AR.benchmarkAt40[2025]).toBeCloseTo(1.69, 2);
  });

  it('sit around the national average', () => {
    for (const year of COVERAGE_YEARS) {
      const figures = STATE_CODES.map((code) => STATES[code].benchmarkAt40[year]);
      const national = BENCHMARK_YEAR_PARAMS[year].monthlyAt40;
      expect(Math.min(...figures)).toBeLessThan(national);
      expect(Math.max(...figures)).toBeGreaterThan(national);
    }
  });

  it('name the ten that did not expand Medicaid', () => {
    const notExpanded = STATE_CODES.filter((code) => !STATES[code].expandedMedicaid);
    expect(notExpanded).toEqual(['AL', 'FL', 'GA', 'KS', 'MS', 'SC', 'TN', 'TX', 'WI', 'WY']);
    expect(expansionFor('TX')).toBe(false);
    expect(expansionFor('OH')).toBe(true);
    expect(expansionFor(null)).toBe(true);
  });

  it('name the two that do not price by age, and the seven on curves of their own', () => {
    const none = STATE_CODES.filter((code) => STATES[code].ageRating === 'none');
    const own = STATE_CODES.filter((code) => STATES[code].ageRating === 'own');
    expect(none).toEqual(['NY', 'VT']);
    expect(own).toEqual(['AL', 'DC', 'MA', 'MN', 'MS', 'OR', 'UT']);
    expect(Object.keys(STATE_AGE_CURVES).sort()).toEqual(own);
  });

  it('put Alaska and Hawaii on their own poverty guidelines', () => {
    const offCurve = STATE_CODES.filter((code) => STATES[code].guidelineRegion !== 'contiguous');
    expect(offCurve).toEqual(['AK', 'HI']);
    expect(STATES.AK.guidelineRegion).toBe('alaska');
    expect(STATES.HI.guidelineRegion).toBe('hawaii');
  });

  it('know a code from a string', () => {
    expect(isStateCode('TX')).toBe(true);
    expect(isStateCode('DC')).toBe(true);
    expect(isStateCode('tx')).toBe(false);
    expect(isStateCode('ZZ')).toBe(false);
    expect(isStateCode('toString')).toBe(false);
  });
});

describe('a scenario with a state', () => {
  it('opens the switch on the state’s answer, and lets the reader overrule it', () => {
    expect(resolveScenario({ state: 'TX' }).expansionState).toBe(false);
    expect(resolveScenario({ state: 'TX', expansionState: true }).expansionState).toBe(true);
    expect(resolveScenario({ state: 'OH' }).expansionState).toBe(true);
    expect(resolveScenario({}).expansionState).toBe(true);
    expect(resolveScenario({}).state).toBeNull();
  });

  it('keeps the code it was given', () => {
    const code: StateCode = 'HI';
    expect(resolveScenario({ state: code }).state).toBe('HI');
  });
});
