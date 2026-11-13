'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateBossMilestones } = require('../server/lib/milestones');
const markers = [
  { id: 'synthetic-boss', cat: 'boss', flag: 1 },
  { id: 'synthetic-grace', cat: 'grace', flag: 2 },
];
const character = (value) => ({ ok: true, checksumOk: true, _flags: { get: () => value } });

test('boss milestones use existing defeat markers with auditable conditions', () => {
  const result = evaluateBossMilestones(character(true), markers);
  assert.equal(result.length, 1);
  assert.equal(result[0].markerId, 'synthetic-boss');
  assert.equal(result[0].status, 'completed');
  assert.deepEqual(result[0].conditions, [{ id: 1, expected: true, observed: true }]);
  assert.equal(result[0].ruleVersion, 1);
  assert.equal(result[0].source, 'save-copy');
});

test('false, null and invalid evidence never imply availability or missed quests', () => {
  assert.equal(evaluateBossMilestones(character(false), markers)[0].status, 'not-recorded');
  for (const value of [null, undefined, 1, 'true']) {
    assert.equal(evaluateBossMilestones(character(value), markers)[0].status, 'unknown');
  }
  assert.equal(evaluateBossMilestones({ ...character(true), checksumOk: false }, markers)[0].status, 'unknown');
  assert.equal(evaluateBossMilestones({ ...character(true), ok: false }, markers)[0].status, 'unknown');
  assert.equal(evaluateBossMilestones(character(true), [{ id: 'missing', cat: 'boss' }])[0].status, 'unknown');
});

test('multiple flags follow original any-true semantics and recompute on regression', () => {
  const multiple = [{ id: 'synthetic-multiple', cat: 'boss', flags: [1, 2, 1] }];
  const first = { ok: true, checksumOk: true, _flags: { get: (id) => id === 1 ? null : true } };
  const before = evaluateBossMilestones(first, multiple);
  assert.equal(before[0].status, 'completed');
  assert.equal(before[0].conditions.length, 2);
  const restored = evaluateBossMilestones(character(false), multiple);
  assert.equal(restored[0].status, 'not-recorded');
  assert.equal(before[0].status, 'completed');
  assert.equal(evaluateBossMilestones({ ...first, _flags: { get: (id) => id === 1 ? null : false } }, multiple)[0].status, 'unknown');
});
