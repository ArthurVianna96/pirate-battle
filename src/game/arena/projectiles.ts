import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { ProjectileState } from '../mechanics/weapon';

export const PROJECTILE_TRAIL_CONFIG = {
  maxLength: 160,
  width: 3,
  segments: 12,
  opacity: 0.65,
} as const;

function createTrail() {
  const trail = new Graphics();
  const { maxLength, width, segments, opacity } = PROJECTILE_TRAIL_CONFIG;
  const segmentLength = maxLength / segments;
  for (let index = 0; index < segments; index++) {
    trail
      .rect(
        -maxLength + index * segmentLength,
        -width / 2,
        segmentLength,
        width,
      )
      .fill({ color: 0xffffff, alpha: (opacity * (index + 1)) / segments });
  }
  return trail;
}

export function createProjectile(parent: Container, texture: Texture) {
  const layer = new Container();
  const trails = new Container();
  layer.addChild(trails);
  const sprites = new Map<
    number,
    { sprite: Sprite; trail: Graphics; origin: { x: number; y: number } }
  >();
  parent.addChild(layer);

  function removeInactiveSprites(projectiles: readonly ProjectileState[]) {
    const activeIds = new Set(projectiles.map((projectile) => projectile.id));
    for (const [id, { sprite, trail }] of sprites) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        trail.destroy();
        sprites.delete(id);
      }
    }
  }

  function syncSprite(projectile: ProjectileState, deltaSeconds: number) {
    let view = sprites.get(projectile.id);
    if (!view) {
      const sprite = new Sprite({ texture, anchor: 0.5 });
      const trail = createTrail();
      const origin = {
        x: projectile.x - projectile.velocityX * deltaSeconds,
        y: projectile.y - projectile.velocityY * deltaSeconds,
      };
      view = { sprite, trail, origin };
      trails.addChild(trail);
      layer.addChild(sprite);
      sprites.set(projectile.id, view);
    }
    view.sprite.position.set(projectile.x, projectile.y);
    view.trail.position.copyFrom(view.sprite.position);
    view.trail.rotation = Math.atan2(
      projectile.velocityY,
      projectile.velocityX,
    );
    const distance = Math.hypot(
      projectile.x - view.origin.x,
      projectile.y - view.origin.y,
    );
    view.trail.scale.x = Math.min(
      1,
      distance / PROJECTILE_TRAIL_CONFIG.maxLength,
    );
  }

  return {
    sync(projectiles: readonly ProjectileState[], deltaSeconds = 0) {
      removeInactiveSprites(projectiles);
      projectiles.forEach((projectile) => syncSprite(projectile, deltaSeconds));
    },
    destroy() {
      sprites.clear();
      layer.destroy({ children: true });
    },
  };
}
