# Research: Destravar avaliação de fornecedor (§1.6) + cancelamento (§1.7)

Investigação no front (read-only) + backend `dev` (#32). NEEDS CLARIFICATION resolvidos.

## Achados de código

### US1 — Fornecedor (já existe, desabilitado)
- `supplier-form.component.tsx`: campos `serviceRating` (`<select disabled>`) e `ratingComment` (`<Input disabled>`) com `title=partners.suppliers.form.gatedHint` ("sem suporte no backend ainda" — **stale**). Labels `partners.suppliers.form.serviceRating/ratingComment` já existem.
- `supplier.io.ts` `CreateSupplierInput`/`SupplierDetail`: hoje **sem** serviceRating/ratingComment.
- `supplier.io-schemas.ts` / `core-api/supplier.schema.ts` / `core-api-suppliers.ts`: idem — falta os 2 campos no input/response/mapeadores (`toWriteBody`, `itemToModel`/`detailToModel`).
- Backend #32: `serviceRating: 'RUIM'|'REGULAR'|'BOM'|'OTIMO'` (domínio `service-rating.ts`), response `serviceRating: z.string().nullable()`, write `serviceRating: z.string().nullable().default(null)` + `ratingComment`. Catálogo `GET /suppliers/service-ratings`. Erro `invalid-service-rating` (422).

### US2 — Cancelamento (contrato)
- `ContractStatus` (typed) = `'Pendente'|'Em Andamento'|'Finalizado'|'Distrato'` em **dois** lugares: `server/domain/contracts.types.ts` e `client/data/model/contracts.model.ts` (z.enum) + `server/adapters/contracts.schemas.ts` (z.enum). **Falta `'Cancelado'`**.
- `statusApiToDomain` (core-api-contracts): mapeia Pending/Active/Expired/Terminated; **Cancelled cai no fallback `'Finalizado'`** → corrigir p/ `'Cancelado'`. `statusDomainToApi` → +Cancelado→'Cancelled'.
- Switches/Records de status a tratar (guard `never`/typecheck aponta): `contract-detail/page/contract-detail.page.tsx` (`STATUS_BADGE_CLASS` Record) + `contract-detail.css.ts` (classe `statusBadge*`); `contract-list/components/contract-row.component.tsx`; `contract-status-chips.component.tsx`; `client/data/contract-list-filters.schema.ts`. **Nota:** o `client/domain/status.ts` LEGADO (string-key/Tailwind, `ContractRow` de `./types`) **já tem 'cancelado'** em `statusBadgeClass`/`STATUS_OPTIONS` — não exige mudança (não é union-exaustivo).
- `delete-contract-modal.component.tsx`: existe, **desabilitada**, comentário "405 contract-delete-forbidden" (stale). i18n `contracts.list.delete.*`.
- `endContract` (distrato) existe no repository/adapter (POST /:id/end) — **NÃO** reutilizar; criar `cancelContract` (DELETE /:id) separado.
- Backend: `DELETE /contracts/:id` → 200 Cancelled (Pendente); não-Pendente → **409 `ContractNotPending`** (CONFLICT_CODES inclui `contract-not-pending` e `ContractNotPending`). `cancel-contract.ts` use-case existe no core-api.

## D1 (US1) — Níveis de avaliação: enum fixo (não consumir GET /service-ratings)
- **Decisão**: enum fixo no front `SERVICE_RATINGS = ['RUIM','REGULAR','BOM','OTIMO']` + labels i18n `partners.suppliers.rating.*`; `serviceRating: ServiceRating | null`.
- **Rationale**: os 4 níveis são canônicos/estáveis (domínio do backend). Consumir `GET /service-ratings` adicionaria server-fn/query p/ uma lista fixa — custo desproporcional (mesma lógica da decisão 021). Se o backend passar a ter níveis dinâmicos, revisitar.

## D2 (US1) — Opcionalidade + leitura tolerante
- **Decisão**: `serviceRating`/`ratingComment` **opcionais** (null). Form: "sem avaliação" = null (a opção vazia do select). Na leitura (response), `serviceRating` vem como string nullable → mapear `string → ServiceRating | null` **tolerante** (valor desconhecido → null, não quebra). `ratingComment` string|null.
- **Rationale**: o backend permite null; tolerância evita quebra com dados legados.

## D3 (US1) — Erro
- **Decisão**: `invalid-service-rating` → mapear no `SLUG_TO_ERROR` do supplier para `'validation'` (genérico já existente) OU adicionar `'invalid-service-rating'` ao `PartnersError` se quiser mensagem específica. **Recomendo `validation`** (a UI já restringe ao enum; é defesa). Decisão final no implement (barato mudar).

## D4 (US2) — `ContractStatus += 'Cancelado'` (caminho tipado) tratado em todos os switches
- **Decisão**: adicionar `'Cancelado'` aos 3 schemas/tipos + `statusApiToDomain`/`statusDomainToApi` + cada switch/Record de status (badge/cor/label/chip/filtro). Badge reusa o token de terminal (espelha `statusBadgeTerminated`/cor de distrato, ou cor própria neutra). O `status.ts` legado já cobre 'cancelado'.
- **Rationale**: o guard `never` quebra o build se faltar — o typecheck vira o checklist. Cor: `Cancelado` ≈ terminal/neutro (não confundir com Distrato vermelho? decidir no implement — sugiro cinza/neutro distinto do vermelho do distrato).

## D5 (US2) — `cancelContract` SEPARADO do `endContract` (distrato)
- **Decisão**: novo método `cancelContract(contractId)` no client adapter (DELETE /contracts/:id) → use-case `cancel-contract` → server-fn `cancel-contract.service.fn` (input `{contractId: uuid}`) → repository → mutation/binding próprios. NÃO mexer no fluxo de distrato (`endContract`).
- **Rationale**: semânticas diferentes (cancelar Pendente vs distratar Ativo); endpoints diferentes (DELETE vs POST /end); evita acoplar/regredir o distrato (020).

## D6 (US2) — Gating só-Pendente + erro 409
- **Decisão**: a ação "cancelar" só aparece/habilita p/ `status === 'Pendente'` (no grid e, se oferecido, no detalhe). Defesa: 409 `ContractNotPending`/`contract-not-pending` → `ContractsError 'contract-not-pending'` → tag `contracts.error.contract-not-pending` ("Apenas contratos pendentes podem ser cancelados."). A `delete-contract-modal` vira **cancelar** (i18n `contracts.cancel.*`), habilitada.
- **Rationale**: espelha FR-006/FR-008; defesa em profundidade.

## D7 — Coordenação com a 022
- **Decisão**: implementar **US2 (contracts) primeiro/independente**; **US1 (supplier) só após a 022 fechar** (mesmo módulo partners + arquivos de erro/i18n compartilhados que a 022 está editando). Evita conflito de merge no working tree.
