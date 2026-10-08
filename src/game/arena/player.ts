import { Sprite, type Container } from 'pixi.js';
import type { PlayerOptions, HealthBarTextures } from './types';
import { createHealthBar, HEALTH_BAR_CONFIG } from './healthBar';

export const renderPlayer = ({ texture, width, height }: PlayerOptions) => {
  const ship = new Sprite({ texture, anchor: 0.5 });
  ship.position.set(width / 2, height / 2);
  ship.rotation = Math.PI;
  return ship;
};

export function createPlayerHealthBar(
  parent: Container,
  ship: Sprite,
  textures: HealthBarTextures,
) {
  const { bar, update } = createHealthBar(parent, ship.height, textures);

  function sync(health: number, maxHealth: number) {
    const { width, height, scale, gap } = HEALTH_BAR_CONFIG;
    bar.position.set(
      ship.x - (width * scale) / 2,
      ship.y - ship.getBounds().height / 2 - height * scale - gap,
    );
    bar.visible = ship.visible;
    update(health / maxHealth);
  }

  sync(1, 1);
  return { bar, sync, destroy: () => bar.destroy({ children: true }) };
}
