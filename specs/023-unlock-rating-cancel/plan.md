# Implementation Plan: Destravar avaliação de fornecedor (§1.6) + cancelamento de contrato (§1.7)

**Branch**: `feat/act-acordo-022` (ou branch própria) | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/023-unlock-rating-cancel/spec.md`

## Summary

Duas capacidades do #32 estão **desabilitadas no front** com comentário stale; esta fatia as **destrava** (frontend-only, aditivo):

- **US1 (§1.6) — Avaliação de fornecedor** (`partners/supplier`): habilitar `serviceRating` (enum `RUIM|REGULAR|BOM|OTIMO` ou null) + `ratingComment` (string|null) no cadastro/edição/detalhe. Os campos já existem no form, **desabilitados**; o backend agora aceita/retorna.
- **US2 (§1.7) — Cancelamento de contrato** (`contracts`): `DELETE /api/v1/contracts/:id` **cancela (soft)** um contrato **Pendente** → status **Cancelled**; não-Pendente → **409 `ContractNotPending`**. A `delete-contract-modal` (hoje desabilitada, comentário "405 proíbe exclusão") vira **"cancelar contrato"**; o status do front ganha **`Cancelado`**.

Abordagem: US1 espelha o que já existe no supplier (só liga os 2 campos + mapeadores). US2 adiciona `Cancelado` ao `ContractStatus` (typed) — tratado em **todos os switches/Records de status** (o guard `never` força a completude) — + um `cancelContract` **separado** do `endContract` (distrato), com gating só-Pendente e cadeia de erro amigável.

> **Coordenação**: a fatia **022 (ACT)** roda no mesmo working tree (mexe em `partners` act* + erros/i18n compartilhados). **Implementar a US1 (supplier) só após a 022 fechar** (mesmo módulo/arquivos de erro/i18n). A **US2 (contracts) é independente** da 022 e pode ir antes.

## Technical Context

**Language/Version**: TS strict, React 19, TanStack Start/Query/Router, Zod 4, vanilla-extract.
**Testing**: node:test (mapeadores/status/gating) + vitest (form rating, modal cancelar).
**Project Type**: web app (front+BFF). Server fn = única fronteira.
**Constraints**: invariantes v2 (lint): Result sem throw fora da borda; sem any; imutabilidade; só-tokens; i18n; views burras; boundaries; Zod na borda; naming postfix; **switch exaustivo `never`** (crítico no `Cancelado`). Sem tocar core-api.
**Scale/Scope**: US1 ~8 arquivos (supplier); US2 ~12 arquivos (contracts, por causa dos switches de status). Aditivo.

## Constitution Check

| Princípio | Status | Como cumpre |
|---|---|---|
| II Result | ✅ | mapeadores/use-cases Result; throw só na borda. |
| III Server fn única fronteira | ✅ | cancelContract via `cancel-contract.service.fn`; supplier já via server-fns. |
| IV estados ilegais | ✅ | `ServiceRating` enum + null; `ContractStatus += 'Cancelado'` com switch exaustivo `never` em todos os pontos. |
| V erro→i18n | ✅ | `ContractNotPending`→tag; `invalid-service-rating`→tag; UI não olha HTTP. |
| VI Zod na borda | ✅ | supplier input/response ganham serviceRating/ratingComment; contracts status enum atualizado; drift guards. |
| X só-tokens | ✅ | badge `Cancelado` reusa tokens (espelha `statusBadgeTerminated`); o `client/domain/status.ts` legado (string-key/Tailwind) já tem 'cancelado'. |
| XI views burras | ✅ | data-hooks no binding; form no controller. |
| i18n | ✅ | labels rating + tags cancelar/erro. |

**Resultado**: PASS.

## Project Structure

```text
specs/023-unlock-rating-cancel/
├── plan.md · research.md · data-model.md · quickstart.md
├── contracts/{supplier-rating.md,contract-cancel.md}
└── checklists/requirements.md
```

### Arquivos a tocar

```text
US1 — Fornecedor (partners/supplier) — ⚠️ após a 022 fechar
server/domain/supplier/supplier.{io,types}.ts   # CreateSupplierInput/SupplierDetail += serviceRating: ServiceRating|null, ratingComment: string|null; type ServiceRating
server/adapters/supplier.io-schemas.ts          # input += serviceRating enum nullable, ratingComment nullable + drift guard
server/adapters/core-api/supplier.schema.ts     # response += serviceRating(string nullable→tolerante), ratingComment nullable
server/adapters/core-api/core-api-suppliers.ts  # toWriteBody += os 2 campos; itemToModel/detailToModel += ler (string→ServiceRating|null tolerante)
client/data/model/supplier.model.ts             # SERVICE_RATINGS const + tipos + form schema += 2 campos
client/supplier-create/components/supplier-form.{controller.ts,component.tsx} # HABILITAR select rating + comentário (remover disabled/gated)
client/supplier-detail/...                       # exibir avaliação (nível + comentário)
shared/i18n/catalog.pt-BR.ts                     # partners.suppliers.rating.{RUIM,REGULAR,BOM,OTIMO} + "sem avaliação"

US2 — Cancelamento (contracts) — independente da 022
server/domain/contracts.types.ts                # ContractStatus += 'Cancelado'; ContractsError += 'contract-not-pending'
client/data/model/contracts.model.ts            # ContractStatusSchema z.enum += 'Cancelado'
server/adapters/contracts.schemas.ts            # ContractStatusSchema z.enum += 'Cancelado'
server/adapters/core-api/core-api-contracts.ts  # statusApiToDomain Cancelled→'Cancelado'; statusDomainToApi Cancelado→'Cancelled'; SLUG_TO_ERROR ContractNotPending/contract-not-pending→'contract-not-pending'; novo cancelContract (DELETE /contracts/:id)
server/application/commands/cancel-contract.use-case.ts (NOVO)
server/adapters/server-fns/cancel-contract.service.fn.ts (NOVO)  # DELETE; input {contractId uuid}; try/catch→erro
server/adapters/contracts.composition.ts        # + createCancelContract
client/data/repository/contracts.repository.ts(.instance)  # + cancelContract(contractId)
client/contract-terminate/cancel-contract.{mutation,binding}.ts (NOVO)  # DELETE + invalida grid/detalhe
client/contract-list/components/delete-contract-modal.component.tsx → cancelar (i18n; habilita só Pendente)
client/contract-list/... (gatilho) + contract-detail (se oferecer lá)
client/data/helpers/contracts-error-tag.ts      # + case 'contract-not-pending'
client/contract-detail/page/contract-detail.{page.tsx,css.ts}  # STATUS_BADGE_CLASS += Cancelado + statusBadgeCancelled (token)
client/contract-list/components/{contract-row.component.tsx,contract-status-chips.component.tsx}, client/data/contract-list-filters.schema.ts
shared/i18n/catalog.pt-BR.ts                     # contracts.cancel.* + contracts.error.contract-not-pending + label 'Cancelado'
```

**Structure Decision**: US1 = ligar campos existentes (baixo risco). US2 = adicionar status `Cancelado` ao caminho **tipado** + fluxo de cancelamento **separado** do distrato. Manter nomes; reusar `partnersErrorTag`/`contractsErrorTag`.

## Complexity Tracking
> Sem violações. O churn da US2 (status em vários switches) é guiado pelo guard `never` (typecheck aponta cada ponto).

## Migrations Drizzle (core-api)
- [x] **nenhuma** — frontend-only; #32 já entregou serviceRating e DELETE→Cancelled.

## Contrato HTTP (consumo — core-api NÃO muda)
- US1: `POST/PUT /api/v1/suppliers` + detalhe aceitam/retornam `serviceRating` ('RUIM'|'REGULAR'|'BOM'|'OTIMO'|null) + `ratingComment` (string|null). Catálogo `GET /suppliers/service-ratings` (4 níveis). Erro `invalid-service-rating` → 422.
- US2: `DELETE /api/v1/contracts/:id` → 200 (Cancelled) p/ Pendente; não-Pendente → **409 `ContractNotPending`** (CONFLICT_CODES inclui também `contract-not-pending`).

## Estimativa de Pipeline (W0 size)
- **Tamanho**: **M** (US1) + **M/L** (US2 pelos switches de status).
- **Plano de testes W0 (RED)**:
  - node:test — supplier mapeadores (serviceRating/ratingComment request/response, null tolerante); `statusApiToDomain('Cancelled')==='Cancelado'`; gating `canCancel(status)` (só 'Pendente'); SLUG `ContractNotPending`→'contract-not-pending'.
  - vitest — supplier-form (select rating habilitado + comentário); cancel-modal (habilita só Pendente; confirma).
