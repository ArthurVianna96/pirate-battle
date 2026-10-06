import type { Application, Sprite, Ticker } from 'pixi.js';
import { createKeyboardInput } from './input';
import { advancePlayer, type Obstacle } from './collisions';
import { movementConfig } from './simulation';

export function startMovement(
  app: Application,
  ship: Sprite,
  obstacles: readonly Obstacle[],
): () => void {
  const keyboard = createKeyboardInput();
  const player = { x: ship.x, y: ship.y, heading: ship.rotation - Math.PI };
  const shipSize = { width: ship.width, height: ship.height };
  const arenaSize = { width: app.screen.width, height: app.screen.height };
  const world = { shipSize, arenaSize, obstacles };

  function update(ticker: Ticker) {
    advancePlayer(
      player,
      keyboard.input,
      ticker.deltaMS / 1000,
      movementConfig,
      world,
    );
    ship.position.set(player.x, player.y);
    ship.rotation = player.heading + Math.PI;
  }

  app.ticker.add(update);
  app.start();

  return () => {
    app.stop();
    app.ticker.remove(update);
    keyboard.destroy();
  };
}
