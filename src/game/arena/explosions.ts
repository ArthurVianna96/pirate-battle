import { Container, Sprite, type Texture } from 'pixi.js';

export const EXPLOSION_CONFIG = { duration: 0.6 } as const;

export function createExplosion(
  parent: Container,
  textures: readonly Texture[],
) {
  const layer = new Container();
  let explosions: { sprite: Sprite; elapsed: number }[] = [];
  parent.addChild(layer);

  return {
    play(position: { x: number; y: number }) {
      const sprite = new Sprite({ texture: textures[0], anchor: 0.5 });
      sprite.position.set(position.x, position.y);
      layer.addChild(sprite);
      explosions.push({ sprite, elapsed: 0 });
    },
    update(deltaSeconds: number) {
      for (const explosion of explosions) {
        explosion.elapsed += deltaSeconds;
        if (explosion.elapsed >= EXPLOSION_CONFIG.duration - 1e-9) {
          explosion.sprite.destroy();
          continue;
        }
        const progress = explosion.elapsed / EXPLOSION_CONFIG.duration;
        const frame = Math.min(
          textures.length - 1,
          Math.floor(progress * textures.length),
        );
        explosion.sprite.texture = textures[frame];
        explosion.sprite.alpha = 1 - progress;
      }
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
