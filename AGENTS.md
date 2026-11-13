# AGENTS.md — Instruções permanentes ao Codex

Este repositório será evoluído para o **Elden Ring Live Companion**. Antes de trabalhar, leia `PROJECT.md` e a tarefa ativa (`TASK-006.md`; auditoria anterior em `docs/tasks/TASK-001.md`). Não trate uma tarefa isolada como definição integral de produto.

## Princípios

1. **Rifle, não bazuca.** Menor alteração que passe nos testes, sem overengineering.
2. Reutilizar o servidor Node.js, o parser `.sl2`, EventFlags, SSE, projeto de coordenadas e mapa canvas existentes. Não reescrever stacks nem instalar frameworks sem evidência e aprovação.
3. O save real é **somente leitura**. Nunca modificar arquivos do jogo, nunca usar memória do processo como dependência ou exigir Steam Deck nesta etapa.
4. POC inicial integralmente no Linux, com mocks e testes; integração real ocorre mais tarde.
5. Toda interpretação de quest/objetivo tem resultado auditável e incerteza visível. Ausência de flag não implica `missed`. `unknown` é resposta legítima.
6. Progresso manual deve ser guardado separado, por perfil; não alterar indevidamente estado de outro personagem. Regressão de snapshot pode reverter conclusão automática, mas não deve apagar checkboxes manuais.
7. Regras de quests no backend/engine, não no DOM. Usar funções puras em vez de abstrações sofisticadas.
8. Respeitar licenças e assets: não copiar bases de terceiros sem autorização; não commitar saves, tiles, imagens ou dados extraídos de instalação de jogo.
9. Trabalhar em pequenas alterações, testes antes/depois, verificar `git diff` e `git status`. Não alterar código fora do escopo sem justificar.
10. Falar português no relatório e na comunicação. Identificadores de código em inglês quando coerente com o repositório.

## Fontes e prioridade

- Código real no workspace é fonte primária para comportamento implementado.
- README e `docs/HOW-IT-WORKS.md` do upstream: https://github.com/egormagurin/EldenRingMap
- Ref. externa para quests: https://github.com/jw-ofs/elden-ring-map/blob/main/questlines.json
- Ref. flags com licença restritiva: https://github.com/Hapfel1/er-save-manager/blob/main/src/er_save_manager/data/quest_flags.json
- Outras referências e condições de uso: `PROJECT.md`.

Não invente flags ou coordenadas reais. Na POC use IDs mock explícitos, como `mock.millicent.*`, e pixels sintéticos. Nunca confunda um exemplo com evidência real.

## Estratégia de mudanças

- Preservar funcionalidades existentes de mapa, filtro, seleção, markers e SSE.
- Preferir `node:test` para regras e integração. Playwright somente quando testar interface e viewport mobile.
- Interface simples, responsiva, sem novo framework neste primeiro marco.
- Se o servidor não inicia sem save, criar provider/mock mode por pequena injeção, sem bifurcar a aplicação inteira.
- Proteger a separação entre dados derivados do save e marcações persistidas pelo usuário.
- Colocar novas regras e dados num módulo pequeno e autônomo, com testes. Evitar `switch/case` gigantes no frontend.

## Fluxo obrigatório por missão

1. Verificar branch, remotes, status, revisão e estrutura do projeto.
2. Identificar comportamento existente e lacuna antes de propor código.
3. Mostrar plano mínimo, arquivos a criar/alterar, testes e riscos.
4. Respeitar o sinal **AUDIT ONLY** quando ele aparecer na tarefa: não escrever/instalar/commitar, apenas relatar.
5. Depois de aprovação, implementar **somente** o escopo aprovado.
6. No relatório final: mudança realizada, justificativa, comandos/testes rodados, resultados, limitações e próximo passo mínimo.

## Backlog, não escopo imediato

Guias em jogo, overlay, IA, plugin Decky, APK, sincronização de nuvem, catálogos gigantes de quests e novos frameworks são ideias futuras. Não inicie nenhuma delas na tarefa atual.

## Git e publicação — preferência explícita do usuário

Manter o código e as evoluções no fork dancarvofc/EldenRingMap.
Branches, PRs e merges para main são permitidos no nosso fork.
Não enviar PRs, commits ou merges ao repositório original egormagurin/EldenRingMap.
A tarefa ativa é TASK-006.md. TASK-002.md registra a primeira entrega.

Reforço do usuário: reutilizar marcadores, extratores e recursos do projeto original;
não reconstruir mapa ou catálogo do zero.
