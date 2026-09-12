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
 *
 * An image has no children a reader can reach: `role="img"` hides
 * everything inside it from assistive technology, so nothing inside it may
 * be in the tab order. recharts would put a tab stop there anyway — its own
 * accessibility layer gives the SVG a `tabindex="0"` and a role the `img`
 * around it then hides — and a Tab that landed on it landed on nothing a
 * reader could hear. So every chart drawn in this box passes
 * `accessibilityLayer={false}` to recharts, and the slider under the plot is
 * the keyboard's way along the axis. What recharts still writes is a
 * `tabindex="-1"` on the layers it stacks the plot in and on the hover
 * reading's box, which a pointer can focus and a Tab never reaches. `the
 * plot` in each page's chart suite holds that line.
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
