# TASK-004 — Companion visual e responsividade

Continuação autorizada em 13/11/2026. Implementada sobre as entregas 1 e 2.

## Resultado
- Timeline com estados automáticos, marcações manuais independentes e evidências.
- Lista personalizada com criação, marcação e remoção por perfil.
- Seletor de três snapshots fictícios, atualização via SSE e regressão.
- NPC atualizado no canvas existente e botão para navegar até ele.
- Manifesto e tile SVG originais servidos somente no mock, sem assets do jogo.
- Menu responsivo sobre o mapa em telas até 700 px, controles maiores e cabeçalho
  fixo para permitir recolher o menu mesmo durante a rolagem.

## Arquivos
web/js/companion.js concentra apresentação sem regras de quests no DOM.
web/js/app.js mantém seleção, canvas e SSE; HTML/CSS adicionam o painel e layout.
server/index.js fornece apenas no mock os recursos sintéticos do mapa.
tools/verify_companion.cjs verifica o fluxo num navegador Chromium existente.

## Verificação
npm test: 8 testes de backend passando.
Playwright-core existente no ambiente + Chrome headless: 360, 390 e 1280 px.
Verificados: timeline, troca de snapshots, marcação manual mantida na regressão,
criação de objetivo, troca de perfil sem vazamento, reload, menu e foco no NPC.
Nenhum pageerror; sem overflow horizontal. Capturas inspecionadas visualmente.
Nenhuma dependência instalada. Nenhum save real lido ou alterado.

## Limitações
Mobile validado por viewport em Chrome desktop; teste físico Android ainda pendente.
A interface herdada continua EN/RU; o painel companion foi escrito em português.
Os marcos reais não são avaliados. Não há regras/flags reais nesta demonstração.
O mock continua restrito a localhost até corrigir e testar segurança LAN.
Integração real exige confiança no checksum, identidade por personagem e catálogo
validado. Decky permanece posterior, controlando servidor passivo no Steam Deck.
