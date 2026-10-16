import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { cliffCost, ptcFor } from '../../lib/aca';
import type { Scenario } from '../../lib/aca';
import { CliffExplainer } from './CliffExplainer';

/** The cliff note, priced for a household the line bites and one it does not. */

const COUPLE: Scenario = { adults: 2, ages: [50, 50], year: 2026 };
/** A 25-year-old’s benchmark is cheap enough that the share covers it short of the $62,600 line. */
const YOUNG: Scenario = { adults: 1, ages: [25], year: 2026 };

const noteText = (magi: number, scenario: Scenario): string => {
  const { container } = render(
    <CliffExplainer here={ptcFor(magi, scenario)} cliffCost={cliffCost(scenario)} />,
  );
  return container.textContent ?? '';
};

describe('the cliff note', () => {
  it('names the 400% line and prices it for this household', () => {
    const text = noteText(50_000, COUPLE);
    expect(text).toContain(
      'Once household income passes 400% of FPL, the subsidy completely disappears.',
    );
    expect(text).toContain('For 2 people the line is $84,600, 400% of the $21,150 poverty line.');
  });

  it('prices the dollar over the line for a household the line bites', () => {
    const text = noteText(50_000, COUPLE);
    expect(text).toContain('the subsidy pays the other $12,538');
    expect(text).toContain('One dollar over, you pay the full $20,964');
    expect(text).toContain('Earning an extra $1 actually loses you $12,537');
  });

  it('leaves the dollar over it out where the share already covers the premium', () => {
    const text = noteText(50_000, YOUNG);
    expect(text).not.toContain('pays the other $0');
    expect(text).not.toContain('-$1');
  });

  it('says when the cliff came back, and how', () => {
    const text = noteText(50_000, COUPLE);
    expect(text).toContain('The cliff came back in 2026.');
    expect(text).toContain('capped at 8.5% of income');
    expect(text).toContain('passed in the House but failed in the Senate');
  });
});
