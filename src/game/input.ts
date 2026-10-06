export interface MovementInput {
  forward: boolean;
  turnLeft: boolean;
  turnRight: boolean;
}

interface KeyboardInput extends MovementInput {
  shootFront: boolean;
}

export function createKeyboardInput() {
  const input: KeyboardInput = {
    forward: false,
    turnLeft: false,
    turnRight: false,
    shootFront: false,
  };
  const pressed = new Set<string>();
  const gameKeys = new Set([
    'KeyW',
    'ArrowUp',
    'KeyA',
    'ArrowLeft',
    'KeyD',
    'ArrowRight',
    'Space',
  ]);

  function syncInput() {
    input.forward = pressed.has('KeyW') || pressed.has('ArrowUp');
    input.turnLeft = pressed.has('KeyA') || pressed.has('ArrowLeft');
    input.turnRight = pressed.has('KeyD') || pressed.has('ArrowRight');
    input.shootFront = pressed.has('Space');
  }

  function keyDown(event: KeyboardEvent) {
    if (
      !gameKeys.has(event.code) ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    pressed.add(event.code);
    syncInput();
  }

  function keyUp(event: KeyboardEvent) {
    if (!gameKeys.has(event.code)) return;
    event.preventDefault();
    pressed.delete(event.code);
    syncInput();
  }

  function reset() {
    pressed.clear();
    syncInput();
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', reset);

  return {
    input,
    destroy() {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
      reset();
    },
  };
}
