export interface MovementInput {
  forward: boolean;
}

export function createKeyboardInput() {
  const input: MovementInput = { forward: false };
  const pressed = new Set<string>();
  const forwardKeys = new Set(['KeyW', 'ArrowUp']);

  function keyDown(event: KeyboardEvent) {
    if (
      !forwardKeys.has(event.code) ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    pressed.add(event.code);
    input.forward = true;
  }

  function keyUp(event: KeyboardEvent) {
    if (!forwardKeys.has(event.code)) return;
    event.preventDefault();
    pressed.delete(event.code);
    input.forward = pressed.size > 0;
  }

  function reset() {
    pressed.clear();
    input.forward = false;
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
