'use strict';
window.Companion = (() => {
  let character = null;
  const byId = (id) => document.getElementById(id);
  const labels = { completed: 'Concluída automaticamente', available: 'Disponível', blocked: 'Bloqueada', missed: 'Perdida', unknown: 'Desconhecida' };
  function element(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  async function post(route, data) {
    byId('companion-error').textContent = '';
    byId('profile-error').textContent = '';
    try {
      const response = await fetch(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha ao salvar');
      return true;
    } catch (error) {
      const errorId = state.source === 'save-copy' ? 'profile-error' : 'companion-error';
      byId(errorId).textContent = `Não foi possível salvar: ${error.message}`;
      return false;
    }
  }
  async function manual(action) {
    if (!character) return false;
    return post('api/manual', { profileId: character.profileId,
      ...(state.source === 'save-copy' ? { slot: character.slot, observationToken: character.observationToken } : {}), ...action });
  }
  function render(snapshot, selected) {
    byId('save-copy-notice').hidden = snapshot.source !== 'save-copy';
    const panel = byId('companion');
    const real = snapshot.source === 'save-copy';
    panel.setAttribute('aria-label', real ? 'Minha lista por perfil' : 'Companion simulado');
    character = selected;
    renderMilestones();
    panel.hidden = snapshot.source !== 'mock' && !(real && selected?.profileId);
    document.body.classList.toggle('real-profile-mode', real);
    if (real && selected) renderAssociation(snapshot, selected);
    document.body.classList.toggle('mock-mode', snapshot.source === 'mock');
    if (panel.hidden || !selected) return;
    character = selected;
    const localMap = snapshot.mapSource === 'local' || real;
    document.body.classList.toggle('local-map', localMap);
    panel.querySelector('.simulation-badge').textContent = localMap
      ? 'MAPA REAL LOCAL · progresso simulado · NPC fictício oculto'
      : 'SIMULAÇÃO · sem dados reais do jogo';
    byId('mock-snapshot').value = selected.snapshotId;
    byId('mock-snapshot').onchange = (event) => post('api/mock/snapshot', {
      profileId: selected.profileId, snapshotId: event.target.value,
    });
    const timeline = byId('quest-timeline');
    timeline.replaceChildren();
    for (const quest of selected.quests || []) {
      for (const step of quest.steps) {
        const card = element('article', undefined, `quest-step status-${step.status}`);
        card.append(element('h3', step.title), element('p', labels[step.status] || step.status, 'automatic-status'));
        const label = element('label', undefined, 'manual-check');
        const input = element('input'); input.type = 'checkbox';
        input.checked = !!selected.manual.checked[step.id];
        input.onchange = async () => { input.disabled = true; if (!await manual({ type: 'check', id: step.id, on: input.checked })) { input.checked = !input.checked; input.disabled = false; } };
        label.append(input, element('span', 'Minha marcação manual'));
        const details = element('details');
        details.append(element('summary', 'Ver evidências'));
        details.append(element('p', `${step.source} · ${step.ruleId} · v${step.ruleVersion}`));
        for (const condition of step.conditions) details.append(element('p', `${condition.id}: esperado ${condition.expected}; observado ${condition.observed === null ? 'desconhecido' : condition.observed}`));
        details.append(element('p', step.explanation));
        card.append(label, details); timeline.append(card);
      }
    }
    const custom = byId('custom-objectives'); custom.replaceChildren();
    if (!selected.manual.custom.length) custom.append(element('p', 'Sua lista está vazia.', 'dim'));
    for (const item of selected.manual.custom) {
      const row = element('div', undefined, 'custom-row');
      const label = element('label'); const input = element('input'); input.type = 'checkbox'; input.checked = item.checked;
      input.onchange = async () => { input.disabled = true; if (!await manual({ type: 'toggle', id: item.id, on: input.checked })) { input.checked = !input.checked; input.disabled = false; } };
      label.append(input, element('span', item.title));
      const remove = element('button', 'Remover'); remove.type = 'button'; remove.onclick = () => manual({ type: 'delete', id: item.id });
      row.append(label, remove); custom.append(row);
    }
    byId('custom-form').onsubmit = async (event) => {
      event.preventDefault();
      const input = byId('custom-title'); const title = input.value;
      if (await manual({ type: 'create', title }) && input.value === title) input.value = '';
    };
    if (real) return;
    const npc = selected.quests?.[0]?.npc;
    const id = 'mock.npc.millicent';
    state.markers = state.markers.filter((marker) => marker.id !== id);
    state.byId.delete(id);
    if (!localMap && npc && npc.status !== 'unknown') {
      const marker = { ...npc, id, cat: 'poi', names: { en: 'Millicent · SIMULAÇÃO', ru: 'Millicent · SIMULAÇÃO' } };
      state.markers.push(marker); state.byId.set(id, marker); state.enabled.add('poi');
    }
    byId('focus-npc').textContent = localMap ? 'Posição real do NPC ainda não validada' : 'Ver NPC no mapa';
    byId('focus-npc').disabled = localMap || !npc || npc.status === 'unknown';
    byId('focus-npc').onclick = () => {
      if (state.master !== npc.master) switchMaster(npc.master);
      map.flyTo(npc.px, npc.py, 0.9);
      if (matchMedia('(max-width: 700px)').matches) byId('sb-collapse').click();
    };
    if (state.selected === id) closePopup();
  }
  function renderAssociation(snapshot, selected) {
    const profiles = snapshot.manualProfiles || [];
    const currentProfile = profiles.find((p) => p.profileId === selected.profileId);
    byId('profile-status').textContent = currentProfile
      ? `Perfil associado: ${currentProfile.label}` : 'Sem associação: suas marcações estão protegidas.';
    const select = byId('profile-select'); const previous = select.value;
    select.replaceChildren();
    for (const profile of profiles) {
      const option = element('option', profile.label); option.value = profile.profileId; select.append(option);
    }
    if (profiles.some((p) => p.profileId === previous)) select.value = previous;
    byId('profile-bind').disabled = !profiles.length;
    const association = (data) => post('api/profiles', { ...data, slot: selected.slot, observationToken: selected.observationToken });
    byId('profile-create').onclick = () => association({ type: 'create', label: byId('profile-label').value });
    byId('profile-bind').onclick = () => association({ type: 'bind', profileId: select.value });
  }
  function renderMilestones() {
    const section = byId('real-milestones');
    section.hidden = state.source !== 'save-copy';
    if (section.hidden) return;
    const milestones = character?.milestones || [];
    const completed = milestones.filter((item) => item.status === 'completed').length;
    byId('milestone-count').textContent = `(${completed}/${milestones.length})`;
    const input = byId('milestone-search'); const status = byId('milestone-status'); const layer = byId('milestone-layer');
    input.oninput = renderMilestones; status.onchange = renderMilestones; layer.onchange = renderMilestones;
    const query = input.value.trim().toLocaleLowerCase();
    const list = byId('milestone-list'); list.replaceChildren();
    const visible = milestones.filter((item) => {
      const marker = state.byId.get(item.markerId);
      return (!query || (marker ? nameOf(marker) : item.markerId).toLocaleLowerCase().includes(query)) &&
        (status.value === 'all' || item.status === status.value) &&
        (layer.value === 'all' || marker?.master === state.master);
    });
    byId('milestone-filter-count').textContent = `${visible.length} de ${milestones.length} marcadores`;
    if (!visible.length) list.append(element('p', 'Nenhum marcador corresponde aos filtros.', 'dim'));
    for (const item of visible) {
      const marker = state.byId.get(item.markerId);
      const card = element('article', undefined, `milestone status-${item.status}`);
      card.dataset.markerId = item.markerId;
      const title = element('h3', marker ? nameOf(marker) : item.markerId);
      const statusLabels = { completed: 'Derrota registrada', 'not-recorded': 'Derrota não registrada', unknown: 'Desconhecido' };
      card.append(title, element('p', `${statusLabels[item.status]} · ${marker?.master || 'Camada desconhecida'}`, 'milestone-status'));
      const details = element('details'); details.append(element('summary', 'Ver evidências'));
      details.append(element('p', `${item.source} · ${item.ruleId} · v${item.ruleVersion}`));
      details.append(element('p', item.flagSource));
      for (const condition of item.conditions) details.append(element('p', `Flag ${condition.id}: esperado ${condition.expected}; observado ${condition.observed === null ? 'desconhecido' : condition.observed}`));
      details.append(element('p', item.explanation)); card.append(details);
      const focus = element('button', 'Ver no mapa'); focus.type = 'button';
      focus.disabled = !marker || !masterInfo(marker.master) || !Number.isFinite(marker.px) || !Number.isFinite(marker.py);
      focus.onclick = () => {
        setFollow(false);
        if (state.master !== marker.master) switchMaster(marker.master);
        state.enabled.add(marker.cat); buildCategories();
        map.flyTo(marker.px, marker.py, 0.9);
        showPopup(marker);
        if (matchMedia('(max-width: 700px)').matches) byId('sb-collapse').click();
      };
      card.append(focus); list.append(card);
    }
  }
  return { render, manual, refreshMilestones: renderMilestones };
})();
