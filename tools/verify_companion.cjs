'use strict';
// Optional UI verification using an existing Playwright installation and browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const localMap = process.argv.includes('--local-map');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'elden-ui-'));
  const server = spawn(process.execPath, ['server/index.js', '--mock', '--mock-map', localMap ? 'local' : 'synthetic', '--port', '0', '--manual-state', path.join(temporary, 'manual.json')], { cwd: path.join(__dirname, '..') });
  let browser;
  try {
    const base = await new Promise((resolve, reject) => {
      let output = '';
      server.stdout.on('data', (data) => { output += data; const match = /open  http:\/\/localhost:(\d+)/.exec(output); if (match) resolve(`http://127.0.0.1:${match[1]}`); });
      server.on('error', reject); server.once('exit', (code) => reject(new Error(`Server exited ${code}`)));
    });
    browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE || undefined });
    for (const width of [360, 390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = []; page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(base);
      await page.locator('#companion').waitFor({ state: 'visible' });
      await page.waitForFunction(() => document.querySelectorAll('.quest-step').length === 3);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.locator('#mock-snapshot').selectOption('completed');
      await page.waitForFunction(() => [...document.querySelectorAll('.automatic-status')].every((e) => e.textContent.includes('Concluída')));
      await page.locator('.manual-check input').first().check();
      await page.waitForFunction(() => !document.querySelector('.manual-check input').disabled);
      await page.locator('#mock-snapshot').selectOption('not-started');
      await page.waitForFunction(() => document.querySelector('.automatic-status').textContent === 'Disponível');
      assert.equal(await page.locator('.manual-check input').first().isChecked(), true);
      await page.locator('#custom-title').fill(`Explorar ${width}`);
      await page.locator('#custom-form button').click();
      await page.getByText(`Explorar ${width}`, { exact: true }).waitFor();
      await page.locator('#save-character').selectOption({ index: 1 });
      await page.waitForFunction(() => document.querySelector('#char-name').textContent === 'Guts');
      assert.equal(await page.locator('.manual-check input').first().isChecked(), false);
      assert.equal(await page.locator('.custom-row').count(), 0);
      await page.locator('#save-character').selectOption({ index: 0 });
      await page.getByText(`Explorar ${width}`, { exact: true }).waitFor();
      await page.reload();
      await page.getByText(`Explorar ${width}`, { exact: true }).waitFor();
      if (localMap) {
        assert.equal(await page.locator('#focus-npc').isDisabled(), true);
        assert.equal(await page.locator('#categories').isVisible(), true);
        const markers = await (await page.request.get(base + '/api/markers')).json();
        assert.ok(markers.markers.length > 0);
        assert.equal(await page.evaluate(() => state.byId.has('mock.npc.millicent')), false);
        await page.locator('#sb-collapse').click();
        const markerId = await page.evaluate(() => {
          const marker = state.markers.find((item) => item.master === state.master);
          map.flyTo(marker.px, marker.py, 0.9); showPopup(marker); return marker.id;
        });
        const wasChecked = await page.evaluate((id) => !!state.checked[id], markerId);
        await page.locator('#popup .toggle').click();
        await page.waitForFunction(({ id, previous }) => !!state.checked[id] !== previous, { id: markerId, previous: wasChecked });
        assert.equal(await page.evaluate(() => state.found.size), 0);
        await page.locator('#popup .close').click();
        await page.locator('#sb-expand').click();
      } else await page.locator('#focus-npc').click();
      if (!localMap && width <= 700) {
        await page.waitForFunction(() => document.querySelector('#app').classList.contains('sb-collapsed'));
        await page.locator('#sb-expand').click();
        await page.locator('#companion').waitFor({ state: 'visible' });
      }
      await page.evaluate(() => { document.querySelector('#sidebar').scrollTop = 0; });
      await page.waitForFunction(() => document.querySelector('#sidebar').getBoundingClientRect().left >= -0.1);
      if (localMap) await page.waitForFunction(() => map.cache.size > 0 && [...map.cache.values()].some((v) => v instanceof Image && v.complete));
      await page.screenshot({ path: path.join(temporary, `viewport-${width}.png`) });
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: timeline, regression, persistence, profiles, map navigation; no page errors`);
      await page.close();
    }
    console.log(`Screenshots: ${temporary}`);
  } finally {
    if (browser) await browser.close();
    const stopped = new Promise((resolve) => server.once('exit', resolve)); server.kill(); await stopped;
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
