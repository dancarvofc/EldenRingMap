# Prévia com mapa real local e progresso simulado

Reutiliza o mapa canvas, extratores, marcadores, filtros, busca, seleção, ícones e
SSE do upstream. Não é outro motor de mapa nem um catálogo de marcadores novo.
Os painéis companion adicionam objetivos e evidências à interface herdada.

## Preparação

Com Elden Ring instalado e as ferramentas indicadas por `./setup-linux.sh --check`:

```sh
./setup-linux.sh --map-only
```

Se a instalação estiver em outro lugar:

```sh
ER_GAME_DIR='/caminho/ELDEN RING/Game' ./setup-linux.sh --map-only
```

Esse modo prepara dependências em `cache/`, extrai tiles, gera os marcadores
originais e extrai ícones. Não faz scan completo de itens, não busca textos de
wiki, não lê saves, não inicia servidor e não acessa memória do jogo.
A compilação do adaptador Oodle usa a revisão já fixada pelo setup upstream.
No GCC recente, dois avisos específicos não são tratados como erros; os demais
continuam com a política original da biblioteca.

Os arquivos do jogo são apenas lidos; as saídas ficam no projeto em caminhos
ignorados por Git (`cache/`, `web/tiles/`, `web/icons/`, `data/markers.json` e
`data/legacy-conv.json`). Não publicar os assets gerados.

## Inicialização

```sh
npm run start:preview
```

Abra http://localhost:8099. Pare com Ctrl+C. Continua local-only, sem save ou
leitura de memória. O mapa e os marcadores vêm da sua instalação, mas os perfis
Jinx/Guts e as quests são fictícios. Nenhum marcador aparece automaticamente
como coletado com base no save. Marcações manuais ficam no perfil mock escolhido,
separadas do progresso automático e do arquivo legado.

As coordenadas do NPC da POC são sintéticas e, por isso, o NPC fictício não é
exibido sobre o mapa real. Sua posição real será habilitada após validação.

`npm run start:mock` continua oferecendo o fundo sintético e o NPC fictício sem
exigir instalação do jogo; não carrega marcadores reais na API desse modo.

## Verificação

```sh
npm test
PLAYWRIGHT_MODULE=/caminho/playwright-core BROWSER_EXECUTABLE=/caminho/chrome node tools/verify_companion.cjs --local-map
```

O teste de interface exige assets já extraídos; valida o modo local em 360, 390
e 1280 px, incluindo filtros originais presentes e ausência do NPC sintético.
O teste padrão sem --local-map continua independente dos assets de jogo.

O extrator atualizado registra a origem persistente/transitória das flags de
fragmentos. Esse metadado é necessário para a confirmação conservadora da coleta
no painel Exploração da inspeção de save.
