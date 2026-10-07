import type { Application, Ticker } from 'pixi.js';
import { createGameFeedback } from './feedback/index';
import { EXPLOSION_CONFIG } from './arena/explosions';
import type { ArenaView } from './arena/types';
import type { GameOptions } from './support/options';
import { createPauseControls } from './support/pause';
import { resolveChaserImpact, updateChaser } from './mechanics/chaser';
import {
  createEnemyProjectilesState,
  updateEnemyProjectiles,
} from './mechanics/enemyProjectiles';
import { createGameInput, type GameInput } from './mechanics/input';
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
  const controls = createGameInput(onInputChange);
  const enemyProjectilesState = createEnemyProjectilesState();
  const spawner = createSpawnerState();
  const match = createMatchState(options.sessionDuration);
  const feedback = createGameFeedback(arena);
  const pauseControls = createPauseControls({
    match,
    stop: () => app.stop(),
    start: () => app.start(),
    setInputEnabled: controls.setEnabled,
    onPauseChange(value) {
      feedback.setPaused(value);
      onPauseChange(value);
    },
  });

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
    if (match.paused) {
      return;
    }
    const frameSeconds = ticker.deltaMS / 1000;
    feedback.updateEffects(frameSeconds);
    if (match.endReason) {
      updateEndingAnimation(frameSeconds);
      return;
    }

    const deltaSeconds = advanceMatchClock(match, frameSeconds);

    updateSpawns(deltaSeconds);
    updateMovement(deltaSeconds);
    updateAttacks(deltaSeconds);
    updateEnemyAttacks(deltaSeconds);
    updateContacts();
    removeDestroyedEnemies();
    feedback.syncViews(
      player,
      player.weapon.projectiles,
      enemyProjectilesState.projectiles,
      deltaSeconds,
    );
    updateMatchStatus();
  }

  function updateMatchStatus() {
    publishRemainingTime();
    const endReason = finishMatchIfNeeded(match, player.health);
    if (endReason) {
      endMatch(endReason);
    }
  }

  function publishRemainingTime() {
    const remainingSeconds = Math.ceil(match.remainingSeconds);
    if (remainingSeconds === displayedSeconds) {
      return;
    }
    displayedSeconds = remainingSeconds;
    feedback.time(remainingSeconds);
    onTimeChange(remainingSeconds);
  }

  function endMatch(endReason: MatchResult['endReason']) {
    feedback.finish();
    controls.destroy();
    const result = createMatchResult(match, score);
    if (endReason === 'time') {
      onMatchEnd(result);
      return;
    }
    feedback.playerDestroyed(player);
    pendingResult = result;
    endingAnimationRemaining = EXPLOSION_CONFIG.duration;
  }

  function updateEndingAnimation(deltaSeconds: number) {
    endingAnimationRemaining -= deltaSeconds;
    if (!pendingResult || endingAnimationRemaining > 0) {
      return;
    }
    const result = pendingResult;
    pendingResult = undefined;
    onMatchEnd(result);
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
    feedback.movement(controls.input.forward);
    updatePlayer(player, controls.input, deltaSeconds, MOVEMENT_CONFIG, world);
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
      feedback.impact,
    );
    updateScore(destroyedEnemies);
  }

  function updateEnemyAttacks(deltaSeconds: number) {
    const previousHealth = player.health;
    for (const enemy of arena.enemies) {
      if (enemy.kind !== 'shooter') {
        continue;
      }
      const shot = updateShooterAttack(
        enemy.state,
        player,
        deltaSeconds,
        enemyProjectilesState,
      );
      if (shot) {
        feedback.enemyShot(shot);
      }
    }
    updateEnemyProjectiles(
      enemyProjectilesState,
      deltaSeconds,
      player,
      world,
      feedback.impact,
    );
    if (player.health !== previousHealth) {
      reportPlayerDamage(previousHealth);
    }
  }

  function fireWeapons() {
    fireFrontWeapon();
    fireSideWeapons();
  }

  function fireFrontWeapon() {
    if (!controls.input.shootFront) {
      return;
    }
    const shot = fireFront(player.weapon, player);
    if (shot) {
      feedback.frontShot(shot);
    }
  }

  function fireSideWeapons() {
    const leftShots = controls.input.shootLeft
      ? (fireSide(player.weapon, player, 'left') ?? [])
      : [];
    const rightShots = controls.input.shootRight
      ? (fireSide(player.weapon, player, 'right') ?? [])
      : [];
    feedback.sideShots([...leftShots, ...rightShots]);
  }

  function updateScore(destroyedEnemies: number) {
    if (destroyedEnemies > 0) {
      score += destroyedEnemies;
      onScoreChange(score);
      feedback.score();
    }
  }

  function updateContacts() {
    const previousHealth = player.health;
    for (const { kind, state } of arena.enemies) {
      if (kind === 'chaser') {
        resolveChaserImpact(state, player, shipSize);
      }
    }
    if (player.health !== previousHealth) {
      feedback.collision(player);
      reportPlayerDamage(previousHealth);
    }
  }

  function reportPlayerDamage(previousHealth: number) {
    onHealthChange(player.health);
    feedback.playerDamaged(previousHealth, player.health);
  }

  function removeDestroyedEnemies() {
    arena.enemies = arena.enemies.filter(({ state, renderer }) => {
      if (state.health > 0) {
        return true;
      }
      feedback.enemyDestroyed(state.position);
      renderer.destroy();
      return false;
    });
  }

  app.ticker.add(update);
  app.start();
  if (document.hidden) {
    pauseControls.pause();
  }

  function destroy() {
    feedback.destroy();
    pauseControls.destroy();
    app.stop();
    app.ticker.remove(update);
    controls.destroy();
  }

  return {
    pause: pauseControls.pause,
    resume: pauseControls.resume,
    setControl: controls.setAction,
    destroy,
  };
}
