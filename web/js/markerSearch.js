'use strict';
// Shared by global search, checklists and tests. No remote translation service.
(function (root) {
  const categoryTerms = {
    grace: 'grace graca', fragment: 'map fragment fragmento mapa',
    boss: 'boss chefe', npc: 'npc personagem',
    miquellas_crosses: 'miquella cross crosses cruz cruzes',
    evergaols: 'evergaol evergaols evergaol masmorra prisao',
    divine_towers: 'divine tower towers torre divina torres divinas',
    minor_erdtrees: 'minor erdtree erdtrees arvore arvore menor',
    hidden_passages: 'hidden passage passages passagem secreta passagens',
    imp_seal_statues: 'imp seal statue statues statue selo imp',
    portals: 'portal portals sending gate waygate portao portal',
    elevators: 'elevator elevators lift lifts well wells elevador elevadores poco pocos',
    dragon_shrines: 'dragon shrine shrines dragon communion santuario dragao',
    dungeons: 'dungeon dungeons grave graves tumba tumbas masmorra masmorras',
    caves: 'cave caves caverna cavernas', catacombs: 'catacomb catacombs catacumba catacumbas',
    tunnels: 'tunnel tunnels tunel tunels', forts: 'fort forts forte fortes',
    shacks: 'shack shacks cabin cabins hut hovel cabana cabanas choupana',
    churches: 'church churches cathedral igreja igrejas catedral',
    castles: 'castle castles manor palacio castelo castelos',
    ruins: 'ruin ruins ruina ruinas', towers: 'tower towers rise torre torres',
    scadutree_fragments: 'scadutree fragment fragments fragmento fragmentos arvore sombria',
    revered_spirit_ashes: 'revered spirit ash ashes cinza cinzas espirito reverenciado invocacao invocacoes',
  };
  function normalize(text) {
    return String(text || '').normalize('NFKD').replace(/\p{M}/gu, '')
      .toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }
  function displayName(marker) {
    return marker?.names?.en || marker?.name || Object.values(marker?.names || {}).find(Boolean) || '';
  }
  function matches(marker, query) {
    const tokens = normalize(query).split(' ').filter(Boolean);
    const names = marker?.names ? Object.values(marker.names) : [marker?.name || ''];
    const haystack = normalize([...names, ...Object.values(marker?.reference?.locationNames || {}), ...(marker?.aliases || []), categoryTerms[marker?.cat] || ''].join(' '));
    return tokens.every((token) => haystack.includes(token));
  }
  const compare = (a, b) => (displayName(a) + ' ' + (a?.reference?.locationNames?.en || '')).localeCompare(displayName(b) + ' ' + (b?.reference?.locationNames?.en || ''), 'en');
  const api = { normalize, displayName, matches, compare };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MarkerSearch = api;
})(globalThis);
