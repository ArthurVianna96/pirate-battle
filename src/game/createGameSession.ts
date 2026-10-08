import { calculateArenaViewport } from './arena/viewport';
import { Application } from 'pixi.js';
import { createArena, loadArenaAssets } from './arena';
import {
  startGameLoop,
  type GameLoopCallbacks,
  type GameLoopController,
} from './gameLoop';
import type { GameOptions } from './support/options';

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
  const observer = new ResizeObserver(resize);
  let viewportWidth = 0;
  let viewportHeight = 0;

  function resize() {
    if (!initialized || !gameLoop) {
      return;
    }
    if (
      host.clientWidth === viewportWidth &&
      host.clientHeight === viewportHeight
    ) {
      return;
    }
    viewportWidth = host.clientWidth;
    viewportHeight = host.clientHeight;
    const viewport = calculateArenaViewport(host.getBoundingClientRect());
    app.renderer.resize(host.clientWidth, host.clientHeight);
    app.stage.scale.set(viewport.scale);
    gameLoop.resize?.(viewport);
    app.render();
  }

  function releaseResources() {
    observer.disconnect();
    gameLoop?.destroy();
    gameLoop = undefined;
    if (!initialized) {
      return;
    }
    initialized = false;
    app.destroy({ removeView: true }, { children: true });
  }

  function mountArena(textures: Awaited<ReturnType<typeof loadArenaAssets>>) {
    const viewport = calculateArenaViewport(host.getBoundingClientRect());
    const arena = createArena(textures, viewport.width, viewport.height);
    app.stage.scale.set(viewport.scale);
    app.stage.addChild(arena.container);
    app.canvas.setAttribute('aria-label', 'Naval battle arena');
    app.canvas.setAttribute('role', 'img');
    host.appendChild(app.canvas);
    app.render();
    gameLoop = startGameLoop(app, arena, options, callbacks);
    viewportWidth = host.clientWidth;
    viewportHeight = host.clientHeight;
    observer.observe(host);
  }

  async function initialize() {
    try {
      const textures = await loadArenaAssets();
      if (cancelled) {
        return;
      }
      await app.init({
        width: host.clientWidth,
        height: host.clientHeight,
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
