export interface HeaderProps {
  title: string;
  /** The sentence under the title that says what the page draws. */
  deck: React.ReactNode;
  /** The other page, with this household already in its address. */
  sibling: { href: string; label: string };
  /**
   * What the link asked for and could not have, if anything. Dismissible
   * because it describes the arrival rather than the household.
   */
  linkNotes: string[];
  onDismissNotes: () => void;
}

/**
 * The masthead: the title, the deck, the way to the other page, and what
 * the link that opened this one could not honour. The note is in here
 * rather than loose above the columns because it is about the arrival, the
 * same thing the title and the deck are.
 */
export const Header: React.FC<HeaderProps> = ({
  title,
  deck,
  sibling,
  linkNotes,
  onDismissNotes,
}) => (
  <header className="masthead">
    <div className="masthead-body">
      <h1>{title}</h1>
      <p className="subtitle">{deck}</p>
      <p className="masthead-nav">
        <a href={sibling.href}>{sibling.label}</a>
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
