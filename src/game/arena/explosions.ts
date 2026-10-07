import { Container, Sprite, type Texture } from 'pixi.js';

export const EXPLOSION_CONFIG = { duration: 0.6 } as const;

interface Explosion {
  sprite: Sprite;
  elapsed: number;
}

export function createExplosion(
  parent: Container,
  textures: readonly Texture[],
) {
  const layer = new Container();
  let explosions: Explosion[] = [];
  parent.addChild(layer);

  function updateExplosion(explosion: Explosion, deltaSeconds: number) {
    explosion.elapsed += deltaSeconds;
    if (explosion.elapsed >= EXPLOSION_CONFIG.duration - 1e-9) {
      explosion.sprite.destroy();
      return;
    }
    const progress = explosion.elapsed / EXPLOSION_CONFIG.duration;
    const frame = Math.min(
      textures.length - 1,
      Math.floor(progress * textures.length),
    );
    explosion.sprite.texture = textures[frame];
    explosion.sprite.alpha = 1 - progress;
  }

  return {
    play(position: { x: number; y: number }) {
      const sprite = new Sprite({ texture: textures[0], anchor: 0.5 });
      sprite.position.set(position.x, position.y);
      layer.addChild(sprite);
      explosions.push({ sprite, elapsed: 0 });
    },
    update(deltaSeconds: number) {
      explosions.forEach((explosion) =>
        updateExplosion(explosion, deltaSeconds),
      );
      explosions = explosions.filter(
        (explosion) => !explosion.sprite.destroyed,
      );
    },
    destroy() {
      explosions = [];
      layer.destroy({ children: true });
    },
  };
}
