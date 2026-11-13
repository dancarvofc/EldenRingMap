# TASK-001 — Auditoria, fork e plano mínimo da POC

**Fase:** M0 — descoberta técnica e estabelecimento do repositório de trabalho.
**Modo:** `AUDIT ONLY`. Nesta execução não alterar código nem arquivos, não instalar dependências, não criar commit, não efetuar fork remoto sem confirmação humana. Produzir diagnóstico e plano. Ler `PROJECT.md` e `AGENTS.md` primeiro.

## Contexto obrigatório

Queremos um companion de Elden Ring (jogo base + Shadow of the Erdtree) para o Steam Deck e navegador Android, mas TODO desenvolvimento inicial ocorrerá no Linux. O motor do mapa existente deve ser preservado. O marco M1 é um fluxo end-to-end com **Millicent simulada**, flags fictícias, NPC alterando local, timeline, checklist manual/automático e persistência isolada entre dois personagens. Não envolve hardware real ou integração com save `.sl2`. Ver `PROJECT.md` para especificação e referências.

## Upstream e estratégia de fork

Origem: https://github.com/egormagurin/EldenRingMap
Documentação: https://github.com/egormagurin/EldenRingMap/blob/main/docs/HOW-IT-WORKS.md

Confirmar se o diretório atual já é um clone e se há fork configurado. Inspecionar `git remote -v`, `git status --short`, branch, HEAD, `.gitignore`, README, LICENSE (se existir), scripts e convenções. Não presumir usuário do GitHub. Reportar o procedimento recomendado: fork do upstream na conta pessoal, clonar o fork no Linux, `origin` apontando para fork e `upstream` para original, branch de trabalho para cada alteração; alternativa inicial local enquanto são esclarecidas licenças. Nunca publicar artefatos extraídos do jogo.

Há permissão textual para copiar/modificar no README original, mas ausência de licença padronizada identificada previamente. Avaliar com cautela os direitos de redistribuição de derivados antes de uma publicação pública. O autor pode ser consultado.

## Arquivos a investigar de forma específica

- `package.json` e scripts de inicialização.
- `server/index.js`: startup exigindo save, `buildSnapshot`, seleção de personagem/save, `computeFound`, persistência manual, HTTP e SSE.
- `server/lib/saveParser.js`, `slotWalk.js`, `bnd4.js`: flags, integridade de checksum, identificação de perfil, falhas de parser.
- `server/lib/project.js`: conversão de coordenadas e camadas.
- `web/js/map.js`, `web/js/app.js`, `web/index.html`, `web/css/app.css`: camadas, marcadores dinâmicos, navegação para posição, UI mobile, eventos e `checked`.
- `tools/build_markers.py`, `tools/extract_items.py`, `tools/extract_tiles.py`, `data/eventflag_bst.txt`: origem e forma dos marcadores e flags.
- `.gitignore`, docs e testes existentes.

Verificar pontos já observados na revisão remota: `EventFlags.get(id)` retorna true/false/null; servidor recebe `--lan`; `/api/events` SSE; `/api/check` grava `userState.checked` global por ID; `buildSnapshot` retorna `found` por personagem mas não o bitfield; layers M00/M01/M10/M11. Corrigir essas observações se o workspace local diferir.

## Comparar fontes externas de dados (somente referência)

1. `jw-ofs/elden-ring-map/questlines.json` contém etapas narrativas e anchors de NPCs; verificar o formato e se há permissão de incorporar.
2. `Hapfel1/er-save-manager/src/er_save_manager/data/quest_flags.json` contém condições com flags 0 e 1, inclusive estados transitórios; licença source-available restritiva: NÃO COPIAR.
3. `EthanShoeDev/elden-ring-compass` contém parser TS, fixtures, testes e inventário; usar como material de comparação e verificar licença.
4. `Kamikaz07/Elden-Ring-Save-Editor`, `ClayAmore/ER-Save-Lib` e `soulsmods/Paramdex`: referências técnicas para o futuro, sem necessidade de dependência no M1.
5. Wikis Fextralife/Exputer: validação cruzada de sequência de quests, nunca fonte única.

**Não usar flags reais de terceiros nesta POC.** Preparar catálogo mock original com pelo menos três snapshots, coordenadas sintéticas e evidências claras.

## Perguntas que a auditoria deve responder

1. Quais arquivos e funções podem ser reutilizados sem mudanças?
2. Qual alteração mínima permite iniciar o servidor sem `.sl2` mantendo o caminho real intacto?
3. Onde integrar avaliação de regras de quests sem expor bitfield bruto ao browser?
4. Como enviar alterações de quest/NPC/checklist pelo SSE existente, sem stream paralelo?
5. Como incluir marcador NPC em `map.js`/`app.js` sem reimplementar renderização?
6. Como adaptar `userState.checked` ou introduzir estado paralelo por personagem sem perder dados antigos?
7. Como identificar perfis em mock e que hipótese de identidade real precisa ser validada?
8. Como fazer o modo mock funcionar sem tiles gerados do jogo, preservando o motor visual?
9. Há falha de integridade do parser que poderia gerar `found` mesmo com `checksumOk=false`?
10. Quais testes unitários/integração/E2E mínimos provam a POC e a regressão de backup?
11. Quais consequências de LAN para os endpoints de escrita devem ser mitigadas antes do deployment?
12. Quais licenças autorizam redistribuição e quais fontes são apenas referenciais?

## Entrega solicitada: relatório, NÃO código

A. **Mapa do repositório atual:** branch, HEAD, status, remotes, principais arquivos e funções relevantes.
B. **Tabela EXISTE / FALTA / PRECISA ADAPTAR** para cada requisito da POC, com caminho do arquivo e justificativa.
C. **Desenho do fluxo mínimo** mock → snapshot → regras → SSE → mapa/checklist → persistência, apontando pontos reais de integração.
D. **Esquema mínimo** de fixture, resultado de quest/evidência, posição de NPC e estado manual. Sem modelagem excessiva.
E. **Proposta de implementação em no máximo três entregas pequenas**, cada uma com objetivo, arquivos, teste e critério de aceite.
F. **Riscos e bloqueios**, incluindo permissões de fork, catálogos, identificação de personagem e ausência de assets locais.
G. **Próxima ação concreta recomendada**, sem executar ainda.

Condição de sucesso de TASK-001: conseguimos decidir exatamente o primeiro pequeno PR da POC com base no código real, sem adivinhar API ou reimplementar recursos existentes.
