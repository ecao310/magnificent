import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
import { NARROW_FRAME, WIDE_FRAME, incomeAtX } from './components/chartFrame';
import { INCOME, chooseChart, incomeField, money, pinPageYear, typeMoney } from './test/pageFixtures';

/**
 * The plot as a cursor, under a finger and under a mouse; the frame it takes
 * on a phone; the field the figure is typed into; and the note a link
 * leaves. jsdom has no `matchMedia` and no layout, so the screen is
 * pretended and the chart's box is given a size by hand.
 */

pinPageYear();

/** A window `width` pixels wide with the pointer named, as far as `matchMedia` can tell. */
function pretend(width: number, pointer: 'fine' | 'coarse'): void {
  const matchMedia = (query: string): MediaQueryList => {
    const max = /\(max-width:\s*(\d+)px\)/.exec(query);
    const matches = max !== null ? width <= Number(max[1]) : /hover: hover/.test(query) ? pointer === 'fine' : false;
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  };
  Object.defineProperty(window, 'matchMedia', { value: matchMedia, configurable: true, writable: true });
}

afterEach(() => {
  delete (window as { matchMedia?: unknown }).matchMedia;
});

const plot = (): HTMLElement => screen.getByRole('img', { name: /^Chart:/ });
const slider = (): HTMLInputElement => screen.getByRole('slider', { name: INCOME });

/** Give the chart's box a place and a width, which jsdom will not. */
const BOX = { left: 20, width: 800 };
const sizeBox = (): void => {
  plot().getBoundingClientRect = () =>
    ({ left: BOX.left, top: 0, width: BOX.width, height: 400, right: BOX.left + BOX.width, bottom: 400, x: BOX.left, y: 0, toJSON: () => ({}) }) as DOMRect;
};
/** A pointer at `x` across the box, as a finger unless said otherwise. */
const at = (x: number, y = 100, pointerType: 'touch' | 'mouse' = 'touch') => ({
  clientX: BOX.left + x,
  clientY: y,
  pointerId: 1,
  pointerType,
  isPrimary: true,
  button: 0,
});
const tap = (x: number): void => {
  fireEvent.pointerDown(plot(), at(x));
  fireEvent.pointerUp(plot(), at(x));
};
const click = (x: number): void => {
  fireEvent.pointerDown(plot(), at(x, 100, 'mouse'));
  fireEvent.pointerUp(plot(), at(x, 100, 'mouse'));
};

describe('the plot as a cursor', () => {
  it('moves the marker to the income under a tap, on the first tap', () => {
    render(<App />);
    sizeBox();
    tap(400);
    const expected = incomeAtX(400, BOX.width, 130_000, WIDE_FRAME);
    expect(expected).not.toBeNull();
    expect(slider()).toHaveValue(String(expected));
    expect(money(incomeField())).toBe(expected);
  });

  it('drags the marker under a finger drawn along the plot, and leaves it where the finger lifts', () => {
    render(<App />);
    sizeBox();
    fireEvent.pointerDown(plot(), at(300));
    fireEvent.pointerMove(plot(), at(303));
    expect(slider()).toHaveValue('50000');
    fireEvent.pointerMove(plot(), at(340));
    expect(slider()).toHaveValue(String(incomeAtX(340, BOX.width, 130_000, WIDE_FRAME)));
    fireEvent.pointerMove(plot(), at(500));
    const last = incomeAtX(500, BOX.width, 130_000, WIDE_FRAME);
    expect(slider()).toHaveValue(String(last));
    fireEvent.pointerUp(plot(), at(500));
    expect(slider()).toHaveValue(String(last));
  });

  it('leaves a finger drawn down the plot to the page', () => {
    render(<App />);
    sizeBox();
    fireEvent.pointerDown(plot(), at(400, 100));
    fireEvent.pointerMove(plot(), at(403, 140));
    fireEvent.pointerMove(plot(), at(420, 200));
    fireEvent.pointerUp(plot(), at(420, 200));
    expect(slider()).toHaveValue('50000');
    // And once the browser has taken the scroll, nothing here moves either.
    fireEvent.pointerDown(plot(), at(400, 100));
    fireEvent.pointerCancel(plot(), at(400, 100));
    fireEvent.pointerMove(plot(), at(600, 100));
    expect(slider()).toHaveValue('50000');
  });

  it('moves the marker to the income under a click, and clamps a click off either end', () => {
    render(<App />);
    sizeBox();
    click(400);
    expect(slider()).toHaveValue(String(incomeAtX(400, BOX.width, 130_000, WIDE_FRAME)));
    click(2);
    expect(slider()).toHaveValue('0');
    click(BOX.width + 50);
    expect(slider()).toHaveValue('130000');
    // A right click is not a move.
    fireEvent.pointerDown(plot(), { ...at(400, 100, 'mouse'), button: 2 });
    fireEvent.pointerUp(plot(), { ...at(400, 100, 'mouse'), button: 2 });
    expect(slider()).toHaveValue('130000');
  });

  it('does the same on the rate chart', () => {
    render(<App />);
    chooseChart('Your effective rate');
    sizeBox();
    tap(600);
    expect(slider()).toHaveValue(String(incomeAtX(600, BOX.width, 130_000, WIDE_FRAME)));
  });
});

describe('the frame', () => {
  const titles = (): string[] =>
    Array.from(plot().querySelectorAll('text'))
      .map((t) => t.textContent ?? '')
      .filter((t) => /per month|Share of income|Household income/.test(t));

  it('is wide by default: titled axes, the premium named on the plot, no key, and the hover reading', () => {
    render(<App />);
    expect(titles()).toEqual(['Household income for the year', 'You pay per month']);
    expect(plot().querySelector('.premium-label')).not.toBeNull();
    expect(document.querySelector('#step-cost .chart-key')).toBeNull();
    expect(plot().querySelector('.recharts-tooltip-wrapper')).not.toBeNull();
  });

  it('narrows on a phone: no titles, the premium in a key under the plot, and no hover reading for a finger', () => {
    pretend(390, 'coarse');
    render(<App />);
    expect(titles()).toEqual([]);
    expect(plot().querySelector('.premium-label')).toBeNull();
    const key = document.querySelector('#step-cost .chart-key') as HTMLElement;
    expect(key).not.toBeNull();
    expect(key).toHaveTextContent('Full premium $1,747/mo');
    expect(key).toHaveTextContent('Subsidy pays');
    expect(key).toHaveTextContent('You pay');
    expect(plot().querySelector('.recharts-tooltip-wrapper')).toBeNull();
    // The narrow frame's gutter is what the y-axis is given: its labels end inside it.
    const yAxisTick = Array.from(plot().querySelectorAll('.recharts-cartesian-axis-tick-value')).find(
      (t) => t.textContent === '$2,000',
    ) as SVGTextElement;
    expect(Number(yAxisTick.getAttribute('x'))).toBeLessThanOrEqual(NARROW_FRAME.axis + NARROW_FRAME.margin.left);
  });

  it('keeps the hover reading for a mouse on a narrow window', () => {
    pretend(390, 'fine');
    render(<App />);
    expect(plot().querySelector('.recharts-tooltip-wrapper')).not.toBeNull();
  });

  it('reads a touch against the narrow frame', () => {
    pretend(390, 'coarse');
    render(<App />);
    sizeBox();
    tap(400);
    expect(slider()).toHaveValue(String(incomeAtX(400, BOX.width, 130_000, NARROW_FRAME)));
  });
});

describe('the money field', () => {
  it('shows the figure with its thousands separated, and asks a phone for the numeric keypad', () => {
    render(<App />);
    expect(incomeField()).toHaveValue('50,000');
    expect(incomeField()).toHaveAttribute('inputmode', 'numeric');
    expect(incomeField()).toHaveAttribute('type', 'text');
  });

  it('takes a figure typed with or without separators, and settles it with them', () => {
    render(<App />);
    typeMoney(INCOME, 65_000);
    expect(incomeField()).toHaveValue('65,000');
    expect(slider()).toHaveValue('65000');
    fireEvent.change(incomeField(), { target: { value: '72,500' } });
    expect(slider()).toHaveValue('72500');
    fireEvent.blur(incomeField());
    expect(incomeField()).toHaveValue('72,500');
  });

  it('steps by the arrow keys, and never past the ends', () => {
    render(<App />);
    fireEvent.keyDown(incomeField(), { key: 'ArrowUp' });
    expect(slider()).toHaveValue('50100');
    fireEvent.keyDown(incomeField(), { key: 'ArrowDown' });
    fireEvent.keyDown(incomeField(), { key: 'ArrowDown' });
    expect(slider()).toHaveValue('49900');
    typeMoney(INCOME, 0);
    fireEvent.keyDown(incomeField(), { key: 'ArrowDown' });
    expect(slider()).toHaveValue('0');
  });
});

describe('the link note', () => {
  it('says how much one link adjusted in a line, and names one adjustment in full', () => {
    window.history.replaceState(null, '', '/?age=80');
    render(<App />);
    const note = screen.getByRole('status');
    expect(note).toHaveTextContent('One setting in this link was out of range and was adjusted.');
    expect(within(note).getAllByRole('listitem')).toHaveLength(1);
    expect(note.querySelector('details')).toBeNull();
  });

  it('folds more than one adjustment behind a summary', () => {
    window.history.replaceState(null, '', '/?age=80&income=999999&state=zz');
    render(<App />);
    const note = screen.getByRole('status');
    expect(note).toHaveTextContent('Three settings in this link were out of range and were adjusted.');
    const fold = note.querySelector('details') as HTMLDetailsElement;
    expect(fold).not.toBeNull();
    expect(fold).not.toHaveAttribute('open');
    expect(within(fold).getByText('What changed')).toBeInTheDocument();
    expect(within(fold).getAllByRole('listitem')).toHaveLength(3);
  });
});
