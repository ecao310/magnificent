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
  it('prices the line for this household', () => {
    const text = noteText(50_000, COUPLE);
    expect(text).toContain('$84,600');
    expect(text).toContain('$21,150');
  });

  it('prices the dollar over the line for a household the line bites', () => {
    const text = noteText(50_000, COUPLE);
    expect(text).toContain('$20,964');
    expect(text).toContain('$12,537');
  });

  it('leaves the dollar over it out where the share already covers the premium', () => {
    const text = noteText(50_000, YOUNG);
    expect(text).toContain('$62,600');
    expect(text).not.toContain('$5,892');
  });
});
