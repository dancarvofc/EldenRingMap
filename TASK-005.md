# TASK-005 — Mapa e marcadores originais na prévia local

Continuação autorizada em 13/11/2026. Reutilizar tudo que for possível do upstream,
especialmente os marcadores, conforme reforçado pelo usuário.

## Escopo
- Extrair assets localmente com as ferramentas existentes, sem tocar em saves.
- Novo start:preview = --mock --mock-map local, mantendo start:mock sintético.
- Preservar canvas, filtros, busca, marcadores, seleção e SSE do upstream.
- Identificar mapa local real e progresso fictício; não projetar NPC sintético
  sobre o mapa real, nem inferir itens coletados a partir de flags mock.
- Manter marcações manuais por perfil. Nenhum asset gerado vai ao GitHub.

## Arquivos e verificação
server/index.js seleciona a origem do mapa. web/js/app.js e companion.js mantêm
estado manual do perfil ativo e a apresentação do modo. CSS reexibe controles
originais na prévia. setup-linux.sh --map-only prepara só mapas/marcadores/ícones.
Testes node:test e Playwright verificam mock sintético e prévia local.

## Limites
Sem novas flags reais de quests, sem interpretação de save, sem LAN ou Decky.
Ícones, tiles e marcadores extraídos são locais e devem permanecer ignorados.
Apenas o nosso fork recebe commits; nenhuma publicação ao upstream.

## Resultado verificado
- 1.106 marcadores: 208 chefes, 413 graças, 34 fragmentos, 157 landmarks, 294 POIs.
- M00, M01, M10 e M11 extraídos sem falhas de decodificação; 89 ícones locais.
  A extração não comprova a completude de todos os pontos subterrâneos do DLC.
- npm test: 8 testes passando; bash -n e git diff --check sem erros.
- Playwright: modos sintético e mapa local em 360, 390 e 1280 px; sem pageerror.
- Popup original: marcar/desmarcar reflete no perfil manual e no SSE, sem found
  automático; busca, filtros e seleção continuam os recursos originais.
- Assets gerados confirmados como ignorados pelo Git. Nenhum save utilizado.
