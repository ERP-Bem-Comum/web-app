# Contrato de Tela — Detalhe de Fornecedor (US3)

**Rota**: `/_authenticated/parceiros/fornecedores/$id` (`$id.tsx`). Dados via `getSupplierFn`.

## Entradas
- `state`: `Result<SupplierDetail, AppError>` derivado do `useQuery` (loading/error/ready/not-found).
- `statusCommand`: `{ running; errorTag; execute(action: 'deactivate' | 'reactivate') }` (do binding).
- `canWrite: boolean` (= `can(granted, 'supplier:write')`), `canViewSensitive: boolean` (= `can(granted, 'supplier:edit-sensitive')`).

## Comportamento
- Render: hero (nome, razão, fantasia, e-mail, CNPJ, categoria, status `Badge`) + aside (bancário/PIX **se** `canViewSensitive`).
- Ativo → ação **Inativar**; inativo → **Reativar** (gated por `canWrite`), ambas com **confirmação** (componente local de confirmação — R9).
- Após sucesso da ação, invalida query do detalhe (e da lista) → status reflete na tela.
- `id` inexistente → mensagem "não encontrado" (i18n).
- Ação dupla bloqueada (`running`); fns idempotentes.
- Navegação: botão "Editar" → `/$id/editar` (gated por `canWrite`).

## Critérios de aceite: US3 (1–5).

## Testes
- `supplier-detail.view-model.test.ts` (node:test): derivação de estado (ready/not-found/error); decisão da ação de status por `activation`; gates por permissão.
