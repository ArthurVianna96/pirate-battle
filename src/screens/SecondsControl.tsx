import type { Ref } from 'react';

interface SecondsControlProps {
  id: string;
  label: string;
  value: string;
  min: number;
  max: number;
  invalid: boolean;
  autoFocus?: boolean;
  inputRef: Ref<HTMLInputElement>;
  onChange: (value: string) => void;
}

export function SecondsControl({
  id,
  label,
  value,
  min,
  max,
  invalid,
  autoFocus,
  inputRef,
  onChange,
}: SecondsControlProps) {
  function adjust(seconds: number) {
    const current = Number(value);
    const next = Number.isFinite(current) ? current + seconds : min;
    onChange(String(Math.min(max, Math.max(min, next))));
  }

  return (
    <div className="option-field">
      <label htmlFor={id}>{label}</label>
      <div className="option-stepper">
        <button
          type="button"
          className="round-button minus-button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          disabled={Number(value) <= min}
          onClick={() => adjust(-1)}
        />
        <div className="seconds-value">
          <input
            autoFocus={autoFocus}
            ref={inputRef}
            id={id}
            type="number"
            required
            min={min}
            max={max}
            step="1"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={invalid}
            aria-describedby={`${id}-help ${id}-error`}
          />
          <span aria-hidden="true">s</span>
        </div>
        <button
          type="button"
          className="round-button plus-button"
          aria-label={`Increase ${label.toLowerCase()}`}
          disabled={Number(value) >= max}
          onClick={() => adjust(1)}
        />
      </div>
      <span id={`${id}-help`} className="sr-only">
        {min} to {max} seconds, in whole seconds.
      </span>
      {invalid && (
        <span id={`${id}-error`} role="alert">
          Enter a whole number from {min} to {max}.
        </span>
      )}
    </div>
  );
}
