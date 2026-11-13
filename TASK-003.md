# TASK-003 — Persistência manual por perfil

Continuação autorizada pelo usuário em 13/11/2026.

## Objetivo e implementação
Armazenar checkboxes e objetivos personalizados em JSON local, com namespaces
por profileId e substituição atômica de arquivo. No modo mock, /api/manual exige
profileId explícito e publica o snapshot atualizado pelo SSE existente.

Arquivos: server/lib/manualState.js, mockProvider.js, server/index.js,
tests/manualState.test.js e tests/mockServer.test.js.

Dados automáticos continuam recalculados; marcações manuais não alteram evidências
nem o status automático. O arquivo legado data/user-state.json não é migrado nem
alterado no modo mock. A identidade real dos personagens permanece pendente.

## Verificação
npm test: 8 testes passando, com reinício real do processo e recarga da persistência, isolamento entre perfis,
regressão, criação/conclusão/remoção de objetivos, erros de disco, corrupção e SSE.
git diff --check sem erros. Nenhum save do jogo utilizado ou alterado.

## Próximo passo
Entrega 3: demonstração visual com timeline/checklist, controle de snapshots,
NPC no mapa canvas, fundo sintético e responsividade para celular.
Decky permanece etapa posterior, controlando o servidor passivo no Steam Deck.

## Git
Publicação exclusivamente em dancarvofc/EldenRingMap. Main do nosso fork pode
receber evoluções; não enviar alterações ou PRs ao repositório original.
