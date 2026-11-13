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
- Marcações manuais exigem associação explícita a perfil local. O estado global
  legado não é exibido. Seleção de personagem não grava user-state.json.
- Não pode combinar com mock, --save, leitura de memória ou acesso LAN.
- A posição é a última posição gravada no save, não rastreamento em tempo real.
- Progresso é o resultado das flags associadas aos marcadores do upstream;
  isso não comprova etapas narrativas ou conclusão de quests.
- Uma leitura posterior inválida não substitui o último snapshot verificado;
  o watcher publica erro. Nenhum progresso é calculado do arquivo inválido.

O modo mock continua com progresso manual por perfil e quests fictícias. Na
inspeção real, apenas a lista manual aparece após associar um perfil; quests
fictícias nunca aparecem e não há mistura de progresso entre real e mock.

## Testes

`npm test` usa containers BND4 sintéticos originais gerados em diretórios
 temporários: checksum válido/inválido, AES, limites, API read-only e regressões
 anteriores. Não precisa de save pessoal.

Verificação opcional do navegador com assets locais:

```sh
PLAYWRIGHT_MODULE=/caminho/playwright-core BROWSER_EXECUTABLE=/caminho/chrome node tools/verify_save_copy.cjs '/caminho/COPIA.sl2'
```

Valida seleção, contagens da API no frontend, associação explícita, lista manual,
marcação no popup original e viewports de
390/1280 px; confere bytes da cópia antes/depois. Capturas temporárias podem conter
nomes e progresso pessoais e não devem ser publicadas. Não versionar saves.

## Próximo passo

Investigar uma identidade estável do jogo; não usar nome, slot ou checksum do
arquivo como identidade definitiva. Até lá, usar a associação explícita abaixo.
Depois validar regras de quests sem copiar catálogos de licença restritiva.
LAN e inicialização Decky continuam etapas posteriores.

## Associação explícita e persistência manual

Na tela da cópia:
1. Selecione o personagem.
2. Digite um nome para o perfil local e use **Criar e associar**, ou selecione um
   perfil já salvo e use **Associar ao personagem selecionado**.
3. Use Minha lista e os botões de marcação do popup original do mapa.

Perfis locais têm UUIDs independentes, inclusive quando possuem o mesmo nome.
Persistem em `cache/real-manual-state.json`; para outro destino use
`--manual-state /caminho/local/estado.json`. Esse arquivo contém apenas o estado
local do companion e é separado dos mocks, do estado legado e do save.

A associação não tenta reconhecer automaticamente o personagem. Ao reiniciar o
servidor ou mudar o conteúdo observado do personagem, ela é interrompida; refaça
a associação ao perfil correto para recuperar suas notas. A restauração de um
backup pode exigir essa confirmação, mas não apaga objetivos manuais.

O token observado é uma verificação de versão para rejeitar ações desatualizadas,
não uma identidade de personagem. Conteúdos byte a byte idênticos são
indistinguíveis por esse mecanismo. Não associar o mesmo perfil a dois
personagens diferentes. O servidor impede vínculo simultâneo em dois slots.

O save continua apenas leitura. O campo `readOnly` refere-se ao save; ações
manuais escrevem exclusivamente no JSON separado do companion.

## Marcos · chefes

Abra o painel **Marcos · chefes** na inspeção. Ele está disponível mesmo sem
associar perfil manual. Busca por nome e filtros de estado/camada organizam os
marcadores já extraídos da instalação local; não é um catálogo novo.

**Derrota registrada** exige flag ativa no personagem de checksum válido.
**Derrota não registrada** indica flag false, sem afirmar se o chefe está
acessível. **Desconhecido** significa ausência de evidência confiável. Não existe
estado de quest perdida neste painel. A lista é recalculada de cada snapshot,
inclusive após restaurar backup; as notas manuais continuam independentes.

Em **Ver evidências**, consulte ID da flag, valor esperado/observado, origem e
versão da regra. **Ver no mapa** reutiliza camada, posição, canvas e popup do
marcador original. Nomes de arenas e cobertura têm as limitações do extrator;
a lista não promete representar todos os chefes possíveis do jogo.

Esses marcos não avaliam quests de NPC, pontos sem retorno nem consequências
narrativas de uma vitória. Nenhum registro de marcação manual prova derrota.
