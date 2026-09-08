import { afterEach, beforeEach, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { PAGE_COVERAGE_YEAR } from '../lib/aca';

/** What every test that renders the whole page needs: a stopped clock, and the readings more than one file makes. */

export function pinPageYear(): void {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${PAGE_COVERAGE_YEAR}-07-01T00:00:00Z`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });
}

/** The line that closes step 1 by naming the household every later step prices. */
export const scenarioRecap = (): HTMLElement => screen.getByText(/^One year’s household:/);

/** The sentence under the slider that prices the household's own point. */
export const readout = (): HTMLElement => document.querySelector('.slider-readout') as HTMLElement;

/** Set the adults, which the page keeps in one place: the strip. */
export const chooseAdults = (label: string): void => {
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
