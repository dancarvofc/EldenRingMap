# TASK-006 — Integridade do parser e inspeção passiva de cópia

Continuação autorizada em 13/11/2026. Primeiro contato com uma cópia isolada do
save real; nenhuma alteração nos arquivos originais do jogo ou nos saves.

## Mudança
readStable deixa de retornar dados sem checksum válido após esgotar tentativas.
Valida tanto representação bruta quanto AES; checksums do resumo/personagem são
exigidos e buildSnapshot reforça a condição antes de publicar found.
BND4 verifica limites de diretório, nomes e payloads.

--save-copy mantém o caminho passivo existente com arquivo explícito, somente
localhost, sem leitura de memória, estado global manual ou gravações de seleção.
UI identifica inspeção de cópia, permite trocar personagens e exibe apenas
marcadores automáticos originais. Quests reais permanecem unknown, sem mocks.

## Evidências
- 12 testes node:test: integridade, AES, corrupção de personagem/resumo, limites,
  API read-only e a suíte anterior de regras, persistência, HTTP e SSE.
- Cópia privada com permissão 0400 conferida por hash contra origem antes/depois.
  Os três personagens foram lidos com checksums válidos, flags e posição.
- Playwright 390/1280 px: seleção dos personagens, contagem de marcadores coerente
  com API, popup sem botão de escrita e ausência de pageerror. Capturas revisadas.
- Nenhum save, hash pessoal ou asset local adicionado ao commit.

## Pendências
Identidade estável e persistência manual para personagens reais; regras reais de
quests; LAN e Decky. A demo de quests simuladas continua disponível separadamente.
