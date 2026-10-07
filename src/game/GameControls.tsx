import type { PointerEvent } from 'react';
import type { GameInput } from './mechanics/input';

const CONTROLS = [
  { action: 'forward', label: 'Move forward', keys: 'W / ↑', icon: 'forward' },
  { action: 'turnLeft', label: 'Turn left', keys: 'A / ←', icon: 'turn-left' },
  {
    action: 'turnRight',
    label: 'Turn right',
    keys: 'D / →',
    icon: 'turn-right',
  },
  {
    action: 'shootFront',
    label: 'Fire forward',
    keys: 'Space',
    icon: 'fire-front',
  },
  { action: 'shootLeft', label: 'Fire left', keys: 'Q', icon: 'fire-left' },
  { action: 'shootRight', label: 'Fire right', keys: 'E', icon: 'fire-right' },
] as const;

export function GameControls({
  input,
  disabled,
  onAction,
}: {
  input: GameInput;
  disabled: boolean;
  onAction: (action: keyof GameInput, active: boolean) => void;
}) {
  function pressControl(
    event: PointerEvent<HTMLButtonElement>,
    action: keyof GameInput,
  ) {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onAction(action, true);
  }

  return (
    <div className="game-controls" aria-label="Ship controls">
      {CONTROLS.map(({ action, label, keys, icon }) => (
        <button
          key={action}
          type="button"
          className={`round-button control-${icon}`}
          aria-label={label}
          aria-pressed={input[action]}
          title={`${label} (${keys})`}
          disabled={disabled}
          onPointerDown={(event) => pressControl(event, action)}
          onPointerUp={() => onAction(action, false)}
          onPointerCancel={() => onAction(action, false)}
          onLostPointerCapture={() => onAction(action, false)}
        />
      ))}
    </div>
  );
}
