import type { Application, Ticker } from 'pixi.js';
import type { ArenaView } from './arena/types';
import { advancePlayer } from './mechanics/collisions';
import { createKeyboardInput } from './mechanics/input';
import { createProjectile } from './arena/projectiles';
import { movementConfig } from './mechanics/simulation';
import {
  createWeaponState,
  fireFront,
  fireSide,
  updateWeapon,
} from './mechanics/weapon';

export function startGameLoop(app: Application, arena: ArenaView): () => void {
  const { ship, obstacles, target, targetRenderer } = arena;
  const keyboard = createKeyboardInput();
  const weapon = createWeaponState();
  const projectiles = createProjectile(
    arena.container,
    arena.projectileTexture,
  );

  const player = { x: ship.x, y: ship.y, heading: ship.rotation - Math.PI };
  const shipSize = { width: ship.width, height: ship.height };
  const arenaSize = { width: app.screen.width, height: app.screen.height };
  const world = { shipSize, arenaSize, obstacles };
  const targets = [target];

  function updateAttacks(deltaSeconds: number) {
    if (keyboard.input.shootFront) {
      fireFront(weapon, player);
    }
    if (keyboard.input.shootLeft) {
      fireSide(weapon, player, 'left');
    }
    if (keyboard.input.shootRight) {
      fireSide(weapon, player, 'right');
    }
    updateWeapon(weapon, deltaSeconds, arenaSize, obstacles, targets);
  }

  function syncViews() {
    ship.position.set(player.x, player.y);
    ship.rotation = player.heading + Math.PI;
    targetRenderer.sync();
    projectiles.sync(weapon.projectiles);
  }

  function update(ticker: Ticker) {
    const deltaSeconds = ticker.deltaMS / 1000;
    advancePlayer(player, keyboard.input, deltaSeconds, movementConfig, world);
    updateAttacks(deltaSeconds);
    syncViews();
  }

  app.ticker.add(update);
  app.start();

  return () => {
    app.stop();
    app.ticker.remove(update);
    keyboard.destroy();
    projectiles.destroy();
    targetRenderer.destroy();
  };
}
