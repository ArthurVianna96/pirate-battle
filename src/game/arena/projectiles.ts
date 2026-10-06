import { Container, Sprite, type Texture } from 'pixi.js';
import type { ProjectileState } from '../mechanics/weapon';

export function createProjectile(parent: Container, texture: Texture) {
  const layer = new Container();
  const sprites = new Map<number, Sprite>();
  parent.addChild(layer);

  function removeInactiveSprites(projectiles: readonly ProjectileState[]) {
    const activeIds = new Set(projectiles.map((projectile) => projectile.id));
    for (const [id, sprite] of sprites) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        sprites.delete(id);
      }
    }
  }

  function syncSprite(projectile: ProjectileState) {
    let sprite = sprites.get(projectile.id);
    if (!sprite) {
      sprite = new Sprite({ texture, anchor: 0.5 });
      layer.addChild(sprite);
      sprites.set(projectile.id, sprite);
    }
    sprite.position.set(projectile.x, projectile.y);
  }

  return {
    sync(projectiles: readonly ProjectileState[]) {
      removeInactiveSprites(projectiles);
      projectiles.forEach(syncSprite);
    },
    destroy() {
      sprites.clear();
      layer.destroy({ children: true });
    },
  };
}
