import { FURTHER_READING } from '../lib/furtherReading';

/**
 * The reading list: a closed note under the footer's rule, ahead of the
 * disclaimer. Same-tab links, no `target`: a reader who leaves comes back
 * with the back button, and the household is still in the address bar when
 * they do.
 */
export const FurtherReading: React.FC = () => (
  <details className="reading" id="reading">
    <summary>
      <h2 className="reading-heading" id="reading-heading">
        Further reading
      </h2>
    </summary>
    <ul className="reading-list">
      {FURTHER_READING.map(({ href, title, source }) => (
        <li className="reading-item" key={href}>
          <a href={href}>{title}</a>
          <span className="reading-source">{source}</span>
        </li>
      ))}
    </ul>
  </details>
);
