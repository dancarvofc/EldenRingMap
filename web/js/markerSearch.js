'use strict';
// Shared by global search, checklists and tests. No remote translation service.
(function (root) {
  const categoryTerms = {
    grace: 'grace graca', fragment: 'map fragment fragmento mapa',
    boss: 'boss chefe', npc: 'npc personagem',
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
