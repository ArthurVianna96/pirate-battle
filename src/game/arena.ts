import { Assets, Container, Sprite, TilingSprite, type Texture } from 'pixi.js';
import playerShipUrl from '../../assets/png/default/ships/ship_1.png?url';
import waterUrl from '../../assets/png/default/tiles/tile_73.png?url';

interface ArenaAssets {
  playerShip: Texture;
  water: Texture;
}

export async function loadArenaAssets(): Promise<ArenaAssets> {
  const [playerShip, water] = await Promise.all([
    Assets.load<Texture>(playerShipUrl),
    Assets.load<Texture>(waterUrl),
  ]);

  return { playerShip, water };
}

export function createArena(
  textures: ArenaAssets,
  width: number,
  height: number,
): Container {
  const arena = new Container();
  const water = new TilingSprite({ texture: textures.water, width, height });
  const ship = new Sprite({ texture: textures.playerShip, anchor: 0.5 });
  ship.position.set(width / 2, height / 2);

  arena.addChild(water, ship);
  return arena;
}
