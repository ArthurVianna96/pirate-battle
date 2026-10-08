import type { ArenaView } from '../arena/types';
import type { ProjectileState } from '../mechanics/weapon';
import type { FeedbackAudio, FeedbackViews } from './types';

export function createCombatFeedback(
  arena: ArenaView,
  audio: FeedbackAudio,
  { effects, explosions, playerHealth }: FeedbackViews,
) {
  function impact(position: { x: number; y: number }) {
    effects.impact(position);
    void audio.play('ship_wood_hit_1', 0.18);
  }

  return {
    impact,
    frontShot(projectile: ProjectileState) {
      effects.shot(projectile);
      void audio.play('cannon_fire_1');
    },
    sideShots(projectiles: readonly ProjectileState[]) {
      if (projectiles.length === 0) {
        return;
      }
      projectiles.forEach(effects.shot);
      void audio.play('cannon_broadside');
    },
    enemyShot(projectile: ProjectileState) {
      effects.shot(projectile);
      void audio.play('cannon_fire_1', 0.18);
    },
    collision(position: { x: number; y: number }) {
      effects.impact(position);
      void audio.play('ship_collision');
    },
    enemyDestroyed(position: { x: number; y: number }) {
      explosions.play(position);
      void audio.play('ship_explosion_1', 0.25);
    },
    playerDestroyed(position: { x: number; y: number }) {
      arena.ship.visible = false;
      playerHealth.bar.visible = false;
      explosions.play(position);
      void audio.play('ship_explosion_1');
    },
    playerDamaged(previousHealth: number, health: number) {
      if (previousHealth > 2 && health <= 2 && health > 0) {
        void audio.play('health_low');
      }
    },
  };
}
