import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import { RAIL_COLLAPSES_AT } from './components/BenefitStep';
import { PAGE_TAX_YEAR, avgAnnualSSBenefit } from './lib/tax';
import { formatCurrency } from './lib/format';
import { AVG_ANNUAL_SS_BENEFIT, chooseFilingStatus, pinPageYear } from './test/pageFixtures';

/**
 * The rail on a narrow screen: folded to a row under the masthead that
 * names the return, opening in place. jsdom has no `matchMedia`, so the
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

const rail = (): HTMLElement => document.getElementById('step-benefit') as HTMLElement;

describe('the fold', () => {
  it('folds the rail to a row under the masthead on a narrow screen, closed, naming the return', () => {
    pretendWidth(390);
    render(<App />);
    const sheet = rail();
    expect(sheet.tagName).toBe('DETAILS');
    expect(sheet).not.toHaveAttribute('open');
    const row = sheet.querySelector('summary') as HTMLElement;
    expect(
      within(row).getByRole('heading', { name: 'Your Social Security benefit', level: 2 }),
    ).toBeInTheDocument();
    expect(row).toHaveTextContent(
      `A single filer, 65 or older · ${formatCurrency(AVG_ANNUAL_SS_BENEFIT)}/yr Social Security`,
    );
    expect(row).toHaveTextContent('Change');
    // Under the masthead and above the chart, so it is met before the chart.
    const chart = document.getElementById('step-torpedo') as HTMLElement;
    expect(sheet.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const title = screen.getByRole('heading', { level: 1 });
    expect(title.compareDocumentPosition(sheet) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
    expect(
      within(sheet).getByRole('slider', { name: /social security benefit/i }),
    ).toBeInTheDocument();
    chooseFilingStatus('Married Filing Jointly');
    fireEvent.click(within(sheet).getByRole('checkbox', { name: 'Both spouses are 65 or older' }));
    fireEvent.change(within(sheet).getByRole('slider', { name: /municipal/i }), {
      target: { value: '3750' },
    });
    const couple = formatCurrency(avgAnnualSSBenefit(PAGE_TAX_YEAR, 'mfj'));
    expect(row).toHaveTextContent(
      `A married couple filing jointly, both spouses 65 or older · ${couple}/yr Social Security · $3,750 muni interest`,
    );
  });

  it('names a return collecting nothing as one', () => {
    pretendWidth(390);
    render(<App />);
    const sheet = rail() as HTMLDetailsElement;
    fireEvent.change(within(sheet).getByRole('slider', { name: /social security benefit/i }), {
      target: { value: '0' },
    });
    fireEvent.click(within(sheet).getByRole('checkbox', { name: 'Age 65 or older' }));
    expect(sheet.querySelector('summary')).toHaveTextContent(
      'A single filer, under 65 · no Social Security',
    );
  });

  it('is the rail beside the chart on a wide screen, with no row to open', () => {
    pretendWidth(RAIL_COLLAPSES_AT + 1);
    render(<App />);
    expect(rail().tagName).toBe('SECTION');
    // No row of its own; the Advanced inputs disclosure inside it is another matter.
    expect(rail().querySelector(':scope > summary')).toBeNull();
    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });
});
