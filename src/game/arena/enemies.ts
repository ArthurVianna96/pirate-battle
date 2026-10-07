import type { ShipTextures } from './types';
import { createShipAppearance } from './shipAppearance';
import { Container, Sprite, type Texture } from 'pixi.js';
import type { EnemyState } from '../mechanics/combat';
import type { PlayerState } from '../mechanics/simulation';
import { createHealthBar } from './healthBar';

export function createEnemy(
  parent: Container,
  texture: Texture,
  enemy: EnemyState,
  options: {
    position?: PlayerState;
    tint?: number;
    shipTextures: ShipTextures;
    fire: Texture[];
  },
) {
  const ship = new Sprite({
    texture,
    anchor: 0.5,
    tint: options.tint ?? 0xffffff,
  });
  const { bounds } = enemy;

  const group = new Container();
  group.position.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  group.addChild(ship);

  const { bar, health } = createHealthBar(group, bounds.height);
  parent.addChild(group);
  const appearance = createShipAppearance(
    group,
    ship,
    options.shipTextures,
    options.fire,
  );

  function syncPosition() {
    group.position.set(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    );
    if (options.position) ship.rotation = options.position.heading + Math.PI;
  }

  function syncHealth() {
    health.scale.x = enemy.health / enemy.maxHealth;
    bar.y = -bounds.height / 2 - 12;
  }

  return {
    sync(deltaSeconds = 0) {
      if (group.destroyed) return;
      if (enemy.health === 0) {
        group.destroy({ children: true });
        return;
      }
      syncPosition();
      syncHealth();
      appearance.update(enemy.health, enemy.maxHealth, deltaSeconds);
    },
    destroy() {
      if (!group.destroyed) group.destroy({ children: true });
    },
  };
}
