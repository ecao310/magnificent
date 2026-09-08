import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { answerFigure, chooseKind, pinPageYear, slide } from './test/pageFixtures';

/** The close: the six figures the walk was for, and the link that carries them. */

pinPageYear();

describe('the close', () => {
  it('restates the household above the figures', () => {
    render(<App />);
    expect(screen.getByText(/^Priced for 2026:/)).toHaveTextContent(
      'Priced for 2026: a married couple filing jointly, both 50, with $10,000 of ordinary income and $40,000 of qualified dividends and gains, adding $10,000 as a harvested gain.',
    );
  });

  it('adds up the thread’s household', () => {
    render(<App />);
    expect(answerFigure(/^Household income/)).toHaveTextContent('$60,000');
    expect(answerFigure(/^Household income/)).toHaveTextContent(/284% of the \$21,150 poverty line for 2 people/);
    // Benchmark $20,964 less 9.4642% of $60,000 = $5,678.51, credit $15,285.49.
    expect(answerFigure(/^Premium tax credit/)).toHaveTextContent(/\$15,28[56]/);
    expect(answerFigure(/^Premium tax credit/)).toHaveTextContent(/of \$20,964/);
    expect(answerFigure(/^Premium tax credit/)).toHaveTextContent(/9\.46% of income/);
    expect(answerFigure(/^Your share of the benchmark/)).toHaveTextContent('$5,678');
    expect(answerFigure(/^Your share of the benchmark/)).toHaveTextContent(/\$473 a month/);
    expect(answerFigure(/^Federal tax/)).toHaveTextContent('$0');
    expect(answerFigure(/^Cost of the block/)).toHaveTextContent('$1,709');
    expect(answerFigure(/^Cost of the block/)).toHaveTextContent(/17\.09% of \$10,000/);
    expect(answerFigure(/^Cost of the block/)).toHaveTextContent(/As a Roth conversion: \$1,709, 17\.09%/);
  });

  it('names the rate a harvest can save at most, and the rate a conversion has to beat', () => {
    render(<App />);
    const future = answerFigure(/^Future rate to beat/);
    expect(future).toHaveTextContent(/15%/);
    expect(future).toHaveTextContent(/at most/);
    expect(future).toHaveTextContent(/Today it costs 17\.09%/);
    chooseKind('Roth conversion');
    expect(answerFigure(/^Future rate to beat/)).toHaveTextContent(/17\.09%/);
    expect(answerFigure(/^Future rate to beat/)).toHaveTextContent(/pays off only if/);
  });

  it('says when the credit is gone, and why', () => {
    render(<App />);
    slide(/amount to add/i, 40_000);
    expect(answerFigure(/^Premium tax credit/)).toHaveTextContent(/None/);
    expect(answerFigure(/^Premium tax credit/)).toHaveTextContent(/Over the 400% line/);
    expect(answerFigure(/^Your share of the benchmark/)).toHaveTextContent('$20,964');
    expect(answerFigure(/^Cost of the block/)).toHaveTextContent(/the whole credit among it/);
    slide(/amount to add/i, 0);
    slide(/qualified dividends/i, 10_000);
    expect(answerFigure(/^Premium tax credit/)).toHaveTextContent(/None/);
    expect(answerFigure(/^Premium tax credit/)).toHaveTextContent(/Under the floor/);
  });

  it('prices the next dollar instead when nothing is added', () => {
    render(<App />);
    slide(/amount to add/i, 0);
    const figure = answerFigure(/^Cost of the next dollar/);
    expect(figure).toHaveTextContent('16.64%');
    expect(figure).toHaveTextContent(/0% in tax and 16\.64% in credit given back/);
  });

  it('copies the address, flushed first, and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<App />);
    slide(/amount to add/i, 20_000);
    const button = screen.getByRole('button', { name: /copy link to this household/i });
    fireEvent.click(button);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toMatch(/\?add=20000$/);
    expect(await screen.findByText(/Copied\. That link opens this page on this household\./)).toBeInTheDocument();
    const share = button.parentElement as HTMLElement;
    expect(within(share).getByText(/Copied/)).toHaveAttribute('aria-live', 'polite');
  });
});
