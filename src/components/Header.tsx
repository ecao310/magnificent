export interface HeaderProps {
  /**
   * What the link asked for and could not have, if anything. Dismissible
   * because it describes the arrival rather than the household.
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
      <h1>The ACA Subsidy Slope</h1>
      <p className="subtitle">
        A household that buys its coverage on the Marketplace pays a set share of
        its income for the benchmark plan, and the subsidy pays the rest. The
        share rises with income &mdash; around 17 cents of every extra dollar
        for a couple in the middle of the table &mdash; and the whole subsidy
        goes on the dollar that crosses 400% of the poverty line. Use this tool
        to see what the plan costs at every income, and what the next dollar
        does to it.
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
