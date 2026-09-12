import type { ReactNode } from 'react';

/**
 * The notes: the explainers behind the figures, set as a broadsheet's
 * numbered notes under a kicker.
 *
 * Below the figures rather than beside them: the figures are the answer, and
 * these are the working. Each is numbered by the stylesheet, so a note added
 * or dropped renumbers the rest. Each page hands this its own notes, in the
 * order a reader meets what they describe.
 *
 * The kicker is the section's heading — an `h2`, between the figures' and
 * the reading list's — so each note's own `h3` hangs under a heading of its
 * own rather than under the figures', and a reader jumping by heading lands
 * on "Notes" before the first of them. The stylesheet sets it as a kicker:
 * the level is for the outline, the size for the page.
 */
export const NotesSection: React.FC<{ children: ReactNode }> = ({ children }) => (
  <section className="notes-section" aria-labelledby="notes-heading">
    <h2 className="notes-kicker" id="notes-heading">
      Notes
    </h2>
    {children}
  </section>
);
