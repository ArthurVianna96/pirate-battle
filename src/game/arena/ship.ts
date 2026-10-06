import { Sprite } from 'pixi.js';
import type { ShipOptions } from './types';

export const renderShip = ({ texture, width, height }: ShipOptions) => {
  const ship = new Sprite({ texture, anchor: 0.5 });
  ship.position.set(width / 2, height / 2);
  ship.rotation = Math.PI;
  return ship;
};
