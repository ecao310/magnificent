import type { ReactNode } from 'react';

export interface ExplainerProps {
  /** The heading's id, for anything that points at the note. */
  id: string;
  title: ReactNode;
  children: ReactNode;
}

/**
 * One note: a closed disclosure whose summary is its heading, so the row a
 * reader opens is the row the stylesheet numbers. Print CSS cannot open a
 * `<details>`, so a note prints exactly as the reader left it.
 */
export const Explainer: React.FC<ExplainerProps> = ({ id, title, children }) => (
  <details className="explainer">
    <summary>
      <h3 id={id}>{title}</h3>
    </summary>
    <div className="explainer-content">{children}</div>
  </details>
);
