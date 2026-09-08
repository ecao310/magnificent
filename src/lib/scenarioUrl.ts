/**
 * The household, written into the address bar and read back out of it.
 *
 * Every figure on the page is derived from ten values, and the address bar
 * is already the share surface every reader knows how to use: a refresh keeps
 * the household, and the link can go to a spouse or an advisor. Every value it
 * carries prices something — a link is the household, and nothing that
 * changes no figure belongs in it. The step is a fragment (`#step-slope`),
 * not a key: it is where the reader is standing, not what the household is.
 * The year is not a key either: the page prices `PAGE_TAX_YEAR` and offers no
 * way to change it, and a key that reads nothing is worse than no key.
 *
 * Writing is `replaceState`, debounced, never `pushState` — see
 * `hooks/useScenarioAddress.ts` for the two reasons, both of which are
 * browsers. Everything a link carries is clamped on the way in against the
 * same bound the page's own control would have held it inside, and every
 * clamp says what it did: a link is the one input this app has that it did
 * not produce itself.
 */
import { FILING_STATUSES, MAX_ADULT_AGE, MIN_ADULT_AGE } from './tax';
import type { AddedKind, FilingStatus } from './tax';
import { formatCurrency } from './format';

/** The whole household the page prices, and the whole of what a link carries. */
export interface PageScenario {
  filingStatus: FilingStatus;
  age: number;
  /** Read only on a joint return, but kept on a single one — see `decodeScenario`. */
  spouseAge: number;
  ordinaryIncome: number;
  qualifiedIncome: number;
  added: number;
  addedKind: AddedKind;
  dependents: number;
  /** The reader's own monthly benchmark, or null for the national average. */
  benchmarkPremium: number | null;
  expansionState: boolean;
}

/**
 * The page opens on the thread's own household: a couple, $50,000 of income
 * that is mostly dividends, asking what $10,000 of harvested gain costs. So a
 * reader arriving from the thread lands on the example they came to check.
 */
export const DEFAULT_ORDINARY_INCOME = 10_000;
export const DEFAULT_QUALIFIED_INCOME = 40_000;
export const DEFAULT_ADDED = 10_000;

/**
 * The most either half of the base may carry. Past $200,000 of income a
 * household is not on the Marketplace credit at any household size this page
 * offers, and the chart has nothing left to say.
 */
export const MAX_BASE_INCOME = 200_000;

/** The most the block slider offers: a large conversion, in one year. */
export const MAX_ADDED = 150_000;

/** Dependents past this move the line by amounts nobody on this page will meet. */
export const MAX_DEPENDENTS = 5;

/**
 * The most the premium slider offers, monthly. A couple of sixty-four-year-olds
 * in the most expensive county in the country is under $5,000.
 */
export const MAX_PREMIUM_MONTHLY = 6_000;

/** Every kind a link may name, in the order they are offered. */
export const ADDED_KINDS: AddedKind[] = ['conversion', 'harvest'];

/** How each status is named back to a reader whose link asked for it. */
const FILING_STATUS_SHORT: Record<FilingStatus, string> = {
  single: 'a single filer',
  mfj: 'married filing jointly',
};

/** The page as it opens, before the reader touches anything. */
export function defaultScenario(): PageScenario {
  return {
    filingStatus: 'mfj',
    age: 50,
    spouseAge: 50,
    ordinaryIncome: DEFAULT_ORDINARY_INCOME,
    qualifiedIncome: DEFAULT_QUALIFIED_INCOME,
    added: DEFAULT_ADDED,
    addedKind: 'harvest',
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
 * something the reader did. The spouse's age is written only on a joint
 * return: a single return has no spouse for it to be the age of.
 */
export function encodeScenario(scenario: PageScenario): string {
  const opening = defaultScenario();
  const params = new URLSearchParams();
  if (scenario.filingStatus !== opening.filingStatus) params.set('filing', scenario.filingStatus);
  if (scenario.age !== opening.age) params.set('age', String(scenario.age));
  if (scenario.filingStatus === 'mfj' && scenario.spouseAge !== opening.spouseAge) {
    params.set('spouse', String(scenario.spouseAge));
  }
  if (scenario.ordinaryIncome !== opening.ordinaryIncome) {
    params.set('ordinary', String(scenario.ordinaryIncome));
  }
  if (scenario.qualifiedIncome !== opening.qualifiedIncome) {
    params.set('qualified', String(scenario.qualifiedIncome));
  }
  if (scenario.added !== opening.added) params.set('add', String(scenario.added));
  if (scenario.addedKind !== opening.addedKind) params.set('kind', scenario.addedKind);
  if (scenario.dependents !== opening.dependents) params.set('deps', String(scenario.dependents));
  if (scenario.benchmarkPremium !== null) params.set('premium', String(scenario.benchmarkPremium));
  if (!scenario.expansionState) params.set('expansion', '0');
  return params.toString();
}

/**
 * The address to replace the current one with: the path, this household, and
 * whichever step the fragment is standing on. The `?` is only written when
 * there is something after it.
 */
export function scenarioUrl(
  scenario: PageScenario,
  location: { pathname: string; hash: string },
): string {
  const query = encodeScenario(scenario);
  return `${location.pathname}${query ? `?${query}` : ''}${location.hash}`;
}

export interface DecodedScenario {
  scenario: PageScenario;
  /**
   * What the link asked for that this page would not give it, in the same
   * plain words the page uses for everything else. Empty for a link this page
   * wrote itself.
   */
  notes: string[];
}

/**
 * Read a household out of a query string, holding every figure inside the
 * bounds the page's own controls would have held it inside.
 *
 * Nothing here throws and nothing here refuses: an unreadable value falls back
 * to what the page opens with, and every fallback and every clamp leaves a
 * note naming the bound it hit.
 */
export function decodeScenario(search: string): DecodedScenario {
  const params = new URLSearchParams(search);
  const notes: string[] = [];
  const opening = defaultScenario();

  /** A whole number from the link, held between `min` and `max`, with a note for each edge. */
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

  const rawFiling = params.get('filing');
  let filingStatus: FilingStatus = opening.filingStatus;
  if (rawFiling !== null && rawFiling.trim() !== '') {
    if ((FILING_STATUSES as string[]).includes(rawFiling)) {
      filingStatus = rawFiling as FilingStatus;
    } else {
      notes.push(
        `This link names a filing status this page does not offer (“${rawFiling}”), so it is showing ${FILING_STATUS_SHORT[filingStatus]}.`,
      );
    }
  }

  const rawKind = params.get('kind');
  let addedKind: AddedKind = opening.addedKind;
  if (rawKind !== null && rawKind.trim() !== '') {
    if ((ADDED_KINDS as string[]).includes(rawKind)) {
      addedKind = rawKind as AddedKind;
    } else {
      notes.push(
        `This link names a kind of income this page does not price (“${rawKind}”), so the block is priced as a harvested gain.`,
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
   * Kept whatever the status, as the page keeps it: switching the strip to
   * single hides the spouse's slider without forgetting its answer, so a
   * refresh has to keep it too or a misclick on the radio would cost the
   * reader a figure they had set.
   */
  const spouseAge = whole('spouse', { fallback: opening.spouseAge, what: 'a spouse’s age', ...ageBounds });

  const ordinaryIncome = whole('ordinary', {
    fallback: opening.ordinaryIncome,
    max: MAX_BASE_INCOME,
    what: 'ordinary income',
    reason: 'the right edge of the slider that sets it',
    format: formatCurrency,
  });
  const qualifiedIncome = whole('qualified', {
    fallback: opening.qualifiedIncome,
    max: MAX_BASE_INCOME,
    what: 'qualified dividends and gains',
    reason: 'the right edge of the slider that sets it',
    format: formatCurrency,
  });
  const added = whole('add', {
    fallback: opening.added,
    max: MAX_ADDED,
    what: 'an amount to add',
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
    scenario: {
      filingStatus,
      age,
      spouseAge,
      ordinaryIncome,
      qualifiedIncome,
      added,
      addedKind,
      dependents,
      benchmarkPremium,
      expansionState,
    },
    notes,
  };
}

/** The engine's view of the page's household: ages as a list, nothing else renamed. */
export function engineScenario(scenario: PageScenario) {
  return {
    filingStatus: scenario.filingStatus,
    ages: scenario.filingStatus === 'mfj' ? [scenario.age, scenario.spouseAge] : [scenario.age],
    ordinaryIncome: scenario.ordinaryIncome,
    qualifiedIncome: scenario.qualifiedIncome,
    added: scenario.added,
    addedKind: scenario.addedKind,
    dependents: scenario.dependents,
    benchmarkPremium: scenario.benchmarkPremium,
    expansionState: scenario.expansionState,
  };
}
