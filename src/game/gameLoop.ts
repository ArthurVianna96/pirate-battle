import type { Application, Ticker } from 'pixi.js';
import { createExplosion, EXPLOSION_CONFIG } from './arena/explosions';
import { createCombatEffects } from './arena/combatEffects';
import { createShipAppearance } from './arena/shipAppearance';
import { createHealthBar } from './arena/healthBar';
import { createProjectile } from './arena/projectiles';
import type { ArenaView } from './arena/types';
import type { GameOptions } from './options';
import { createPauseControls } from './pause';
import { resolveChaserImpact, updateChaser } from './mechanics/chaser';
import {
  createEnemyProjectilesState,
  updateEnemyProjectiles,
} from './mechanics/enemyProjectiles';
import { createKeyboardInput, type GameInput } from './mechanics/input';
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
  createMatchResult,
  finishMatchIfNeeded,
  type MatchResult,
} from './mechanics/match';

export interface GameLoopCallbacks {
  onInputChange: (input: GameInput) => void;
  onScoreChange: (score: number) => void;
  onHealthChange: (health: number) => void;
  onTimeChange: (remainingSeconds: number) => void;
  onMatchEnd: (result: MatchResult) => void;
  onPauseChange: (paused: boolean) => void;
}

export interface GameLoopController {
  setControl: (action: keyof GameInput, active: boolean) => void;
  pause: () => void;
  resume: () => void;
  destroy: () => void;
}

export function startGameLoop(
  app: Application,
  arena: ArenaView,
  options: GameOptions,
  {
    onScoreChange,
    onHealthChange,
    onTimeChange,
    onMatchEnd,
    onPauseChange,
    onInputChange,
  }: GameLoopCallbacks,
): GameLoopController {
  const { ship, obstacles } = arena;
  const keyboard = createKeyboardInput(onInputChange);
  const enemyProjectilesState = createEnemyProjectilesState();
  const spawner = createSpawnerState();
  const match = createMatchState(options.sessionDuration);
  const pauseControls = createPauseControls({
    match,
    stop: () => app.stop(),
    start: () => app.start(),
    setInputEnabled: keyboard.setEnabled,
    onPauseChange,
  });
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
  const effects = createCombatEffects(
    arena.container,
    arena.explosionTextures[0],
  );
  const playerAppearance = createShipAppearance(
    arena.container,
    ship,
    arena.playerShipTextures,
    arena.fireTextures,
  );

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
  let pendingResult: MatchResult | undefined;
  let endingAnimationRemaining = 0;

  function update(ticker: Ticker) {
    if (match.paused) return;
    explosions.update(ticker.deltaMS / 1000);
    effects.update(ticker.deltaMS / 1000);
    if (match.endReason) {
      endingAnimationRemaining -= ticker.deltaMS / 1000;
      if (pendingResult && endingAnimationRemaining <= 0) {
        const result = pendingResult;
        pendingResult = undefined;
        onMatchEnd(result);
      }
      return;
    }

    const deltaSeconds = advanceMatchClock(match, ticker.deltaMS / 1000);

    updateSpawns(deltaSeconds);
    updateMovement(deltaSeconds);
    updateAttacks(deltaSeconds);
    updateEnemyAttacks(deltaSeconds);
    updateContacts();
    removeDestroyedEnemies();
    syncViews(deltaSeconds);
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
      const result = createMatchResult(match, score);
      if (endReason === 'death') {
        ship.visible = false;
        playerHealth.bar.visible = false;
        explosions.play(player);
        pendingResult = result;
        endingAnimationRemaining = EXPLOSION_CONFIG.duration;
      } else onMatchEnd(result);
    }
  }

  function updateSpawns(deltaSeconds: number) {
    const spawnCount = updateSpawner(
      spawner,
      deltaSeconds,
      options.enemySpawnInterval,
    );
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
      effects.impact,
    );
    updateScore(destroyedEnemies);
  }

  function updateEnemyAttacks(deltaSeconds: number) {
    const previousHealth = player.health;
    for (const enemy of arena.enemies) {
      if (enemy.kind === 'shooter') {
        const shotCount = enemyProjectilesState.projectiles.length;
        updateShooterAttack(
          enemy.state,
          player,
          deltaSeconds,
          enemyProjectilesState,
        );
        enemyProjectilesState.projectiles
          .slice(shotCount)
          .forEach(effects.shot);
      }
    }
    updateEnemyProjectiles(
      enemyProjectilesState,
      deltaSeconds,
      player,
      world,
      effects.impact,
    );
    if (player.health !== previousHealth) onHealthChange(player.health);
  }

  function fireWeapons() {
    const shotCount = player.weapon.projectiles.length;
    if (keyboard.input.shootFront) {
      fireFront(player.weapon, player);
    }
    if (keyboard.input.shootLeft) {
      fireSide(player.weapon, player, 'left');
    }
    if (keyboard.input.shootRight) {
      fireSide(player.weapon, player, 'right');
    }
    player.weapon.projectiles.slice(shotCount).forEach(effects.shot);
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
    if (player.health !== previousHealth) {
      effects.impact(player);
      onHealthChange(player.health);
    }
  }

  function removeDestroyedEnemies() {
    arena.enemies = arena.enemies.filter(({ state, renderer }) => {
      if (state.health > 0) return true;
      explosions.play(state.position);
      renderer.destroy();
      return false;
    });
  }

  function syncViews(deltaSeconds: number) {
    syncPlayer();
    playerAppearance.update(player.health, player.maxHealth, deltaSeconds);
    for (const { renderer } of arena.enemies) renderer.sync(deltaSeconds);
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
  if (document.hidden) pauseControls.pause();

  function destroy() {
    pauseControls.destroy();
    app.stop();
    app.ticker.remove(update);
    keyboard.destroy();
    playerProjectiles.destroy();
    enemyProjectiles.destroy();
    arena.enemies.forEach(({ renderer }) => renderer.destroy());
    playerHealth.bar.destroy({ children: true });
    explosions.destroy();
    effects.destroy();
    playerAppearance.destroy();
  }

  return {
    pause: pauseControls.pause,
    resume: pauseControls.resume,
    setControl: keyboard.setAction,
    destroy,
  };
}
