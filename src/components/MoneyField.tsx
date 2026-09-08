import { useEffect, useState } from 'react';

export interface MoneyFieldProps {
  id: string;
  /** The figure as the page holds it: what the field shows when nobody is typing. */
  value: number;
  min: number;
  max: number;
  step: number;
  /** Called with every in-range figure typed, and with the clamped one on blur. */
  onCommit: (next: number) => void;
  /** The colour the figure takes, as a class. */
  className?: string;
  describedBy?: string;
}

/**
 * A dollar figure the reader can type, set as the page sets every other
 * figure: mono, right-aligned, with the sign in front of it.
 *
 * Typing commits on every keystroke that parses inside the bounds, so the
 * chart follows the field the way it follows a slider. A half-typed figure —
 * an empty field, a number past the end of the axis — is held as a draft and
 * clamped when the field is left, so the page never jumps to a value the
 * reader was passing through.
 */
export const MoneyField: React.FC<MoneyFieldProps> = ({
  id,
  value,
  min,
  max,
  step,
  onCommit,
  className,
  describedBy,
}) => {
  const [draft, setDraft] = useState<string | null>(null);

  /* Anything that moves the figure — this field, a slider, a link — ends the
     draft, so the field shows what the page is actually pricing. */
  useEffect(() => setDraft(null), [value]);

  const commit = (raw: string): void => {
    setDraft(raw);
    const next = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(next)) return;
    if (next < min || next > max) return;
    onCommit(Math.round(next));
  };

  const settle = (): void => {
    const next = Number(draft);
    setDraft(null);
    if (draft === null || draft.trim() === '' || !Number.isFinite(next)) return;
    onCommit(Math.round(Math.min(max, Math.max(min, next))));
  };

  /* The box is as wide as the biggest figure it can hold, so the sign in
     front of it stands against the digits rather than across a gap. */
  const digits = { '--digits': String(max).length } as React.CSSProperties;

  return (
    <span className={className ? `money-field ${className}` : 'money-field'} style={digits}>
      <span className="money-field-sign" aria-hidden="true">
        $
      </span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={draft ?? String(value)}
        aria-describedby={describedBy}
        onChange={(e) => commit(e.target.value)}
        onBlur={settle}
      />
    </span>
  );
};
