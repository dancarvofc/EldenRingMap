'use strict';
// Requires an explicitly supplied COPY, existing map assets and Playwright.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: node tools/verify_save_copy.cjs /path/to/COPY.sl2');
  const before = fs.readFileSync(file);
  const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'elden-copy-ui-'));
  const child = spawn(process.execPath, ['server/index.js', '--save-copy', path.resolve(file), '--port', '0'], { cwd: path.join(__dirname, '..') });
  let browser;
  try {
    const base = await new Promise((resolve, reject) => {
      let output = '';
      child.stdout.on('data', (data) => { output += data; const match = /open  http:\/\/localhost:(\d+)/.exec(output); if (match) resolve(`http://127.0.0.1:${match[1]}`); });
      child.once('error', reject); child.once('exit', (code) => reject(new Error(`Server exited ${code}: ${output}`)));
    });
    browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE || undefined });
    for (const width of [390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = []; page.on('pageerror', (error) => errors.push(error.message));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(base);
      await page.locator('#save-copy-notice').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#companion').isVisible(), false);
      const characters = await (await page.request.get(base + '/api/state')).json();
      assert.ok(characters.characters.every((c) => c.checksumOk && c.ok));
      for (let i = 0; i < characters.characters.length; i++) {
        await page.locator('#save-character').selectOption({ index: i });
        const expected = characters.characters[i];
        await page.waitForFunction((name) => document.querySelector('#char-name').textContent === name, expected.name);
        assert.equal(await page.evaluate(() => state.found.size), expected.found.length);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.locator('#sb-collapse').click();
      await page.evaluate(() => {
        const marker = state.markers.find((m) => m.master === state.master);
        map.centerOn(marker.px, marker.py, 0.8); showPopup(marker);
      });
      assert.equal(await page.locator('#popup .toggle').count(), 0);
      await page.locator('#popup .close').click();
      await page.locator('#sb-expand').click();
      await page.evaluate(() => { document.querySelector('#sidebar').scrollTop = 0; });
      await page.waitForFunction(() => document.querySelector('#sidebar').getBoundingClientRect().left >= -0.1);
      await page.evaluate(() => map.fit());
      await page.waitForFunction(() => map.cache.size > 0 && ![...map.cache.values()].includes('pending') && [...map.cache.values()].some((v) => v instanceof Image && v.complete));
      await page.evaluate(() => map.draw());
      await page.screenshot({ path: path.join(artifacts, `viewport-${width}.png`) });
      assert.deepEqual(errors, []); await page.close();
      console.log(`PASS ${width}px: verified characters, automatic markers, read-only popup, no page errors`);
    }
    assert.deepEqual(fs.readFileSync(file), before);
    console.log(`Copy unchanged. Screenshots: ${artifacts}`);
  } finally {
    if (browser) await browser.close();
    const stopped = new Promise((resolve) => child.once('exit', resolve)); child.kill(); await stopped;
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
