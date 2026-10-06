import type { Application, Sprite, Ticker } from 'pixi.js';
import { createKeyboardInput } from './input';
import { constrainPlayerToArena } from './collisions';
import { movementConfig, updatePlayer } from './simulation';

export function startMovement(app: Application, ship: Sprite): () => void {
  const keyboard = createKeyboardInput();
  const player = { x: ship.x, y: ship.y, heading: ship.rotation - Math.PI };
  const shipSize = { width: ship.width, height: ship.height };
  const arenaSize = { width: app.screen.width, height: app.screen.height };

  function update(ticker: Ticker) {
    updatePlayer(player, keyboard.input, ticker.deltaMS / 1000, movementConfig);
    constrainPlayerToArena(player, shipSize, arenaSize);
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
