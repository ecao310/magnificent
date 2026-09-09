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

/** Set the adults, which the page keeps in one place: the strip. */
export const chooseAdults = (label: string): void => {
  fireEvent.click(screen.getByRole('radio', { name: label }));
};

/** Set the children, on the strip of digits beside the adults. */
export const chooseChildren = (count: number): void => {
  fireEvent.click(screen.getByRole('radio', { name: `${count} ${count === 1 ? 'child' : 'children'}` }));
};

/** Pick a state off the list, or '' for the national average. */
export const chooseState = (code: string): void => {
  fireEvent.change(screen.getByRole('combobox', { name: 'State' }), { target: { value: code } });
};

/** The income control's name: the same under either chart, since only one chart is on the page at a time. */
export const INCOME = 'Household income for the year';

/** Put the other chart on the page, by the name the chooser gives it. */
export const chooseChart = (name: 'What you pay' | 'Your effective rate'): void => {
  fireEvent.click(screen.getByRole('radio', { name }));
};

/** Move a slider to a value. */
export const slide = (name: RegExp | string, value: number): void => {
  fireEvent.change(screen.getByRole('slider', { name }), { target: { value: String(value) } });
};

/** Type a dollar figure into one of the number fields and leave it, as a reader would. */
export const typeMoney = (name: RegExp | string, value: number): void => {
  const field = screen.getByRole('spinbutton', { name });
  fireEvent.change(field, { target: { value: String(value) } });
  fireEvent.blur(field);
};

/** The income field under the cost chart. */
export const incomeField = (): HTMLInputElement => screen.getByRole('spinbutton', { name: INCOME });

/** The premium field in the rail. */
export const premiumField = (): HTMLInputElement =>
  screen.getByRole('spinbutton', { name: /benchmark plan premium/i });
