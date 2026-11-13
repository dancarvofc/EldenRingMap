# TASK-010 — Rodada ampla: busca EN/PT, nomes oficiais, NPCs e objetivos ligados ao mapa

Solicitada em 13/11/2026: nomes exibidos em inglês, busca em português/inglês,
Exploração com nome real e Millicent visível no mapa. Reutilizar o upstream.

## Plano e arquivos
1. Textos PT-BR locais e nomes oficiais de fragmentos: tools/build_markers.py.
2. Busca compartilhada/acento/pontuação/termos em ordem livre: markerSearch.js,
   app.js, companion.js. Exibição inglesa preservada; busca local, sem serviço externo.
3. Referências de NPCs por nome/param/MSB/evento: erlib/msb.py, erlib/emevd.py,
   extract_npc_references.py, data/npcs.json gerado e ignorado, integração no mapa.
4. Popup → Minha lista com referência ao marcador, deduplicação, retorno ao mapa.
5. Navegação por teclado e foco compartilhado; estabilidade da extração Linux.

## Limites de evidência
NPCs são posições estáticas de referência, não posição atual confirmada. Não há
avaliação de condições de spawn, amizade, morte ou conclusão de quest. Variantes
podem estar presentes. Nenhum dado extraído, save, tradução ou tile é versionado.
Apenas código de extração e nomes mínimos de seleção entram no fork.

Millicent é ligada por NpcParam.nameId ao NpcName oficial e à parte MSB. Adan usa
uma referência de nome/evento no mesmo comando de inicialização que uma única
entidade humana no MSB, pois o param da variante tem nome dummy. Isso é indicado
na evidência, sem inferir estado da missão. Associações ambíguas são descartadas.

## Referências de formato consultadas
- https://github.com/soulsmods/Paramdex/blob/master/ER/Defs/NpcParam.xml
- https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/MSB/MSBE/PartsParam.cs
- https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/EMEVD/EMEVD.cs
- https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/EMEVD/Instruction.cs

Offsets de formato confrontados com os arquivos locais e fixtures sintéticas.
Nenhuma biblioteca/implementação dessas referências foi incorporada. REA sem
alvo nativo aberto; formatos do jogo analisados pelos parsers específicos do projeto.

## Resultado e limites observados
- 1.103 dos 1.106 marcadores originais com nomes PT locais; display permanece EN.
- `thief`, `ladrao` e `ladrão` encontram o mesmo marcador de referência de Adan.
- 24 fragmentos com nome oficial por ligação flag → ItemLot → GoodsName. Outras
  10 áreas preservadas em Regions, com referência de local explicitamente derivada.
- 15 posições de referência de Millicent e 1 de Adan extraídas; estado atual unknown.
- Popup Add to My List com retorno ao mapa, sem duplicar marcador no perfil.
- Busca por teclado e câmera com cancelamento de animações antigas.
- Setup --labels-only e Oodle runtime independente do diretório de execução.
- 22 testes Node e 7 testes Python passando; E2E da cópia em 360/390/1280 px,
  incluindo busca bilíngue real, nomes ingleses mesmo com chrome RU, fragmento
  oficial, NPC/alias Milicent, pin/retorno e filtros. Mocks sintético e mapa local
  também verificados. Capturas inspecionadas; nenhum erro de página.
- Nenhuma dependência nova, alteração no jogo ou save, ou publicação de assets.

Papéis das variantes, condições de spawn, quests reais, LAN e Decky continuam
pendentes. Não confundir posição de referência com presença atual do NPC.
