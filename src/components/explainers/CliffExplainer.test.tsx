import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { cliffCost, creditRunsOutMagi, ptcFor } from '../../lib/aca';
import type { Scenario } from '../../lib/aca';
import { CliffExplainer } from './CliffExplainer';

/** The cliff note, priced for a household the line bites and one it does not. */

const COUPLE: Scenario = { adults: 2, ages: [50, 50], year: 2026 };
/** A 25-year-old’s benchmark is cheap enough that 9.96% of income covers it short of the $62,600 line. */
const YOUNG: Scenario = { adults: 1, ages: [25], year: 2026 };

const noteText = (magi: number, scenario: Scenario): string => {
  const { container } = render(
    <CliffExplainer
      here={ptcFor(magi, scenario)}
      cliffCost={cliffCost(scenario)}
      runsOutMagi={creditRunsOutMagi(scenario)}
      year={2026}
    />,
  );
  return container.textContent ?? '';
};

describe('the cliff note', () => {
  it('prices the dollar over the line for a household the line bites', () => {
    const text = noteText(50_000, COUPLE);
    expect(text).toContain('The dollar over it.');
    expect(text).toMatch(/subsidy pays the other \$1[0-9],[0-9]{3}\. One dollar over/);
    expect(text).toContain('another $34,600 of income reaches the line, and the dollar after that is the one that costs.');
    expect(text).not.toContain('costs this household nothing');
  });

  it('says the line costs nothing where the share reaches the full premium first', () => {
    const text = noteText(50_000, YOUNG);
    expect(text).toContain('The dollar over it costs this household nothing.');
    expect(text).toContain('reaches the full $5,892 premium at $59,157, 378% of the poverty line');
    expect(text).toContain('At the line the share is 10% of income, $6,235;');
    expect(text).toContain('another $9,157 of income and your share covers the full premium; the line, $12,600 away, then costs nothing to cross.');
    expect(text).not.toContain('pays the other $0');
    expect(text).not.toContain('-$1');
  });

  it('says the share already covers the premium between where it runs out and the line', () => {
    const text = noteText(61_000, YOUNG);
    expect(text).toContain('your share already covers the full premium; the line, another $1,600 away, costs nothing to cross.');
    expect(text).not.toContain('the dollar after that is the one that costs');
  });

  it('says the subsidy had run out anyway for such a household over the line', () => {
    const text = noteText(70_000, YOUNG);
    expect(text).toContain('you are $7,400 over the line, and the subsidy had run out at $59,157 anyway: no subsidy this year.');
    expect(noteText(90_000, COUPLE)).toContain('you are $5,400 over the line: no subsidy this year.');
  });
});
