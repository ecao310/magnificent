import { useState } from 'react';
import type { ReactNode } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { RAIL_FOLD_QUERY } from '../lib/layout';

export interface RailProps {
  /** The section's id, which a skip link or a fragment can name. Its heading is `${id}-heading`. */
  id: string;
  heading: string;
  /** The rail in one phrase, for the row it folds to on a narrow screen. */
  summary: string;
  /** The controls. */
  children: ReactNode;
}

/**
 * The rail: the scenario every figure on the page prices, beside the chart
 * on a wide screen and folded to a row under the masthead on a narrow one.
 *
 * Folded, the row is the heading, the scenario in a phrase under it, and a
 * stamped word at the right that says what a tap does. A phone reader who
 * scrolled past a chart and its figures to find the controls found them too
 * late to change the scenario the figures were priced for; a row that says
 * whose figures these are before the chart does, and one tap makes them the
 * reader's. Open, the controls stand in place, directly over the chart they
 * move. Each page hands this its own controls and its own phrase; the fold
 * itself is the site's.
 */
export const Rail: React.FC<RailProps> = ({ id, heading, summary, children }) => {
  const folds = useMediaQuery(RAIL_FOLD_QUERY);
  const [open, setOpen] = useState(false);
  const headingId = `${id}-heading`;

  const title = (
    <h2 className="step-heading" id={headingId}>
      {heading}
    </h2>
  );

  if (!folds) {
    return (
      <section className="step step-config" id={id} tabIndex={-1} aria-labelledby={headingId}>
        {title}
        {children}
      </section>
    );
  }

  return (
    <details
      className="step step-config rail-sheet"
      id={id}
      aria-labelledby={headingId}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        {title}
        <span className="rail-sheet-gloss">{summary}</span>
        <span className="rail-sheet-toggle" aria-hidden="true">
          {open ? 'Done' : 'Change'}
        </span>
      </summary>
      <div className="rail-sheet-body">{children}</div>
    </details>
  );
};
