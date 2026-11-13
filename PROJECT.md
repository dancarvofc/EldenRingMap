# Elden Ring Live Companion — Visão do produto e plano técnico

Status: M0 auditado; TASK-002 a TASK-011 implementadas no fork. Referência: 13/11/2026.

O estado consolidado, funcionalidades entregues e backlog atualizado estão em
[docs/STATUS-AND-ROADMAP.md](docs/STATUS-AND-ROADMAP.md).

## 1. O que vamos construir

Evoluir o [EldenRingMap Live Map](https://github.com/egormagurin/EldenRingMap) para um companion inteligente e leve, que acompanhe a jornada de cada personagem de **Elden Ring (jogo base e Shadow of the Erdtree)**. O usuário joga no Steam Deck LCD com SteamOS/Proton e consulta, preferencialmente pelo navegador Android na mesma LAN, um mapa e uma lista de objetivos que se atualizam conforme o save. O sistema não altera o jogo nem o save.

Problema a resolver: hoje é difícil saber quais quests avançaram, onde um NPC provavelmente está, o que falta coletar, quais objetivos estão disponíveis e quais ações podem provocar pontos sem retorno. A ferramenta deve fornecer respostas claras, rastreáveis e com controle de spoilers, sem exigir reconstruir recursos já presentes no Live Map.

**Experiência final pretendida:** mapa interativo com quatro camadas (M00 superfície; M01 subterrâneo; M10 DLC; M11 subterrâneo da DLC), progresso automático de graças/chefes/itens, NPCs com posições condicionais, quests em timeline com próximos passos e escolhas, checklist central (Quests, Marcos, Exploração, Minha Lista), filtros, progresso manual independente, evidências de conclusões, avisos contextuais e persistência separada por personagem/save. Interface mobile-first, acessada no navegador; controle simples no Steam Deck futuramente (Decky Loader pode ser avaliado). Ideias futuras a avaliar: guias contextuais in-game, overlay e IA; não fazem parte da POC.

## 2. Princípios e critérios de engenharia

- **Menor solução que funcione:** preferir evolução incremental do JavaScript/Node existente. Nenhum framework, banco de dados, microsserviço, contêiner, APK ou reescrita do mapa sem demonstração de necessidade.
- **Reutilizar:** parser, leitura de flags, servidor HTTP, SSE, projeção, canvas/mapa e mecanismos atuais de marcadores.
- **Somente leitura do jogo:** não modificar saves originais; leitura de memória é opcional e fica desligada. Não usar anti-cheat como obstáculo nem exigir contorná-lo.
- **Desenvolver no Linux:** mocks primeiro; integrar com cópias reais de saves somente após testes locais. Steam Deck é alvo de implantação, não ambiente primário de codificação.
- **Transparência:** flag ausente não prova perda de quest. Um `false` pode ser condição legítima, mas exige semântica correta da regra e acesso confiável à flag. Dados insuficientes => `unknown`.
- **Rastreabilidade:** toda conclusão automática deve expor ID/condição observada e versão da regra. Diferenciar observação, inferência e marcação manual.
- **Segregação:** o progresso manual nunca é sobrescrito pelo automático; separar por identidade estável de personagem e contexto de save. Evitar usar apenas nome/slot ou o checksum do arquivo inteiro como identidade permanente.
- **Regressão permitida:** restauração de backup pode fazer progresso automático voltar; recalcular a partir de cada snapshot, sem acumular flags de forma monotônica.
- **Licenças e assets:** não incorporar código/bancos externos sem permissão. Nunca versionar tiles, ícones extraídos, saves pessoais ou assets redistribuíveis do jogo.

## 3. Base técnica confirmada no repositório original

URL base: https://github.com/egormagurin/EldenRingMap
Documentação: https://github.com/egormagurin/EldenRingMap/blob/main/docs/HOW-IT-WORKS.md

Arquivos identificados no `main` em 13/11/2026:

| Arquivo | Responsabilidade |
|---|---|
| `server/index.js` | Servidor HTTP, endpoints, polling do save, SSE, seleção de save/slot, marcadores e persistência atual |
| `server/lib/saveParser.js` | Leitura de `.sl2`, personagens e acesso à estrutura de flags |
| `server/lib/slotWalk.js` | Percurso da estrutura variável e `EventFlags.get(flagId)` que retorna `true`, `false` ou `null` |
| `server/lib/project.js` | Posição no jogo → pixels/map layer |
| `web/js/app.js` | UI, seleção de camadas e personagens, marcadores, eventos SSE |
| `web/js/map.js` | Motor canvas de tiles e coordenadas |
| `tools/build_markers.py` | Extrai marcadores/flags do jogo |
| `tools/extract_items.py` | Extrai pickups; cobertura incompleta de drops/event scripts |
| `tools/extract_tiles.py` | Reconhece M00, M01, M10, M11 |
| `data/eventflag_bst.txt` | Mapeamento de grupos das event flags |
| `data/user-state.json` | Estado manual atual, que exige isolamento por perfil |

Endpoints existentes identificados: `GET /api/state`, `GET /api/markers`, `GET/POST /api/saves`, `GET /api/events` (SSE), `POST /api/check`, `/api/refresh`. A UI hoje combina `found` automático e `checked` manual. O estado manual de marcadores usa IDs globais (`userState.checked`) e deve ser revisado para evitar mistura de personagens. `buildSnapshot` expõe marcadores encontrados, mas não publica uma API de consulta arbitrária de flags; preferir **avaliação no servidor** e apenas resultados semânticos no frontend. O servidor atualmente precisa de um save válido para iniciar: criar provider mock injetável.

A extração de mapa/markers exige arquivos de jogo do usuário e produz artefatos locais que não devem ser commitados. O modo mock precisa oferecer alguma forma simples de visualizar o deslocamento de NPC sem depender de arquivos reais de jogo, usando o motor canvas existente e recursos simulados quando os tiles não estiverem disponíveis.

## 4. Modelo lógico mínimo para a POC (sujeito à auditoria)

```
MockProvider (agora) ─┐
                     ├→ NormalizedSnapshot → Progress/Quest Rules → NPC Resolver → API/SSE
SaveReader (depois) ─┘                                           ↓
                      Persistent Manual State (por perfil) → Mapa + Timeline + Checklist
```

NormalizedSnapshot deve conter `profileId`, origem do snapshot, slot (quando aplicável), nome, timestamp/versão, mecanismo `getFlag(id): true|false|null` ou mapa equivalente, e dados opcionais de posição/inventário. Nunca enviar bitfield inteiro ao browser apenas para avaliar quests. Regras são funções puras e testáveis com fixtures.

Estados funcionais sugeridos para objetivos: `completed`, `available`, `blocked`, `missed`, `unknown`. O estado `missed` só pode surgir de evidência **positiva e suficiente** de irreversibilidade, não de flags ausentes. Não assumir que uma flag isolada prova necessariamente um diálogo ou etapa completa. Etapas transitórias, flags mutuamente exclusivas e dependências merecem regras próprias.

Cada decisão automática deve permitir auditar: `source`, `ruleId`, `ruleVersion`, `conditions` (IDs, valores esperados e observados), além de `explanation` quando há ambiguidade. Marcação manual é guardada em namespace próprio e apresentada com a origem identificada; não falsifica evidência automática.

NPC Resolver retorna localizações `current`, `next` ou `unknown`, com camada do mapa e coordenadas verificadas, sem afirmar posição certeira quando há ambiguidade. A POC utiliza coordenadas sintéticas rotuladas como mocks; dados reais apenas quando validados.

Persistência inicial: JSON local e gravação atômica de estado manual separado do save. Testar reinício do servidor, múltiplos personagens, restauração de backup e eventual reutilização de slot. Não introduzir SQLite até surgir necessidade demonstrável.

## 5. Escopo da primeira POC — milestone M1

**Objetivo do M1:** demonstrar que uma mudança num snapshot simulado produz uma mudança coerente e verificável de quest, NPC, timeline e checklist, sem jogo real.

Fazer:
1. Iniciar o servidor em `--mock` (ou flag equivalente acordada) sem `.sl2`.
2. Oferecer dois personagens simulados, por exemplo Jinx e Guts; nomes são apenas dados de fixture, não progresso real.
3. Carregar três snapshots simulados da quest de Millicent (não iniciada, intermediária, conclusão/ramificação ilustrativa), com flags **fictícias e explicitamente marcadas**.
4. Exibir uma quest com etapas, requisitos, status e evidências.
5. Alterar posição do NPC conforme snapshot/estado, usando mapa existente e marcador adicional mínimo.
6. Exibir timeline e checklist com Quests, Marcos e Minha Lista (pode ser simples, sem toda a UX futura).
7. Marcar/desmarcar objetivos manuais e objetivos personalizados, persistindo por perfil.
8. Trocar de personagem sem vazamento de progresso.
9. Atualizar browser via SSE ao mudar snapshot; suportar reconexão básica.
10. Testar regressão de progresso ao restaurar snapshot anterior.
11. Cobrir unidade, integração, E2E mobile com Playwright (se necessário somente para UI); priorizar `node:test` para lógica.

**Fora do M1:** leitura real de saves, integração Steam Deck, plugin Decky, leitura de memória, overlays, APK, integração de IA, catálogo de todas as quests, cobertura total de drops e migração de frontend. Essas ideias ficam no backlog, não são abandonadas.

**Definição de pronto:** cenários reproduzíveis; testes passando; nenhuma conclusão automática sem evidência; ausência de dados exibe unknown; troca de personagem isola marcações; restauração não deixa progresso automático antigo; nenhuma alteração nos arquivos do jogo; README curto explicando modo mock.

## 6. Roadmap posterior — ordem de prioridade, não compromisso fixo

- **M0: auditoria e contexto** — validar código, licenças, artefatos gerados, responsabilidades, contratos e lacunas; plano de mudança mínimo.
- **M1: prova de conceito local com mocks** — comportamento íntegro de Millicent, NPC, timeline, checklist e persistência.
- **M2: enriquecer motor** — dados/rules de quests reais validados, conflitos, missables, milestones como Forja dos Gigantes, Maliketh e Três Dedos; inventário quando possível.
- **M3: ampliar catálogos e interface** — mais NPCs/base/DLC, melhores marcadores de drops/recompensas, filtro/UX mobile e import/export de marcações.
- **M4: integração passiva** — cópias de `.sl2` para validar; então saves reais em somente leitura no SteamOS/Proton, acesso Android via LAN e medição de consumo.
- **M5: empacotamento opcional** — controle via Decky/systemd apenas se a operação manual do servidor for inconveniente; considerar guias/overlay/IA por necessidade demonstrada.

## 7. Referências técnicas, prioridade e limitações

**Base / primeiro lugar para consultar código existente:**
- EldenRingMap: https://github.com/egormagurin/EldenRingMap
- Como funciona: https://github.com/egormagurin/EldenRingMap/blob/main/docs/HOW-IT-WORKS.md

**Quests, NPCs e sequência narrativa (comparação e validação, não copiar automaticamente):**
- jw-ofs mapa e 31 questlines: https://github.com/jw-ofs/elden-ring-map
- Catálogo: https://github.com/jw-ofs/elden-ring-map/blob/main/questlines.json
- Hapfel1 Save Manager, ~56 NPCs e 49 registros de Millicent (reconhece múltiplas condições): https://github.com/Hapfel1/er-save-manager
- Referência flags: https://github.com/Hapfel1/er-save-manager/blob/main/src/er_save_manager/data/quest_flags.json
- Carregador das flags: https://github.com/Hapfel1/er-save-manager/blob/main/src/er_save_manager/data/quest_flags_db.py
- Kamikaz07 Save Editor: https://github.com/Kamikaz07/Elden-Ring-Save-Editor

**Save, dados e testes:**
- Elden Ring Compass (parser TS, fixtures, inventário, testes): https://github.com/EthanShoeDev/elden-ring-compass
- ER-Save-Lib: https://github.com/ClayAmore/ER-Save-Lib
- Paramdex: https://github.com/soulsmods/Paramdex

**Futuras integrações:**
- Decky Loader: https://github.com/SteamDeckHomebrew/decky-loader
- Template: https://github.com/SteamDeckHomebrew/decky-plugin-template
- Docs: https://wiki.deckbrew.xyz

**Validação cruzada narrativa, nunca fonte única:**
- https://eldenring.wiki.fextralife.com/
- https://eldenring.exputer.com/quests

**Atenção à licença:** EldenRingMap declara no README que código pode ser copiado/modificado, mas não foi encontrada licença geral padronizada na revisão auditada; confirmar termos de redistribuição antes de publicar derivação. jw-ofs e Compass também não mostraram licença geral na auditoria inicial; verificar novamente. Hapfel1 possui `Source-Available License` desde 22/07/2026 e restringe redistribuição e incorporação; não importar seu código/JSON sem autorização expressa. Kamikaz07 informa Apache-2.0. Interpretar todas essas referências como material de estudo até comprovar permissões específicas. Não versionar conteúdo extraído do jogo.

## 8. Riscos conhecidos

- Uma flag pode ser desconhecida (`null`) ou compartilhada por vários itens; não extrapolar certeza.
- Um passo de quest pode envolver sequência, escolhas mutuamente exclusivas, estados transitórios ou vários indicadores. Registro de flags != etapa visual.
- O servidor original tem marcações manuais globais; compatibilidade/migração e isolamento são relevantes.
- A identidade do personagem precisa resistir a mudança de nome, slot reutilizado e save restaurado; definir estratégia após auditoria do parser.
- Quatro camadas de tile existem, mas cobertura do subterrâneo da DLC e de NPCs deve ser confirmada.
- O serviço `--lan` precisa ser limitado à rede confiável e futuramente proteger endpoints de escrita/seleção de arquivos; não expor na internet.
- O modo mock precisará de assets sintéticos se não houver extração real; não reimplementar motor canvas.
- Overlay, IA e guias são produtos tentadores, mas não devem atrasar o M1.

## 9. Governança do trabalho ChatGPT + Codex

Humano = decisões e validação; ChatGPT = arquitetura, gestão de prioridades e revisão crítica; Codex = auditoria do workspace, implementação incremental, execução de testes, relatório de mudanças. Cada tarefa deve ter escopo, arquivos afetados, critério de aceite, riscos e evidência de testes. **Trabalhar uma missão por vez.** Não converter ideias do backlog automaticamente em trabalho. Antes de alterar algo significativo, apresentar o plano. Se encontrar incompatibilidade com a especificação, registrar e pedir orientação.


## Atualização aprovada em 13/11/2026

Decky é a forma desejada de inicialização no Steam Deck: iniciar/parar, estado e
endereço do servidor. Implementar após validar o companion localmente. Saves
locais podem apoiar testes futuros somente por cópias isoladas e não versionadas.
A primeira entrega não utiliza saves reais.
