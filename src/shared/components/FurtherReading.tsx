import type { Reading } from '../lib/reading';

export interface FurtherReadingProps {
  /** The page's own list, from its `lib/furtherReading.ts`. */
  readings: readonly Reading[];
}

/**
 * The reading list: a closed note under the footer's rule, ahead of the
 * disclaimer.
 *
 * Set as one of the notes — the heading, the plus that turns to a minus —
 * because it is one: something to open after the walk, not part of it. It
 * is in the footer because that is what one is for: `contentinfo` is the
 * landmark for what is *about* a document rather than part of it, so the
 * close stays the last thing in the main and the disclaimer the last word.
 * Same-tab links, no `target`: a reader who leaves comes back with the back
 * button, and the return is still in the address bar when they do.
 *
 * A span rather than a paragraph for the source, because the footer's own
 * `p` rule is written for the disclaimer and would set anything else in the
 * same italic.
 */
export const FurtherReading: React.FC<FurtherReadingProps> = ({ readings }) => (
  <details className="reading" id="reading">
    <summary>
      <h2 className="reading-heading" id="reading-heading">
        Further reading
      </h2>
    </summary>
    <ul className="reading-list">
      {readings.map(({ href, title, source }) => (
        <li className="reading-item" key={href}>
          <a href={href}>{title}</a>
          <span className="reading-source">{source}</span>
        </li>
      ))}
    </ul>
  </details>
);
