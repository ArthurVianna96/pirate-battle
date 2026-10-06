import { Container, Sprite, type Texture } from 'pixi.js';
import type { ProjectileState } from './weapon';

export function createProjectileRenderer(parent: Container, texture: Texture) {
  const layer = new Container();
  const sprites = new Map<number, Sprite>();
  parent.addChild(layer);

  return {
    sync(projectiles: readonly ProjectileState[]) {
      const activeIds = new Set(projectiles.map((projectile) => projectile.id));
      for (const [id, sprite] of sprites) {
        if (!activeIds.has(id)) {
          sprite.destroy();
          sprites.delete(id);
        }
      }
      for (const projectile of projectiles) {
        let sprite = sprites.get(projectile.id);
        if (!sprite) {
          sprite = new Sprite({ texture, anchor: 0.5 });
          layer.addChild(sprite);
          sprites.set(projectile.id, sprite);
        }
        sprite.position.set(projectile.x, projectile.y);
      }
    },
    destroy() {
      sprites.clear();
      layer.destroy({ children: true });
    },
  };
}
