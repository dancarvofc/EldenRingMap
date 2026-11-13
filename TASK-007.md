# TASK-007 — Perfis manuais explícitos para personagens da cópia

Continuação autorizada em 13/11/2026. Reutiliza o estado manual, JSON atômico,
seletor de personagens, popups de marcadores e SSE existentes.

## Decisão de identidade
O parser atual não expõe uma identidade permanente comprovada. Não inventar um
GUID do jogo, não usar nome/slot/checksum como identidade definitiva.

Criar perfis locais com UUID. O usuário associa explicitamente um perfil ao
personagem selecionado. A associação só existe na sessão do servidor. Um token
SHA-256 do payload e resumo observado é usado apenas para recusar escritas após
mudanças, não como identidade persistente. Alteração, renomeação ou restauração
que mude os bytes observados interrompe o vínculo; notas permanecem no perfil.
Após reiniciar, reassociar explicitamente. Esse fluxo é provisório e conservador.

## Resultado
- Criar perfil local e associar perfil existente na inspeção de cópia.
- Lista personalizada e marcações de marcadores por perfil explícito.
- Não permitir um perfil associado simultaneamente a dois slots.
- Escritas manuais exigem slot, token observado e UUID do perfil vinculado.
- Atualizações via SSE sem alterar found automático; JSON separado e ignorado.
- Host local e origem validados nos modos mock/inspeção locais.
- Nenhuma alteração no save ou importação de catálogos externos.

## Verificação
13 testes node:test: inclui reinício, reassociação, alteração/restauração de
snapshot, nomes de perfil repetidos, isolamento e rejeição de Host externo.
Playwright com cópia real: 390/1280 px, criar perfil, objetivos, trocar personagem,
reload e popup de marcador; cópia inalterada. Modos mock e prévia local também
verificados em 360/390/1280 px. Quests reais continuam não avaliadas.

## Próximo passo
Validar regras reais pequenas com evidência própria e explicações auditáveis;
manter associação explícita até comprovar identidade estável no formato do save.
LAN e Decky não foram iniciados nesta tarefa.
