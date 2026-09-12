import type { ReactNode } from 'react';
import { ShareLink } from './ShareLink';
import type { ShareLinkProps } from './ShareLink';

export interface AnswerProps {
  heading: ReactNode;
  /** The scenario the figures are priced for, set as a status line under the heading. */
  subline: ReactNode;
  /** The figures, as `Figure`s, in the order a reader takes them. */
  children: ReactNode;
  /** The button that sends the scenario as a link, and what it says. */
  share: ShareLinkProps;
}

/**
 * The figures the page is for, at the point the marker is standing on.
 *
 * Under the chart and over the notes, because it is the thing a reader would
 * screenshot, which is also why it restates the scenario in a status line
 * above the figures: a screenshot of an answer with no question in it is
 * worth nothing. The link closes the block, because what is worth sending is
 * the answer and this is the one place the answer sits together.
 */
export const Answer: React.FC<AnswerProps> = ({ heading, subline, children, share }) => (
  <section className="answer" id="answer" aria-labelledby="answer-heading">
    <h2 className="answer-heading" id="answer-heading">
      {heading}
    </h2>
    <p className="answer-subline">{subline}</p>
    <dl className="answer-figures">{children}</dl>
    <ShareLink {...share} />
  </section>
);

export interface FigureProps {
  label: ReactNode;
  /** The figure itself, set large in the mono. */
  value: ReactNode;
  /** The second half of a figure that is a pair — "/mo", "of $24,852" — on a line of its own under it. */
  of?: ReactNode;
  /** The same figure a second way, in a sentence under it. */
  gloss?: ReactNode;
}

/** One figure: its name, the figure, and what it is of and what it means. */
export const Figure: React.FC<FigureProps> = ({ label, value, of, gloss }) => (
  <div className="answer-figure">
    <dt>{label}</dt>
    <dd>
      <strong>{value}</strong>
      {of !== undefined && (
        <>
          {' '}
          <span className="answer-of">{of}</span>
        </>
      )}
      {gloss !== undefined && <span className="answer-gloss">{gloss}</span>}
    </dd>
  </div>
);
