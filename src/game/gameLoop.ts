import type { Application, Ticker } from 'pixi.js';
import type { ArenaView } from './arena/types';
import { createKeyboardInput } from './mechanics/input';
import { createProjectile } from './arena/projectiles';
import { movementConfig, updatePlayer } from './mechanics/simulation';
import { updateChaser, resolveChaserImpact } from './mechanics/chaser';
import { createPlayerState } from './mechanics/combat';
import { createHealthBar } from './arena/healthBar';
import {
  createWeaponState,
  fireFront,
  fireSide,
  updateWeapon,
} from './mechanics/weapon';

export function startGameLoop(
  app: Application,
  arena: ArenaView,
  onScoreChange: (score: number) => void,
  onHealthChange: (health: number) => void,
): () => void {
  const { ship, obstacles, chaser, chaserRenderer } = arena;
  const keyboard = createKeyboardInput();
  const weapon = createWeaponState();
  const projectiles = createProjectile(
    arena.container,
    arena.projectileTexture,
  );
  const playerHealth = createHealthBar(arena.container, ship.height);

  const player = createPlayerState({
    x: ship.x,
    y: ship.y,
    heading: ship.rotation - Math.PI,
  });
  const shipSize = { width: ship.width, height: ship.height };
  const arenaSize = { width: app.screen.width, height: app.screen.height };
  const world = { shipSize, arenaSize, obstacles };
  const enemies = [chaser];
  let score = 0;

  function fireWeapons() {
    if (keyboard.input.shootFront) {
      fireFront(weapon, player);
    }
    if (keyboard.input.shootLeft) {
      fireSide(weapon, player, 'left');
    }
    if (keyboard.input.shootRight) {
      fireSide(weapon, player, 'right');
    }
  }

  function updateAttacks(deltaSeconds: number) {
    fireWeapons();
    const destroyedEnemies = updateWeapon(
      weapon,
      deltaSeconds,
      arenaSize,
      obstacles,
      enemies,
    );
    updateScore(destroyedEnemies);
  }

  function updateScore(destroyedEnemies: number) {
    if (destroyedEnemies > 0) {
      score += destroyedEnemies;
      onScoreChange(score);
    }
  }

  function syncPlayer() {
    ship.position.set(player.x, player.y);
    ship.rotation = player.heading + Math.PI;
    const halfHeight =
      (Math.abs(Math.cos(player.heading)) * shipSize.height +
        Math.abs(Math.sin(player.heading)) * shipSize.width) /
      2;
    playerHealth.bar.position.set(
      player.x - 24,
      Math.max(4, player.y - halfHeight - 12),
    );
    playerHealth.health.scale.x = player.health / player.maxHealth;
  }

  function syncViews() {
    syncPlayer();
    chaserRenderer.sync();
    projectiles.sync(weapon.projectiles);
  }

  function updateContacts() {
    if (resolveChaserImpact(chaser, player, shipSize)) {
      onHealthChange(player.health);
    }
  }

  function update(ticker: Ticker) {
    const deltaSeconds = ticker.deltaMS / 1000;
    updatePlayer(player, keyboard.input, deltaSeconds, movementConfig, world);
    updateChaser(chaser, player, deltaSeconds, world);
    updateAttacks(deltaSeconds);
    updateContacts();
    syncViews();
  }

  app.ticker.add(update);
  app.start();

  return () => {
    app.stop();
    app.ticker.remove(update);
    keyboard.destroy();
    projectiles.destroy();
    chaserRenderer.destroy();
    playerHealth.bar.destroy({ children: true });
  };
}
