import { useMediaQuery } from './useMediaQuery';
import { usePlotPointer } from './usePlotPointer';
import type { PlotPointer } from './usePlotPointer';
import { HOVER_QUERY, NARROW_QUERY } from '../lib/chartFrame';
import type { Frame } from '../lib/chartFrame';

export interface PlotOptions<F extends Frame> {
  axisMax: number;
  /** The slider's step, which a tap or a drag on the plot is rounded to. */
  step: number;
  /** Moves the reader's marker: a tap, a click, or a finger drawn along the plot. */
  onIncome: (next: number) => void;
  /** The page's frames: the wide one, or the narrow one on a phone. */
  frameFor: (narrow: boolean) => F;
}

export interface Plot<F extends Frame> {
  /** Whether the screen is under `NARROW_MAX_WIDTH`, and so the plot takes the narrow frame. */
  narrow: boolean;
  frame: F;
  /** Whether there is a pointer that can hover, and so a hover reading to draw. */
  hoverable: boolean;
  pointer: PlotPointer;
}

/**
 * What every plot asks the window before it draws: which frame to take, and
 * whether a hover means anything — and the pointer that makes the plot its
 * own cursor, built on the frame it chose.
 */
export function usePlot<F extends Frame>({ axisMax, step, onIncome, frameFor }: PlotOptions<F>): Plot<F> {
  const narrow = useMediaQuery(NARROW_QUERY);
  const frame = frameFor(narrow);
  const hoverable = useMediaQuery(HOVER_QUERY, true);
  const pointer = usePlotPointer({ axisMax, step, frame, onIncome });
  return { narrow, frame, hoverable, pointer };
}
