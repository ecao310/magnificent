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
import { ChartTooltip } from './components/ChartTooltip';
import { PAGE_COVERAGE_YEAR, costCurve } from './lib/aca';
import type { Scenario } from './lib/aca';
import { CHART, PALETTE } from './styles/palette';
import { defaultScenario, engineScenario } from './lib/scenarioUrl';
import { expansionSwitch, pinPageYear, slide, typeMoney } from './test/pageFixtures';

/** What recharts puts in the SVG: the two bands, the marker, and the two edges the subsidy draws. */

pinPageYear();

const plot = (): HTMLElement => screen.getByRole('img', { name: /^Chart:/ });
const marks = (selector: string): Element[] => Array.from(plot().querySelectorAll(selector));

describe('the chart', () => {
  it('draws both axes with their ticks', () => {
    render(<App />);
    expect(marks('.recharts-cartesian-axis')).toHaveLength(2);
    expect(marks('.recharts-cartesian-axis-tick-value')).toHaveLength(11);
  });

  it('draws what you pay as a hatched curve and what the subsidy pays as a green band up to the premium', () => {
    render(<App />);
    const areas = marks('.recharts-area-area');
    expect(areas).toHaveLength(2);
    // The subsidy's tint first, so the hatch stands on top of it.
    const [subsidy, cost] = areas;
    expect(subsidy.getAttribute('fill')).toBe(PALETTE.emerald);
    expect(subsidy.getAttribute('fill-opacity')).toBe(String(CHART.tint));
    expect(cost.getAttribute('fill')).toBe('url(#costHatch)');
    const curves = marks('.recharts-area-curve');
    expect(curves).toHaveLength(1);
    expect(curves[0].getAttribute('stroke')).toBe(PALETTE.accent);
    expect(curves[0].getAttribute('stroke-width')).toBe(String(CHART.line));
    expect(marks('.recharts-line-curve')).toHaveLength(0);

    const premium = marks('.premium-line line')[0];
    expect(premium.getAttribute('stroke')).toBe(PALETTE.inkMuted);
    expect(premium.getAttribute('stroke-dasharray')).toBe('2 4');
  });

  it('draws the subsidy’s edges from the start, in ink', () => {
    render(<App />);
    expect(marks('.credit-edge')).toHaveLength(2);
    for (const line of marks('.credit-edge line')) {
      expect(line.getAttribute('stroke')).toBe(PALETTE.inkMuted);
      expect(line.getAttribute('stroke-dasharray')).toBe('2 3');
    }
  });

  it('carries no key and no switch under the plot', () => {
    render(<App />);
    expect(document.querySelector('figure.chart-figure')).not.toBeNull();
    expect(document.querySelector('figure.chart-figure figcaption')).toBeNull();
    expect(document.querySelector('figure.chart-figure input')).toBeNull();
  });

  it('shades the gap under the floor, and moves the floor with the expansion switch', () => {
    render(<App />);
    expect(marks('.gap-area')).toHaveLength(1);
    const floorX = (): number => Number(marks('.credit-edge line')[0].getAttribute('x1'));
    const before = floorX();
    fireEvent.click(expansionSwitch());
    expect(floorX()).toBeLessThan(before);
    expect(marks('.gap-area')).toHaveLength(1);
  });

  it('stands the marker on the curve at the household’s income, and drops the dot on Medicaid', () => {
    render(<App />);
    const hereX = (): number => Number(marks('.here-line line')[0].getAttribute('x1'));
    const edgeX = (): number[] => marks('.credit-edge line').map((l) => Number(l.getAttribute('x1')));
    const dot = (): Element | undefined => marks('.here-dot circle')[0];

    const line = marks('.here-line line')[0];
    expect(line.getAttribute('stroke')).toBe(PALETTE.amber);
    expect(line.getAttribute('stroke-dasharray')).toBe('3 3');
    expect(line.getAttribute('stroke-width')).toBe(String(CHART.marker));
    expect(dot()?.getAttribute('fill')).toBe(PALETTE.amber);
    expect(dot()?.getAttribute('stroke')).toBe(PALETTE.surface);
    expect(dot()?.getAttribute('r')).toBe(String(CHART.dot));
    expect(Number(dot()?.getAttribute('cx'))).toBeCloseTo(hereX(), 6);

    const [floor, cliff] = edgeX();
    expect(hereX()).toBeGreaterThan(floor);
    expect(hereX()).toBeLessThan(cliff);

    slide(/household income/i, 90_000);
    expect(hereX()).toBeGreaterThan(cliff);
    expect(marks('.here-dot')).toHaveLength(1);

    slide(/household income/i, 25_000);
    expect(hereX()).toBeLessThan(floor);
    expect(marks('.here-line')).toHaveLength(1);
    expect(marks('.here-dot')).toHaveLength(0);
  });

  it('gives the slider the plot’s own axis, and widens both to keep a typed income on it', () => {
    render(<App />);
    const slider = screen.getByRole('slider', { name: /household income/i });
    expect(slider).toHaveAttribute('max', '130000');
    typeMoney(/household income/i, 200_000);
    expect(slider).toHaveAttribute('max', '210000');
  });
});

describe('the hover', () => {
  const scenario: Scenario = { ...engineScenario(defaultScenario()), year: PAGE_COVERAGE_YEAR };
  const curve = costCurve(scenario, { maxMagi: 130_000, step: 250 });
  const at = (magi: number) => curve.find((p) => p.magi === magi)!;
  const hover = (magi: number, over: Partial<Scenario> = {}) =>
    render(<ChartTooltip active payload={[{ payload: at(magi) }]} scenario={{ ...scenario, ...over }} />);

  const rows = (): Element[] =>
    Array.from(document.querySelectorAll('.chart-tooltip-rows dt, .chart-tooltip-rows dd'));

  it('prices the point in three rows under its income', () => {
    hover(69_000);
    expect(document.querySelector('.chart-tooltip-head')).not.toBeNull();
    expect(document.querySelector('.chart-tooltip-standing')).toBeNull();
    expect(rows()).toHaveLength(6);
  });

  it('adds a second line only where the plain reading does not hold', () => {
    hover(40_000);
    expect(document.querySelector('.chart-tooltip-standing')).toBeNull();
    document.body.innerHTML = '';
    hover(90_000);
    expect(document.querySelector('.chart-tooltip-standing')).not.toBeNull();
    expect(rows()).toHaveLength(6);
    document.body.innerHTML = '';
    hover(25_000);
    expect(document.querySelector('.chart-tooltip-standing')).not.toBeNull();
    expect(rows()).toHaveLength(6);
  });

  it('draws nothing when the pointer is off the plot', () => {
    render(<ChartTooltip active={false} payload={[]} scenario={scenario} />);
    expect(document.querySelector('.chart-tooltip')).toBeNull();
  });
});
