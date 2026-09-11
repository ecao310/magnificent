export interface HeaderProps {
  /**
   * What the link asked for and could not have, if anything. Dismissible
   * because it describes the arrival rather than the household.
   */
  linkNotes: string[];
  onDismissNotes: () => void;
}

/** How many settings were adjusted, in a word. */
const COUNTS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];

/**
 * The masthead: the title, the deck, and what the link that opened the page
 * could not honour. The note is in here rather than loose above the columns
 * because it is about the arrival, the same thing the title and the deck are.
 *
 * The note is one line, and says how much was adjusted; one adjustment is
 * named in full under it, and more than one are folded behind a summary,
 * because on a phone a list of three took the whole first screen from the
 * chart.
 */
export const Header: React.FC<HeaderProps> = ({ linkNotes, onDismissNotes }) => {
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
      <div className="masthead-body">
        <h1>The ACA Subsidy Slope</h1>
        <p className="subtitle">
          On an ACA plan, you pay a set share of your household income and
          the subsidy pays the rest. When household income reaches 400% of the
          poverty line, the subsidy ends abruptly (the ACA subsidy cliff).
        </p>
      </div>

      {count > 0 && (
        <div className="link-note" role="status">
          <p>
            {count === 1
              ? 'One setting in this link was out of range and was adjusted.'
              : `${COUNTS[count] ?? count} settings in this link were out of range and were adjusted.`}
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
