import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/** As in App.chart.test.tsx: give ResponsiveContainer a size, so recharts draws under jsdom. */
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
import { RateTooltip } from './components/rate/RateTooltip';
import { rateCurve } from './lib/tax';
import { CHART, PALETTE } from './styles/palette';
import { defaultScenario, engineScenario } from './lib/scenarioUrl';
import { INCOME, chooseChart, chooseState, pinPageYear, slide } from './test/pageFixtures';

/** What recharts puts in the SVG once the rate chart is chosen: the two bands, the line along their top, the marker, and the subsidy's edges. */

pinPageYear();

/** The page, with the rate chart chosen. */
const renderRate = (): void => {
  render(<App />);
  chooseChart('Your effective rate');
};

/** The rate chart, named for what it draws. */
const plot = (): HTMLElement => screen.getByRole('img', { name: /^Chart: federal income tax/ });
const marks = (selector: string): Element[] => Array.from(plot().querySelectorAll(selector));

describe('the rate chart', () => {
  it('is the one plot on the page once chosen, and draws both axes, the rate one in tens', () => {
    renderRate();
    expect(screen.getAllByRole('img', { name: /^Chart:/ })).toHaveLength(1);
    expect(marks('.recharts-cartesian-axis')).toHaveLength(2);
    const ticks = marks('.recharts-cartesian-axis-tick-value').map((t) => t.textContent);
    expect(ticks).toContain('10%');
    expect(ticks).toContain('40%');
    expect(ticks).toContain('$125K');
  });

  it('stacks the premium’s hatch on the tax’s wash, and rules the whole in ink along the top', () => {
    renderRate();
    const areas = marks('.recharts-area-area');
    expect(areas).toHaveLength(2);
    const [tax, premium] = areas;
    expect(tax.getAttribute('fill')).toBe(PALETTE.inkMuted);
    expect(tax.getAttribute('fill-opacity')).toBe(String(CHART.wash));
    expect(premium.getAttribute('fill')).toBe('url(#premiumHatch)');
    const lines = marks('.recharts-line-curve');
    expect(lines).toHaveLength(1);
    expect(lines[0].getAttribute('stroke')).toBe(PALETTE.edgeStrong);
    expect(lines[0].getAttribute('stroke-width')).toBe(String(CHART.line));
  });

  it('names its three marks in a key under the plot', () => {
    renderRate();
    const key = document.querySelector('#step-rate figure.chart-figure figcaption.chart-key') as HTMLElement;
    expect(key).not.toBeNull();
    const items = Array.from(key.querySelectorAll('.chart-key-item')).map((i) => i.textContent);
    expect(items).toEqual(['All in', 'Premium after subsidy', 'Federal income tax']);
    expect(key.querySelector('.chart-key-line')).not.toBeNull();
    expect(key.querySelector('.chart-key-hatch')).not.toBeNull();
    expect(key.querySelector('.chart-key-wash')).not.toBeNull();
  });

  it('draws the subsidy’s edges and the gap, and moves the floor for a state that did not expand', () => {
    renderRate();
    expect(marks('.credit-edge')).toHaveLength(2);
    expect(marks('.gap-area')).toHaveLength(1);
    const floorX = (): number => Number(marks('.credit-edge line')[0].getAttribute('x1'));
    const before = floorX();
    chooseState('TX');
    expect(floorX()).toBeLessThan(before);
  });

  it('stands the marker on the line at the household’s income, and drops the dot under the floor', () => {
    renderRate();
    const hereX = (): number => Number(marks('.here-line line')[0].getAttribute('x1'));
    const dot = (): Element | undefined => marks('.here-dot circle')[0];
    expect(dot()?.getAttribute('fill')).toBe(PALETTE.amber);
    expect(Number(dot()?.getAttribute('cx'))).toBeCloseTo(hereX(), 6);
    expect(plot().textContent).toContain('You · 11.5%');

    slide(INCOME, 90_000);
    expect(plot().textContent).toContain('You · 30.4%');

    slide(INCOME, 25_000);
    expect(marks('.here-line')).toHaveLength(1);
    expect(marks('.here-dot')).toHaveLength(0);
  });
});

describe('the rate tooltip', () => {
  const scenario = { ...engineScenario(defaultScenario()), year: 2026 as const };
  const curve = rateCurve(scenario, { maxMagi: 130_000 });
  const at = (magi: number) => curve.find((point) => point.magi === magi)!;

  it('splits the rate at a point on the slope', () => {
    render(<RateTooltip active payload={[{ payload: at(50_000) }]} scenario={scenario} />);
    expect(screen.getByText(/\$50,000 · 236% of poverty line/)).toBeInTheDocument();
    expect(screen.getByText('11.5%')).toBeInTheDocument();
    expect(screen.getByText('3.6% · $1,780')).toBeInTheDocument();
    expect(screen.getByText('7.9% · $331/mo')).toBeInTheDocument();
  });

  it('says where the plain reading does not hold', () => {
    const { rerender } = render(
      <RateTooltip active payload={[{ payload: at(25_000) }]} scenario={scenario} />,
    );
    expect(screen.getByText('Medicaid')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
    rerender(<RateTooltip active payload={[{ payload: at(100_000) }]} scenario={scenario} />);
    expect(screen.getByText(/over the 400% line/)).toBeInTheDocument();
  });

  it('draws nothing when there is nothing under the pointer', () => {
    const { container } = render(<RateTooltip scenario={scenario} />);
    expect(container).toBeEmptyDOMElement();
  });
});
