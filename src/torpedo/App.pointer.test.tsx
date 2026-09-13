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
import { pinPageYear } from './test/pageFixtures';

/**
 * The plot as a cursor, under a finger and under a mouse; the frame it takes
 * on a phone; and the note a link leaves. jsdom has no `matchMedia` and no
 * layout, so the screen is pretended and the chart's box is given a size by
 * hand.
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
const slider = (): HTMLInputElement => screen.getByRole('slider', { name: /other income/i });
/** The right edge of the slider, and its step: the axis is sized to the return, so both are read rather than known. */
const axisMax = (): number => Number(slider().max);
const step = (): number => Number(slider().step);

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
    const before = slider().value;
    tap(400);
    const expected = incomeAtX(400, BOX.width, axisMax(), step(), WIDE_FRAME);
    expect(expected).not.toBeNull();
    expect(String(expected)).not.toBe(before);
    expect(slider()).toHaveValue(String(expected));
  });

  it('drags the marker under a finger drawn along the plot, and leaves it where the finger lifts', () => {
    render(<App />);
    sizeBox();
    const before = slider().value;
    fireEvent.pointerDown(plot(), at(300));
    fireEvent.pointerMove(plot(), at(303));
    expect(slider()).toHaveValue(before);
    fireEvent.pointerMove(plot(), at(340));
    expect(slider()).toHaveValue(String(incomeAtX(340, BOX.width, axisMax(), step(), WIDE_FRAME)));
    fireEvent.pointerMove(plot(), at(500));
    const last = incomeAtX(500, BOX.width, axisMax(), step(), WIDE_FRAME);
    expect(slider()).toHaveValue(String(last));
    fireEvent.pointerUp(plot(), at(500));
    expect(slider()).toHaveValue(String(last));
  });

  it('leaves a finger drawn down the plot to the page', () => {
    render(<App />);
    sizeBox();
    const before = slider().value;
    fireEvent.pointerDown(plot(), at(400, 100));
    fireEvent.pointerMove(plot(), at(403, 140));
    fireEvent.pointerMove(plot(), at(420, 200));
    fireEvent.pointerUp(plot(), at(420, 200));
    expect(slider()).toHaveValue(before);
    // And once the browser has taken the scroll, nothing here moves either.
    fireEvent.pointerDown(plot(), at(400, 100));
    fireEvent.pointerCancel(plot(), at(400, 100));
    fireEvent.pointerMove(plot(), at(600, 100));
    expect(slider()).toHaveValue(before);
  });

  it('moves the marker to the income under a click, and clamps a click off either end', () => {
    render(<App />);
    sizeBox();
    click(400);
    expect(slider()).toHaveValue(String(incomeAtX(400, BOX.width, axisMax(), step(), WIDE_FRAME)));
    click(2);
    expect(slider()).toHaveValue('0');
    const max = axisMax();
    click(BOX.width + 50);
    expect(slider()).toHaveValue(String(max));
    // A right click is not a move.
    fireEvent.pointerDown(plot(), { ...at(400, 100, 'mouse'), button: 2 });
    fireEvent.pointerUp(plot(), { ...at(400, 100, 'mouse'), button: 2 });
    expect(slider()).toHaveValue(String(max));
  });

  it('lands on a step of the slider, so the readout is a point the curve sampled', () => {
    render(<App />);
    sizeBox();
    tap(377);
    expect(Number(slider().value) % step()).toBe(0);
  });
});

describe('the frame', () => {
  /**
   * Where a y-axis label ends. recharts lifts tick labels out of the axis
   * layer, so the y-axis's are told from the x-axis's by their `%` rather
   * than by where they sit; the label's `x` is its right edge, which the
   * gutter has to hold.
   */
  const yAxisTickX = (): number => {
    const tick = Array.from(plot().querySelectorAll('.recharts-cartesian-axis-tick-value')).find(
      (t) => /%$/.test(t.textContent ?? ''),
    ) as SVGTextElement;
    return Number(tick.getAttribute('x'));
  };

  it('is wide by default, with the hover reading', () => {
    render(<App />);
    expect(plot().querySelector('.recharts-tooltip-wrapper')).not.toBeNull();
    // The plot area starts where the wide frame says: the y-axis ends inside its gutter.
    expect(yAxisTickX()).toBeLessThanOrEqual(WIDE_FRAME.axis + WIDE_FRAME.margin.left);
  });

  it('narrows on a phone, and draws no hover reading for a finger', () => {
    pretend(390, 'coarse');
    render(<App />);
    expect(plot().querySelector('.recharts-tooltip-wrapper')).toBeNull();
    expect(yAxisTickX()).toBeLessThanOrEqual(NARROW_FRAME.axis + NARROW_FRAME.margin.left);
    expect(yAxisTickX()).toBeGreaterThan(NARROW_FRAME.axis + NARROW_FRAME.margin.left - WIDE_FRAME.margin.left);
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
    expect(slider()).toHaveValue(String(incomeAtX(400, BOX.width, axisMax(), step(), NARROW_FRAME)));
  });
});

describe('the link note', () => {
  it('says how much one link adjusted in a line, and names one adjustment in full', () => {
    window.history.replaceState(null, '', '/?filing=widow');
    render(<App />);
    const note = screen.getByRole('status');
    expect(note).toHaveTextContent('This link asked for something this page could not show.');
    expect(note).toHaveTextContent('One setting was adjusted');
    expect(within(note).getAllByRole('listitem')).toHaveLength(1);
    expect(note.querySelector('details')).toBeNull();
  });

  it('folds more than one adjustment behind a summary', () => {
    window.history.replaceState(null, '', '/?filing=widow&income=99999999&ss=999999');
    render(<App />);
    const note = screen.getByRole('status');
    expect(note).toHaveTextContent('Three settings were adjusted');
    const fold = note.querySelector('details') as HTMLDetailsElement;
    expect(fold).not.toBeNull();
    expect(fold).not.toHaveAttribute('open');
    expect(within(fold).getByText('What changed')).toBeInTheDocument();
    expect(within(fold).getAllByRole('listitem')).toHaveLength(3);
  });
});
