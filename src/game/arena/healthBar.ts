import { Container, Graphics } from 'pixi.js';

export function createHealthBar(parent: Container, shipHeight: number) {
  const bar = new Container();
  const background = new Graphics().rect(0, 0, 48, 6).fill(0x263238);
  const health = new Graphics().rect(0, 0, 48, 6).fill(0x66dd88);
  bar.position.set(-24, -shipHeight / 2 - 12);
  bar.addChild(background, health);
  parent.addChild(bar);
  return { bar, health };
}
