import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import {
  answerFigure,
  chooseAdults,
  expansionSwitch,
  figureParts,
  pinPageYear,
  slide,
} from './test/pageFixtures';

/** The four figures the page is for, at the income the marker stands on, and the link that carries them. */

pinPageYear();

describe('the figures', () => {
  it('are headed by the income and the household they are priced for', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: 'Your numbers at $50,000', level: 2 });
    expect(heading.nextElementSibling).toHaveClass('answer-subline');
    expect(heading.nextElementSibling).toHaveTextContent(
      '236% of the poverty line · a couple, both 50 · 2026 coverage',
    );
    expect(document.querySelectorAll('.answer-figure')).toHaveLength(4);
  });

  it('add up the opening household', () => {
    render(<App />);
    expect(figureParts(answerFigure(/^You pay$/))).toEqual({
      value: '$331',
      unit: '/mo',
      gloss: '$3,970 a year · 7.9% of income. A cheaper plan costs less; the subsidy is the same.',
    });
    expect(figureParts(answerFigure(/^Subsidy$/))).toEqual({
      value: '$1,416',
      unit: '/mo',
      gloss: '$16,994 a year, off a full premium of $1,747/mo.',
    });
    expect(figureParts(answerFigure(/^Each extra \$1 of income costs$/))).toEqual({
      value: '16.6¢',
      unit: 'of subsidy',
      gloss: '$10,000 more income → $1,709 less subsidy for the year.',
    });
    expect(figureParts(answerFigure(/^Room before the cliff$/))).toEqual({
      value: '$34,600',
      unit: null,
      gloss: 'Up to $84,600 the subsidy shrinks gradually; the next dollar loses all $12,538.',
    });
  });

  it('names the cliff in the next $10,000 when it is crossed', () => {
    render(<App />);
    slide(/household income/i, 80_000);
    expect(figureParts(answerFigure(/^Each extra/)).gloss).toBe(
      '$10,000 more income → $12,996 less subsidy for the year — it crosses the 400% line.',
    );
    expect(figureParts(answerFigure(/^Room before the cliff$/)).value).toBe('$4,600');
  });

  it('says when the subsidy is gone, and why', () => {
    render(<App />);
    slide(/household income/i, 90_000);
    expect(figureParts(answerFigure(/^You pay$/))).toEqual({
      value: '$1,747',
      unit: '/mo',
      gloss: '$20,964 a year — the full premium.',
    });
    expect(figureParts(answerFigure(/^Subsidy$/))).toEqual({
      value: 'None',
      unit: null,
      gloss: 'Over the 400% line.',
    });
    expect(figureParts(answerFigure(/^Each extra/))).toEqual({
      value: '0.0¢',
      unit: 'of subsidy',
      gloss: 'No subsidy left to lose.',
    });
    expect(screen.queryByText('Room before the cliff')).not.toBeInTheDocument();
    expect(figureParts(answerFigure(/^Over the cliff by$/))).toEqual({
      value: '$5,400',
      unit: null,
      gloss: 'Get back under $84,600 and the subsidy is $12,538.',
    });

    slide(/household income/i, 25_000);
    expect(figureParts(answerFigure(/^You pay$/))).toEqual({
      value: 'Medicaid',
      unit: null,
      gloss: 'No Marketplace premium under the Medicaid line.',
    });
    expect(figureParts(answerFigure(/^Subsidy$/)).value).toBe('None');
    expect(figureParts(answerFigure(/^Subsidy$/)).gloss).toBe('Under the Medicaid line.');
    expect(figureParts(answerFigure(/^Each extra/)).gloss).toBe('No subsidy left to lose.');
  });

  it('prices one adult in a state without expansion under the line', () => {
    render(<App />);
    chooseAdults('One adult');
    fireEvent.click(expansionSwitch());
    slide(/household income/i, 12_000);
    expect(figureParts(answerFigure(/^Subsidy$/))).toEqual({
      value: 'None',
      unit: null,
      gloss: 'Under 100% of the poverty line, and no Medicaid.',
    });
    expect(figureParts(answerFigure(/^You pay$/)).value).toBe('$873');
    expect(figureParts(answerFigure(/^You pay$/)).gloss).toMatch(/a year — the full premium\.$/);
  });

  it('copies the address, flushed first, and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<App />);
    slide(/household income/i, 65_000);
    const button = screen.getByRole('button', { name: 'Copy link' });
    fireEvent.click(button);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toMatch(/\?income=65000$/);
    expect(await screen.findByText('Link copied.')).toBeInTheDocument();
    const share = button.parentElement as HTMLElement;
    expect(within(share).getByText('Link copied.')).toHaveAttribute('aria-live', 'polite');
  });

  it('says when the clipboard refuses, and where the link still is', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(
      await screen.findByText('Couldn’t copy — the address bar holds the same link.'),
    ).toBeInTheDocument();
  });
});
