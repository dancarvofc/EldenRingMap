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
  const child = spawn(process.execPath, ['server/index.js', '--save-copy', path.resolve(file), '--manual-state', path.join(artifacts, 'manual.json'), '--port', '0'], { cwd: path.join(__dirname, '..') });
  let browser;
  try {
    const base = await new Promise((resolve, reject) => {
      let output = '';
      child.stdout.on('data', (data) => { output += data; const match = /open  http:\/\/localhost:(\d+)/.exec(output); if (match) resolve(`http://127.0.0.1:${match[1]}`); });
      child.once('error', reject); child.once('exit', (code) => reject(new Error(`Server exited ${code}: ${output}`)));
    });
    browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE || undefined });
    for (const width of [360, 390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = []; page.on('pageerror', (error) => errors.push(error.message));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(base);
      await page.locator('#save-copy-notice').waitFor({ state: 'visible' });
      assert.equal(await page.locator('.quest-step').count(), 0);
      const markerDoc = await (await page.request.get(base + '/api/markers')).json();
      const references = markerDoc.markers.filter((marker) => marker.cat === 'npc');
      assert.ok(references.some((marker) => marker.names.en === 'Millicent'));
      const lookup = async (query) => {
        await page.locator('#search').fill(query);
        return page.locator('#search-results button[data-id]').evaluateAll((items) => items.map((item) => item.dataset.id));
      };
      const english = await lookup('thief');
      const portuguese = await lookup('ladrao');
      assert.ok(english.length > 0);
      assert.deepEqual(portuguese, english);
      assert.deepEqual(await lookup('ladrão'), english);
      await page.locator('#search').press('ArrowDown');
      assert.equal(await page.evaluate(() => document.activeElement.matches('#search-results button')), true);
      await page.keyboard.press('Enter');
      await page.locator('#popup').waitFor({ state: 'visible' });
      assert.match(await page.locator('#popup h3').innerText(), /Adan, Thief of Fire/);
      assert.match(await page.locator('#popup .found-state').innerText(), /current NPC position unknown/);
      await page.locator('#popup .close').click();
      if (width <= 700) await page.locator('#sb-expand').click();
      await page.locator('.lang-btn').filter({ hasText: 'RU' }).click();
      await lookup('ladrao');
      assert.match(await page.locator('#search-results').innerText(), /Adan, Thief of Fire/);
      await page.locator('#search').press('Escape');
      await page.locator('.lang-btn').filter({ hasText: 'EN' }).click();
      const millicent = await lookup('milicent');
      assert.ok(millicent.length > 0);
      await page.locator('#search').press('Escape');
      const characters = await (await page.request.get(base + '/api/state')).json();
      assert.ok(characters.characters.every((c) => c.checksumOk && c.ok));
      for (let i = 0; i < characters.characters.length; i++) {
        await page.locator('#save-character').selectOption({ index: i });
        const expected = characters.characters[i];
        const explorationIds = new Set(expected.exploration.filter((item) => item.status !== 'unknown').map((item) => item.markerId));
        assert.deepEqual(expected.exploration.filter((item) => item.status === 'completed').map((item) => item.markerId).sort(), expected.found.filter((id) => explorationIds.has(id)).sort());
        const bossIds = new Set(expected.milestones.map((item) => item.markerId));
        assert.deepEqual(expected.milestones.filter((item) => item.status === 'completed').map((item) => item.markerId).sort(), expected.found.filter((id) => bossIds.has(id)).sort());
        await page.waitForFunction((name) => document.querySelector('#char-name').textContent === name, expected.name);
        assert.equal(await page.evaluate(() => state.found.size), expected.found.length);
      }
      const milestoneData = await page.evaluate(() => state.character.milestones);
      assert.ok(milestoneData.length > 0);
      await page.locator('#real-milestones > details > summary').click();
      assert.equal(await page.locator('.milestone').count(), milestoneData.length);
      await page.locator('#milestone-status').selectOption('completed');
      assert.equal(await page.locator('.milestone').count(), milestoneData.filter((m) => m.status === 'completed').length);
      if (await page.locator('.milestone').count()) {
        await page.locator('.milestone details summary').first().click();
        assert.match(await page.locator('.milestone details').first().innerText(), /observado true/);
      }
      await page.locator('#real-milestones').screenshot({ path: path.join(artifacts, `milestones-${width}.png`) });
      await page.locator('#milestone-search').fill('no-such-synthetic-boss-xyz');
      assert.equal(await page.locator('.milestone').count(), 0);
      await page.locator('#milestone-search').fill('');
      await page.locator('#milestone-status').selectOption('all');
      const target = await page.evaluate(() => {
        const marker = state.markers.find((m) => m.cat === 'boss' && m.master === 'M10');
        return marker && { id: marker.id, master: marker.master };
      });
      if (target) {
        await page.locator(`.milestone[data-marker-id="${target.id}"] button`).click();
        await page.waitForFunction((master) => state.master === master, target.master);
        if (width <= 700) await page.locator('#sb-expand').click();
        await page.locator('#milestone-layer').selectOption('current');
        assert.ok(await page.locator('.milestone').count() > 0);
        assert.ok((await page.locator('.milestone-status').allTextContents()).every((text) => text.includes(target.master)));
        await page.locator('#milestone-layer').selectOption('all');
      }
      await page.locator('#real-milestones > details > summary').click();
      const explorationData = await page.evaluate(() => state.character.exploration);
      await page.locator('#real-exploration > details > summary').click();
      assert.equal(await page.locator('.exploration-item').count(), explorationData.length);
      await page.locator('#exploration-kind').selectOption('grace');
      assert.equal(await page.locator('.exploration-item').count(), explorationData.filter((item) => item.kind === 'grace').length);
      await page.locator('#exploration-search').fill('peninsula lagrimas');
      await page.locator('#exploration-kind').selectOption('all');
      assert.equal(await page.locator('.exploration-item').count(), 1);
      assert.equal(await page.locator('.exploration-item h3').innerText(), 'Map: Weeping Peninsula');
      await page.locator('#exploration-search').fill('');
      await page.locator('#exploration-kind').selectOption('fragment');
      await page.locator('#exploration-status').selectOption('completed');
      assert.equal(await page.locator('.exploration-item').count(), explorationData.filter((item) => item.kind === 'fragment' && item.status === 'completed').length);
      if (await page.locator('.exploration-item').count()) {
        await page.locator('.exploration-item details summary').first().click();
        assert.match(await page.locator('.exploration-item details').first().innerText(), /WorldMapPieceParam.openEventFlagId/);
        const targetId = await page.locator('.exploration-item').first().getAttribute('data-marker-id');
        await page.locator('.exploration-item button').first().click();
        await page.waitForFunction((id) => state.selected === id, targetId);
        assert.ok(await page.evaluate(() => state.byId.get(state.selected).rect.length === 4));
        await page.locator('#popup .close').click();
        if (width <= 700) await page.locator('#sb-expand').click();
      }
      await page.locator('#exploration-search').fill('no-such-place-xyz');
      assert.equal(await page.locator('.exploration-item').count(), 0);
      await page.locator('#exploration-search').fill('');
      await page.locator('#real-exploration').screenshot({ path: path.join(artifacts, `exploration-${width}.png`) });
      await page.locator('#real-exploration > details > summary').click();
      await page.locator('#profile-label').fill(`Perfil ${width}`);
      await page.locator('#profile-create').click();
      await page.waitForFunction((label) => document.querySelector('#profile-status').textContent.includes(label), `Perfil ${width}`);
      await page.locator('#custom-title').fill(`Objetivo ${width}`);
      await page.locator('#custom-form button').click();
      await page.getByText(`Objetivo ${width}`, { exact: true }).waitFor();
      if (characters.characters.length > 1) {
        await page.locator('#save-character').selectOption({ index: 0 });
        await page.locator('#companion').waitFor({ state: 'hidden' });
        await page.locator('#save-character').selectOption({ index: characters.characters.length - 1 });
        await page.getByText(`Objetivo ${width}`, { exact: true }).waitFor();
      }
      await page.reload();
      await page.getByText(`Objetivo ${width}`, { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.locator('#npc-references > details > summary').click();
      await page.locator('#npc-search').fill('Millicent');
      const referenceCard = page.locator('.npc-reference-card').first();
      const referenceId = await referenceCard.getAttribute('data-marker-id');
      await referenceCard.locator('button').click();
      await page.locator('#popup .pin-list').click();
      await page.waitForFunction((id) => state.character.manual.custom.some((item) => item.markerId === id), referenceId);
      assert.equal(await page.locator('#popup .pin-list').isDisabled(), true);
      assert.equal(await page.locator('#popup .toggle').count(), 0);
      await page.waitForFunction(() => { const marker = state.byId.get(state.selected); return marker && Math.abs(map.cx-marker.px) < 1 && Math.abs(map.cy-marker.py) < 1; });
      await page.waitForFunction(() => ![...map.cache.values()].includes('pending'));
      await page.evaluate(() => map.draw());
      await page.screenshot({ path: path.join(artifacts, `millicent-map-${width}.png`) });
      await page.locator('#popup .close').click();
      if (width <= 700) await page.locator('#sb-expand').click();
      const linked = page.locator('.custom-row').filter({ hasText: 'Millicent' }).first();
      await linked.getByRole('button', { name: 'Mapa', exact: true }).click();
      await page.waitForFunction((id) => state.selected === id, referenceId);
      await page.locator('#popup .close').click();
      if (width <= 700) await page.locator('#sb-expand').click();
      await page.locator('#npc-references > details > summary').click();
      await page.locator('#sb-collapse').click();
      await page.evaluate(() => {
        const marker = state.markers.find((m) => m.master === state.master && !state.found.has(m.id));
        map.centerOn(marker.px, marker.py, 0.8); showPopup(marker);
      });
      assert.equal(await page.locator('#popup .toggle').count(), 1);
      const foundBefore = await page.evaluate(() => state.found.size);
      await page.locator('#popup .toggle').click();
      await page.waitForFunction(() => !!state.checked[state.selected]);
      assert.equal(await page.evaluate(() => state.found.size), foundBefore);
      await page.locator('#popup .close').click();
      await page.locator('#sb-expand').click();
      await page.evaluate(() => { document.querySelector('#sidebar').scrollTop = 0; });
      await page.waitForFunction(() => document.querySelector('#sidebar').getBoundingClientRect().left >= -0.1);
      await page.evaluate(async () => {
        map.flyTo(1000, 1000, 0.9, 1000);
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        map.fit();
        await new Promise((resolve) => setTimeout(resolve, 120));
        if (Math.abs(map.cx - map.width / 2) > 0.1) throw new Error('Fit did not cancel previous camera flight');
      });
      await page.waitForFunction(() => map.cache.size > 0 && ![...map.cache.values()].includes('pending') && [...map.cache.values()].some((v) => v instanceof Image && v.complete));
      await page.evaluate(() => map.draw());
      await page.screenshot({ path: path.join(artifacts, `viewport-${width}.png`) });
      assert.deepEqual(errors, []); await page.close();
      console.log(`PASS ${width}px: verified characters, automatic markers, EN/PT search, official names, NPC references, linked objectives, milestone/exploration filters, no page errors`);
    }
    assert.deepEqual(fs.readFileSync(file), before);
    console.log(`Copy unchanged. Screenshots: ${artifacts}`);
  } finally {
    if (browser) await browser.close();
    const stopped = new Promise((resolve) => child.once('exit', resolve)); child.kill(); await stopped;
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
