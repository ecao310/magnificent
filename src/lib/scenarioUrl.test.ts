import { describe, expect, it } from 'vitest';
import {
  MAX_ADDED,
  MAX_BASE_INCOME,
  MAX_DEPENDENTS,
  MAX_PREMIUM_MONTHLY,
  decodeScenario,
  defaultScenario,
  encodeScenario,
  engineScenario,
  scenarioUrl,
} from './scenarioUrl';
import { MAX_ADULT_AGE, MIN_ADULT_AGE } from './tax';

describe('the link', () => {
  it('is empty for the household the page opens with', () => {
    expect(encodeScenario(defaultScenario())).toBe('');
    expect(scenarioUrl(defaultScenario(), { pathname: '/x/', hash: '' })).toBe('/x/');
  });

  it('carries only what the reader changed', () => {
    const link = encodeScenario({ ...defaultScenario(), added: 25_000, addedKind: 'conversion' });
    expect(link).toBe('add=25000&kind=conversion');
  });

  it('keeps the fragment and writes the ? only when there is a query', () => {
    expect(scenarioUrl({ ...defaultScenario(), age: 60 }, { pathname: '/x/', hash: '#step-slope' })).toBe(
      '/x/?age=60#step-slope',
    );
  });

  it('writes the spouse’s age only on a joint return', () => {
    const couple = { ...defaultScenario(), spouseAge: 58 };
    expect(encodeScenario(couple)).toBe('spouse=58');
    expect(encodeScenario({ ...couple, filingStatus: 'single' })).toBe('filing=single');
  });

  it('writes the premium only when the reader set one, and expansion only when off', () => {
    expect(encodeScenario({ ...defaultScenario(), benchmarkPremium: 900 })).toBe('premium=900');
    expect(encodeScenario({ ...defaultScenario(), expansionState: false })).toBe('expansion=0');
  });

  it('round-trips every field', () => {
    const scenario = {
      filingStatus: 'single' as const,
      age: 61,
      spouseAge: 50,
      ordinaryIncome: 22_500,
      qualifiedIncome: 15_000,
      added: 30_000,
      addedKind: 'conversion' as const,
      dependents: 2,
      benchmarkPremium: 1_250,
      expansionState: false,
    };
    const { scenario: back, notes } = decodeScenario(`?${encodeScenario(scenario)}`);
    expect(notes).toEqual([]);
    expect(back).toEqual(scenario);
  });
});

describe('reading a link', () => {
  it('opens on the defaults for an empty address', () => {
    const { scenario, notes } = decodeScenario('');
    expect(scenario).toEqual(defaultScenario());
    expect(notes).toEqual([]);
  });

  it('clamps every figure to the slider that would have set it, and says so', () => {
    const { scenario, notes } = decodeScenario(
      `?age=70&spouse=10&ordinary=${MAX_BASE_INCOME + 1}&qualified=-5&add=${MAX_ADDED * 2}&deps=9&premium=99999`,
    );
    expect(scenario.age).toBe(MAX_ADULT_AGE);
    expect(scenario.spouseAge).toBe(MIN_ADULT_AGE);
    expect(scenario.ordinaryIncome).toBe(MAX_BASE_INCOME);
    expect(scenario.qualifiedIncome).toBe(0);
    expect(scenario.added).toBe(MAX_ADDED);
    expect(scenario.dependents).toBe(MAX_DEPENDENTS);
    expect(scenario.benchmarkPremium).toBe(MAX_PREMIUM_MONTHLY);
    expect(notes).toHaveLength(7);
    expect(notes.join(' ')).toMatch(/Medicare takes over/);
    expect(notes.join(' ')).toMatch(/\$200,000/);
  });

  it('answers a filing status or a kind it does not offer', () => {
    const { scenario, notes } = decodeScenario('?filing=hoh&kind=wages');
    expect(scenario.filingStatus).toBe('mfj');
    expect(scenario.addedKind).toBe('harvest');
    expect(notes).toHaveLength(2);
    expect(notes[0]).toMatch(/hoh/);
    expect(notes[1]).toMatch(/wages/);
  });

  it('falls back on a value that is not a number, with a note', () => {
    const { scenario, notes } = decodeScenario('?add=lots');
    expect(scenario.added).toBe(defaultScenario().added);
    expect(notes[0]).toMatch(/“lots”/);
  });

  it('reads past keys it does not know', () => {
    const { scenario, notes } = decodeScenario('?year=2025&ss=20000&utm_source=x');
    expect(scenario).toEqual(defaultScenario());
    expect(notes).toEqual([]);
  });
});

describe('the engine’s view', () => {
  it('lists two ages for a couple and one for a single filer', () => {
    expect(engineScenario({ ...defaultScenario(), spouseAge: 40 }).ages).toEqual([50, 40]);
    expect(engineScenario({ ...defaultScenario(), filingStatus: 'single', spouseAge: 40 }).ages).toEqual([50]);
  });
});
