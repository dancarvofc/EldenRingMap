'use strict';

// Illustrative rules only. No real flags, coordinates or third-party quest data.
const STEPS = [
  { id: 'meet', flag: 'mock.millicent.met', title: 'Meet Millicent (simulation)' },
  { id: 'help', flag: 'mock.millicent.helped', title: 'Help Millicent (simulation)' },
  { id: 'finish', flag: 'mock.millicent.finished', title: 'Complete illustrative branch (simulation)' },
];

function evaluateMillicent(snapshot) {
  const observed = STEPS.map(({ flag }) => {
    const value = snapshot.integrity === 'valid' ? snapshot.getFlag(flag) : null;
    return typeof value === 'boolean' ? value : null;
  });
  // Later completion without its prerequisites is not trustworthy evidence.
  const conflict = observed.some((value, i) => value === true && observed.slice(0, i).includes(false));
  const steps = STEPS.map((step, i) => {
    const conditions = STEPS.slice(0, i + 1).map((s, j) => ({
      id: s.flag, expected: true, observed: observed[j],
    }));
    const prior = observed.slice(0, i);
    const status = conflict || conditions.some((c) => c.observed === null) ? 'unknown'
      : observed[i] ? 'completed'
      : prior.every(Boolean) ? 'available' : 'blocked';
    return {
      id: `mock.millicent.${step.id}`, title: step.title, status,
      source: snapshot.source, ruleId: `mock.millicent.${step.id}`, ruleVersion: 1,
      conditions, explanation: conflict ? 'Conflicting mock flags; no conclusion.'
        : status === 'unknown' ? 'Insufficient trustworthy data.' : 'Fictional demonstration rule.',
    };
  });
  const uncertain = conflict || observed.includes(null);
  const stage = observed[2] ? 2 : observed[1] ? 1 : 0;
  return {
    id: 'mock.millicent', title: 'Millicent — SIMULATION', source: snapshot.source,
    status: uncertain ? 'unknown' : observed[2] ? 'completed' : 'available', steps,
    npc: uncertain ? { id: 'mock.millicent', status: 'unknown', synthetic: true }
      : { id: 'mock.millicent', status: observed[2] ? 'next' : 'current', synthetic: true,
          master: 'M00', px: [256, 512, 768][stage], py: [768, 512, 256][stage] },
  };
}

module.exports = { evaluateMillicent };
