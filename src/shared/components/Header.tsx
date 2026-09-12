import type { ReactNode } from 'react';
import { SiteNav } from './SiteNav';
import type { PageId } from '../lib/pages';

export interface HeaderProps {
  /** Which page this is, for the strip to mark. */
  page: PageId;
  title: string;
  /** The deck under the title: what the page is for, in a sentence or two. */
  subtitle: ReactNode;
  /**
   * What the link asked for and could not have, if anything. Dismissible
   * because it describes the arrival rather than the return: it stops being
   * true of what is on screen the moment the reader moves a control, and there
   * is no honest way to keep it current.
   */
  linkNotes: string[];
  onDismissNotes: () => void;
}

/** How many settings were adjusted, in a word. */
const COUNTS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];

/**
 * The masthead: the strip between the pages, the title and the deck, and
 * what the link that opened the page did.
 *
 * One component for both pages, handed each page's title and deck, because
 * the shape is the site's: the strip under the top rule, the title under a
 * hairline, the note under that. The note is in here rather than loose above
 * the steps because it is about the arrival rather than about the return —
 * the same thing the title and the deck are — and because content outside
 * every landmark is content a reader jumping by landmark never lands on.
 *
 * The note is two lines, and says how much was adjusted; one adjustment is
 * named in full under it, and more than one are folded behind a summary,
 * because on a phone a list of three took the whole first screen from the
 * chart.
 */
export const Header: React.FC<HeaderProps> = ({
  page,
  title,
  subtitle,
  linkNotes,
  onDismissNotes,
}) => {
  const count = linkNotes.length;
  const list = (
    <ul>
      {linkNotes.map((note) => (
        <li key={note}>{note}</li>
      ))}
    </ul>
  );
  return (
    <header className="masthead">
      <SiteNav current={page} />
      <div className="masthead-body">
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>

      {count > 0 && (
        <div className="link-note" role="status">
          <p>
            <strong>This link asked for something this page could not show.</strong>{' '}
            {count === 1
              ? 'One setting was adjusted; everything else in it came through as sent.'
              : `${COUNTS[count] ?? count} settings were adjusted; everything else in it came through as sent.`}
          </p>
          {count === 1 ? (
            list
          ) : (
            <details className="link-note-list">
              <summary>What changed</summary>
              {list}
            </details>
          )}
          <button type="button" onClick={onDismissNotes}>
            Dismiss
          </button>
        </div>
      )}
    </header>
  );
};
