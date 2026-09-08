import { useEffect, useRef, useState } from 'react';
import { scenarioUrl } from '../lib/scenarioUrl';
import type { PageScenario } from '../lib/scenarioUrl';

/**
 * How long a control has to sit still before the address bar is rewritten, in
 * milliseconds.
 *
 * Not a matter of taste. Browsers rate-limit the history API: Safari throws a
 * `SecurityError` on the 101st `replaceState` in 30 seconds, and Chrome and
 * Firefox silently drop the call. A range input fires a change per notch, so
 * one unhurried drag spends the whole budget. A trailing debounce writes where
 * the drag *stopped*, and at 400ms a reader who stutters still cannot get past
 * 75 calls in the window Safari counts over.
 */
export const ADDRESS_SETTLE_MS = 400;

/**
 * Put a household in the address bar, and never take the document down over
 * it: `replaceState` so Back still leaves, the whole URL so the fragment
 * survives, and a `catch` because the address bar is a convenience.
 */
const writeAddress = (scenario: PageScenario): void => {
  try {
    window.history.replaceState(window.history.state, '', scenarioUrl(scenario, window.location));
  } catch {
    /* The address bar is a convenience, and the reading outranks it. */
  }
};

/** What to say about the last copy, or nothing. */
export type CopyState = 'idle' | 'copied' | 'failed';

export interface ScenarioAddress {
  /** Whether this browser will hand a script the clipboard, and so whether the copy button is drawn. */
  canCopy: boolean;
  copyState: CopyState;
  copy: () => void;
}

/**
 * Keeps the address bar in step with the household, and copies it on request.
 * Only the write waits on the debounce; arrival writes at once. The copy
 * status is cleared on the render that changed the household.
 */
export const useScenarioAddress = (scenario: PageScenario): ScenarioAddress => {
  const [canCopy] = useState(() => typeof navigator.clipboard?.writeText === 'function');
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const { adults, age, spouseAge, income, dependents, state, benchmarkPremium, expansionState } =
    scenario;

  const written = useRef(false);
  useEffect(() => {
    const current: PageScenario = {
      adults,
      age,
      spouseAge,
      income,
      dependents,
      state,
      benchmarkPremium,
      expansionState,
    };
    let timer: number | undefined;
    if (written.current) {
      timer = window.setTimeout(() => writeAddress(current), ADDRESS_SETTLE_MS);
    } else {
      written.current = true;
      writeAddress(current);
    }
    setCopyState('idle');
    return () => window.clearTimeout(timer);
  }, [adults, age, spouseAge, income, dependents, state, benchmarkPremium, expansionState]);

  const copy = (): void => {
    /* Flush the address before reading it, so the button copies what is on
       screen rather than what was on screen 400ms ago. */
    writeAddress({
      adults,
      age,
      spouseAge,
      income,
      dependents,
      state,
      benchmarkPremium,
      expansionState,
    });
    void navigator.clipboard
      .writeText(window.location.href)
      .then(() => setCopyState('copied'))
      .catch(() => setCopyState('failed'));
  };

  return { canCopy, copyState, copy };
};
