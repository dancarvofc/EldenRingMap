# Modo mock — entregas 1 e 2

Execute com Node.js >=18, sem npm install:

```sh
npm run start:mock
```

Servidor: http://localhost:8099. Para outra porta: `npm run start:mock -- --port 8100`.
Pare com Ctrl+C. Não há serviço persistente ou autostart.

Este modo não procura nem abre saves, não acompanha arquivos e não inicia leitura
de memória. `--save`, `--live-memory` e acesso LAN são recusados em modo mock.
O progresso manual é gravado em cache/mock-manual-state.json, fora do Git.
Para outro destino: --manual-state /caminho/local/estado.json.
/api/check continua reservado ao modo legado; no mock, use /api/manual.

## Exercitar a API

```sh
curl http://localhost:8099/api/state
curl -N http://localhost:8099/api/events
```

Em outro terminal:

```sh
curl http://localhost:8099/api/mock/snapshot \
  -H 'Content-Type: application/json' \
  -d '{"profileId":"mock:jinx","snapshotId":"intermediate"}'
```

Perfis: `mock:jinx` e `mock:guts`. Snapshots: `not-started`, `intermediate`,
`completed`. Voltar a `not-started` recalcula e reverte o progresso automático.
O outro perfil permanece intacto. A reconexão SSE envia o estado atual.

Para selecionar Guts no mesmo seletor usado pelo frontend:

```sh
curl http://localhost:8099/api/saves \
  -H 'Content-Type: application/json' \
  -d '{"path":"mock://demo","slot":1}'
```

A API retorna quests com evidências e localização sintética de NPC. Nenhuma flag
ou coordenada é real. Não representa um guia validado de Millicent. O bitfield
não é enviado ao navegador. Dados ausentes/inválidos ou contraditórios resultam
em `unknown`; nenhuma regra desta demonstração declara `missed`.

## Verificação

```sh
npm test
```

Testa regras, isolamento, regressão, evidências, dados desconhecidos, HTTP, SSE,
reconexão e rejeição de combinações com save/memória/LAN. Os processos de teste
usam portas efêmeras e são encerrados ao terminar. Nenhum save real é necessário.

## Limitações e sequência

A interface de quests e o fundo sintético ainda não foram implementados; a página
original abre, mas pode mostrar um mapa vazio sem tiles locais. A entrega 2 já oferece persistência por perfil na API; a entrega 3
adicionará a demonstração visual/mobile.
A integração de saves reais exige corrigir a confiança em checksum e definir
identidade de personagem; não se presume uma identidade estável por nome ou slot.

O destino é uma aplicação web no Steam Deck, acessada pelo celular. Um plugin
Decky deverá controlar iniciar/parar e mostrar endereço/estado posteriormente.
O comando de implantação será passivo; não usar o start-map.sh atual do upstream
como inicializador passivo, pois ele acrescenta --live-memory.

O README upstream permanece abaixo da apresentação do fork. Seus avisos de
copyright e atribuições são preservados; não foi atribuída nova licença ao código
herdado. Saves e dados/arte extraídos do jogo não devem ser publicados.

## Marcações manuais por personagem

```sh
curl http://localhost:8099/api/manual \
  -H 'Content-Type: application/json' \
  -d '{"profileId":"mock:jinx","type":"check","id":"mock.millicent.meet","on":true}'
curl http://localhost:8099/api/manual \
  -H 'Content-Type: application/json' \
  -d '{"profileId":"mock:jinx","type":"create","title":"Explorar depois"}'
```

O snapshot de cada personagem possui `manual.checked` e `manual.custom`. Para um
objetivo personalizado, use `type: "toggle"`, seu `id` e `on: true/false`; para
remover use `type: "delete"` com o `id`. Use `type: "check"` com `on: false` para
desmarcar uma etapa. Todas as ações exigem `profileId` explícito e atualizam SSE.

As marcações não transformam uma inferência automática em evidência. Permanecem
salvas independentemente do snapshot selecionado. O snapshot automático inicial
é reiniciado ao abrir o servidor; o estado manual é recarregado do JSON. Não há
migração automática das marcações globais antigas. JSON corrompido impede o
início para preservar os dados; não é substituído silenciosamente.
