import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import { RAIL_COLLAPSES_AT } from './components/HouseholdStep';
import { formatCurrency } from './lib/format';
import { chooseAdults, chooseChildren, chooseState, money, pinPageYear, premiumField } from './test/pageFixtures';

/**
 * The rail on a narrow screen: folded to a row under the masthead that
 * names the household, opening in place. jsdom has no `matchMedia`, so the
 * width is pretended, and the wide layout is what every other test sees.
 */

pinPageYear();

/** A window `width` pixels wide, as far as `matchMedia` can tell. */
function pretendWidth(width: number): void {
  const listeners = new Set<() => void>();
  const matchMedia = (query: string): MediaQueryList => {
    const max = /\(max-width:\s*(\d+)px\)/.exec(query);
    return {
      matches: max !== null && width <= Number(max[1]),
      media: query,
      onchange: null,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  };
  Object.defineProperty(window, 'matchMedia', { value: matchMedia, configurable: true, writable: true });
}

afterEach(() => {
  delete (window as { matchMedia?: unknown }).matchMedia;
});

const rail = (): HTMLElement => document.getElementById('step-household') as HTMLElement;

describe('the fold', () => {
  it('folds the rail to a row under the masthead on a narrow screen, closed, naming the household', () => {
    pretendWidth(390);
    render(<App />);
    const sheet = rail();
    expect(sheet.tagName).toBe('DETAILS');
    expect(sheet).not.toHaveAttribute('open');
    const row = sheet.querySelector('summary') as HTMLElement;
    expect(within(row).getByRole('heading', { name: 'Your household', level: 2 })).toBeInTheDocument();
    expect(row).toHaveTextContent('A couple, both 50 · national average · benchmark $1,747/mo');
    expect(row).toHaveTextContent('Change');
    // Under the masthead and above the chooser, so it is met before the chart.
    const chooser = screen.getByRole('group', { name: 'Chart' });
    expect(sheet.compareDocumentPosition(chooser) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('heading', { name: /the aca subsidy slope/i }).compareDocumentPosition(sheet) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('opens in place, and the row follows the controls', () => {
    pretendWidth(390);
    render(<App />);
    const sheet = rail() as HTMLDetailsElement;
    const row = sheet.querySelector('summary') as HTMLElement;
    sheet.open = true;
    fireEvent(sheet, new Event('toggle'));
    expect(sheet).toHaveAttribute('open');
    expect(row).toHaveTextContent('Done');
    // The controls are the rail's own, in the same place.
    expect(within(sheet).getByRole('slider', { name: 'Age' })).toBeInTheDocument();
    chooseAdults('One adult');
    chooseChildren(2);
    chooseState('TX');
    const benchmark = formatCurrency(money(premiumField()));
    expect(row).toHaveTextContent(`One adult, aged 50, with 2 children · Texas · benchmark ${benchmark}/mo`);
  });

  it('is the rail beside the chart on a wide screen, with no row to open', () => {
    pretendWidth(RAIL_COLLAPSES_AT + 1);
    render(<App />);
    expect(rail().tagName).toBe('SECTION');
    expect(rail().querySelector('summary')).toBeNull();
    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });
});
