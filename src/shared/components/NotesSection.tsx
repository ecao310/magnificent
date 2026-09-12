import type { ReactNode } from 'react';

/**
 * The notes: the explainers behind the figures, set as a broadsheet's
 * numbered notes under a kicker.
 *
 * Below the figures rather than beside them: the figures are the answer, and
 * these are the working. Each is numbered by the stylesheet, so a note added
 * or dropped renumbers the rest. Each page hands this its own notes, in the
 * order a reader meets what they describe.
 */
export const NotesSection: React.FC<{ children: ReactNode }> = ({ children }) => (
  <section className="notes-section" aria-label="Notes">
    <p className="notes-kicker">Notes</p>
    {children}
  </section>
);
