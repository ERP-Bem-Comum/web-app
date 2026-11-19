# 133 — Colaborador: inativar e reativar no detalhe

**Tamanho:** M · **Status:** implementado (web-app) · **Data:** 2026-11-19
**Backend:** core-api — nada novo. `POST /collaborators/:id/deactivate` (`{ disableBy }`) e
`POST /collaborators/:id/reactivate` já existem, com `collaborator:write` e entrada no histórico.

## Pedido (P.O., 19/11)

Habilitar a função de inativar um registro de colaborador em Parceiros > Colaboradores.

## Situação antes

O BFF já tinha tudo: server fns `deactivateCollaboratorFn` / `reactivateCollaboratorFn`, use-cases,
client core-api e repository no client. A tela de detalhe não tinha o botão. O detalhe também não
trazia o motivo gravado (`disableBy`).

## Comportamento

1. **Detalhe, modo leitura, com `collaborator:write`:** botão **Inativar** (colaborador ativo) ou
   **Reativar** (inativo), ao lado de **Editar**. O mesmo padrão do Fornecedor.
2. **Inativar** abre um diálogo com **Motivo** obrigatório (os 4 motivos do core-api):
   - Desligamento pela ABC
   - Falecimento
   - Tempo de contrato finalizado
   - Solicitação de rescisão contratual

   **Inativar** só habilita com um motivo escolhido. Em caso de erro, o diálogo fica aberto e mostra
   a mensagem.

3. **Reativar** pede confirmação simples (o core-api não pede motivo).
4. **Cabeçalho:** colaborador inativo mostra "Cadastro … · Inativo · <motivo>". Inativo migrado do
   legado (`LEGACY_MIGRATION`, sem causa real) mostra só "Inativo".
5. Ao concluir, o detalhe atualiza na hora e as listas de colaboradores são invalidadas.

## Fora do escopo

- Inativar direto pela lista (ação em linha ou em lote).
- Filtro "Desativado por" na lista (segue `GatedSelect`).
- Autor da inativação no histórico (core-api#1040).

## Arquivos

- `server/adapters/core-api/collaborator.schema.ts` + `core-api-collaborators.ts`: `disableBy` →
  `deactivationReason` (só os 4 motivos; o resto vira ausente).
- `client/collaborator-detail/`: view-model (`statusActionFor`, motivos, subtítulo), binding
  (`statusCommand`), diálogo `collaborator-deactivate-dialog.component.tsx`, página.
- i18n: ações, diálogos e rótulos dos motivos.
- Teste: `tests/modules/partners/client/collaborator-detail/collaborator-detail.view-model.test.ts`.
