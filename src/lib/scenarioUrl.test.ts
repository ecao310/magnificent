import { describe, expect, it } from 'vitest';
import {
  MAX_DEPENDENTS,
  MAX_INCOME,
  MAX_PREMIUM_MONTHLY,
  decodeScenario,
  defaultScenario,
  encodeScenario,
  engineScenario,
  scenarioUrl,
} from './scenarioUrl';
import { MAX_ADULT_AGE, MIN_ADULT_AGE } from './aca';

describe('the link', () => {
  it('is empty for the household the page opens with', () => {
    expect(encodeScenario(defaultScenario())).toBe('');
    expect(scenarioUrl(defaultScenario(), { pathname: '/x/', hash: '' })).toBe('/x/');
  });

  it('carries only what the reader changed', () => {
    expect(encodeScenario({ ...defaultScenario(), income: 65_000 })).toBe('income=65000');
  });

  it('keeps the fragment and writes the ? only when there is a query', () => {
    expect(scenarioUrl({ ...defaultScenario(), age: 60 }, { pathname: '/x/', hash: '#step-cost' })).toBe(
      '/x/?age=60#step-cost',
    );
  });

  it('writes the second age only for a couple', () => {
    const couple = { ...defaultScenario(), spouseAge: 58 };
    expect(encodeScenario(couple)).toBe('spouse=58');
    expect(encodeScenario({ ...couple, adults: 1 })).toBe('adults=1');
  });

  it('writes the premium only when the reader set one, and expansion only when off', () => {
    expect(encodeScenario({ ...defaultScenario(), benchmarkPremium: 900 })).toBe('premium=900');
    expect(encodeScenario({ ...defaultScenario(), expansionState: false })).toBe('expansion=0');
  });

  it('round-trips every field', () => {
    const scenario = {
      adults: 1 as const,
      age: 61,
      spouseAge: 50,
      income: 37_500,
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
      `?age=70&spouse=10&income=${MAX_INCOME + 1}&deps=9&premium=99999`,
    );
    expect(scenario.age).toBe(MAX_ADULT_AGE);
    expect(scenario.spouseAge).toBe(MIN_ADULT_AGE);
    expect(scenario.income).toBe(MAX_INCOME);
    expect(scenario.dependents).toBe(MAX_DEPENDENTS);
    expect(scenario.benchmarkPremium).toBe(MAX_PREMIUM_MONTHLY);
    expect(notes).toHaveLength(5);
    expect(notes.join(' ')).toMatch(/Medicare takes over/);
    expect(notes.join(' ')).toMatch(/\$200,000/);
  });

  it('answers a count of adults it does not offer', () => {
    const { scenario, notes } = decodeScenario('?adults=3');
    expect(scenario.adults).toBe(2);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatch(/3 adults/);
  });

  it('falls back on a value that is not a number, with a note', () => {
    const { scenario, notes } = decodeScenario('?income=lots');
    expect(scenario.income).toBe(defaultScenario().income);
    expect(notes[0]).toMatch(/“lots”/);
  });

  it('reads past keys it does not know', () => {
    const { scenario, notes } = decodeScenario('?year=2025&filing=mfj&kind=harvest&utm_source=x');
    expect(scenario).toEqual(defaultScenario());
    expect(notes).toEqual([]);
  });
});

describe('the engine’s view', () => {
  it('lists two ages for a couple and one for one adult', () => {
    expect(engineScenario({ ...defaultScenario(), spouseAge: 40 }).ages).toEqual([50, 40]);
    expect(engineScenario({ ...defaultScenario(), adults: 1, spouseAge: 40 }).ages).toEqual([50]);
  });
});
