import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ptcFor } from '../../lib/aca';
import type { Scenario } from '../../lib/aca';
import { CreditExplainer } from './CreditExplainer';

/** The subsidy note, at a household on the slope and at one the 400% line leaves out. */

const COUPLE: Scenario = { adults: 2, ages: [50, 50], year: 2026 };

const noteText = (magi: number, scenario: Scenario = COUPLE): string => {
  const { container } = render(<CreditExplainer here={ptcFor(magi, scenario)} />);
  return container.textContent ?? '';
};

describe('the credit note', () => {
  it('works the doc’s example at 236% of FPL', () => {
    const text = noteText(50_000);
    expect(text).toContain('236%');
    expect(text).toContain('7.9%');
    expect(text).toContain('$3,970');
    expect(text).toContain('$331');
    expect(text).toContain('$16,994');
  });

  it('prices the full premium past the 400% line instead of a share that no longer applies', () => {
    const text = noteText(120_000);
    expect(text).toContain('$20,964');
    expect(text).toContain('$1,747');
    expect(text).not.toContain('10.0%');
  });
});
