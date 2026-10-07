import type { Application, Ticker } from 'pixi.js';
import { createExplosion } from './arena/explosions';
import { createHealthBar } from './arena/healthBar';
import { createProjectile } from './arena/projectiles';
import type { ArenaView } from './arena/types';
import { resolveChaserImpact, updateChaser } from './mechanics/chaser';
import {
  createEnemyProjectilesState,
  updateEnemyProjectiles,
} from './mechanics/enemyProjectiles';
import { createKeyboardInput } from './mechanics/input';
import { createPlayerState } from './mechanics/player';
import { updateShooter, updateShooterAttack } from './mechanics/shooter';
import { MOVEMENT_CONFIG, updatePlayer } from './mechanics/simulation';
import {
  createSpawnerState,
  findEnemySpawn,
  takeNextEnemyKind,
  updateSpawner,
} from './mechanics/spawning';
import { fireFront, fireSide, updateWeapon } from './mechanics/weapon';
import {
  advanceMatchClock,
  createMatchState,
  finishMatchIfNeeded,
  type MatchEndReason,
} from './mechanics/match';

export interface GameLoopCallbacks {
  onScoreChange: (score: number) => void;
  onHealthChange: (health: number) => void;
  onTimeChange: (remainingSeconds: number) => void;
  onMatchEnd: (reason: MatchEndReason) => void;
}

export function startGameLoop(
  app: Application,
  arena: ArenaView,
  {
    onScoreChange,
    onHealthChange,
    onTimeChange,
    onMatchEnd,
  }: GameLoopCallbacks,
): () => void {
  const { ship, obstacles } = arena;
  const keyboard = createKeyboardInput();
  const enemyProjectilesState = createEnemyProjectilesState();
  const spawner = createSpawnerState();
  const match = createMatchState();
  const playerProjectiles = createProjectile(
    arena.container,
    arena.projectileTexture,
  );
  const enemyProjectiles = createProjectile(
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
  let displayedSeconds = match.duration;

  function update(ticker: Ticker) {
    explosions.update(ticker.deltaMS / 1000);
    if (match.endReason) {
      return;
    }

    const deltaSeconds = advanceMatchClock(match, ticker.deltaMS / 1000);

    updateSpawns(deltaSeconds);
    updateMovement(deltaSeconds);
    updateAttacks(deltaSeconds);
    updateEnemyAttacks(deltaSeconds);
    updateContacts();
    removeDestroyedEnemies();
    syncViews();
    updateMatchStatus();
  }

  function updateMatchStatus() {
    const remainingSeconds = Math.ceil(match.remainingSeconds);
    if (remainingSeconds !== displayedSeconds) {
      displayedSeconds = remainingSeconds;
      onTimeChange(remainingSeconds);
    }
    const endReason = finishMatchIfNeeded(match, player.health);
    if (endReason) {
      keyboard.destroy();
      onMatchEnd(endReason);
    }
  }

  function updateSpawns(deltaSeconds: number) {
    const spawnCount = updateSpawner(spawner, deltaSeconds);
    for (let attempt = 0; attempt < spawnCount; attempt++) {
      const position = findEnemySpawn(
        player,
        world,
        arena.enemies.map(({ state }) => state),
      );
      if (position) {
        arena.spawnEnemy(takeNextEnemyKind(spawner), position);
      }
    }
  }

  function updateMovement(deltaSeconds: number) {
    updatePlayer(player, keyboard.input, deltaSeconds, MOVEMENT_CONFIG, world);
    for (const { kind, state } of arena.enemies) {
      if (kind === 'chaser') {
        updateChaser(state, player, deltaSeconds, world);
      } else {
        updateShooter(state, player, deltaSeconds, world);
      }
    }
  }

  function updateAttacks(deltaSeconds: number) {
    fireWeapons();
    const destroyedEnemies = updateWeapon(
      player.weapon,
      deltaSeconds,
      arenaSize,
      obstacles,
      arena.enemies.map(({ state }) => state),
    );
    updateScore(destroyedEnemies);
  }

  function updateEnemyAttacks(deltaSeconds: number) {
    const previousHealth = player.health;
    for (const enemy of arena.enemies) {
      if (enemy.kind === 'shooter') {
        updateShooterAttack(
          enemy.state,
          player,
          deltaSeconds,
          enemyProjectilesState,
        );
      }
    }
    updateEnemyProjectiles(enemyProjectilesState, deltaSeconds, player, world);
    if (player.health !== previousHealth) onHealthChange(player.health);
  }

  function fireWeapons() {
    if (keyboard.input.shootFront) {
      fireFront(player.weapon, player);
    }
    if (keyboard.input.shootLeft) {
      fireSide(player.weapon, player, 'left');
    }
    if (keyboard.input.shootRight) {
      fireSide(player.weapon, player, 'right');
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
    for (const { kind, state } of arena.enemies) {
      if (kind === 'chaser') resolveChaserImpact(state, player, shipSize);
    }
    if (player.health !== previousHealth) onHealthChange(player.health);
  }

  function removeDestroyedEnemies() {
    arena.enemies = arena.enemies.filter(({ state, renderer }) => {
      if (state.health > 0) return true;
      explosions.play(state.position);
      renderer.destroy();
      return false;
    });
  }

  function syncViews() {
    syncPlayer();
    for (const { renderer } of arena.enemies) renderer.sync();
    playerProjectiles.sync(player.weapon.projectiles);
    enemyProjectiles.sync(enemyProjectilesState.projectiles);
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
    playerProjectiles.destroy();
    enemyProjectiles.destroy();
    arena.enemies.forEach(({ renderer }) => renderer.destroy());
    playerHealth.bar.destroy({ children: true });
    explosions.destroy();
  };
}
