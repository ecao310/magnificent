import { afterEach, beforeEach, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';

/**
 * What every test that renders a whole page needs, on either page: a
 * stopped clock, and the two gestures every rail is made of. Each page's
 * own fixtures under `src/<page>/test/` build on these with the year it
 * prices and the names its controls carry.
 */

/**
 * Pins the clock to the middle of `year` for one test file.
 *
 * Nothing on either page reads `Date` any more, but a stopped clock is what
 * keeps a figure derived from an engine's own calendar default from making
 * these assertions depend on the day they are run. Date only: React Testing
 * Library needs the real setTimeout.
 */
export function pinYear(year: number): void {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${year}-07-01T00:00:00Z`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });
}

/** Choose an option off a strip, by the label it carries. */
export const chooseRadio = (label: string): void => {
  fireEvent.click(screen.getByRole('radio', { name: label }));
};

/** Move a slider to a value. */
export const slide = (name: RegExp | string, value: number): void => {
  fireEvent.change(screen.getByRole('slider', { name }), { target: { value: String(value) } });
};
