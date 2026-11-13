'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { readBnd4, readEntryPayload, md5, ER_SAVE_KEY } = require('../server/lib/bnd4');
const { SaveReader, readStable } = require('../server/lib/saveParser');

// Original synthetic container, not game data. Blank slot structure is sufficient
// to exercise flag exposure; only a fictitious header name is populated.
function fixture(encrypted = false) {
  const names = Array.from({ length: 12 }, (_, i) => Buffer.from(`USER_DATA${String(i).padStart(3, '0')}\0`, 'utf16le'));
  const payloads = names.map((_, i) => Buffer.alloc(i === 0 ? 0x280000 : i === 10 ? 0x4000 : 64));
  payloads[10][0x1954] = 1;
  payloads[10].write('Synthetic', 0x195e, 'utf16le');
  const blocks = payloads.map((payload) => {
    const body = Buffer.concat([md5(payload), payload]);
    if (!encrypted) return body;
    const iv = Buffer.alloc(16, 7);
    const cipher = crypto.createCipheriv('aes-128-cbc', ER_SAVE_KEY, iv);
    cipher.setAutoPadding(false);
    return Buffer.concat([iv, cipher.update(body), cipher.final()]);
  });
  let offset = 0x40 + 12 * 32 + names.reduce((n, b) => n + b.length, 0);
  const buf = Buffer.alloc(offset + blocks.reduce((n, b) => n + b.length, 0));
  buf.write('BND4'); buf.writeUInt32LE(12, 12);
  let nameOffset = 0x40 + 12 * 32;
  blocks.forEach((block, i) => {
    const entry = 0x40 + i * 32;
    buf.writeBigUInt64LE(BigInt(block.length), entry + 8);
    buf.writeUInt32LE(offset, entry + 16); buf.writeUInt32LE(nameOffset, entry + 20);
    names[i].copy(buf, nameOffset); block.copy(buf, offset);
    nameOffset += names[i].length; offset += block.length;
  });
  return buf;
}
function files(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'elden-integrity-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const bst = path.join(dir, 'flags.txt'); fs.writeFileSync(bst, '');
  return { file: path.join(dir, 'synthetic.sl2'), bst };
}
test('verified raw and AES containers expose flags only after integrity passes', (t) => {
  const { file, bst } = files(t);
  for (const encrypted of [false, true]) {
    const buf = fixture(encrypted); fs.writeFileSync(file, buf);
    const reader = new SaveReader(file, bst);
    const result = reader.read();
    assert.equal(result.characters[0].name, 'Synthetic');
    assert.equal(result.characters[0].checksumOk, true);
    assert.equal(result.characters[0].ok, true);
    assert.equal(result.characters[0]._flags.get(123), null);
    assert.deepEqual(readStable(file, 1, 0), buf);
  }
});
test('corrupt character or summary never yields a usable stable snapshot', (t) => {
  const { file, bst } = files(t);
  for (const index of [0, 10]) {
    const buf = fixture(); const { entries } = readBnd4(buf);
    buf[entries[index].dataOffset + 20] ^= 1;
    fs.writeFileSync(file, buf);
    assert.equal(readStable(file, 1, 0), null);
  }
  assert.throws(() => new SaveReader(file, bst).read(), /checksum-verified/);
});
test('truncated directories, invalid bounds and missing entries are rejected', () => {
  const buf = fixture();
  assert.throws(() => readBnd4(buf.subarray(0, 80)), /Truncated/);
  const broken = Buffer.from(buf); broken.writeBigUInt64LE(BigInt(buf.length), 0x48);
  assert.throws(() => readBnd4(broken), /bounds/);
  assert.throws(() => readEntryPayload(buf, undefined), /Missing/);
});

test('save-copy HTTP exposes verified progress and refuses manual writes or foreign files', { timeout: 10000 }, async (t) => {
  const { spawn } = require('node:child_process');
  const { file } = files(t); const buf = fixture(); fs.writeFileSync(file, buf);
  const child = spawn(process.execPath, ['server/index.js', '--save-copy', file, '--port', '0'], { cwd: path.join(__dirname, '..') });
  t.after(async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const stopped = new Promise((resolve) => child.once('exit', resolve)); child.kill(); await stopped;
  });
  const base = await new Promise((resolve, reject) => {
    let output = '';
    child.stdout.on('data', (data) => { output += data; const match = /open  http:\/\/localhost:(\d+)/.exec(output); if (match) resolve(`http://127.0.0.1:${match[1]}`); });
    child.once('error', reject); child.once('exit', (code) => reject(new Error(`Server exited ${code}: ${output}`)));
  });
  const get = async () => (await fetch(base + '/api/state')).json();
  const post = (route, data) => fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const initial = await get();
  assert.equal(initial.source, 'save-copy'); assert.equal(initial.readOnly, true);
  assert.equal(initial.questsStatus, 'unknown'); assert.equal(initial.live.enabled, false);
  assert.equal(initial.characters[0].checksumOk, true);
  assert.deepEqual(initial.checked, {});
  assert.ok(!JSON.stringify(initial).includes('_flags'));
  assert.equal((await post('/api/check', { id: 'example', on: true })).status, 409);
  assert.equal((await post('/api/saves', { path: file, slot: 0 })).status, 200);
  assert.equal((await get()).activeSlot, 0);
  assert.equal((await post('/api/saves', { path: '/etc/passwd', slot: 0 })).status, 400);
  assert.deepEqual(fs.readFileSync(file), buf);
});
