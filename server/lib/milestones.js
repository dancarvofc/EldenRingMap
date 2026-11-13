'use strict';

const RULES = {
  boss: { id: 'boss-defeat', flagSource: 'GameAreaParam.defeatBossFlagId', action: 'derrota' },
  grace: { id: 'grace-activation', flagSource: 'BonfireWarpParam.eventflagId', action: 'ativação da graça' },
  fragment: { id: 'map-fragment', flagSource: 'WorldMapPieceParam.openEventFlagId', action: 'coleta do fragmento' },
};

/** Semantic view of original markers; no quest or missability inference. */
function evaluateMarkers(character, markers, categories) {
  const trusted = character.ok === true && character.checksumOk === true && character._flags;
  return markers.filter((marker) => categories.includes(marker.cat)).map((marker) => {
    const rule = RULES[marker.cat];
    const flags = [...new Set(marker.flags || (marker.flag ? [marker.flag] : []))];
    const conditions = flags.map((id) => {
      const value = trusted && Number.isSafeInteger(id) && id > 0 ? character._flags.get(id) : null;
      return { id, expected: true, observed: typeof value === 'boolean' ? value : null };
    });
    // Old fragment datasets do not distinguish persistent ownership from pickup
    // animation. Require explicit provenance before claiming acquisition.
    const persistent = marker.cat !== 'fragment' || marker.flagSource === rule.flagSource;
    const status = !persistent ? 'unknown'
      : conditions.some((condition) => condition.observed === true) ? 'completed'
        : conditions.length && conditions.every((condition) => condition.observed === false) ? 'not-recorded' : 'unknown';
    return {
      markerId: marker.id, kind: marker.cat, status, source: 'save-copy',
      ruleId: `upstream.${rule.id}-marker`, ruleVersion: 1,
      flagSource: marker.flagSource || (marker.cat === 'fragment' ? 'Origem da flag não confirmada' : `upstream marker / ${rule.flagSource}`), conditions,
      explanation: !persistent ? 'A origem persistente da flag do fragmento não foi confirmada; uma animação de coleta não comprova posse atual.'
        : status === 'completed' ? `A flag de ${rule.action} associada ao marcador está ativa na cópia verificada.`
          : status === 'not-recorded' ? `A flag de ${rule.action} está desativada. Isso não indica disponibilidade do objetivo nem perda de quest.`
            : 'Não há evidência confiável suficiente para avaliar este marcador.',
    };
  });
}
const evaluateBossMilestones = (character, markers) => evaluateMarkers(character, markers, ['boss']);
const evaluateExploration = (character, markers) => evaluateMarkers(character, markers, ['grace', 'fragment']);
module.exports = { evaluateBossMilestones, evaluateExploration };
