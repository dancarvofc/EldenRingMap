'use strict';
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

class ManualState {
  constructor(file, profileIds = null) {
    this.dynamic = profileIds === null;
    this.file = file;
    this.profileIds = new Set(profileIds || []);
    this.state = { schemaVersion: 1, profiles: {} };
    try {
      const state = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (state.schemaVersion !== 1 || !state.profiles || typeof state.profiles !== 'object' || Array.isArray(state.profiles)) {
        throw new Error('Invalid manual state schema');
      }
      for (const profile of Object.values(state.profiles)) {
        if (!profile || !profile.checked || typeof profile.checked !== 'object' || Array.isArray(profile.checked) ||
            Object.values(profile.checked).some((v) => v !== true) || !Array.isArray(profile.custom) ||
            profile.custom.some((item) => !item || typeof item.id !== 'string' || typeof item.title !== 'string' || typeof item.checked !== 'boolean' || (item.markerId !== undefined && typeof item.markerId !== 'string'))) {
          throw new Error('Invalid manual profile');
        }
      }
      this.state = state;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error; // Never overwrite unreadable/corrupt progress.
    }
    if (this.dynamic) this.profileIds = new Set(Object.keys(this.state.profiles));
  }

  list() {
    return Object.entries(this.state.profiles).map(([profileId, profile]) => ({ profileId, label: profile.label || profileId }));
  }

  createProfile(label) {
    if (!this.dynamic || typeof label !== 'string' || !label.trim() || label.length > 100) throw new Error('Invalid profile label');
    const profileId = `local:${randomUUID()}`;
    const next = structuredClone(this.state);
    next.profiles[profileId] = { label: label.trim(), checked: {}, custom: [] };
    this.persist(next);
    this.profileIds.add(profileId);
    return profileId;
  }

  read(profileId) {
    if (!this.profileIds.has(profileId)) throw new Error('Unknown profile');
    return structuredClone(this.state.profiles[profileId] || { checked: {}, custom: [] });
  }

  update(profileId, action) {
    const profile = this.read(profileId);
    if (action.type === 'check') {
      if (typeof action.id !== 'string' || !action.id.length || action.id.length > 200 ||
          ['__proto__', 'constructor', 'prototype'].includes(action.id) || typeof action.on !== 'boolean') {
        throw new Error('Invalid checkbox');
      }
      if (action.on) profile.checked[action.id] = true;
      else delete profile.checked[action.id];
    } else if (action.type === 'create') {
      if (typeof action.title !== 'string' || !action.title.trim() || action.title.length > 300) throw new Error('Invalid title');
      if (action.markerId !== undefined && (typeof action.markerId !== 'string' || !action.markerId.length || action.markerId.length > 300)) throw new Error('Invalid marker reference');
      if (action.markerId && profile.custom.some((item) => item.markerId === action.markerId)) return this.read(profileId);
      if (profile.custom.length >= 1000) throw new Error('Custom objective limit reached');
      profile.custom.push({ id: randomUUID(), title: action.title.trim(), checked: false,
        ...(action.markerId ? { markerId: action.markerId } : {}) });
    } else if (action.type === 'toggle' || action.type === 'delete') {
      const item = profile.custom.find((i) => i.id === action.id);
      if (!item) throw new Error('Unknown custom objective');
      if (action.type === 'delete') profile.custom = profile.custom.filter((i) => i !== item);
      else {
        if (typeof action.on !== 'boolean') throw new Error('Invalid checkbox');
        item.checked = action.on;
      }
    } else throw new Error('Unknown manual action');
    const next = structuredClone(this.state);
    next.profiles[profileId] = profile;
    this.persist(next);
    return this.read(profileId);
  }

  persist(next) {
    const temporary = `${this.file}.${randomUUID()}.tmp`;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    try {
      fs.writeFileSync(temporary, JSON.stringify(next, null, 2), { flag: 'wx', mode: 0o600 });
      fs.renameSync(temporary, this.file);
    } finally {
      try { fs.unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    this.state = next; // Commit in memory only after successful disk replacement.
  }
}
module.exports = { ManualState };
