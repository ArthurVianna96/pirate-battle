import { expect, test } from '@playwright/test';
import {
  createShooterState,
  shooterConfig,
  updateShooter,
} from '../src/game/mechanics/shooter';
import { damageEnemy } from '../src/game/mechanics/combat';
import { overlapsObstacle } from '../src/game/mechanics/collisions';

const world = { arenaSize: { width: 960, height: 540 }, obstacles: [] };
const player = { x: 480, y: 270 };

function createShooter() {
  const shooter = createShooterState({
    x: 807,
    y: 213.5,
    width: 66,
    height: 113,
  });
  shooter.position.heading = -Math.PI / 2;
  return shooter;
}

test('the Shooter approaches and stops at attack range', () => {
  const shooter = createShooter();
  updateShooter(shooter, player, 1, world);
  expect(shooter.position.x).toBeCloseTo(840 - shooterConfig.speed);
  updateShooter(shooter, player, 5, world);
  expect(shooter.position.x - player.x).toBeCloseTo(shooterConfig.attackRange);
  const stopped = { ...shooter.position };
  updateShooter(shooter, player, 2, world);
  expect(shooter.position.x).toBeCloseTo(stopped.x);
  expect(shooter.position.y).toBeCloseTo(stopped.y);
});

test('the Shooter turns toward the player while within range', () => {
  const shooter = createShooter();
  const nearbyPlayer = { x: 800, y: 170 };
  const previous = { ...shooter.position };
  updateShooter(shooter, nearbyPlayer, 1, world);
  expect(shooter.position.x).toBe(previous.x);
  expect(shooter.position.y).toBe(previous.y);
  expect(shooter.position.heading).toBeCloseTo(Math.atan2(-40, 100));
});

test('the Shooter resumes approaching when the player leaves its range', () => {
  const shooter = createShooter();
  updateShooter(shooter, player, 5, world);
  const stoppedX = shooter.position.x;
  updateShooter(shooter, { x: 380, y: 270 }, 1, world);
  expect(shooter.position.x).toBeCloseTo(stoppedX - shooterConfig.speed);
});

test('Shooter pursuit agrees at 30 and 60 FPS', () => {
  function pursue(fps: number) {
    const shooter = createShooter();
    for (let frame = 0; frame < fps * 5; frame++) {
      updateShooter(shooter, { x: 480, y: 100 }, 1 / fps, world);
    }
    return shooter.position;
  }
  const slow = pursue(30);
  const fast = pursue(60);
  expect(slow.x).toBeCloseTo(fast.x);
  expect(slow.y).toBeCloseTo(fast.y);
  expect(slow.heading).toBeCloseTo(fast.heading);
});

test('an island blocks the Shooter during a long update', () => {
  const shooter = createShooter();
  const island = { x: 600, y: 174, width: 192, height: 192 };
  updateShooter(shooter, { x: 100, y: 270 }, 10, {
    ...world,
    obstacles: [island],
  });
  expect(overlapsObstacle(shooter.position, shooter.shipSize, island)).toBe(
    false,
  );
  expect(shooter.bounds.x).toBeCloseTo(island.x + island.width);
});

test('destroyed Shooters neither advance nor turn', () => {
  const shooter = createShooter();
  damageEnemy(shooter, shooter.maxHealth);
  const previous = { ...shooter.position };
  updateShooter(shooter, { x: 100, y: 100 }, 5, world);
  expect(shooter.position).toEqual(previous);
});
