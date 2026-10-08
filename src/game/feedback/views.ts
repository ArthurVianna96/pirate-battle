import { createExplosion } from '../arena/explosions';
import { createCombatEffects } from '../arena/combatEffects';
import { createShipAppearance } from '../arena/shipAppearance';
import { createProjectile } from '../arena/projectiles';
import { createPlayerHealthBar } from '../arena/player';
import type { ArenaView } from '../arena/types';
import type { PlayerCombatState } from '../mechanics/combat';
import type { ProjectileState } from '../mechanics/weapon';

export function createViewFeedback(arena: ArenaView) {
  const playerProjectiles = createProjectile(
    arena.container,
    arena.projectileTexture,
  );
  const enemyProjectiles = createProjectile(
    arena.container,
    arena.projectileTexture,
  );
  const explosions = createExplosion(arena.container, arena.explosionTextures);
  const effects = createCombatEffects(
    arena.container,
    arena.explosionTextures[0],
  );
  const playerAppearance = createShipAppearance(
    arena.container,
    arena.ship,
    arena.playerShipTextures,
    arena.fireTextures,
  );
  const playerHealth = createPlayerHealthBar(
    arena.container,
    arena.ship,
    arena.playerHealthTextures,
  );

  function updateEffects(deltaSeconds: number) {
    explosions.update(deltaSeconds);
    effects.update(deltaSeconds);
  }

  function syncViews(
    player: PlayerCombatState,
    playerShots: readonly ProjectileState[],
    enemyShots: readonly ProjectileState[],
    deltaSeconds: number,
  ) {
    arena.ship.position.set(player.x, player.y);
    arena.ship.rotation = player.heading + Math.PI;
    playerAppearance.update(player.health, player.maxHealth, deltaSeconds);
    playerHealth.sync(player.health, player.maxHealth);
    for (const { renderer } of arena.enemies) {
      renderer.sync(deltaSeconds);
    }
    playerProjectiles.sync(playerShots, deltaSeconds);
    enemyProjectiles.sync(enemyShots, deltaSeconds);
  }

  function destroy() {
    playerProjectiles.destroy();
    enemyProjectiles.destroy();
    arena.enemies.forEach(({ renderer }) => renderer.destroy());
    explosions.destroy();
    effects.destroy();
    playerAppearance.destroy();
    playerHealth.destroy();
  }

  return {
    updateEffects,
    syncViews,
    destroy,
    effects,
    explosions,
    playerHealth,
  };
}
