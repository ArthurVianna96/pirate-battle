export interface MovementInput {
  forward: boolean;
  turnLeft: boolean;
  turnRight: boolean;
}

export interface GameInput extends MovementInput {
  shootFront: boolean;
  shootLeft: boolean;
  shootRight: boolean;
}

const INPUT_BINDINGS: { action: keyof GameInput; keys: string[] }[] = [
  { action: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { action: 'turnLeft', keys: ['KeyA', 'ArrowLeft'] },
  { action: 'turnRight', keys: ['KeyD', 'ArrowRight'] },
  { action: 'shootFront', keys: ['Space'] },
  { action: 'shootLeft', keys: ['KeyQ'] },
  { action: 'shootRight', keys: ['KeyE'] },
];

export function createInputState(): GameInput {
  return {
    forward: false,
    turnLeft: false,
    turnRight: false,
    shootFront: false,
    shootLeft: false,
    shootRight: false,
  };
}

export function createGameInput(
  onChange: (input: GameInput) => void = () => {},
) {
  const input = createInputState();
  const pointerInput = createInputState();
  const pressed = new Set<string>();
  let enabled = true;
  const gameKeys = new Set(INPUT_BINDINGS.flatMap(({ keys }) => keys));

  function syncInput() {
    for (const { action, keys } of INPUT_BINDINGS) {
      input[action] =
        pointerInput[action] || keys.some((key) => pressed.has(key));
    }
    onChange({ ...input });
  }

  function keyDown(event: KeyboardEvent) {
    if (
      !enabled ||
      !gameKeys.has(event.code) ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    if (event.repeat) {
      return;
    }
    pressed.add(event.code);
    syncInput();
  }

  function keyUp(event: KeyboardEvent) {
    if (!enabled || !gameKeys.has(event.code)) {
      return;
    }
    event.preventDefault();
    pressed.delete(event.code);
    syncInput();
  }

  function reset() {
    pressed.clear();
    Object.assign(pointerInput, createInputState());
    syncInput();
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', reset);

  return {
    input,
    setAction(action: keyof GameInput, active: boolean) {
      if (!enabled) {
        return;
      }
      pointerInput[action] = active;
      syncInput();
    },
    setEnabled(value: boolean) {
      enabled = value;
      reset();
    },
    destroy() {
      enabled = false;
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
      reset();
    },
  };
}
