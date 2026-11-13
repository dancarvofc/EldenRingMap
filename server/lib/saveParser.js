'use strict';
/**
 * Read an Elden Ring save into the shape the map UI needs.
 *
 * Read-only. Nothing in this project ever writes to your save file.
 */
const fs = require('fs');
const { createHash } = require('crypto');
const { readBnd4, readEntryPayload } = require('./bnd4');
const { walkSlot, readCharacter, readPosition, EventFlags, EF_LEN } = require('./slotWalk');

/* USER_DATA010 - the summary shown on the load-game screen. Offsets are
 * relative to the entry payload and cross-checked against EldenRingSaveCopier. */
const HDR = {
  ACTIVE: 0x1954,     // uint8[10], 1 = slot occupied
  NAME0: 0x195e,      // UTF-16LE, 16 chars + NUL
  STRIDE: 0x24c,
  NAME_BYTES: 0x22,
  LEVEL: 0x22,        // relative to the name
  SECONDS: 0x26,
  RUNES_MEMORY: 0x2a,
  MAP_ID: 0x2e,
};
const MAX_SLOTS = 10;

function loadFlagGroups(file) {
  const groups = new Map();
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const c = line.indexOf(',');
    if (c > 0) groups.set(Number(line.slice(0, c)), Number(line.slice(c + 1)));
  }
  return groups;
}

function readUtf16z(buf, off, maxBytes) {
  let e = off;
  const limit = Math.min(off + maxBytes, buf.length - 1);
  while (e < limit && buf.readUInt16LE(e) !== 0) e += 2;
  return buf.toString('utf16le', off, e);
}

function readProfiles(payload) {
  const out = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    const n = HDR.NAME0 + i * HDR.STRIDE;
    if (n + HDR.SECONDS + 4 > payload.length) break;
    out.push({
      slot: i,
      active: payload[HDR.ACTIVE + i] === 1,
      name: readUtf16z(payload, n, HDR.NAME_BYTES),
      level: payload.readUInt32LE(n + HDR.LEVEL),
      secondsPlayed: payload.readUInt32LE(n + HDR.SECONDS),
    });
  }
  return out;
}

/**
 * Read the save file, tolerating the game rewriting it underneath us.
 *
 * The file is always exactly the same size, so "has the write finished?" cannot
 * be answered by watching the size. The per-entry MD5 can answer it exactly: if
 * the digests verify, we read a complete, consistent file.
 */
function readStable(file, tries = 15, waitMs = 80) {
  const sab = new Int32Array(new SharedArrayBuffer(4));

  for (let i = 0; i < tries; i++) {
    try {
      const buf = fs.readFileSync(file);
      const { entries } = readBnd4(buf);
      const ok = entries.every((entry) => readEntryPayload(buf, entry).checksumOk);
      if (ok) return buf;
    } catch { /* Incomplete container or payload; retry a fresh read. */ }
    Atomics.wait(sab, 0, 0, waitMs);
  }
  return null;   // Never return an unverified snapshot.
}

class SaveReader {
  constructor(savePath, bstPath) {
    this.savePath = savePath;
    this.groups = loadFlagGroups(bstPath);
  }

  read() {
    const buf = readStable(this.savePath);
    if (!buf) throw new Error(`could not read a checksum-verified save: ${this.savePath}`);

    const { entries } = readBnd4(buf);
    const byName = new Map(entries.map((e) => [e.name, e]));
    const headerEntry = byName.get('USER_DATA010') || entries[10];
    const header = readEntryPayload(buf, headerEntry);
    if (!header.checksumOk) throw new Error('Invalid save summary checksum');
    const profiles = readProfiles(header.payload);

    const characters = [];
    for (const p of profiles) {
      if (!p.active) continue;
      const ent = byName.get(`USER_DATA${String(p.slot).padStart(3, '0')}`) || entries[p.slot];
      if (!ent) continue;
      const res = readEntryPayload(buf, ent);
      const c = { ...p, checksumOk: res.checksumOk, encrypted: res.encrypted,
        observationToken: createHash('sha256').update(res.payload).update(JSON.stringify(p)).digest('hex') };
      try {
        if (!res.checksumOk) throw new Error('Invalid character checksum');
        const w = walkSlot(res.payload);
        c.stats = readCharacter(res.payload, w);
        c.deaths = w.deaths;
        c.lastRestedGrace = w.lastRestedGrace;
        c.regionCount = w.regionCount;
        try {
          c.position = readPosition(res.payload, w);
        } catch {
          c.position = null;              // least-anchored field; never fatal
        }
        c._flags = new EventFlags(res.payload, w.eventFlags, this.groups);
        c.flagOffset = w.eventFlags;
        c.ok = true;
      } catch (err) {
        c.ok = false;
        c.error = err.message;
      }
      characters.push(c);
    }
    return { encrypted: header.encrypted, characters };
  }
}

module.exports = { SaveReader, readProfiles, loadFlagGroups, readStable, EF_LEN };
