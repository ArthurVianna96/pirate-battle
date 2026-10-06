import { expect, test } from '@playwright/test';
import {
  createChaserState,
  resolveChaserImpact,
  updateChaser,
} from '../src/game/mechanics/chaser';
import { createPlayerState } from '../src/game/mechanics/player';
import {
  createWeaponState,
  fireFront,
  updateWeapon,
} from '../src/game/mechanics/weapon';

const shipSize = { width: 66, height: 113 };

test('contact deals damage once and removes the Chaser from combat', () => {
  const player = createPlayerState({ x: 480, y: 270, heading: 0 });
  const chaser = createChaserState({ x: 500, y: 213.5, ...shipSize });
  expect(resolveChaserImpact(chaser, player, shipSize)).toBe(true);
  expect(player.health).toBe(4);
  expect(chaser.health).toBe(0);
  expect(resolveChaserImpact(chaser, player, shipSize)).toBe(false);
  expect(player.health).toBe(4);

  const position = { ...chaser.position };
  updateChaser(chaser, player, 1, {
    arenaSize: { width: 960, height: 540 },
    obstacles: [],
  });
  expect(chaser.position).toEqual(position);
  const weapon = createWeaponState();
  fireFront(weapon, { x: 480, y: 270, heading: Math.PI / 2 });
  expect(
    updateWeapon(weapon, 0.1, { width: 960, height: 540 }, [], [chaser]),
  ).toBe(0);
});

test('separated ships and destroyed enemies cannot cause contact damage', () => {
  const player = createPlayerState({ x: 480, y: 270, heading: 0 });
  const chaser = createChaserState({ x: 687, y: 213.5, ...shipSize });
  expect(resolveChaserImpact(chaser, player, shipSize)).toBe(false);
  expect(player.health).toBe(5);
  chaser.bounds.x = 480;
  chaser.health = 0;
  expect(resolveChaserImpact(chaser, player, shipSize)).toBe(false);
  expect(player.health).toBe(5);
});

test('contact damage cannot reduce health below zero', () => {
  const player = createPlayerState({ x: 480, y: 270, heading: Math.PI / 4 });
  player.health = 1;
  const chaser = createChaserState({ x: 480, y: 213.5, ...shipSize });
  expect(
    resolveChaserImpact(chaser, player, shipSize, {
      speed: 60,
      rotationSpeed: Math.PI / 2,
      impactDamage: 2,
    }),
  ).toBe(true);
  expect(player.health).toBe(0);
});

test('the pursuing Chaser damages the player without awarding points', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await expect(page.getByText('Health: 5/5', { exact: true })).toBeVisible();
  await page.clock.runFor(2700);
  await expect(page.getByText('Health: 4/5', { exact: true })).toBeVisible();
  await expect(page.getByText('Score: 0', { exact: true })).toBeVisible();
  await page.keyboard.down('e');
  await page.clock.runFor(500);
  await page.keyboard.up('e');
  await expect(page.getByText('Health: 4/5', { exact: true })).toBeVisible();
  await expect(page.getByText('Score: 0', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByText('Health: 5/5', { exact: true })).toBeVisible();
});
