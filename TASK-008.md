# TASK-008 — Marcos auditáveis de chefes a partir dos marcadores originais

Continuação autorizada em 13/11/2026. Nenhum catálogo externo ou flag nova foi
incorporado. Reutiliza os boss markers gerados pelo extrator do upstream.

## Implementação
server/lib/milestones.js avalia no backend a flag de derrota de cada marcador de
chefe, exigindo personagem lido com checksum válido. Publica markerId, status,
fonte, ID/versão da regra, condições esperadas/observadas e explicação no snapshot
HTTP/SSE já existente. Não publica o bitfield.

Estados deste painel de marcadores (não estados de quests):
- completed: alguma flag de derrota associada está true, como no mapa original.
- not-recorded: todas as flags consultáveis estão false; não infere disponibilidade.
- unknown: não há flag ou dados confiáveis suficientes.

Não avalia Forge/Maliketh como causas de perda de quests, não deduz próximos passos
narrativos e não trata marcação manual como evidência automática.

## Interface
Marcos · chefes fica disponível na inspeção real mesmo sem perfil manual.
Usa nomes e camadas dos marcadores já carregados. Busca por nome, filtro por
estado e por camada atual/todas; evidências expansíveis e navegação no canvas
original com troca de camada e popup existente. Nenhum motor novo.

## Verificação
16 testes node:test, incluindo unidade de marcos para true/false/null, checksum
inválido, ausência de flag, OR entre flags e regressão de snapshot.
Playwright com cópia real em 390/1280 px: contagens conferem com found por
personagem, filtros, evidências, busca vazia, troca para DLC e popup. Regressões
anteriores de perfil e objetivos também verificadas. Mock em 360/390/1280 px.
Cópia real permanece idêntica após testes; nenhum dado extraído versionado.

## Pendências
Quests/NPCs reais, validação de pontos sem retorno, identidade definitiva de
personagem, acesso LAN e inicialização Decky seguem fora desta entrega.
