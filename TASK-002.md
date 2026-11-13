# TASK-002 — Primeira entrega: servidor mock e regras

Aprovada pelo usuário em 13/11/2026 após a auditoria TASK-001.
A auditoria anterior permanece arquivada em docs/tasks/TASK-001.md.

## Escopo
- Fork pessoal, origin/upstream e branch de trabalho.
- Mesmo servidor HTTP e stream SSE, iniciado com --mock sem save.
- Dois perfis estáveis e três snapshots fictícios independentes.
- Regras puras de Millicent, condições auditáveis e NPC com pixels sintéticos.
- Testes node:test para regras, desconhecidos, contradições, regressão, HTTP e SSE.
- Documentação do projeto e da evolução no GitHub.

## Limites desta entrega
Sem interface de quests, tiles mock, persistência manual, leitura de save real,
instalação de dependências ou plugin Decky. Essas funcionalidades pertencem às
próximas entregas. O modo mock é local-only até a revisão da segurança LAN.

## Resultado
Cinco testes automatizados passando. A aplicação inicia sem save; as quests
ficam disponíveis na API e no SSE. O navegador ainda mostra a interface original.
O caminho real do parser não foi alterado nem validado nesta entrega.

## Próximas entregas
2. Persistência atômica de checkboxes e objetivos personalizados por perfil.
3. Timeline/checklist, controles de snapshots, NPC no canvas, fundo sintético,
   responsividade e verificação de interface.

## Alvo operacional posterior
Servidor no Steam Deck, acessado pelo navegador do celular na LAN. Plugin Decky
com iniciar/parar, estado e endereço/QR code é a inicialização desejada pelo
usuário. Usar comando passivo, sem --live-memory; start-map.sh do upstream ativa
leitura de memória por padrão e precisa ser revisto antes dessa implantação.
