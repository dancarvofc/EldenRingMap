# Elden Ring Live Companion — Estado e roteiro

**Atualizado em:** 13/11/2026  
**Repositório de trabalho:** `dancarvofc/EldenRingMap`  
**Branch:** `main` do nosso fork  
**Estado:** entregas TASK-002 a TASK-011 implementadas; TASK-012 está planejada para destacar os marcadores. Em seguida, evoluir regras reais e preparar uso no celular/Steam Deck.

Este documento é o guia consolidado de continuidade. As tarefas `TASK-002.md` a `TASK-011.md`, a próxima tarefa `TASK-012.md` e `docs/tasks/TASK-001.md` guardam o histórico, escopo e evidências.

## Visão do produto

Um companion web para Elden Ring (jogo base e Shadow of the Erdtree), servido localmente no Steam Deck e consultado pelo navegador do celular na mesma rede. Ele reutiliza o mapa, marcadores, parser de save, servidor HTTP, SSE, projeção e canvas do projeto original. Deve ajudar a acompanhar chefes, exploração, NPCs e quests com evidências visíveis e controle de spoilers.

O programa é passivo: não altera o jogo nem os saves. O idioma de exibição dos locais é inglês; a busca também aceita nomes em português e não exige acentos. O início/parada do servidor por Decky é o alvo operacional desejado, mas ainda não foi implementado.

## O que já foi feito

### Base do fork e experiência web

- Fork pessoal configurado com `origin` em `dancarvofc/EldenRingMap` e `upstream` em `egormagurin/EldenRingMap`.
- Evoluções publicadas no `main` do nosso fork. **Não enviar commits, PRs ou merges ao repositório original.**
- Companion responsivo integrado à interface existente, mantendo o canvas, mapa, marcadores, filtros, seleção de camada, popups e eventos SSE originais.
- Modo mock local, sem save, com perfis, snapshots fictícios, timeline de demonstração, NPC sintético e objetivos manuais persistidos separadamente.
- Prévia mock que usa mapa e marcadores reais extraídos localmente; modo sintético continua disponível sem esses assets.
- Busca compartilhada em nomes em inglês/português, sem acentos, com palavras em qualquer ordem, teclado e navegação até o marcador. `thief`, `ladrao` e `ladrão` encontram a mesma referência de Adan.
- Nomes exibidos em inglês. A extração local encontrou nomes PT-BR diferentes para 1.103 de 1.106 marcadores originais.
- Exploração preserva marcadores originais: 413 graças e 24 fragmentos com nomes oficiais ligados a dados de item. Outras 10 áreas ficam na categoria Regions, sem receber nomes de item inventados.
- Objetivos de “Minha Lista” podem apontar para um marcador e voltar ao mapa, sem alterar o estado automático.
- Categorias do painel lateral agora aparecem em grupos (Locations, Structures, Key Items, Items, Equipment, NPCs, Enemies, Materials e Other). POIs nomeados são separados por tipos de estrutura, incluindo cabanas, fortes, cavernas, castelos, igrejas, ruínas e torres; nomes sem indicação inequívoca permanecem genéricos.
- As 13 Cruzes de Miquella encontradas na extração local têm categoria própria. Pickups DLC reconhecem 38 Fragmentos de Scadutree e 18 Cinzas do Espírito Reverenciado; os nomes de categoria entram na busca EN/PT.
- O servidor é para uso sob demanda: iniciar quando for consultar o companion e encerrar ao terminar. Não deve ficar rodando continuamente nem iniciar automaticamente em segundo plano. Decky deve ter controles explícitos de iniciar/parar e indicar o estado.
- Correção de cancelamento de animação de câmera para que um voo antigo não sobrescreva Fit, zoom, arrasto ou nova navegação.

### Leitura passiva e dados auditáveis

- Parser BND4/save reforçado: valida limites e checksums e não publica snapshot não verificado.
- `--save-copy` inspeciona um caminho de cópia explicitamente, apenas em localhost e sem escrita no save, acesso LAN ou leitura de memória.
- Perfis manuais locais com associação explícita ao personagem selecionado. Como não há identidade permanente comprovada no formato observado, a associação é de sessão e precisa ser refeita após reiniciar; mudanças observadas invalidam o vínculo de escrita. UUID identifica o perfil manual, não o personagem do jogo.
- Painel de chefes baseado nas flags dos marcadores originais e painel de Exploração para graças/fragmentos. As avaliações mostram origem, condições e versão da regra. `unknown` é mantido quando os dados não bastam; `false` não significa que algo foi perdido ou ficou inacessível.
- Referências de NPCs extraídas localmente dos arquivos do jogo, sem incluir os dados extraídos no Git. Existem 15 referências estáticas de Millicent e 1 de Adan. São pontos de referência, não posição atual confirmada nem estado de quest.
- Regras mock são explicitamente fictícias e não se confundem com a inspeção real.
- Scripts de extração suportam atualização apenas de labels e modo map-only. A carga do runtime Oodle não depende do diretório atual.

### Privacidade, segurança e validação já realizada

- Nenhum save pessoal, mapa, tile, ícone, catálogo extraído ou dado pessoal está versionado.
- A cópia privada usada na inspeção foi conferida por hash antes/depois das verificações; a origem e o jogo não foram alterados.
- Mock e inspeção de cópia recusam Host/origem externa e não oferecem acesso LAN. `start-map.sh` do projeto original ativa `--live-memory`; não o usar para iniciar o companion passivo.
- Validações anteriores registradas até TASK-010: 22 testes Node e 7 testes Python; verificações Playwright em 360, 390 e 1280 px nos modos sintético, mapa local e cópia de save. Na TASK-011, os extratores foram executados, mas testes automatizados e E2E não foram rodados.
- Não foram adicionadas dependências npm de produção.

## O que falta fazer

Itens abaixo são backlog ordenado por dependência e segurança. A ordem pode mudar quando novas evidências surgirem.

### 1. Evoluir de referências para estados reais de NPC e quests

- Validar, com fontes permitidas e evidência própria, um primeiro conjunto pequeno de etapas reais de quest. Não importar dados/código com licença incompatível.
- Definir regras auditáveis no backend: flags/condições consultadas, estados, versão, explicação e saída `unknown` quando insuficiente.
- Investigar o que cada referência estática representa: variantes, diálogo, invasão, spawn e condição; não escolher uma posição atual sem prova.
- Implementar primeiro poucos casos completos (Millicent é candidata), cobrir ramificações e regressões e só então ampliar o catálogo.
- Distinguir claramente “marcador encontrado”, “etapa de quest concluída”, “NPC provavelmente neste local” e “presença atual confirmada”. Não deduzir disponibilidade ou `missed` de uma flag ausente.
- Incluir escolhas irreversíveis/pontos sem retorno apenas quando a condição estiver documentada e validada. Apresentar avisos contextuais sem revelar spoilers além da preferência do usuário.

### 2. Melhorar identidade e persistência dos perfis reais

- Investigar se o formato do save fornece um identificador estável e verificável por personagem, independente de nome, slot, renomeação e restauração de backup.
- Até existir prova, manter associação explícita e temporária; não transformar checksum do save, nome ou slot em identidade permanente.
- Definir backup/exportação e recuperação dos dados manuais por perfil antes de depender deles no uso diário.
- Verificar concorrência e comportamento se o save mudar durante a inspeção ou se houver mais de uma instância do servidor.

### 3. Tornar o acesso pelo celular seguro na LAN

- Planejar e implementar um modo LAN para o companion passivo, separado dos modos locais de mock e cópia que atualmente rejeitam LAN.
- Revisar autenticação ou proteção dos endpoints que gravam estado manual, seleção e configurações; limitar exposição à rede doméstica e documentar o firewall.
- Testar no Android físico: abrir mapa, navegar, filtros, popups, busca, rolagem, SSE/reconexão e consumo de bateria/rede.
- Confirmar comportamento quando o IP do Deck muda, a rede cai, o servidor reinicia ou a página fica aberta em segundo plano.
- Nunca expor o servidor diretamente à internet.

### 4. Executar no Steam Deck e integrar Decky

- Definir um comando de inicialização próprio, passivo e previsível. Não reutilizar launcher que injeta `--live-memory`.
- Medir no Steam Deck CPU, memória, resposta do mapa e robustez após suspensão/retomada.
- Criar plugin Decky com iniciar, parar, estado e endereço local do servidor; mostrar erro de porta e estado de rede. Adicionar QR code somente se trouxer benefício real.
- Decidir localização e permissões dos dados manuais/logs e como a atualização do fork preserva esses dados.
- Testar instalação, atualização, desinstalação e reinício do Deck sem tocar nos saves.

### 5. Expandir exploração, NPCs e acabamento

- Implementar o controle “Destacar marcadores” com contorno vermelho, descrito em [TASK-012](../TASK-012.md). Persistir a preferência e preservar ícones, filtros e estado de progresso.
- Verificar cobertura real das quatro camadas, sobretudo M11 (subterrâneo da DLC), e identificar lacunas nos marcadores originais antes de completar dados.
- Avaliar catálogo de pickups e itens que não são representados por uma flag persistente confiável; manter desconhecido quando a origem não prova posse.
- Ampliar referências de NPCs e nomes/aliases EN/PT por extração reproduzível, com validação de casos ambíguos e sem commit de conteúdo extraído.
- Testar uso físico em celular e Steam Deck; ajustar contraste, tamanhos, foco, acessibilidade e controles com base no uso real.
- Acrescentar configuração de idioma da interface se necessário; hoje o companion e nomes de marcador têm convenções de idioma diferentes da interface herdada EN/RU.

### 6. Publicação e manutenção do fork

- Manter mudanças, documentação e releases no GitHub pessoal `dancarvofc/EldenRingMap`.
- Antes de cada publicação, conferir branch, diff, arquivos gerados e estado do save/cópia. Não publicar saves, hashes, assets extraídos ou catálogos locais.
- Revisar licenças de código e dados antes de redistribuir qualquer componente. Referências de estudo não autorizam automaticamente cópia.
- Atualizar este documento e a tarefa ativa quando uma entrega mudar o status do backlog.

### Operação do servidor

- Iniciar apenas ao usar a aplicação e encerrar o processo quando terminar.
- Não instalar autostart nem serviço persistente que consuma recursos quando o companion estiver ocioso.
- A integração Decky deve iniciar/parar o servidor, exibir status e endereço; fechar a interface do celular, por si só, não garante que o servidor pare.

## Sequência sugerida das próximas entregas

1. **TASK-012 — visibilidade:** botão para contorno vermelho nos marcadores, preferência persistente, contraste e validação mobile.
2. **TASK-013 — primeira quest real auditável:** escolher um fluxo pequeno (sugestão: Millicent), mapear condições com fontes permitidas, definir regras conservadoras e testar snapshots reais/cópias sem escrita. Se não houver evidência suficiente, documentar a lacuna em vez de inferir.
3. **TASK-014 — presença de NPC:** classificar referências de Millicent por variante e condição; só indicar posição provável quando as flags sustentarem a regra. Manter referência estática separada.
4. **TASK-015 — operação LAN passiva:** definir ameaça e proteção, habilitar acesso Android de forma restrita e verificar no dispositivo físico.
5. **TASK-016 — implantação Decky:** controlar servidor sob demanda, estado e endereço e validar ciclo de vida no Steam Deck.
6. **Depois:** expandir catálogo, avisos de irreversibilidade, cobertura de itens e polimento conforme uso.

## Estimativa de conclusão

Estimativa de trabalho ativo, em horas de desenvolvimento; não é tempo corrido. Assume uma pessoa trabalhando com o código atual, reaproveitando o upstream, sem reescrita e usando testes/cópias locais.

| Marco | Escopo resumido | Estimativa |
|---|---|---:|
| M1 — Visibilidade | Contorno vermelho com botão, preferência persistente, contraste/viewport | 2–4 h |
| M2 — Primeira quest e NPC reais | Regras auditáveis para um fluxo (Millicent candidata), variantes e status desconhecido | 12–24 h |
| M3 — Perfis confiáveis | Investigar identidade, recuperação/backup e proteger isolamento manual | 6–12 h |
| M4 — Celular na LAN | Acesso restrito, segurança dos endpoints, reconexão e teste Android físico | 8–16 h |
| M5 — Steam Deck e Decky | Servidor sob demanda, iniciar/parar/status/endereço e teste no Deck | 12–24 h |
| M6 — Acabamento da primeira versão | Camadas, acessibilidade, desempenho, regressões e validação nos dispositivos | 8–16 h |

**Primeira versão utilizável:** aproximadamente **48–96 horas** (cerca de 3–7 semanas a 15 horas por semana), incluindo o primeiro fluxo real de quest/NPC, celular e Decky.

Ampliar o catálogo de quests, NPCs, consequências irreversíveis e cobertura base+DLC é uma fase adicional, estimada preliminarmente em **40–100 horas ou mais**, pois cada fluxo exige validação independente. Para essa versão mais ampla, a estimativa total passa a **88–196+ horas** (aproximadamente 6–13+ semanas a 15 horas por semana). Pesquisa de condições, testes no Android/Deck e correções podem aumentar os intervalos. APK, overlay em jogo, IA e sincronização de nuvem não estão incluídos.

## Decisões que não devem ser perdidas

- O mapa e os marcadores originais devem ser reaproveitados sempre que possível; não reconstruir do zero.
- Texto exibido para locais em inglês; busca deve aceitar inglês e português, inclusive sem acentos.
- O jogo e saves originais nunca são alvo de escrita. Testes de save usam uma cópia isolada e ignorada pelo Git.
- Não usar leitura de memória como dependência do companion. A opção upstream existe, mas não deve ser ativada no fluxo passivo.
- Nunca declarar conclusão, posição atual, disponibilidade ou perda de quest sem evidência suficiente. `unknown` é válido.
- Progresso automático, dados de quest e checkboxes manuais são estados separados e não devem se sobrescrever.
- Manter todo o trabalho no fork pessoal; nenhuma contribuição deve ser enviada ao upstream original.
- Não adicionar frameworks/dependências ou assets redistribuíveis sem necessidade demonstrada e revisão apropriada.

## Comandos úteis no estado atual

```sh
# Companion de demonstração com mapa sintético
npm run start:mock

# Progresso mock no mapa real extraído localmente
npm run start:preview

# Inspeção local de uma CÓPIA explícita do save (somente leitura)
node server/index.js --save-copy '/caminho/para/COPIA.sl2' --port 8100

# Encerrar o servidor: Ctrl+C no terminal onde ele está rodando

# Suítes automatizadas
npm test
npm run test:extractors
```

Inicie esses comandos apenas durante o uso e encerre com Ctrl+C ao terminar. Os modos mock e inspeção de cópia são locais. A integração LAN e Decky ainda não está pronta. Para extração local, veja [LOCAL-MAP.md](LOCAL-MAP.md); para inspeção passiva, [SAVE-COPY.md](SAVE-COPY.md); para mock, [MOCK-MODE.md](MOCK-MODE.md).

## Critérios para considerar o projeto pronto para o uso pretendido

- A página abre no celular pela LAN do Steam Deck e reconecta após suspensão/reinício sem expor o serviço à internet.
- Decky inicia, para e reporta corretamente o servidor passivo e seu endereço.
- O servidor não fica ativo nem inicia automaticamente quando o companion não está em uso.
- Dados automáticos têm evidências auditáveis; regras de quest/NPC não inventam estado a partir de ausência de flags.
- Perfis e marcações manuais permanecem isolados e recuperáveis.
- Mapa original, marcadores e quatro camadas estão utilizáveis; limitações de cobertura são explícitas.
- Instalação e atualização não modificam saves nem exigem leitura de memória.
- Testes automatizados e verificações em dispositivos alvo passam; GitHub pessoal contém somente código/documentação autorizados.
