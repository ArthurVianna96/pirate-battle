import type { Application, Ticker } from 'pixi.js';
import { createExplosion } from './arena/explosions';
import { createHealthBar } from './arena/healthBar';
import { createProjectile } from './arena/projectiles';
import type { ArenaView } from './arena/types';
import { resolveChaserImpact, updateChaser } from './mechanics/chaser';
import { createPlayerState } from './mechanics/combat';
import { createKeyboardInput } from './mechanics/input';
import { movementConfig, updatePlayer } from './mechanics/simulation';
import {
  createSpawnerState,
  findChaserSpawn,
  updateSpawner,
} from './mechanics/spawning';
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
  const { ship, obstacles } = arena;
  const keyboard = createKeyboardInput();
  const weapon = createWeaponState();
  const spawner = createSpawnerState();
  const projectiles = createProjectile(
    arena.container,
    arena.projectileTexture,
  );
  const playerHealth = createHealthBar(arena.container, ship.height);
  const explosions = createExplosion(arena.container, arena.explosionTextures);

  const player = createPlayerState({
    x: ship.x,
    y: ship.y,
    heading: ship.rotation - Math.PI,
  });
  const shipSize = { width: ship.width, height: ship.height };
  const arenaSize = { width: app.screen.width, height: app.screen.height };
  const world = { shipSize, arenaSize, obstacles };
  let score = 0;

  function update(ticker: Ticker) {
    const deltaSeconds = ticker.deltaMS / 1000;
    explosions.update(deltaSeconds);
    if (player.health === 0) {
      return;
    }

    updateSpawns(deltaSeconds);
    updateMovement(deltaSeconds);
    updateAttacks(deltaSeconds);
    updateContacts();
    removeDestroyedChasers();
    syncViews();
  }

  function updateSpawns(deltaSeconds: number) {
    const spawnCount = updateSpawner(spawner, deltaSeconds);
    for (let attempt = 0; attempt < spawnCount; attempt++) {
      const position = findChaserSpawn(
        player,
        world,
        arena.chasers.map(({ chaser }) => chaser),
      );
      if (position) {
        arena.spawnChaser(position);
      }
    }
  }

  function updateMovement(deltaSeconds: number) {
    updatePlayer(player, keyboard.input, deltaSeconds, movementConfig, world);
    for (const { chaser } of arena.chasers) {
      updateChaser(chaser, player, deltaSeconds, world);
    }
  }

  function updateAttacks(deltaSeconds: number) {
    fireWeapons();
    const destroyedEnemies = updateWeapon(
      weapon,
      deltaSeconds,
      arenaSize,
      obstacles,
      arena.chasers.map(({ chaser }) => chaser),
    );
    updateScore(destroyedEnemies);
  }

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

  function updateScore(destroyedEnemies: number) {
    if (destroyedEnemies > 0) {
      score += destroyedEnemies;
      onScoreChange(score);
    }
  }

  function updateContacts() {
    const previousHealth = player.health;
    for (const { chaser } of arena.chasers) {
      resolveChaserImpact(chaser, player, shipSize);
    }
    if (player.health !== previousHealth) onHealthChange(player.health);
  }

  function removeDestroyedChasers() {
    arena.chasers = arena.chasers.filter(({ chaser, renderer }) => {
      if (chaser.health > 0) return true;
      explosions.play(chaser.position);
      renderer.destroy();
      return false;
    });
  }

  function syncViews() {
    syncPlayer();
    for (const { renderer } of arena.chasers) renderer.sync();
    projectiles.sync(weapon.projectiles);
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

  app.ticker.add(update);
  app.start();

  return () => {
    app.stop();
    app.ticker.remove(update);
    keyboard.destroy();
    projectiles.destroy();
    arena.chasers.forEach(({ renderer }) => renderer.destroy());
    playerHealth.bar.destroy({ children: true });
    explosions.destroy();
  };
}
