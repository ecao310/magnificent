import { fireEvent, screen } from '@testing-library/react';
import { PAGE_COVERAGE_YEAR } from '../lib/aca';
import { chooseRadio, pinYear } from '../../test/pageFixtures';

/**
 * What every test that renders the whole page needs: a stopped clock, and
 * the readings more than one file makes. The clock and the gestures are the
 * site's, in src/test/pageFixtures.ts; what is here is the year this page
 * prices and the names its controls carry.
 */

export { slide } from '../../test/pageFixtures';

/** Pins the clock to the year the page prices, for one test file. */
export const pinPageYear = (): void => pinYear(PAGE_COVERAGE_YEAR);

/** Set the adults, which the page keeps in one place: the strip. */
export const chooseAdults = chooseRadio;

/** Set the children, on the strip of digits beside the adults. */
export const chooseChildren = (count: number): void => {
  chooseRadio(`${count} ${count === 1 ? 'child' : 'children'}`);
};

/** Pick a state off the list, or '' for the national average. */
export const chooseState = (code: string): void => {
  fireEvent.change(screen.getByRole('combobox', { name: 'State' }), { target: { value: code } });
};

/** The income control's name: the same under either chart, since only one chart is on the page at a time. */
export const INCOME = 'Household income for the year';

/** Put the other chart on the page, by the name the chooser gives it. */
export const chooseChart = (name: 'What you pay' | 'Your effective rate'): void => chooseRadio(name);

/** Type a dollar figure into one of the money fields and leave it, as a reader would. */
export const typeMoney = (name: RegExp | string, value: number): void => {
  const field = screen.getByRole('textbox', { name });
  fireEvent.change(field, { target: { value: String(value) } });
  fireEvent.blur(field);
};

/** The figure a money field holds, read past its separators. */
export const money = (field: HTMLInputElement): number => Number(field.value.replace(/[^\d]/g, ''));

/** The income field under the cost chart. */
export const incomeField = (): HTMLInputElement => screen.getByRole('textbox', { name: INCOME });

/** The premium field in the rail. */
export const premiumField = (): HTMLInputElement =>
  screen.getByRole('textbox', { name: /benchmark plan premium/i });
