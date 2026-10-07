import { Application } from 'pixi.js';
import { createArena, loadArenaAssets } from './arena';
import {
  startGameLoop,
  type GameLoopCallbacks,
  type GameLoopController,
} from './gameLoop';
import type { GameOptions } from './options';

interface GameSessionCallbacks extends GameLoopCallbacks {
  onReady: () => void;
  onError: (error: unknown) => void;
}

export function createGameSession(
  host: HTMLDivElement,
  options: GameOptions,
  callbacks: GameSessionCallbacks,
): GameLoopController {
  const app = new Application();
  let gameLoop: GameLoopController | undefined;
  let initialized = false;
  let cancelled = false;

  function releaseResources() {
    gameLoop?.destroy();
    gameLoop = undefined;
    if (!initialized) {
      return;
    }
    initialized = false;
    app.destroy({ removeView: true }, { children: true });
  }

  function mountArena(textures: Awaited<ReturnType<typeof loadArenaAssets>>) {
    const arena = createArena(textures, app.screen.width, app.screen.height);
    app.stage.addChild(arena.container);
    app.canvas.setAttribute('aria-label', 'Naval battle arena');
    app.canvas.setAttribute('role', 'img');
    host.appendChild(app.canvas);
    app.render();
    gameLoop = startGameLoop(app, arena, options, callbacks);
  }

  async function initialize() {
    try {
      const textures = await loadArenaAssets();
      if (cancelled) {
        return;
      }
      await app.init({
        width: 960,
        height: 540,
        background: '#126b86',
        preference: 'webgl',
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        autoStart: false,
        sharedTicker: false,
      });
      initialized = true;
      if (cancelled) {
        releaseResources();
        return;
      }
      mountArena(textures);
      callbacks.onReady();
    } catch (error) {
      releaseResources();
      if (!cancelled) {
        callbacks.onError(error);
      }
    }
  }

  void initialize();
  return {
    pause: () => gameLoop?.pause(),
    resume: () => gameLoop?.resume(),
    setControl: (action, active) => gameLoop?.setControl(action, active),
    destroy() {
      cancelled = true;
      releaseResources();
    },
  };
}
