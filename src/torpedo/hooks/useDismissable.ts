import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * The three ways out of an open panel that is not a dialog: Escape, a click
 * on anything else, and the focus leaving it.
 *
 * `container` has to wrap the trigger *and* the panel, so pressing the trigger
 * while it is open counts as a click inside — otherwise the outside-click
 * listener would shut the panel a moment before the trigger's own handler
 * reopened it, and the control would never close. Escape puts focus back on
 * the trigger, because a reader who dismisses a panel with the keyboard has
 * nowhere else to be.
 *
 * Nothing traps focus. What this is written for is a group of checkboxes
 * rather than a dialog, and Tab out of one is a legitimate way to leave it —
 * so the panel closes behind a Tab that leaves it, the way it closes behind a
 * click that lands elsewhere, rather than staying open over the plot while
 * the reader works the slider under it. Only a focus that moves *to*
 * something counts: a click on the panel's own legend blurs a checkbox with
 * nothing to relate it to, and that is a click inside, which the pointer
 * listener has already let stand.
 */
export const useDismissable = (
  open: boolean,
  dismiss: () => void,
  container: RefObject<HTMLElement | null>,
  trigger: RefObject<HTMLElement | null>,
): void => {
  useEffect(() => {
    if (!open) return;
    const box = container.current;
    const onPointerDown = (e: MouseEvent): void => {
      if (!container.current?.contains(e.target as Node)) dismiss();
    };
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      dismiss();
      trigger.current?.focus();
    };
    const onFocusOut = (e: FocusEvent): void => {
      const to = e.relatedTarget;
      if (to instanceof Node && !container.current?.contains(to)) dismiss();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    box?.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      box?.removeEventListener('focusout', onFocusOut);
    };
  }, [open, dismiss, container, trigger]);
};
