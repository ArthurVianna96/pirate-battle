import { Container, Sprite, type Texture } from 'pixi.js';

export const COMBAT_EFFECTS_CONFIG = {
  shotDuration: 0.16,
  impactDuration: 0.25,
} as const;

export function createCombatEffects(parent: Container, texture: Texture) {
  const layer = new Container({ label: 'combat-effects' });
  parent.addChild(layer);
  let effects: {
    sprite: Sprite;
    elapsed: number;
    duration: number;
    scale: number;
  }[] = [];

  function play(
    position: { x: number; y: number },
    duration: number,
    scale: number,
    tint: number,
  ) {
    const sprite = new Sprite({ texture, anchor: 0.5, tint });
    sprite.position.set(position.x, position.y);
    sprite.scale.set(scale);
    layer.addChild(sprite);
    effects.push({ sprite, elapsed: 0, duration, scale });
  }

  return {
    shot(position: { x: number; y: number }) {
      play(position, COMBAT_EFFECTS_CONFIG.shotDuration, 0.35, 0xffee99);
    },
    impact(position: { x: number; y: number }) {
      play(position, COMBAT_EFFECTS_CONFIG.impactDuration, 0.5, 0xffffff);
    },
    update(deltaSeconds: number) {
      for (const effect of effects) {
        effect.elapsed += deltaSeconds;
        const progress = Math.min(1, effect.elapsed / effect.duration);
        effect.sprite.alpha = 1 - progress;
        effect.sprite.scale.set(effect.scale * (1 + progress));
        if (progress === 1) effect.sprite.destroy();
      }
      effects = effects.filter(({ sprite }) => !sprite.destroyed);
    },
    destroy() {
      effects = [];
      layer.destroy({ children: true });
    },
  };
}
