# Contracts — 025 Integração Parceiros × Contratos

> Fronteiras: server functions (BFF) já existentes do módulo partners; nenhuma rota nova de backend.

## US1 — detalhe de parceiro por tipo (REUSO, via partners/public-api)
- `getSupplierFn({ data: { id } })` → `SupplierDetail` (bankAccount?, pixKey?, email)
- `getActFn({ data: { id } })` → `ActDetail` (bankAccount?, pixKey?, email)
- `getFinancierFn({ data: { id } })` → `FinancierDetail` (telephone)
- `getCollaboratorFn({ data: { id } })` → `CollaboratorDetail` (email) — **exportar no public-api**
- Consumo: `contract-create.page.tsx` `handleSelectPartner` (client-ui → partners/public-api, permitido).
- Pré-preenche via `partnerDetailToContractFields(kind, detail)` → `form.update(...)`. Erro → não preenche.

## US2 — propagação do contratado ACT (client, sem backend)
- `Contract` (domain) += `act?: Contractor | null`.
- `ContractSchema` (model, zod) += `act?: PartnerSnapshot` (actId já existe).
- `mapModelToContractRow`/`buildContractDocData` += `act`/`actId`.
- `getContractorFromRow`: `case 'ACT' → row.act`.
- `contract-info`: incluir `act` no fallback e no `typeLabel`.

## US3 — máscara de telefone
- `contract-form` (Contato) e `contract-contato` (edição): `<Input mask="phone" …>` (shared). Salva dígitos.

## US4 — novo parceiro com retorno
- `handleCreateNewPartner`: `navigate({ to: '/parceiros/fornecedores/criar', search: { returnTo: '/contratos/criar' } })`.
- Rotas `parceiros/{fornecedores,colaboradores,atos,financiadores}/criar.tsx`: `validateSearch({ returnTo? })`.
- Bindings de criação (`*-create.binding.ts`) `onSuccess`: `navigate({ to: safeRedirect(search.returnTo, '<lista>') })`.
- `safeRedirect` reusado de `auth/public-api`.

## US5 — auto-PIX (cadastro de parceiro)
- `derivePixKey(keyType, { cnpj, email })` (puro, novo em `partners/client/domain/derive-pix-key.ts`).
- `supplier-form.component.tsx` + `act-form.component.tsx`: onChange do select de tipo →
  `setField('pixKeyType', t)` + `setField('pixKey', derivePixKey(t, state))`.

## Não muda
- core-api; agregador de busca; detalhe do contrato (exibição); CSS; PIX/banco colaborador/financiador.
