import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { answerFigure, chooseAdults, pinPageYear, slide } from './test/pageFixtures';

/** The close: the six figures the walk was for, and the link that carries them. */

pinPageYear();

describe('the close', () => {
  it('restates the household above the figures', () => {
    render(<App />);
    expect(screen.getByText(/^Priced for 2026:/)).toHaveTextContent(
      'Priced for 2026: a couple, both 50, on $50,000 of household income.',
    );
  });

  it('adds up the thread’s household', () => {
    render(<App />);
    expect(answerFigure(/^Household income/)).toHaveTextContent('$50,000');
    expect(answerFigure(/^Household income/)).toHaveTextContent(/236% of the \$21,150 poverty line for 2 people/);
    expect(answerFigure(/^Subsidy/)).toHaveTextContent('$16,994');
    expect(answerFigure(/^Subsidy/)).toHaveTextContent(/of \$20,964/);
    expect(answerFigure(/^Subsidy/)).toHaveTextContent(/7\.94% of income/);
    expect(answerFigure(/^You pay/)).toHaveTextContent('$331');
    expect(answerFigure(/^You pay/)).toHaveTextContent(/\$3,970 a year/);
    expect(answerFigure(/^Share of income/)).toHaveTextContent('7.94%');
    expect(answerFigure(/^Next dollar/)).toHaveTextContent('16.64¢');
    expect(answerFigure(/^Next dollar/)).toHaveTextContent(/The next \$10,000 costs \$1,709\./);
    expect(answerFigure(/^Room under the cliff/)).toHaveTextContent('$34,600');
    expect(answerFigure(/^Room under the cliff/)).toHaveTextContent(/to \$84,600, before the dollar after it costs the \$12,538 of subsidy left at the line/);
  });

  it('says when the subsidy is gone, and why', () => {
    render(<App />);
    slide(/household income/i, 90_000);
    expect(answerFigure(/^Subsidy/)).toHaveTextContent(/None/);
    expect(answerFigure(/^Subsidy/)).toHaveTextContent(/Over the 400% line/);
    expect(answerFigure(/^You pay/)).toHaveTextContent('$1,747');
    expect(answerFigure(/^Share of income/)).toHaveTextContent('23.29%');
    expect(answerFigure(/^Next dollar/)).toHaveTextContent('0¢');
    expect(answerFigure(/^Room under the cliff/)).toHaveTextContent('$5,400');
    expect(answerFigure(/^Room under the cliff/)).toHaveTextContent(/over/);
    slide(/household income/i, 25_000);
    expect(answerFigure(/^Subsidy/)).toHaveTextContent(/None/);
    expect(answerFigure(/^Subsidy/)).toHaveTextContent(/eligible for Medicaid/);
    expect(answerFigure(/^You pay/)).toHaveTextContent('Medicaid');
  });

  it('prices one adult in a state without expansion under the line', () => {
    render(<App />);
    chooseAdults('One adult');
    fireEvent.click(screen.getByRole('checkbox', { name: /my state expanded medicaid/i }));
    slide(/household income/i, 12_000);
    expect(answerFigure(/^Subsidy/)).toHaveTextContent(/no Medicaid either/);
    expect(answerFigure(/^You pay/)).toHaveTextContent('$873');
  });

  it('copies the address, flushed first, and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<App />);
    slide(/household income/i, 65_000);
    const button = screen.getByRole('button', { name: /copy link to this household/i });
    fireEvent.click(button);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toMatch(/\?income=65000$/);
    expect(await screen.findByText(/Copied\. That link opens this page on this household\./)).toBeInTheDocument();
    const share = button.parentElement as HTMLElement;
    expect(within(share).getByText(/Copied/)).toHaveAttribute('aria-live', 'polite');
  });
});
