'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ManualState } = require('../server/lib/manualState');
const { MockProvider } = require('../server/lib/mockProvider');
function location(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'elden-manual-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return path.join(dir, 'manual.json');
}
test('manual objectives survive reload and automatic regression without profile leakage', (t) => {
  const file = location(t);
  const provider = new MockProvider(file);
  const store = provider.manual;
  store.update('mock:jinx', { type: 'check', id: 'mock.millicent.meet', on: true });
  const created = store.update('mock:jinx', { type: 'create', title: ' Explore later ' });
  const id = created.custom[0].id;
  store.update('mock:jinx', { type: 'toggle', id, on: true });
  provider.select('mock:jinx', 'completed');
  provider.select('mock:jinx', 'not-started');
  const characters = provider.read().characters;
  assert.equal(characters[0].quests[0].steps[0].status, 'available');
  assert.equal(characters[0].manual.checked['mock.millicent.meet'], true);
  assert.deepEqual(characters[1].manual, { checked: {}, custom: [] });
  const reloaded = new MockProvider(file).manual;
  assert.deepEqual(reloaded.read('mock:jinx'), store.read('mock:jinx'));
  assert.equal(reloaded.read('mock:jinx').custom[0].checked, true);
  reloaded.update('mock:jinx', { type: 'check', id: 'mock.millicent.meet', on: false });
  reloaded.update('mock:jinx', { type: 'delete', id });
  assert.deepEqual(reloaded.read('mock:jinx'), { checked: {}, custom: [] });
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['manual.json']);
});
test('invalid actions, corrupt data and failed disk writes preserve existing state', (t) => {
  const file = location(t);
  const store = new ManualState(file, ['mock:jinx']);
  store.update('mock:jinx', { type: 'create', title: 'Keep me' });
  const before = fs.readFileSync(file, 'utf8');
  for (const [profile, action] of [
    ['other', { type: 'create', title: 'Wrong profile' }],
    ['mock:jinx', { type: 'check', id: '__proto__', on: true }],
    ['mock:jinx', { type: 'check', id: 'x', on: 'false' }],
    ['mock:jinx', { type: 'create', title: ' ' }],
    ['mock:jinx', { type: 'delete', id: 'missing' }],
  ]) assert.throws(() => store.update(profile, action));
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  const expected = store.read('mock:jinx');
  store.file = path.join(file, 'impossible.json');
  assert.throws(() => store.update('mock:jinx', { type: 'create', title: 'Cannot save' }));
  assert.deepEqual(store.read('mock:jinx'), expected);
  fs.writeFileSync(file, '{broken');
  assert.throws(() => new ManualState(file, ['mock:jinx']));
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
});
