import type { Application, Sprite, Ticker } from 'pixi.js';
import { createKeyboardInput } from './input';
import { movementConfig, updatePlayer } from './simulation';

export function startMovement(app: Application, ship: Sprite): () => void {
  const keyboard = createKeyboardInput();
  const player = { x: ship.x, y: ship.y };

  function update(ticker: Ticker) {
    updatePlayer(player, keyboard.input, ticker.deltaMS / 1000, movementConfig);
    ship.position.set(player.x, player.y);
  }

  app.ticker.add(update);
  app.start();

  return () => {
    app.stop();
    app.ticker.remove(update);
    keyboard.destroy();
  };
}
