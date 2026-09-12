import type { CopyState } from '../hooks/useScenarioAddress';

export interface ShareLinkProps {
  canCopy: boolean;
  copyState: CopyState;
  onCopy: () => void;
  /** What the button says. */
  label: string;
  /** What the line under it says once the copy has gone. */
  copied: string;
  /** And when the browser refused: where the same link still is. */
  failed: string;
}

/**
 * The button that sends the scenario as a link, and the line that says
 * whether the copy went.
 *
 * The address bar has carried the whole scenario since the query string went
 * in, so the button is the whole feature: it saves a reader the trip to the
 * top of the window. A browser with no clipboard (`canCopy`) is left with
 * nothing here at all, because a copy button that cannot copy is worse than
 * no button.
 *
 * `aria-live` rather than `role="status"`: the same announcement, without
 * becoming the second status region on a document whose first one is the
 * link note. Rendered empty rather than conditionally, because a live region
 * has to be mounted before the message lands in it to be read out reliably;
 * CSS hides it while it is.
 */
export const ShareLink: React.FC<ShareLinkProps> = ({
  canCopy,
  copyState,
  onCopy,
  label,
  copied,
  failed,
}) => (
  <div className="answer-share">
    {canCopy && (
      <button type="button" className="answer-share-button" onClick={onCopy}>
        {label}
      </button>
    )}
    <p className="answer-share-status" aria-live="polite" aria-atomic="true">
      {copyState === 'copied' ? copied : copyState === 'failed' ? failed : ''}
    </p>
  </div>
);
