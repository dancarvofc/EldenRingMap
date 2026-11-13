# Inspeção passiva de uma cópia de save

Etapa experimental: reutiliza SaveReader, EventFlags, marcadores, posição, seletor,
mapa e SSE originais. Não avalia quests reais e não acessa memória do processo.

Prepare uma cópia local fora do controle de versão, com o jogo sem gravar no
arquivo naquele momento. Compare os hashes da cópia e da origem. Use a cópia:

```sh
node server/index.js --save-copy '/caminho/para/COPIA.sl2' --port 8100
```

Abra http://localhost:8100. O caminho é informado explicitamente: a opção não
adivinha nem comprova se um arquivo foi copiado. O servidor somente o lê.

## Comportamento

- Todas as entradas devem passar pelo checksum, em formato bruto ou AES, antes
  de o snapshot ser aceito. Arquivos incompletos/corrompidos são recusados.
- Cabeçalho e personagem são verificados antes de extrair flags; o snapshot
  público informa checksumOk e não contém bitfield bruto.
- O seletor permite somente personagens desse arquivo; não troca para outros.
- Marcações manuais são desativadas e o estado global legado não é exibido.
  Seleção de personagem nesta inspeção não grava user-state.json.
- Não pode combinar com mock, --save, leitura de memória ou acesso LAN.
- A posição é a última posição gravada no save, não rastreamento em tempo real.
- Progresso é o resultado das flags associadas aos marcadores do upstream;
  isso não comprova etapas narrativas ou conclusão de quests.
- Uma leitura posterior inválida não substitui o último snapshot verificado;
  o watcher publica erro. Nenhum progresso é calculado do arquivo inválido.

O modo mock continua com progresso manual por perfil e quests fictícias. No modo
save-copy esses painéis não aparecem: não há mistura de personagens reais e mocks.

## Testes

`npm test` usa containers BND4 sintéticos originais gerados em diretórios
 temporários: checksum válido/inválido, AES, limites, API read-only e regressões
 anteriores. Não precisa de save pessoal.

Verificação opcional do navegador com assets locais:

```sh
PLAYWRIGHT_MODULE=/caminho/playwright-core BROWSER_EXECUTABLE=/caminho/chrome node tools/verify_save_copy.cjs '/caminho/COPIA.sl2'
```

Valida seleção, contagens da API no frontend, popup sem escrita e viewports de
390/1280 px; confere bytes da cópia antes/depois. Capturas temporárias podem conter
nomes e progresso pessoais e não devem ser publicadas. Não versionar saves.

## Próximo passo

Definir uma identidade estável de personagem antes de habilitar persistência
manual real; não usar nome, slot ou checksum do arquivo como identidade definitiva.
Depois validar regras de quests sem copiar catálogos de licença restritiva.
LAN e inicialização Decky continuam etapas posteriores.
