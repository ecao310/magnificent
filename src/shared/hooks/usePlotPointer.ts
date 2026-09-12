import { useRef } from 'react';
import type { PointerEvent } from 'react';
import { incomeAtX } from '../lib/chartFrame';
import type { Frame } from '../lib/chartFrame';

/**
 * How far a pointer travels before the page decides what it is doing: under
 * this it is a tap or a click, over it along the axis it is a scrub, and
 * over it down the page it is a scroll, which is the browser's.
 */
const SLOP = 8;

export type PlotPointer = ReturnType<typeof usePlotPointer>;

export interface PlotPointerOptions {
  axisMax: number;
  /** The slider's step, which a pointer's income is rounded to. */
  step: number;
  frame: Frame;
  onIncome: (next: number) => void;
}

/**
 * The plot as its own cursor, for a mouse and for a finger.
 *
 * A click moves the marker to the income under the pointer. So does a tap;
 * and a pointer drawn along the plot drags the marker with it, the way the
 * slider under the plot does, so the sentence and the figures under the
 * chart follow it. A finger drawn down the plot is a scroll, and is left to
 * the browser — `touch-action: pan-y` on the box says as much, the first
 * move decides which it is, and the browser cancels the pointer once it
 * has taken the scroll.
 *
 * Pointer events rather than touch events, because the browser keeps
 * delivering them once the box has captured the pointer, wherever the
 * finger goes, and because a mouse held down and drawn along the plot
 * should scrub too. The income is read off the pointer's own position
 * against the box the chart is drawn in, not off the chart's hover state:
 * on a touchscreen the hover and the tap arrive together, and a marker
 * that waits for the hover moves one tap late.
 */
export function usePlotPointer({ axisMax, step, frame, onIncome }: PlotPointerOptions) {
  const box = useRef<HTMLDivElement>(null);
  const press = useRef<{ id: number; x: number; y: number; scrubbing: boolean } | null>(null);

  const moveTo = (clientX: number): void => {
    const el = box.current;
    if (el === null) return;
    const rect = el.getBoundingClientRect();
    const income = incomeAtX(clientX - rect.left, rect.width, axisMax, step, frame);
    if (income !== null) onIncome(income);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    press.current = { id: e.pointerId, x: e.clientX, y: e.clientY, scrubbing: false };
    /* Kept, so a scrub that runs off the plot's edge keeps its pointer. */
    if (typeof e.currentTarget.setPointerCapture === 'function') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* Nothing to hold on to; the scrub ends at the edge instead. */
      }
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    const p = press.current;
    if (p === null || e.pointerId !== p.id) return;
    if (!p.scrubbing) {
      const dx = Math.abs(e.clientX - p.x);
      const dy = Math.abs(e.clientY - p.y);
      if (dy > dx && dy > SLOP) {
        /* A scroll. The browser has it; nothing here should. */
        press.current = null;
        return;
      }
      if (dx < SLOP) return;
      p.scrubbing = true;
    }
    moveTo(e.clientX);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>): void => {
    const p = press.current;
    if (p === null || e.pointerId !== p.id) return;
    press.current = null;
    /* A pointer that never moved far enough to be a scrub was a tap, or a click. */
    if (!p.scrubbing) moveTo(p.x);
  };

  const onPointerCancel = (): void => {
    press.current = null;
  };

  return { ref: box, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
