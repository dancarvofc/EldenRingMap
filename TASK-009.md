# TASK-009 — Exploração com graças e fragmentos originais

Continuação autorizada em 13/11/2026. Reutiliza extrator, marcadores, coordenadas,
camadas, canvas, popup, áreas dos fragmentos, SSE e motor de regras existentes.

## Implementação
O avaliador de marcos passa a compartilhar a avaliação de flags entre chefes,
graças e fragmentos. A API da cópia publica exploration separado de milestones,
sem mudar estados de chefes ou misturar progresso automático e manual.

Graças usam BonfireWarpParam.eventflagId. Fragmentos exigem provenance explícita
WorldMapPieceParam.openEventFlagId: o fallback acquisitionEventFlagId é transitório
e não comprova posse. O extrator original passa a incluir flagSource nos fragmentos.
Datasets antigos sem essa informação permanecem unknown até reextração.

## Interface
Painel Exploração: graças/fragmentos, busca, estado registrado/não registrado/
desconhecido e camada atual/todas. Mesma renderização de cards/evidências de
chefes, sem duplicar lógica. Navegação usa popup original e desenha a área do
fragmento no canvas existente. Disponível sem perfil manual associado.

## Verificação
17 testes node:test, incluindo graça com múltiplas flags, regressão, integridade,
fragmento persistente, flag transitória e provenance ausente.
Playwright 390/1280 px: filtros, contagens por personagem comparadas com found,
evidências, seleção de fragmento com rect no mapa e regressões de perfis/listas.
Mock em 360/390/1280 px; nenhuma dependência nova instalada.
Extrator reexecutado localmente: 413 graças, 34 fragmentos com flag persistente.
Cópia de save inalterada. Arquivos gerados e saves continuam fora do Git.

## Pendências
Catálogo de quests/NPCs reais, pontos sem retorno, identidade estável do jogo,
LAN e Decky. Não inferir acessibilidade de um local a partir de flag false.
