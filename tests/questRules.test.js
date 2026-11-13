'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MockProvider } = require('../server/lib/mockProvider');
const { evaluateMillicent } = require('../server/lib/questRules');

test('three snapshots recalculate evidence, NPC position and regression per profile', () => {
  const provider = new MockProvider();
  const quest = () => provider.read().characters[0].quests[0];
  assert.deepEqual(quest().steps.map((s) => s.status), ['available', 'blocked', 'blocked']);
  const start = quest().npc;
  provider.select('mock:jinx', 'intermediate');
  assert.deepEqual(quest().steps.map((s) => s.status), ['completed', 'completed', 'available']);
  assert.notDeepEqual(quest().npc, start);
  assert.equal(provider.read().characters[1].snapshotId, 'not-started');
  provider.select('mock:jinx', 'completed');
  assert.equal(quest().status, 'completed');
  for (const step of quest().steps) {
    assert.equal(step.ruleVersion, 1);
    assert.equal(step.source, 'mock');
    assert.ok(step.conditions.every((c) => c.expected === c.observed));
  }
  provider.select('mock:jinx', 'not-started');
  assert.equal(quest().steps[0].status, 'available');
  assert.deepEqual(quest().npc, start);
});

test('unknown, invalid and contradictory evidence never invent completion or missed', () => {
  for (const snapshot of [
    { integrity: 'valid', getFlag: () => null },
    { integrity: 'invalid', getFlag: () => true },
    { integrity: 'valid', getFlag: (id) => id.endsWith('finished') },
  ]) {
    const quest = evaluateMillicent({ source: 'mock', ...snapshot });
    assert.equal(quest.status, 'unknown');
    assert.equal(quest.npc.status, 'unknown');
    assert.ok(quest.steps.every((s) => s.status === 'unknown'));
  }
});

test('bad selection is rejected without modifying provider state', () => {
  const provider = new MockProvider();
  const before = provider.read();
  assert.throws(() => provider.select('other', 'completed'));
  assert.throws(() => provider.select('mock:jinx', '__proto__'));
  assert.deepEqual(provider.read(), before);
});
