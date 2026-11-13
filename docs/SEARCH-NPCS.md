# Busca bilíngue, nomes oficiais e referências de NPCs

## Buscar sem traduzir a interface

Os nomes dos marcadores são exibidos em inglês, independentemente do idioma dos
controles. Os textos portugueses extraídos do jogo continuam no índice de busca.
Não há serviço de tradução, IA, consulta externa ou mudança no save.

Exemplos verificados na instalação local:
- `thief`, `ladrao` ou `ladrão` → **Adan, Thief of Fire**, referência perto de
  **Malefactor's Evergaol**.
- `peninsula lagrimas` → **Map: Weeping Peninsula** em Exploração.
- `Millicent` ou o alias de grafia `Milicent` → referências de Millicent.

A busca aceita acentos omitidos, maiúsculas/minúsculas, pontuação e palavras em
ordem diferente. Não é um tradutor universal de sinônimos; só pesquisa nomes
extraídos, categorias genéricas e aliases explícitos. Os mesmos critérios valem
na busca global, Marcos, Exploração e no painel de NPCs.

Na busca global, use ↓/↑ para percorrer resultados, Enter para abrir e Escape
para fechar. `/` foca a busca quando você não está digitando em outro campo.
Navegar para um resultado habilita sua categoria e permite vê-lo mesmo quando
os encontrados estavam ocultos. Usa o canvas e o popup originais.

## Nomes de Exploração

Os fragmentos de item são resolvidos por ligação de flag a ItemLotParam_map e
a GoodsName, em vez de receber o nome da graça mais próxima. Nomes de graças
continuam vindo de PlaceName. Itens sem relação inequívoca não recebem um nome
inventado: outras áreas WorldMapPiece ficam em Regions, rotuladas como referência
próxima quando existe local nomeado. Isso preserva os marcadores originais.

## Millicent no mapa

Abra **NPCs · referências** ou pesquise Millicent. Há múltiplas posições estáticas
nos arquivos do jogo, inclusive variantes. **Ver no mapa** mostra o marcador e
as evidências da extração. O local próximo é uma referência cartográfica, não
uma descrição de caminho ou condição de quest.

Essas posições NÃO afirmam onde ela está no personagem selecionado. Condições de
aparição, amizade, invasão, morte e progressão não foram interpretadas. A presença
atual permanece desconhecida. O popup não oferece marcar uma referência como
conclusão automática de quest.

A identificação normal combina nome oficial NpcName com NpcParam.nameId e a
parte Enemy do MSB. Algumas variantes têm nome dummy no param; quando possível,
usa-se um único nome solicitado e uma única entidade humana referenciados no
mesmo comando de inicialização EMEVD. Casos ambíguos são descartados e a origem
alternativa fica visível na evidência. Nenhum script é executado.

## Minha lista ligada ao mapa

Na inspeção da cópia, associe um perfil local. No popup, **Add to My List** cria
um objetivo manual com o nome inglês e a referência do marcador. Em Minha lista,
**Mapa** retorna ao ponto. O mesmo marcador não é adicionado duas vezes ao mesmo
perfil. Objetivos livres continuam disponíveis.

Completar um objetivo pessoal não muda flags, status de chefes, posse de itens
ou presença de NPC. Referências e progresso manual continuam separados.

## Preparação local

Primeira extração: `./setup-linux.sh --map-only`.
Atualização com tiles prontos: `./setup-linux.sh --labels-only`.
Pode usar ER_GAME_DIR para a instalação local e ER_MOD_DIR conforme o setup já
suportava; mods não foram validados nesta rodada. Reinicie o servidor depois.
`data/npcs.json`, traduções, marcadores e tiles gerados nunca vão ao GitHub.

Os parsers aceitam somente layouts verificados. Para versões incompatíveis,
interrompem a extração em vez de adivinhar campos. Não existe dependência do
Steam Deck, jogo em execução ou leitura de memória para extrair referências.

## Verificação

```sh
npm test
npm run test:extractors
```

A suíte de interface opcional está em tools/verify_save_copy.cjs e usa uma cópia
explícita de save, assets locais e um Chromium/Playwright já disponível. Verifica
360, 390 e 1280 px e confere que os bytes da cópia não mudaram.
