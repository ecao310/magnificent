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
    const text = noteText(50_000);
    expect(text).toContain('236%');
    expect(text).toContain('7.9%');
    expect(text).toContain('16.6%');
  });

  it('rates the whole premium past the 400% line, dropping the marginal rate', () => {
    const text = noteText(120_000);
    expect(text).toContain('17.5%');
    expect(text).not.toContain('10.0%');
  });
});
