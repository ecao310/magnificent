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

/** What recharts puts in the SVG: the two bands, the marker, and the lines the subsidy draws. */

pinPageYear();

const plot = (): HTMLElement => screen.getByRole('img', { name: /^Chart:/ });
const marks = (selector: string): Element[] => Array.from(plot().querySelectorAll(selector));
/** Every word the plot writes, in the order it writes them. */
const labels = (): string[] => marks('.recharts-label').map((t) => t.textContent ?? '');
const label = (text: string): Element | undefined =>
  marks('.recharts-label').find((t) => t.textContent === text);
const tiersSwitch = (): HTMLElement =>
  screen.getByRole('checkbox', { name: 'Show cost-sharing tiers (150%, 200%, 250%)' });

describe('the chart', () => {
  it('names its axis end to end, and titles both axes', () => {
    render(<App />);
    expect(plot()).toHaveAttribute(
      'aria-label',
      'Chart: what you pay each month for the benchmark plan after the subsidy, against household income from $0 to $130,000.',
    );
    expect(labels()).toContain('Household income for the year');
    expect(labels()).toContain('You pay per month');
    expect(marks('.recharts-cartesian-axis-tick-value').map((t) => t.textContent)).toEqual([
      '$0', '$25K', '$50K', '$75K', '$100K', '$125K',
      '$0', '$500', '$1,000', '$1,500', '$2,000',
    ]);
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
    expect(label('Full premium $1,747/mo')?.getAttribute('fill')).toBe(PALETTE.inkSoft);
  });

  it('draws the subsidy’s edges from the start, in ink, and the tiers from the legend’s switch', () => {
    render(<App />);
    expect(marks('.credit-edge')).toHaveLength(2);
    expect(marks('.csr-tier')).toHaveLength(0);
    for (const line of marks('.credit-edge line')) {
      expect(line.getAttribute('stroke')).toBe(PALETTE.inkMuted);
      expect(line.getAttribute('stroke-dasharray')).toBe('2 3');
    }
    expect(labels()).toEqual(expect.arrayContaining(['Subsidy starts · 138%', 'Subsidy ends · 400%']));
    expect(label('Subsidy ends · 400%')?.getAttribute('fill')).toBe(PALETTE.inkSoft);
    expect(labels()).not.toContain('150%');

    expect(tiersSwitch()).not.toBeChecked();
    fireEvent.click(tiersSwitch());
    expect(marks('.csr-tier')).toHaveLength(3);
    expect(marks('.credit-edge')).toHaveLength(2);
    for (const line of marks('.csr-tier line')) {
      expect(line.getAttribute('stroke')).toBe(PALETTE.violet);
      expect(line.getAttribute('stroke-dasharray')).toBe('6 3');
    }
    // The tiers are a few dozen pixels apart, so each carries its percentage alone.
    expect(labels()).toEqual(expect.arrayContaining(['150%', '200%', '250%']));
    expect(label('150%')?.getAttribute('fill')).toBe(PALETTE.violetDeep);
    fireEvent.click(tiersSwitch());
    expect(marks('.csr-tier')).toHaveLength(0);
  });

  it('keys its marks in a row under the plot, with the one switch among them', () => {
    render(<App />);
    const legend = document.querySelector('figure.chart-figure > figcaption.chart-legend') as HTMLElement;
    expect(legend).not.toBeNull();
    expect(Array.from(legend.querySelectorAll('.chart-legend-item')).map((i) => i.textContent)).toEqual([
      'You pay per month',
      'Subsidy pays',
      'Your income',
      'Subsidy starts / ends',
    ]);
    const swatches = Array.from(legend.querySelectorAll('.chart-legend-swatch')).map((s) => s.className);
    expect(swatches).toEqual([
      'chart-legend-swatch chart-legend-cost',
      'chart-legend-swatch chart-legend-subsidy',
      'chart-legend-swatch chart-legend-here',
      'chart-legend-swatch chart-legend-edge',
      'chart-legend-swatch chart-legend-tier',
    ]);
    expect(legend.contains(tiersSwitch())).toBe(true);
    expect(screen.queryByRole('button', { name: /breakpoints/i })).not.toBeInTheDocument();
  });

  it('names the gap under the floor, and moves the floor with the expansion switch', () => {
    render(<App />);
    expect(label('Medicaid')?.getAttribute('fill')).toBe(PALETTE.inkDim);
    expect(labels()).not.toContain('No subsidy, no Medicaid');
    fireEvent.click(expansionSwitch());
    expect(labels()).toContain('Subsidy starts · 100%');
    expect(labels()).not.toContain('Subsidy starts · 138%');
    expect(labels()).toContain('No subsidy, no Medicaid');
    expect(labels()).not.toContain('Medicaid');
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
    expect(label('You · $331/mo')?.getAttribute('fill')).toBe(PALETTE.amberBright);

    const [floor, cliff] = edgeX();
    expect(hereX()).toBeGreaterThan(floor);
    expect(hereX()).toBeLessThan(cliff);

    slide(/household income/i, 90_000);
    expect(hereX()).toBeGreaterThan(cliff);
    expect(label('You · $1,747/mo')).toBeDefined();

    slide(/household income/i, 25_000);
    expect(hereX()).toBeLessThan(floor);
    expect(marks('.here-line')).toHaveLength(1);
    expect(marks('.here-dot')).toHaveLength(0);
    expect(labels().some((t) => t.startsWith('You ·'))).toBe(false);
  });

  it('gives the slider the plot’s own axis, and widens both to keep a typed income on it', () => {
    render(<App />);
    const slider = screen.getByRole('slider', { name: /household income/i });
    expect(slider).toHaveAttribute('max', '130000');
    expect(slider).toHaveAttribute('aria-valuetext', '$50,000');
    expect(screen.getByText('$130,000')).toBeInTheDocument();
    typeMoney(/household income/i, 200_000);
    expect(plot()).toHaveAttribute('aria-label', expect.stringMatching(/from \$0 to \$210,000/));
    expect(slider).toHaveAttribute('max', '210000');
    expect(slider).toHaveAttribute('aria-valuetext', '$200,000');
    expect(marks('.recharts-cartesian-axis-tick-value').map((t) => t.textContent)).toContain('$200K');
  });
});

describe('the hover', () => {
  const scenario: Scenario = { ...engineScenario(defaultScenario()), year: PAGE_COVERAGE_YEAR };
  const curve = costCurve(scenario, { maxMagi: 130_000, step: 250 });
  const at = (magi: number) => curve.find((p) => p.magi === magi)!;
  const hover = (magi: number, over: Partial<Scenario> = {}) =>
    render(<ChartTooltip active payload={[{ payload: at(magi) }]} scenario={{ ...scenario, ...over }} />);

  const rows = (): (string | null)[] =>
    Array.from(document.querySelectorAll('.chart-tooltip-rows dt, .chart-tooltip-rows dd')).map(
      (el) => el.textContent,
    );

  it('prices the point in three rows under its income', () => {
    hover(69_000);
    expect(document.querySelector('.chart-tooltip-head')).toHaveTextContent(
      '$69,000 · 326% of poverty line',
    );
    expect(document.querySelector('.chart-tooltip-standing')).toBeNull();
    expect(rows()).toEqual(['You pay', '$573/mo', 'Subsidy', '$1,174/mo', 'Share of income', '10.0%']);
  });

  it('adds a second line only where the plain reading does not hold', () => {
    hover(40_000);
    expect(document.querySelector('.chart-tooltip-standing')).toHaveTextContent('87% silver tier');
    document.body.innerHTML = '';
    hover(90_000);
    expect(document.querySelector('.chart-tooltip-standing')).toHaveTextContent(
      'No subsidy — over the 400% line',
    );
    expect(rows()).toEqual(['You pay', '$1,747/mo', 'Subsidy', 'None', 'Share of income', '23.3%']);
    document.body.innerHTML = '';
    hover(25_000);
    expect(document.querySelector('.chart-tooltip-standing')).toHaveTextContent('Medicaid');
    expect(rows()).toEqual(['You pay', '—', 'Subsidy', 'None', 'Share of income', '—']);
  });

  it('draws nothing when the pointer is off the plot', () => {
    render(<ChartTooltip active={false} payload={[]} scenario={scenario} />);
    expect(document.querySelector('.chart-tooltip')).toBeNull();
  });
});
