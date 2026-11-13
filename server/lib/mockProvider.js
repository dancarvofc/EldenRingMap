'use strict';
const { ManualState } = require('./manualState');
const fixture = require('../../fixtures/mock/millicent.json');
const { evaluateMillicent } = require('./questRules');

class MockProvider {
  constructor(manualFile) {
    this.manual = manualFile ? new ManualState(manualFile, fixture.profiles.map((p) => p.profileId)) : null;
    this.selected = new Map(fixture.profiles.map((p) => [p.profileId, 'not-started']));
    this.revision = 0;
  }

  select(profileId, snapshotId) {
    if (!this.selected.has(profileId)) throw new Error('Unknown mock profile');
    if (!Object.hasOwn(fixture.snapshots, snapshotId)) throw new Error('Unknown mock snapshot');
    this.selected.set(profileId, snapshotId);
    this.revision++;
  }

  read() {
    return {
      source: 'mock', notice: fixture.notice, revision: this.revision, encrypted: false,
      characters: fixture.profiles.map((profile) => {
        const snapshotId = this.selected.get(profile.profileId);
        const flags = fixture.snapshots[snapshotId];
        const snapshot = { source: 'mock', integrity: 'valid',
          getFlag: (id) => Object.hasOwn(flags, id) ? flags[id] : null };
        return { ...profile, source: 'mock', integrity: 'valid', snapshotId,
          manual: this.manual ? this.manual.read(profile.profileId) : { checked: {}, custom: [] },
          ok: true, secondsPlayed: 0, quests: [evaluateMillicent(snapshot)] };
      }),
    };
  }
}

module.exports = { MockProvider };
