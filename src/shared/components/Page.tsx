import type { ReactNode } from 'react';
import { FurtherReading } from './FurtherReading';
import { Header } from './Header';
import type { HeaderProps } from './Header';
import { useSettledReading } from '../hooks/useSettledReading';
import type { Reading } from '../lib/reading';

export interface PageProps extends HeaderProps {
  /** Where the skip link lands: the id of the chart's section. */
  skipTo: string;
  /**
   * What the live region reads out, once the control that changed it has
   * settled. Empty until the reader has moved something, so arrival is
   * silent.
   */
  reading: string;
  /** The page's own reading list, from its `lib/furtherReading.ts`. */
  readings: readonly Reading[];
  /** The last word, under the reading list. */
  disclaimer: ReactNode;
  /** The rail, the chart with its figures, and the notes. */
  children: ReactNode;
}

/**
 * The shell both pages are set in: the skip link, the masthead, the live
 * reading, the main landmark and the back matter.
 *
 * The skip link is the first focusable element, because the rail is a column
 * of controls before the chart begins, and a reader who has already set the
 * scenario — or arrived on a link that set it for them — has to tab through
 * every one of them to reach the thing the page is about. It lands on the
 * chart's section rather than on the figures: the figures sit after it in
 * reading order and one heading jump away, so landing on the chart reaches
 * both. No handler: the target carries `tabIndex={-1}`, which is what makes
 * a browser move focus into it rather than only scrolling to it.
 *
 * The live reading is what a screen reader hears when a control moves, and
 * the only thing here that is heard rather than read. Rendered always and
 * empty until there is something to say, because a live region has to be
 * mounted before the message lands in it to be read out reliably; `aria-atomic`
 * because each reading is one sentence that replaces the last. It sits above
 * the steps because where it sits changes nothing about when it is read, and
 * the close is meant to be the last thing before the footer. What it says is
 * held back until the control that changed it has stopped moving — what is
 * on screen never waits on this; only what is said does.
 *
 * `.shell` is the main landmark rather than gaining a wrapper: it is already
 * the box that holds exactly the rail, the chart and the notes, and a second
 * box would be a grid parent with one grid child. The footer stays outside it
 * on purpose — a `<footer>` inside `<main>` is not `contentinfo` — so the
 * reading list and the disclaimer are what is *about* the document, and the
 * close stays the last thing in the main.
 */
export const Page: React.FC<PageProps> = ({
  page,
  title,
  subtitle,
  linkNotes,
  onDismissNotes,
  skipTo,
  reading,
  readings,
  disclaimer,
  children,
}) => {
  const announcement = useSettledReading(reading);

  return (
    <div className="card">
      <a className="skip-link" href={`#${skipTo}`}>
        Skip to the chart
      </a>

      <Header
        page={page}
        title={title}
        subtitle={subtitle}
        linkNotes={linkNotes}
        onDismissNotes={onDismissNotes}
      />

      <p className="live-reading" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <main className="shell">{children}</main>

      <footer>
        <FurtherReading readings={readings} />
        <p>{disclaimer}</p>
      </footer>
    </div>
  );
};
