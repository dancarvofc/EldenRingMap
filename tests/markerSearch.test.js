'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const search = require('../web/js/markerSearch');

test('English display with bilingual, accent-insensitive and punctuation-tolerant lookup', () => {
  const marker = { cat: 'boss', names: { en: 'Synthetic Thief of Fire', pt: 'Ladrão Sintético de Fogo' } };
  assert.equal(search.displayName(marker), marker.names.en);
  for (const term of ['thief', 'ladrão', 'ladrao', 'LADRAO', 'fogo sintetico', 'thief-of-fire']) assert.equal(search.matches(marker, term), true);
  assert.equal(search.matches(marker, 'unrelated place'), false);
  assert.equal(search.matches(marker, 'ladrao chefe'), true);
});

test('explicit aliases and official regional item names point to the same marker', () => {
  const npc = { cat: 'npc', names: { en: 'Millicent', pt: 'Millicent' }, aliases: ['Milicent'] };
  assert.ok(search.matches(npc, 'milicent'));
  const fragment = { cat: 'fragment', names: { en: 'Map: Example, West', pt: 'Mapa: Exemplo, Oeste' } };
  assert.ok(search.matches(fragment, 'map west'));
  assert.ok(search.matches(fragment, 'mapa oeste'));
  assert.equal(search.displayName(fragment), fragment.names.en);
});
