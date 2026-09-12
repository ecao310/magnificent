import type { ReactNode } from 'react';

/** What recharts hands a tooltip: whether one is showing, and the point under the pointer. */
export interface TooltipProps<P> {
  active?: boolean;
  payload?: Array<{ payload: P }>;
}

export interface TooltipCardProps {
  /** The point itself: the income that makes it, and where it stands. */
  head: ReactNode;
  /** What that point is worth, in the page's own figures. */
  children: ReactNode;
}

/**
 * The hover reading: paper with an ink edge, the point named under a rule
 * and its figures under that. Each page fills it with its own figures; the
 * card is the site's.
 */
export const TooltipCard: React.FC<TooltipCardProps> = ({ head, children }) => (
  <div className="chart-tooltip">
    <div className="chart-tooltip-head">{head}</div>
    {children}
  </div>
);
