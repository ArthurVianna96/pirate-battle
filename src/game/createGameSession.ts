import { calculateArenaViewport } from './arena/viewport';
import { Application } from 'pixi.js';
import { createArena, loadArenaAssets } from './arena';
import {
  startGameLoop,
  type GameLoopCallbacks,
  type GameLoopController,
} from './gameLoop';
import type { GameOptions } from './support/options';
import type { Size } from './mechanics/collisions';

interface GameSessionCallbacks extends GameLoopCallbacks {
  onReady: () => void;
  onError: (error: unknown) => void;
}

export type GameSessionController = Omit<GameLoopController, 'resize'>;

export function createGameSession(
  host: HTMLDivElement,
  options: GameOptions,
  callbacks: GameSessionCallbacks,
): GameSessionController {
  const app = new Application();
  const observer = new ResizeObserver(resize);

  let gameLoop: GameLoopController | undefined;
  let initialized = false;
  let cancelled = false;
  let viewportSize = { width: 0, height: 0 };

  function resize() {
    if (!initialized || !gameLoop) {
      return;
    }
    const size = readViewportSize();
    if (
      size.width === viewportSize.width &&
      size.height === viewportSize.height
    ) {
      return;
    }
    const viewport = resizeRenderer(size);
    gameLoop.resize(viewport);
    app.render();
  }

  function readViewportSize() {
    return { width: host.clientWidth, height: host.clientHeight };
  }

  function resizeRenderer(size: Size) {
    const viewport = calculateArenaViewport(size);
    app.renderer.resize(size.width, size.height);
    app.stage.scale.set(viewport.scale);
    viewportSize = size;
    return viewport;
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
    const viewport = resizeRenderer(readViewportSize());
    const arena = createArena(textures, viewport.width, viewport.height);
    app.stage.addChild(arena.container);
    app.canvas.setAttribute('aria-label', 'Naval battle arena');
    app.canvas.setAttribute('role', 'img');
    host.appendChild(app.canvas);
    app.render();
    gameLoop = startGameLoop(app, arena, options, callbacks);
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
