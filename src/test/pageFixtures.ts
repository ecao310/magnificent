import { afterEach, beforeEach, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { PAGE_TAX_YEAR } from '../lib/tax';

/**
 * What every test that renders the whole page needs before it can assert
 * anything: a stopped clock, and the readings of the rendered markup more
 * than one file makes.
 */

/**
 * Pins the clock for one test file, so a figure derived from
 * `defaultTaxYear()` — the engine's own default, which follows the calendar —
 * cannot make these assertions depend on the day they are run.
 */
export function pinPageYear(): void {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${PAGE_TAX_YEAR}-07-01T00:00:00Z`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });
}

/** The line that closes step 1 by naming the household every later step prices. */
export const scenarioRecap = (): HTMLElement => screen.getByText(/^One year’s household:/);

/** The sentence under the slider that prices the block. */
export const readout = (): HTMLElement =>
  document.querySelector('.slider-readout') as HTMLElement;

/** Set the filing status, which the page keeps in one place: the strip. */
export const chooseFilingStatus = (label: string): void => {
  fireEvent.click(screen.getByRole('radio', { name: label }));
};

/** Set the kind of block the same way. */
export const chooseKind = (label: string): void => {
  fireEvent.click(screen.getByRole('radio', { name: label }));
};

/** Move a slider to a value. */
export const slide = (name: RegExp, value: number): void => {
  fireEvent.change(screen.getByRole('slider', { name }), { target: { value: String(value) } });
};

/** The close's figure under a given term. */
export const answerFigure = (term: RegExp): HTMLElement => {
  const dt = Array.from(document.querySelectorAll('.answer-figure dt')).find((el) =>
    term.test(el.textContent ?? ''),
  ) as HTMLElement | undefined;
  if (!dt) throw new Error(`No answer figure matches ${term}`);
  return dt.parentElement as HTMLElement;
};
