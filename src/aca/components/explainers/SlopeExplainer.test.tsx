import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ptcFor } from '../../lib/aca';
import type { Scenario } from '../../lib/aca';
import { SlopeExplainer } from './SlopeExplainer';

/** The rate note, on the slope and over the 400% line. */

const COUPLE: Scenario = { adults: 2, ages: [50, 50], year: 2026 };

const noteText = (magi: number, scenario: Scenario = COUPLE): string => {
  const { container } = render(<SlopeExplainer here={ptcFor(magi, scenario)} />);
  return container.textContent ?? '';
};

describe('the rate note', () => {
  it('quotes the doc’s effective and marginal rates at 236% of FPL', () => {
    expect(noteText(50_000)).toContain('effective rate is 7.9% and marginal rate is 16.6%.');
  });

  it('rates the whole premium past the 400% line, dropping the marginal rate', () => {
    const text = noteText(120_000);
    expect(text).toContain('effective rate is 17.5%.');
    expect(text).not.toContain('and marginal rate is');
    expect(text).not.toContain('10.0%');
  });
});
