'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function camera() {
  const frames = new Map(); let id = 0;
  const context = { window: {}, performance: { now: () => 0 },
    requestAnimationFrame: (fn) => { frames.set(++id, fn); return id; }, cancelAnimationFrame: (key) => frames.delete(key) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../web/js/map.js'), 'utf8'), context);
  const map = Object.create(context.window.TileMap.prototype);
  Object.assign(map, { canvas: { getBoundingClientRect: () => ({ width: 1000, height: 800 }) }, width: 10000, height: 10000,
    cx: 5000, cy: 5000, scale: 0.08, minScale: 0.01, maxScale: 4, draw: () => {} });
  const advance = (time) => { const pending = [...frames.values()]; frames.clear(); pending.forEach((fn) => fn(time)); };
  return { map, frames, advance };
}
test('fit cancels an in-flight camera animation instead of being overwritten', () => {
  const { map, frames, advance } = camera();
  map.flyTo(1000, 1000, 1, 1000); advance(250);
  assert.notEqual(map.cx, 5000);
  map.fit(); advance(500); advance(1000);
  assert.equal(map.cx, 5000); assert.equal(map.cy, 5000); assert.equal(frames.size, 0);
});
test('a new flight owns the camera and destroying the map cancels all owned frames', () => {
  const { map, frames, advance } = camera();
  map.flyTo(1000, 1000, 1, 1000); advance(250);
  map.flyTo(8000, 8000, 1, 1000); advance(1000);
  assert.equal(map.cx, 8000);
  map.flyTo(1000, 1000, 1, 1000); map.requestDraw(); map.destroy();
  advance(1000); assert.equal(frames.size, 0); assert.equal(map.cx, 8000);
});
