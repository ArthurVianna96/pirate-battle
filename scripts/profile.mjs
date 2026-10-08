import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const spawnInterval = Number(process.env.PROFILE_SPAWN_INTERVAL ?? 30);
const browser = await chromium.launch({
  headless: process.env.PROFILE_HEADED !== '1',
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const session = await page.context().newCDPSession(page);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await session.send('Performance.enable');
await page.goto('http://127.0.0.1:4173');
await page.getByRole('button', { name: 'Options', exact: true }).click();
await page.getByLabel('Game session time', { exact: true }).fill('180');
await page
  .getByLabel('Enemy spawn time', { exact: true })
  .fill(String(spawnInterval));
await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
process.stdout.write('Options saved\n');

async function startMatch() {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.locator('canvas').waitFor();
  await page.getByRole('button', { name: 'Pause', exact: true }).waitFor();
}

async function leaveMatch() {
  await page.keyboard.up('KeyW');
  await page.keyboard.up('KeyD');
  await page.keyboard.up('Space');
  await page.keyboard.up('KeyQ');
  await page.keyboard.up('KeyE');
  const pause = page.getByRole('button', { name: 'Pause', exact: true });
  if (await pause.isVisible()) {
    await pause.click();
  }
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.locator('canvas').waitFor({ state: 'detached' });
}

async function collectMemory() {
  await session.send('HeapProfiler.collectGarbage');
  const { metrics } = await session.send('Performance.getMetrics');
  const dom = await session.send('Memory.getDOMCounters');
  return {
    heapBytes: metrics.find((metric) => metric.name === 'JSHeapUsedSize').value,
    ...dom,
  };
}

async function countEntities() {
  const { result } = await session.send('Runtime.evaluate', {
    expression: 'Object.prototype',
    objectGroup: 'entity-sample',
  });
  const { objects } = await session.send('Runtime.queryObjects', {
    prototypeObjectId: result.objectId,
    objectGroup: 'entity-sample',
  });
  const counts = await session.send('Runtime.callFunctionOn', {
    objectId: objects.objectId,
    returnByValue: true,
    functionDeclaration: `function () {
      let enemies = 0;
      let projectiles = 0;
      for (const object of this) {
        if (Object.hasOwn(object, 'health') && Object.hasOwn(object, 'bounds') && Object.hasOwn(object, 'position')) {
          enemies++;
        }
        if (Object.hasOwn(object, 'velocityX') && Object.hasOwn(object, 'remainingLife') && Object.hasOwn(object, 'damage')) {
          projectiles++;
        }
      }
      return { enemies, projectiles };
    }`,
  });
  await session.send('Runtime.releaseObjectGroup', {
    objectGroup: 'entity-sample',
  });
  return counts.result.value;
}

await startMatch();
const environment = await page.evaluate(() => ({
  userAgent: navigator.userAgent,
  devicePixelRatio,
  viewport: { width: innerWidth, height: innerHeight },
  canvas: {
    width: document.querySelector('canvas').width,
    height: document.querySelector('canvas').height,
  },
  renderer: (() => {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    const extension = gl.getExtension('WEBGL_debug_renderer_info');
    return extension
      ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
  })(),
}));
await page.evaluate(() => {
  window.frameSamples = [];
  window.collectFrames = true;
  let previous;
  function sample(time) {
    if (!window.collectFrames) {
      return;
    }
    if (previous !== undefined) {
      window.frameSamples.push(time - previous);
    }
    previous = time;
    requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
});
process.stdout.write(JSON.stringify(environment) + '\n');
for (const key of ['KeyW', 'Space', 'KeyQ', 'KeyE']) {
  await page.keyboard.down(key);
}
const entitySamples = [];
const started = Date.now();
let nextSample = 30;
while (Date.now() - started < 180_000) {
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(200);
  await page.keyboard.up('KeyD');
  await page.waitForTimeout(800);
  const seconds = (Date.now() - started) / 1000;
  if (seconds >= nextSample && seconds < 179) {
    const counts = await countEntities();
    entitySamples.push({ seconds, ...counts });
    process.stdout.write(
      JSON.stringify({ progress: seconds, ...counts }) + '\n',
    );
    nextSample += 30;
  }
  if (
    await page.getByRole('heading', { name: 'Battle complete' }).isVisible()
  ) {
    break;
  }
}
const combat = await page.evaluate(() => {
  window.collectFrames = false;
  const samples = window.frameSamples;
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    frames: samples.length,
    seconds: samples.reduce((sum, value) => sum + value, 0) / 1000,
    fps:
      1000 / (samples.reduce((sum, value) => sum + value, 0) / samples.length),
    p95Milliseconds: sorted[Math.ceil(sorted.length * 0.95) - 1],
    worstMilliseconds: sorted.at(-1),
    framesOver33Milliseconds: samples.filter((value) => value > 33.4).length,
  };
});
process.stdout.write(JSON.stringify(combat) + '\n');
await page.screenshot({ path: '/tmp/profile-combat.png' });
const resultVisible = await page.locator('.result-score').isVisible();
const outcome = resultVisible
  ? await page.locator('.result-score').textContent()
  : null;
if (
  await page.getByRole('button', { name: 'Main Menu', exact: true }).isVisible()
) {
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
} else {
  await leaveMatch();
}
const memory = [{ cycle: 0, ...(await collectMemory()) }];
for (let cycle = 1; cycle <= 5; cycle++) {
  await startMatch();
  await page.keyboard.down('Space');
  await page.keyboard.down('KeyQ');
  await page.keyboard.down('KeyE');
  await page.waitForTimeout(5_000);
  await leaveMatch();
  await page.waitForTimeout(500);
  const sample = { cycle, ...(await collectMemory()) };
  memory.push(sample);
  process.stdout.write(JSON.stringify(sample) + '\n');
}
await mkdir('test-results/performance', { recursive: true });
await writeFile(
  'test-results/performance/profile.json',
  JSON.stringify(
    {
      date: new Date().toISOString(),
      browser: browser.version(),
      environment,
      configuration: {
        sessionDuration: 180,
        enemySpawnInterval: spawnInterval,
      },
      combat,
      outcome,
      entitySamples,
      memory,
      errors,
    },
    null,
    2,
  ),
);
await browser.close();
