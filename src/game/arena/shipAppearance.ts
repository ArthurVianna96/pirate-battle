import type { ShipTextures } from './types';
import { Container, Sprite, type Texture } from 'pixi.js';

export const SHIP_APPEARANCE_CONFIG = {
  damagedThreshold: 2 / 3,
  criticalThreshold: 1 / 3,
  flashDuration: 0.18,
  fireFrameDuration: 0.12,
} as const;

export function createShipAppearance(
  parent: Container,
  ship: Sprite,
  textures: ShipTextures,
  fireTextures: readonly Texture[],
) {
  const originalTint = ship.tint;
  const size = { width: ship.width, height: ship.height };
  const fire = new Sprite({
    texture: fireTextures[0],
    anchor: { x: 0.5, y: 1 },
    label: 'ship-fire',
    visible: false,
  });
  parent.addChild(fire);
  let previousHealth = 1;
  let flashRemaining = 0;
  let fireElapsed = 0;

  function updateDamageFlash(fraction: number, deltaSeconds: number) {
    flashRemaining = Math.max(0, flashRemaining - deltaSeconds);
    if (fraction < previousHealth) {
      flashRemaining = SHIP_APPEARANCE_CONFIG.flashDuration;
    }
    previousHealth = fraction;
    ship.tint = flashRemaining > 0 ? 0xff6655 : originalTint;
  }

  function updateShipTexture(fraction: number) {
    if (fraction <= SHIP_APPEARANCE_CONFIG.criticalThreshold) {
      ship.texture = textures.critical;
    } else if (fraction <= SHIP_APPEARANCE_CONFIG.damagedThreshold) {
      ship.texture = textures.damaged;
    } else {
      ship.texture = textures.healthy;
    }
    ship.width = size.width;
    ship.height = size.height;
  }

  function updateFire(fraction: number, deltaSeconds: number) {
    fire.visible =
      fraction > 0 && fraction <= SHIP_APPEARANCE_CONFIG.criticalThreshold;
    fireElapsed += deltaSeconds;
    const frame =
      Math.floor(fireElapsed / SHIP_APPEARANCE_CONFIG.fireFrameDuration) %
      fireTextures.length;
    fire.texture = fireTextures[frame];
    fire.position.copyFrom(ship.position);
    fire.rotation = 0;
  }

  return {
    update(health: number, maxHealth: number, deltaSeconds: number) {
      const fraction = health / maxHealth;
      updateDamageFlash(fraction, deltaSeconds);
      updateShipTexture(fraction);
      updateFire(fraction, deltaSeconds);
    },
    destroy() {
      fire.destroy();
    },
  };
}
