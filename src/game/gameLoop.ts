import type { Application, Ticker } from 'pixi.js';
import { createKeyboardInput } from './input';
import { advancePlayer } from './collisions';
import { movementConfig } from './simulation';
import type { ArenaView } from './arena';
import { createWeaponState, fireFront, updateWeapon } from './weapon';
import { createProjectileRenderer } from './projectileRenderer';

export function startGameLoop(app: Application, arena: ArenaView): () => void {
  const { ship, obstacles } = arena;
  const keyboard = createKeyboardInput();
  const player = { x: ship.x, y: ship.y, heading: ship.rotation - Math.PI };
  const shipSize = { width: ship.width, height: ship.height };
  const arenaSize = { width: app.screen.width, height: app.screen.height };
  const world = { shipSize, arenaSize, obstacles };
  const weapon = createWeaponState();
  const projectiles = createProjectileRenderer(
    arena.container,
    arena.projectileTexture,
  );

  function update(ticker: Ticker) {
    const deltaSeconds = ticker.deltaMS / 1000;
    advancePlayer(player, keyboard.input, deltaSeconds, movementConfig, world);
    ship.position.set(player.x, player.y);
    ship.rotation = player.heading + Math.PI;
    if (keyboard.input.shootFront) fireFront(weapon, player);
    updateWeapon(weapon, deltaSeconds, arenaSize, obstacles);
    projectiles.sync(weapon.projectiles);
  }

  app.ticker.add(update);
  app.start();

  return () => {
    app.stop();
    app.ticker.remove(update);
    keyboard.destroy();
    projectiles.destroy();
  };
}
