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
 * one unhurried drag spends the whole budget, and on Safari the throw lands
 * inside an effect, where React has no boundary to catch it. A trailing
 * debounce writes where the drag *stopped*, which is the one household worth
 * carrying, and at 400ms a reader who stutters still cannot get past 75 calls
 * in the window Safari counts over.
 */
export const ADDRESS_SETTLE_MS = 400;

/**
 * Put a household in the address bar, and never take the document down over
 * it. `replaceState`, not `pushState`, so Back still leaves; the whole URL,
 * so the `#step-…` fragment survives; and a `catch`, because a browser that
 * refuses to rewrite the address has denied the reader a convenience and
 * nothing more.
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
 *
 * Only the write waits on the debounce; arrival writes at once, because
 * nothing is being dragged on mount and because this is the write that
 * normalises the link the reader came in on. The copy status is cleared on
 * the render that changed the household, because "Copied" stops being true
 * of the clipboard the instant a control moves.
 */
export const useScenarioAddress = (scenario: PageScenario): ScenarioAddress => {
  const [canCopy] = useState(() => typeof navigator.clipboard?.writeText === 'function');
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const {
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
  } = scenario;

  const written = useRef(false);
  useEffect(() => {
    const current: PageScenario = {
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
  }, [
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
  ]);

  const copy = (): void => {
    /* Flush the address before reading it, so the button copies what is on
       screen rather than what was on screen 400ms ago. */
    writeAddress({
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
    });
    void navigator.clipboard
      .writeText(window.location.href)
      .then(() => setCopyState('copied'))
      .catch(() => setCopyState('failed'));
  };

  return { canCopy, copyState, copy };
};
