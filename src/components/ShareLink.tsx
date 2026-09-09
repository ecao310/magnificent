import type { CopyState } from '../hooks/useScenarioAddress';

export interface ShareLinkProps {
  canCopy: boolean;
  copyState: CopyState;
  onCopy: () => void;
}

/**
 * The button that sends the household as a link, and the line that says
 * whether the copy went. The status is a live region that is always
 * mounted, so a message lands in it rather than arriving with it.
 */
export const ShareLink: React.FC<ShareLinkProps> = ({ canCopy, copyState, onCopy }) => (
  <div className="answer-share">
    {canCopy && (
      <button type="button" className="answer-share-button" onClick={onCopy}>
        Copy link
      </button>
    )}
    <p className="answer-share-status" aria-live="polite" aria-atomic="true">
      {copyState === 'copied'
        ? 'Link copied.'
        : copyState === 'failed'
          ? 'Couldn’t copy — the address bar holds the same link.'
          : ''}
    </p>
  </div>
);
