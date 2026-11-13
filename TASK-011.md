# TASK-011 — Categorias de locais e itens de progressão da DLC

Solicitada em 13/11/2026: organizar os marcadores do painel lateral em grupos
como no MapGenie, separar tipos de estruturas (incluindo cabanas e fortes) e
destacar as Cruzes de Miquella, os Fragmentos de Scadutree e as Cinzas do
Espírito Reverenciado. Implementada reaproveitando os marcadores e extratores
originais.

## Implementação

- Painel de categorias agrupado em Locations, Structures, Key Items, Items,
  Equipment, NPCs, Enemies, Materials e Other, com textos EN/RU.
- Subcategorias de locais detectadas a partir dos nomes oficiais em inglês:
  cavernas, catacumbas, túneis, dungeons/graves, Evergaols, fortes, cabanas,
  igrejas, castelos, ruínas, torres, torres divinas, Minor Erdtrees, passagens
  secretas, estátuas de selo imp, portais, elevadores/poços e santuários de
  comunhão do dragão. Pontos sem correspondência clara continuam em POI.
- Cruzes de Miquella ganharam categoria de mapa própria. IDs, coordenadas,
  nomes oficiais, flags, sprites e comportamento de marcador são preservados.
- Classificador de pickups agora reconhece os nomes oficiais dos Fragmentos de
  Scadutree e das Cinzas do Espírito Reverenciado. A busca EN/PT procura também
  os nomes dos novos grupos/categorias e não exige acentos.
- Categorias adicionadas aparecem habilitadas por padrão mesmo para quem já tem
  preferências de categorias salvas de uma versão anterior.
- Não foi incorporado HTML, código, imagens, ícones ou catálogo do MapGenie; a
  referência foi a organização fornecida pelo usuário e os dados locais do jogo.

## Extração local e resultado observado

Foi executado `./setup-linux.sh --labels-only` e, em seguida, o extrator de
itens completo com a instalação local do jogo. Esses comandos apenas leram os
arquivos instalados e escreveram resultados ignorados pelo Git.

- 1.106 marcadores de mapa gerados: 413 graças, 208 chefes, 157 landmarks,
  24 fragmentos de mapa, 10 regiões e 294 pontos categorizados/POI.
- Entre os pontos: 13 Cruzes de Miquella, 21 cabanas, 7 fortes, 19 cavernas,
  10 Evergaols, 36 ruínas e as demais estruturas por tipo. O extrator preserva
  a união original dos pontos duplicados em mapas/camadas sobrepostos.
- 3.347 pickups gerados. Categorias da DLC: 38 Fragmentos de Scadutree e
  18 Cinzas do Espírito Reverenciado.
- Todos os arquivos derivados (`data/markers.json`, `data/items.json`, tiles,
  ícones e cache) permanecem locais/ignorados; não são commits do fork.

## Arquivos alterados

`web/js/app.js`, `web/js/i18n.js`, `web/js/markerSearch.js`, `web/css/app.css`,
`tools/build_markers.py`, `tools/erlib/mfg_categories.py`, além deste registro e
das referências de roadmap/README/AGENTS.

## Verificação e limites

- `git diff --check` passou antes da publicação.
- Testes automatizados e E2E não foram executados nesta rodada.
- A separação dos POIs usa correspondência conservadora nos nomes ingleses; o
  fallback genérico continua disponível para nomes que não indicam o tipo.
- A lista fornecida pelo MapGenie é referência de organização, não promessa de
  paridade de contagens/cobertura. A fonte de marcadores continua sendo o jogo
  local e o extrator original.
- Nada foi lido ou alterado nos saves. Sem leitura de memória.

## Próximo passo

TASK-012: validar um primeiro fluxo real de quest, mantendo regras no backend,
evidências por condição e `unknown` quando as flags não bastarem. Depois,
classificar as referências de Millicent por variantes/condições antes de
apresentar qualquer localização como atual.
