import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/**
 * ResponsiveContainer measures its parent, and jsdom reports every element as
 * zero by zero, so left alone recharts draws nothing here. Given a size, it
 * draws the whole plot, and the SVG can be read back.
 */
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <actual.ResponsiveContainer width={800} height={400}>
        {children as never}
      </actual.ResponsiveContainer>
    ),
  };
});

import App from './App';
import { PALETTE } from './styles/palette';
import { pinPageYear, slide } from './test/pageFixtures';

/** What recharts puts in the SVG: the curve, the marker, and the lines the subsidy draws. */

pinPageYear();

const plot = (): HTMLElement => screen.getByRole('img', { name: /^Chart:/ });
const lines = (selector: string): Element[] => Array.from(plot().querySelectorAll(selector));

describe('the chart', () => {
  it('names its axis end to end', () => {
    render(<App />);
    expect(plot()).toHaveAttribute(
      'aria-label',
      'Chart: what this household pays each month for the benchmark silver plan after the subsidy, plotted against household income from $0 to $130,000.',
    );
    expect(screen.getByText(/^Household income \(\$\), the MAGI the subsidy is measured on\./)).toBeInTheDocument();
  });

  it('draws one curve in the accent, hatched underneath, with no steps', () => {
    render(<App />);
    const curves = lines('.recharts-area-curve');
    expect(curves).toHaveLength(1);
    expect(curves[0].getAttribute('stroke')).toBe(PALETTE.accent);
    expect(lines('.recharts-area-area')[0].getAttribute('fill')).toBe('url(#costHatch)');
    expect(lines('.recharts-line-curve')).toHaveLength(0);
  });

  it('draws the subsidy’s edges from the start and the tiers on request', () => {
    render(<App />);
    expect(lines('.credit-edge')).toHaveLength(2);
    expect(lines('.csr-tier')).toHaveLength(0);
    expect(lines('.recharts-label').map((t) => t.textContent)).toEqual(['138% FPL', '400% FPL']);
    fireEvent.click(screen.getByRole('button', { name: /^Breakpoints \(2\)$/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /cost-sharing tiers/i }));
    expect(lines('.csr-tier')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /^Breakpoints \(5\)$/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /the subsidy's edges/i }));
    expect(lines('.credit-edge')).toHaveLength(0);
    expect(screen.getByRole('button', { name: /^Breakpoints \(3\)$/ })).toBeInTheDocument();
  });

  it('moves the floor with the expansion switch', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('checkbox', { name: /my state expanded medicaid/i }));
    expect(lines('.recharts-label').map((t) => t.textContent)).toContain('100% FPL');
    expect(lines('.recharts-label').map((t) => t.textContent)).not.toContain('138% FPL');
  });

  it('puts the marker at the household’s income', () => {
    render(<App />);
    const hereX = () => Number(lines('.here-line .recharts-reference-line-line')[0].getAttribute('x1'));
    const edgeX = () =>
      lines('.credit-edge .recharts-reference-line-line').map((l) => Number(l.getAttribute('x1')));
    expect(lines('.here-line line')[0].getAttribute('stroke')).toBe(PALETTE.amber);
    const [floor, cliff] = edgeX();
    expect(hereX()).toBeGreaterThan(floor);
    expect(hereX()).toBeLessThan(cliff);
    slide(/household income/i, 90_000);
    expect(hereX()).toBeGreaterThan(cliff);
  });

  it('widens the axis to keep the household on it', () => {
    render(<App />);
    slide(/household income/i, 200_000);
    expect(plot()).toHaveAttribute('aria-label', expect.stringMatching(/from \$0 to \$210,000/));
  });
});
