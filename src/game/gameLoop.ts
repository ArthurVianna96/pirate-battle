import type { Application, Ticker } from 'pixi.js';
import type { ArenaView } from './arena';
import { advancePlayer } from './collisions';
import { createKeyboardInput } from './input';
import { createProjectileRenderer } from './projectileRenderer';
import { movementConfig } from './simulation';
import { createTarget } from './target';
import { createTargetRenderer } from './targetRenderer';
import { createWeaponState, fireFront, fireSide, updateWeapon } from './weapon';

export function startGameLoop(app: Application, arena: ArenaView): () => void {
  const { ship, obstacles } = arena;
  const keyboard = createKeyboardInput();
  const weapon = createWeaponState();
  const target = createTarget({
    x: app.screen.width * 0.75 - ship.width / 2,
    y: app.screen.height / 2 - ship.height / 2,
    width: ship.width,
    height: ship.height,
  });
  const targetRenderer = createTargetRenderer(
    arena.container,
    ship.texture,
    target,
  );
  const projectiles = createProjectileRenderer(
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
