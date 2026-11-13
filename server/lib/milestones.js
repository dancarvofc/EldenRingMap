'use strict';

/** Semantic view of existing boss markers, not a quest or missability catalog. */
function evaluateBossMilestones(character, markers) {
  const trusted = character.ok === true && character.checksumOk === true && character._flags;
  return markers.filter((marker) => marker.cat === 'boss').map((marker) => {
    const flags = [...new Set(marker.flags || (marker.flag ? [marker.flag] : []))];
    const conditions = flags.map((id) => {
      const value = trusted && Number.isSafeInteger(id) && id > 0 ? character._flags.get(id) : null;
      return { id, expected: true, observed: typeof value === 'boolean' ? value : null };
    });
    const status = conditions.some((condition) => condition.observed === true) ? 'completed'
      : conditions.length && conditions.every((condition) => condition.observed === false) ? 'not-recorded' : 'unknown';
    return {
      markerId: marker.id, kind: 'boss', status, source: 'save-copy',
      ruleId: 'upstream.boss-defeat-marker', ruleVersion: 1,
      flagSource: 'upstream marker / GameAreaParam.defeatBossFlagId', conditions,
      explanation: status === 'completed' ? 'A flag de derrota associada ao marcador está ativa na cópia verificada.'
        : status === 'not-recorded' ? 'A flag de derrota está desativada. Isso não indica disponibilidade do chefe nem perda de quest.'
          : 'Não há evidência confiável suficiente para avaliar este marcador.',
    };
  });
}
module.exports = { evaluateBossMilestones };
