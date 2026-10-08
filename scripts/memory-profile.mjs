import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const browser = await chromium.launch({
  headless: process.env.PROFILE_HEADED !== '1',
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const session = await page.context().newCDPSession(page);
await session.send('Performance.enable');
await page.goto('http://127.0.0.1:4173');

async function snapshotSummary() {
  const chunks = [];
  const append = ({ chunk }) => chunks.push(chunk);
  session.on('HeapProfiler.addHeapSnapshotChunk', append);
  await session.send('HeapProfiler.takeHeapSnapshot');
  session.off('HeapProfiler.addHeapSnapshotChunk', append);
  const snapshot = JSON.parse(chunks.join(''));
  const fields = snapshot.snapshot.meta.node_fields;
  const nameIndex = fields.indexOf('name');
  const sizeIndex = fields.indexOf('self_size');
  const types = snapshot.snapshot.meta.node_types[0];
  const summary = {};
  for (let index = 0; index < snapshot.nodes.length; index += fields.length) {
    const name = snapshot.strings[snapshot.nodes[index + nameIndex]];
    const type = types[snapshot.nodes[index]];
    if (type !== 'object' && type !== 'native') {
      continue;
    }
    if (!/ArrayBuffer|Float32Array|WebGL|Canvas|Audio/.test(name)) {
      continue;
    }
    summary[name] ??= { count: 0, bytes: 0 };
    summary[name].count++;
    summary[name].bytes += snapshot.nodes[index + sizeIndex];
  }
  return summary;
}

const memory = [];
let baseline;
for (let cycle = 0; cycle <= 20; cycle++) {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.locator('canvas').waitFor();
  for (const key of ['Space', 'KeyQ', 'KeyE']) {
    await page.keyboard.down(key);
  }
  await page.waitForTimeout(5000);
  for (const key of ['Space', 'KeyQ', 'KeyE']) {
    await page.keyboard.up(key);
  }
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.locator('canvas').waitFor({ state: 'detached' });
  await page.waitForTimeout(500);
  await session.send('HeapProfiler.collectGarbage');
  const { metrics } = await session.send('Performance.getMetrics');
  const sample = {
    cycle,
    heapBytes: metrics.find((metric) => metric.name === 'JSHeapUsedSize').value,
    ...(await session.send('Memory.getDOMCounters')),
  };
  memory.push(sample);
  process.stdout.write(JSON.stringify(sample) + '\n');
  if (cycle === 0) {
    baseline = await snapshotSummary();
  }
}
const final = await snapshotSummary();
await mkdir('test-results/performance', { recursive: true });
await writeFile(
  'test-results/performance/memory-investigation.json',
  JSON.stringify(
    {
      browser: browser.version(),
      memory,
      baseline,
      final,
    },
    null,
    2,
  ),
);
await browser.close();
