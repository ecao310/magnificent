import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
import { chooseKind, pinPageYear, slide } from './test/pageFixtures';

/** What recharts puts in the SVG: two curves, the block, and the lines the credit draws. */

pinPageYear();

const plot = (): HTMLElement => screen.getByRole('img', { name: /^Chart:/ });
const lines = (selector: string): Element[] => Array.from(plot().querySelectorAll(selector));

describe('the chart', () => {
  it('names its axis end to end', () => {
    render(<App />);
    expect(plot()).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/as a Roth conversion and as a harvested gain, plotted against household income from \$0 to \$130,000, with the block the reader is adding hatched from \$50,000\./),
    );
    expect(screen.getByText(/^Household income \(\$\), the MAGI the credit is measured on\./)).toBeInTheDocument();
  });

  /** The recharts layer a curve was drawn in, read off the layer group's class. */
  const layerOf = (kind: string): number => {
    const line = plot().querySelector(`.curve-${kind}`) as Element;
    const layer = line.closest('[class*="recharts-zIndex-layer_"]') as Element;
    return Number(/recharts-zIndex-layer_(-?\d+)/.exec(layer.getAttribute('class') ?? '')?.[1]);
  };

  /**
   * A curve raised above recharts' default layer is drawn into a portal the
   * library creates a render cycle later, so the second curve is awaited
   * rather than read straight off the first render.
   */
  it('draws both curves, the current one on top', async () => {
    render(<App />);
    await waitFor(() => expect(lines('.recharts-line-curve')).toHaveLength(2));
    expect(lines('.recharts-line-curve').map((c) => c.getAttribute('stroke')).sort()).toEqual(
      [PALETTE.accent, PALETTE.emerald].sort(),
    );
    expect(layerOf('harvest')).toBeGreaterThan(layerOf('conversion'));
    chooseKind('Roth conversion');
    await waitFor(() => expect(layerOf('conversion')).toBeGreaterThan(layerOf('harvest')));
  });

  it('keys the curves and marks the current one', () => {
    render(<App />);
    const key = screen.getByRole('list', { name: 'Key' });
    const items = Array.from(key.querySelectorAll('li'));
    expect(items.map((li) => li.textContent)).toEqual([
      'Next dollar as a Roth conversion',
      'Next dollar as a harvested gain',
    ]);
    expect(items[1]).toHaveClass('chart-key-current');
    expect(items[0]).not.toHaveClass('chart-key-current');
  });

  it('draws the credit’s edges from the start and the tiers on request', () => {
    render(<App />);
    expect(lines('.credit-edge')).toHaveLength(2);
    expect(lines('.csr-tier')).toHaveLength(0);
    const labels = lines('.recharts-label').map((t) => t.textContent);
    expect(labels).toEqual(['138% FPL', '400% FPL']);
    const button = screen.getByRole('button', { name: /^Breakpoints \(2\)$/ });
    fireEvent.click(button);
    fireEvent.click(screen.getByRole('checkbox', { name: /cost-sharing tiers/i }));
    expect(lines('.csr-tier')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /^Breakpoints \(5\)$/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /the credit's edges/i }));
    expect(lines('.credit-edge')).toHaveLength(0);
    expect(screen.getByRole('button', { name: /^Breakpoints \(3\)$/ })).toBeInTheDocument();
  });

  it('moves the floor with the expansion switch', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('checkbox', { name: /my state expanded medicaid/i }));
    const labels = lines('.recharts-label').map((t) => t.textContent);
    expect(labels).toContain('100% FPL');
    expect(labels).not.toContain('138% FPL');
  });

  it('puts the marker where the block ends', () => {
    render(<App />);
    const hereX = () => Number(lines('.here-line .recharts-reference-line-line')[0].getAttribute('x1'));
    const edgeX = () =>
      lines('.credit-edge .recharts-reference-line-line').map((l) => Number(l.getAttribute('x1')));
    expect(lines('.here-line line')[0].getAttribute('stroke')).toBe(PALETTE.amber);
    // $60,000 sits between the floor ($29,187) and the cliff ($84,600).
    const [floor, cliff] = edgeX();
    expect(hereX()).toBeGreaterThan(floor);
    expect(hereX()).toBeLessThan(cliff);
    slide(/amount to add/i, 40_000);
    // $90,000 is past the cliff.
    expect(hereX()).toBeGreaterThan(cliff);
  });

  it('widens the axis to keep the block on it', () => {
    render(<App />);
    slide(/amount to add/i, 150_000);
    expect(plot()).toHaveAttribute('aria-label', expect.stringMatching(/from \$0 to \$210,000/));
  });
});
