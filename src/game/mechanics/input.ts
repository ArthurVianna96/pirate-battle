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

export function createKeyboardInput(
  onChange: (input: GameInput) => void = () => {},
) {
  const input = createInputState();
  const pointerInput = createInputState();
  const pressed = new Set<string>();
  let enabled = true;
  const gameKeys = new Set([
    'KeyW',
    'ArrowUp',
    'KeyA',
    'ArrowLeft',
    'KeyD',
    'ArrowRight',
    'Space',
    'KeyQ',
    'KeyE',
  ]);

  function syncInput() {
    input.forward =
      pointerInput.forward || pressed.has('KeyW') || pressed.has('ArrowUp');
    input.turnLeft =
      pointerInput.turnLeft || pressed.has('KeyA') || pressed.has('ArrowLeft');
    input.turnRight =
      pointerInput.turnRight ||
      pressed.has('KeyD') ||
      pressed.has('ArrowRight');
    input.shootFront = pointerInput.shootFront || pressed.has('Space');
    input.shootLeft = pointerInput.shootLeft || pressed.has('KeyQ');
    input.shootRight = pointerInput.shootRight || pressed.has('KeyE');
    onChange({ ...input });
  }

  function keyDown(event: KeyboardEvent) {
    if (
      !enabled ||
      !gameKeys.has(event.code) ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    if (event.repeat) return;
    pressed.add(event.code);
    syncInput();
  }

  function keyUp(event: KeyboardEvent) {
    if (!enabled || !gameKeys.has(event.code)) return;
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
      if (!enabled) return;
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
