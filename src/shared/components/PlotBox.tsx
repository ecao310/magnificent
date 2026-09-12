import type { ReactNode } from 'react';
import type { PlotPointer } from '../hooks/usePlotPointer';

export interface PlotBoxProps {
  /** The plot's accessible name, which describes the axis end to end. */
  label: string;
  /** The plot as its own cursor: see `usePlotPointer`. */
  pointer: PlotPointer;
  children: ReactNode;
}

/**
 * The box a plot is drawn in: named as one image, since the curve is read
 * whole rather than mark by mark, and wired as its own cursor — a click or
 * a tap moves the marker to the income under the pointer, and a finger
 * drawn along the plot drags it. The stylesheet gives it its height.
 */
export const PlotBox: React.FC<PlotBoxProps> = ({ label, pointer, children }) => (
  <div
    className="chart-container"
    role="img"
    aria-label={label}
    ref={pointer.ref}
    onPointerDown={pointer.onPointerDown}
    onPointerMove={pointer.onPointerMove}
    onPointerUp={pointer.onPointerUp}
    onPointerCancel={pointer.onPointerCancel}
  >
    {children}
  </div>
);
