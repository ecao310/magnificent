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

/** The sentence under the slider that prices the household's own point. */
export const readout = (): HTMLElement => document.querySelector('.slider-readout') as HTMLElement;

/** Set the adults, which the page keeps in one place: the strip. */
export const chooseAdults = (label: string): void => {
  fireEvent.click(screen.getByRole('radio', { name: label }));
};

/** Set the children, on the strip of digits beside the adults. */
export const chooseChildren = (count: number): void => {
  fireEvent.click(screen.getByRole('radio', { name: `${count} ${count === 1 ? 'child' : 'children'}` }));
};

/** Move a slider to a value. */
export const slide = (name: RegExp, value: number): void => {
  fireEvent.change(screen.getByRole('slider', { name }), { target: { value: String(value) } });
};

/** Type a dollar figure into one of the two number fields and leave it, as a reader would. */
export const typeMoney = (name: RegExp, value: number): void => {
  const field = screen.getByRole('spinbutton', { name });
  fireEvent.change(field, { target: { value: String(value) } });
  fireEvent.blur(field);
};

/** The income field under the chart. */
export const incomeField = (): HTMLInputElement =>
  screen.getByRole('spinbutton', { name: /household income for the year/i });

/** The premium field in the rail. */
export const premiumField = (): HTMLInputElement =>
  screen.getByRole('spinbutton', { name: /benchmark plan premium/i });

/** The switch for the floor. */
export const expansionSwitch = (): HTMLInputElement =>
  screen.getByRole('checkbox', { name: /my state expanded medicaid/i });

/** One of the four figures, by its term. */
export const answerFigure = (term: RegExp): HTMLElement => {
  const dt = Array.from(document.querySelectorAll('.answer-figure dt')).find((el) =>
    term.test(el.textContent ?? ''),
  ) as HTMLElement | undefined;
  if (!dt) throw new Error(`No answer figure matches ${term}`);
  return dt.parentElement as HTMLElement;
};

/** A figure's three parts: the number, the unit under it, and the gloss. */
export const figureParts = (
  figure: HTMLElement,
): { value: string | null; unit: string | null; gloss: string | null } => ({
  value: figure.querySelector('dd strong')?.textContent ?? null,
  unit: figure.querySelector('.answer-of')?.textContent ?? null,
  gloss: figure.querySelector('.answer-gloss')?.textContent ?? null,
});
