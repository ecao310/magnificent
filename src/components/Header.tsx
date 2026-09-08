export interface HeaderProps {
  /**
   * What the link asked for and could not have, if anything. Dismissible
   * because it describes the arrival rather than the household: it stops
   * being true of what is on screen the moment the reader moves a control.
   */
  linkNotes: string[];
  onDismissNotes: () => void;
}

/**
 * The masthead: the title and the deck, and what the link that opened the
 * page did. The note is in here rather than loose above the steps because it
 * is about the arrival, the same thing the title and the deck are.
 */
export const Header: React.FC<HeaderProps> = ({ linkNotes, onDismissNotes }) => (
  <header className="masthead">
    <div className="masthead-body">
      <h1>Income Taxes in Early Retirement</h1>
      <p className="subtitle">
        Before 65, the next dollar of income rarely costs what its bracket
        says either. A household buying its coverage on the Marketplace gives
        back a slice of its premium tax credit with every dollar it adds
        &mdash; around 17 cents for a couple in the middle of the table &mdash;
        and the whole credit on the dollar that crosses 400% of the poverty
        line. Use this tool to price a Roth conversion or a harvested gain
        against the subsidy it costs.
      </p>
    </div>

    {linkNotes.length > 0 && (
      <div className="link-note" role="status">
        <p>
          <strong>This link asked for something this page could not show.</strong>{' '}
          Everything else in it came through as sent.
        </p>
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
