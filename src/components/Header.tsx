export interface HeaderProps {
  /**
   * What the link asked for and could not have, if anything. Dismissible
   * because it describes the arrival rather than the household.
   */
  linkNotes: string[];
  onDismissNotes: () => void;
}

/**
 * The masthead: the title, the deck, and what the link that opened the page
 * could not honour. The note is in here rather than loose above the columns
 * because it is about the arrival, the same thing the title and the deck are.
 */
export const Header: React.FC<HeaderProps> = ({ linkNotes, onDismissNotes }) => (
  <header className="masthead">
    <div className="masthead-body">
      <h1>The ACA Subsidy Slope</h1>
      <p className="subtitle">
        On an ACA plan, you pay a set share of your household income and
        the subsidy pays the rest. When household income reaches 400% of the
        poverty line, the subsidy ends abruptly (the ACA subsidy cliff).
      </p>
    </div>

    {linkNotes.length > 0 && (
      <div className="link-note" role="status">
        <p>Some settings in this link were out of range and were adjusted:</p>
        <ul>
          {linkNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <button type="button" onClick={onDismissNotes}>
          Dismiss
        </button>
      </div>
    )}
  </header>
);
