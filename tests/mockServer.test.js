'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

const fs = require('node:fs');
const os = require('node:os');
const root = path.join(__dirname, '..');
async function launch(t, manualFile, onChild = () => {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'elden-http-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const child = spawn(process.execPath, ['server/index.js', '--mock', '--port', '0', '--manual-state', manualFile || path.join(dir, 'state.json')],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  onChild(child);
  t.after(async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const stopped = new Promise((resolve) => child.once('exit', resolve));
    child.kill();
    await stopped;
  });
  return new Promise((resolve, reject) => {
    let output = '';
    child.on('error', reject);
    child.once('exit', (code) => reject(new Error(`server exited ${code}: ${output}`)));
    child.stdout.on('data', (chunk) => {
      output += chunk;
      const match = /open  http:\/\/localhost:(\d+)/.exec(output);
      if (match) resolve(`http://127.0.0.1:${match[1]}`);
    });
    child.stderr.on('data', (chunk) => { output += chunk; });
  });
}
async function connect(t, base) {
  const controller = new AbortController();
  t.after(() => controller.abort());
  const response = await fetch(`${base}/api/events`, { signal: controller.signal });
  assert.equal(response.status, 200);
  const reader = response.body.getReader();
  let pending = '';
  return async () => {
    for (;;) {
      const end = pending.indexOf('\n\n');
      if (end >= 0) {
        const frame = pending.slice(0, end); pending = pending.slice(end + 2);
        const match = /^data: (.+)$/m.exec(frame);
        if (frame.startsWith('event: state') && match) return JSON.parse(match[1]);
      } else {
        const { value, done } = await reader.read();
        assert.equal(done, false);
        pending += new TextDecoder().decode(value);
      }
    }
  };
}

test('HTTP and SSE share mock state, isolate characters and recover on reconnect', { timeout: 10000 }, async (t) => {
  const base = await launch(t);
  const post = (route, body, headers = {}) => fetch(base + route, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
  const next = await connect(t, base);
  const initial = await next();
  assert.equal(initial.source, 'mock');
  assert.equal(initial.mapSource, 'synthetic');
  assert.deepEqual((await (await fetch(base + '/api/markers')).json()).markers, []);
  assert.equal(initial.characters.length, 2);
  assert.equal(initial.live.enabled, false);
  assert.ok(!JSON.stringify(initial).includes('_flags'));
  const selection = { profileId: 'mock:jinx', snapshotId: 'completed' };
  assert.equal((await post('/api/mock/snapshot', selection, { Origin: 'http://example.com' })).status, 403);
  assert.equal((await post('/api/mock/snapshot', selection)).status, 200);
  const completed = await next();
  assert.equal(completed.characters[0].quests[0].status, 'completed');
  assert.equal(completed.characters[1].snapshotId, 'not-started');
  const reconnect = await connect(t, base);
  assert.deepEqual(await reconnect(), await (await fetch(base + '/api/state')).json());
  assert.equal((await post('/api/mock/snapshot', { ...selection, snapshotId: 'not-started' })).status, 200);
  assert.equal((await next()).characters[0].quests[0].steps[0].status, 'available');
  assert.equal((await post('/api/saves', { path: 'mock://demo', slot: 1 })).status, 200);
  assert.equal((await next()).activeSlot, 1);
  assert.equal((await post('/api/saves', { path: '/etc/passwd', slot: 0 })).status, 400);
  assert.equal((await post('/api/check', { id: 'anything', on: true })).status, 409);
  assert.equal((await post('/api/mock/snapshot', { ...selection, snapshotId: 'bad' })).status, 400);
  const manual = { profileId: 'mock:jinx', type: 'check', id: 'mock.millicent.meet', on: true };
  assert.equal((await post('/api/manual', manual, { Origin: 'http://evil.example' })).status, 403);
  assert.equal((await post('/api/manual', manual)).status, 200);
  const updated = await next();
  assert.equal(updated.characters[0].manual.checked['mock.millicent.meet'], true);
  assert.deepEqual(updated.characters[1].manual, { checked: {}, custom: [] });
  assert.equal(updated.characters[0].quests[0].steps[0].status, 'available');
  assert.equal((await post('/api/manual', { ...manual, profileId: 'other' })).status, 400);
  assert.equal((await fetch(base + '/api/saves')).status, 200);
  assert.equal((await fetch(base + '/')).status, 200);
  const manifest = await (await fetch(base + '/tiles/manifest.json')).json();
  assert.equal(manifest.masters.M00.width, 1024);
  const tile = await fetch(base + '/tiles/M00/0/0/0.svg');
  assert.equal(tile.headers.get('content-type'), 'image/svg+xml');
  assert.match(await tile.text(), /coordenadas fictícias/);
});

test('mock refuses real saves, memory reading and LAN', { timeout: 10000 }, async () => {
  for (const extra of [['--save', '/does/not/exist'], ['--live-memory'], ['--lan'], ['--mock-map', 'invalid']]) {
    const child = spawn(process.execPath, ['server/index.js', '--mock', ...extra], { cwd: root });
    const code = await new Promise((resolve) => child.once('exit', resolve));
    assert.equal(code, 1);
  }
});

test('manual progress survives a server process restart', { timeout: 10000 }, async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'elden-restart-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'manual.json');
  let child;
  const first = await launch(t, file, (process) => { child = process; });
  const response = await fetch(first + '/api/manual', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: 'mock:jinx', type: 'create', title: 'Keep after restart' }),
  });
  assert.equal(response.status, 200);
  const saved = (await response.json()).manual;
  const stopped = new Promise((resolve) => child.once('exit', resolve));
  child.kill();
  await stopped;
  const second = await launch(t, file);
  const state = await (await fetch(second + '/api/state')).json();
  assert.deepEqual(state.characters[0].manual, saved);
  assert.deepEqual(state.characters[1].manual, { checked: {}, custom: [] });
});
