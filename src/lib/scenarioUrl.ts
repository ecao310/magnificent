/**
 * The household, written into the address bar and read back out of it.
 *
 * Every figure on the page is derived from seven values, and the address bar
 * is already the share surface every reader knows how to use: a refresh keeps
 * the household, and the link can go to a spouse or a navigator. Every value
 * it carries prices something. The step is a fragment (`#step-cost`), not a
 * key: it is where the reader is standing, not what the household is. The
 * year is not a key either: the page prices `PAGE_COVERAGE_YEAR` and offers
 * no way to change it.
 *
 * Writing is `replaceState`, debounced, never `pushState` — see
 * `hooks/useScenarioAddress.ts`. Everything a link carries is clamped on the
 * way in against the same bound the page's own control would have held it
 * inside, and every clamp says what it did.
 */
import { MAX_ADULT_AGE, MIN_ADULT_AGE } from './aca';
import type { Adults } from './aca';
import { formatCurrency } from './format';

/** The whole household the page prices, and the whole of what a link carries. */
export interface PageScenario {
  adults: Adults;
  age: number;
  /** Read only for a couple, but kept for one adult — see `decodeScenario`. */
  spouseAge: number;
  income: number;
  dependents: number;
  /** The reader's own monthly benchmark, or null for the national average. */
  benchmarkPremium: number | null;
  expansionState: boolean;
}

/**
 * The page opens on the thread's own household: a couple on $50,000. A reader
 * arriving from the thread lands on the example they came to check.
 */
export const DEFAULT_INCOME = 50_000;

/**
 * The most income the slider offers. Past $200,000 no household this page
 * can describe is on the credit, and the chart has nothing left to say.
 */
export const MAX_INCOME = 200_000;

/** Dependents past this move the line by amounts nobody on this page will meet. */
export const MAX_DEPENDENTS = 5;

/**
 * The most the premium slider offers, monthly. A couple of sixty-four-year-olds
 * in the most expensive county in the country is under $5,000.
 */
export const MAX_PREMIUM_MONTHLY = 6_000;

/** Every count of adults a link may name, in the order they are offered. */
export const ADULT_COUNTS: Adults[] = [1, 2];

/** The page as it opens, before the reader touches anything. */
export function defaultScenario(): PageScenario {
  return {
    adults: 2,
    age: 50,
    spouseAge: 50,
    income: DEFAULT_INCOME,
    dependents: 0,
    benchmarkPremium: null,
    expansionState: true,
  };
}

/**
 * The household as a query string, without its leading `?`.
 *
 * A value is written only when it differs from what the page opens with, so an
 * untouched page reads as the empty string, and every key that is present is
 * something the reader did. The second age is written only for a couple.
 */
export function encodeScenario(scenario: PageScenario): string {
  const opening = defaultScenario();
  const params = new URLSearchParams();
  if (scenario.adults !== opening.adults) params.set('adults', String(scenario.adults));
  if (scenario.age !== opening.age) params.set('age', String(scenario.age));
  if (scenario.adults === 2 && scenario.spouseAge !== opening.spouseAge) {
    params.set('spouse', String(scenario.spouseAge));
  }
  if (scenario.income !== opening.income) params.set('income', String(scenario.income));
  if (scenario.dependents !== opening.dependents) params.set('deps', String(scenario.dependents));
  if (scenario.benchmarkPremium !== null) params.set('premium', String(scenario.benchmarkPremium));
  if (!scenario.expansionState) params.set('expansion', '0');
  return params.toString();
}

/** The address to replace the current one with: the path, this household, and the fragment. */
export function scenarioUrl(
  scenario: PageScenario,
  location: { pathname: string; hash: string },
): string {
  const query = encodeScenario(scenario);
  return `${location.pathname}${query ? `?${query}` : ''}${location.hash}`;
}

export interface DecodedScenario {
  scenario: PageScenario;
  /** What the link asked for that this page would not give it. Empty for a link this page wrote. */
  notes: string[];
}

/**
 * Read a household out of a query string, holding every figure inside the
 * bounds the page's own controls would have held it inside. Nothing here
 * throws and nothing here refuses: an unreadable value falls back to what the
 * page opens with, and every fallback and every clamp leaves a note naming
 * the bound it hit.
 */
export function decodeScenario(search: string): DecodedScenario {
  const params = new URLSearchParams(search);
  const notes: string[] = [];
  const opening = defaultScenario();

  const whole = (
    key: string,
    {
      fallback,
      min = 0,
      max,
      what,
      reason,
      format = (n: number) => String(n),
    }: {
      fallback: number;
      min?: number;
      max: number;
      what: string;
      reason?: string;
      format?: (n: number) => string;
    },
  ): number => {
    const raw = params.get(key);
    if (raw === null || raw.trim() === '') return fallback;
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      notes.push(
        `This link gave ${what} as “${raw}”, which is not a number, so it is set to ${format(fallback)}.`,
      );
      return fallback;
    }
    const asked = Math.round(value);
    if (asked > max) {
      notes.push(
        `This link asked for ${what} of ${format(asked)}. The most this page can carry is ${format(max)}${reason ? ` — ${reason}` : ''}, so that is what is set.`,
      );
      return max;
    }
    if (asked < min) {
      notes.push(
        min === 0
          ? `This link asked for ${what} of ${format(asked)}, which cannot be less than nothing, so it is set to ${format(0)}.`
          : `This link asked for ${what} of ${format(asked)}. The least this page can carry is ${format(min)}, so that is what is set.`,
      );
      return min;
    }
    return asked;
  };

  const rawAdults = params.get('adults');
  let adults: Adults = opening.adults;
  if (rawAdults !== null && rawAdults.trim() !== '') {
    if (rawAdults === '1' || rawAdults === '2') {
      adults = Number(rawAdults) as Adults;
    } else {
      notes.push(
        `This link names ${rawAdults} adults, and a plan here carries one or two, so it is showing a couple.`,
      );
    }
  }

  const ageBounds = {
    min: MIN_ADULT_AGE,
    max: MAX_ADULT_AGE,
    reason: `at ${MAX_ADULT_AGE + 1} Medicare takes over and the credit ends`,
  };
  const age = whole('age', { fallback: opening.age, what: 'an age', ...ageBounds });
  /**
   * Kept whatever the count, as the page keeps it: switching to one adult
   * hides the second slider without forgetting its answer, so a refresh has
   * to keep it too.
   */
  const spouseAge = whole('spouse', { fallback: opening.spouseAge, what: 'a second age', ...ageBounds });

  const income = whole('income', {
    fallback: opening.income,
    max: MAX_INCOME,
    what: 'household income',
    reason: 'the right edge of the slider that sets it',
    format: formatCurrency,
  });
  const dependents = whole('deps', {
    fallback: opening.dependents,
    max: MAX_DEPENDENTS,
    what: 'a number of dependents',
  });

  const rawPremium = params.get('premium');
  const benchmarkPremium =
    rawPremium === null || rawPremium.trim() === ''
      ? null
      : whole('premium', {
          fallback: 0,
          max: MAX_PREMIUM_MONTHLY,
          what: 'a monthly benchmark premium',
          reason: 'the right edge of the slider that sets it',
          format: formatCurrency,
        });

  const expansionState = params.get('expansion') !== '0';

  return {
    scenario: { adults, age, spouseAge, income, dependents, benchmarkPremium, expansionState },
    notes,
  };
}

/** The engine's view of the page's household: ages as a list, nothing else renamed. */
export function engineScenario(scenario: PageScenario) {
  return {
    adults: scenario.adults,
    ages: scenario.adults === 2 ? [scenario.age, scenario.spouseAge] : [scenario.age],
    income: scenario.income,
    dependents: scenario.dependents,
    benchmarkPremium: scenario.benchmarkPremium,
    expansionState: scenario.expansionState,
  };
}
