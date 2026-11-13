# TASK-012 — Destaque visual dos marcadores

## Pedido registrado

Deixar os pontos do mapa mais visíveis, com um controle/botão que aplique um
contorno vermelho aos marcadores. Este item foi anotado para a próxima rodada;
ainda não está implementado.

## Comportamento pretendido

- Controle acessível no painel de opções, com estado ligado/desligado e rótulo
  claro (por exemplo, “Destacar marcadores”).
- Ligado: desenhar contorno vermelho em volta dos ícones/pontos para destacá-los
  do fundo do mapa, sem substituir a cor original do ícone nem confundir estado
  encontrado, progresso manual ou categoria.
- Desligado: renderização original dos marcadores.
- Persistir a preferência localmente, como as outras opções visuais.
- Funcionar nas quatro camadas, em zooms diferentes e em telas pequenas; manter
  boa leitura quando muitos marcadores estiverem próximos ou agrupados.
- Verificar que a opção não altera busca, filtros, popups, cliques, contagens ou
  a leitura do save.

## Plano técnico inicial

Reutilizar o desenho de marcadores no canvas em `web/js/app.js` e o controle de
opções já existente em `web/index.html`/`web/css/app.css`. Não adicionar
dependências nem redesenhar os ícones. Confirmar contraste e espessura no mapa
real e no celular antes de considerar pronto.

## Estimativa

**2–4 horas de trabalho**, incluindo ajuste visual e verificação em desktop e
viewport mobile. A faixa será refinada depois da primeira inspeção do resultado.

## Aceite

- O botão liga/desliga o contorno vermelho imediatamente.
- A escolha persiste após recarregar a página.
- Ícones e cores existentes continuam reconhecíveis; estado de progresso não
  muda.
- Não há regressão nos filtros, popup, navegação ou uso mobile.
- Mudança e validação são documentadas sem incluir dados/assets extraídos.
