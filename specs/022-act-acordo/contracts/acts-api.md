# Contrato: recurso ACT (BFF ↔ core-api) — Acordo de Cooperação Técnica

> Frontend-only. O browser fala só com as server functions do recurso ACT (única fronteira). O core-api **não muda** (reescrito no #32).

## Endpoints consumidos (`/api/v1/acts`)

| Método & rota | server-fn (mantida) | Notas |
|---|---|---|
| `GET /acts` | `list-acts.query.fn` | filtros `search/active(0\|1)/hasFinancialTransfer(0\|1)/occupationArea`; meta harmonizada |
| `GET /acts/:id` | `get-act.query.fn` | detalhe (campos + id/legacyId/active/createdAt/updatedAt) |
| `POST /acts` | `create-act.service.fn` | **201 + Location** (sem corpo) → ler id → GET detalhe |
| `PUT /acts/:id` | `update-act.service.fn` | substituição total (mesmo body) |
| `POST /acts/:id/deactivate` · `/reactivate` | `deactivate/reactivate-act.service.fn` | POST sem body → refetch detalhe |

## Body POST/PUT (domínio → wire)

```jsonc
{
  "actNumber": "ACT-2026-001",
  "name": "Acordo de Cooperação X",
  "email": "contato@instituicao.org",
  "cnpj": "11222333000181",          // só-dígitos (onlyDigits) no wire; DV validado no backend
  "corporateName": "Instituição Parceira LTDA",
  "fantasyName": "IP",
  "occupationArea": "PARC",          // PARC|DDI|DCE|EPV
  "legalRepresentative": "João Diretor",
  "startDate": "2026-01-01",         // YYYY-MM-DD
  "endDate": "2026-12-31",           // > startDate (igual/antes → 422)
  "hasFinancialTransfer": false,
  "bankAccount": null,               // { bank, agency, accountNumber, checkDigit } | null
  "pixKey": null                     // { keyType: cpf|cnpj|email|phone|random-key, key } | null
}
```

Regra de repasse: `hasFinancialTransfer: true` ⇒ `bankAccount` **ou** `pixKey` ≠ null (senão 422 `act-payment-target-required`). `false` ⇒ ambos null.

## Validação na borda do BFF (`act.io-schemas.ts`, Zod)
- `actNumber/name/email/corporateName/fantasyName/legalRepresentative`: trim min(1).
- `cnpj`: `min(14).max(18)` (DV no backend).
- `occupationArea`: `z.enum(['PARC','DDI','DCE','EPV'])`.
- `startDate/endDate`: data ISO; `.superRefine`: `endDate > startDate`.
- `hasFinancialTransfer`: boolean; `.superRefine`: se true ⇒ `bankAccount || pixKey`.
- `bankAccount/pixKey`: schemas como no supplier; `.nullable().default(null)`.
- Drift guard `AssertEqual<z.infer<...>, D.CreateActInput>`.

## Response (wire → domínio) — `act.schema.ts`
`actDetailSchema`: `id (uuid), legacyId (number|null), actNumber, name, email, cnpj, corporateName, fantasyName, occupationArea (string tolerante), legalRepresentative, startDate, endDate, hasFinancialTransfer (bool), bankAccount (obj|null), pixKey (obj|null), active (bool), createdAt, updatedAt`. Lista: `{ items: actDetail[], meta: { currentPage, itemsPerPage, itemCount, totalItems, totalPages } }` → `{ page, limit, total }`.

## Erros → tag i18n
| code | HTTP | PartnersError | tag |
|---|---|---|---|
| register-act-number-duplicate / edit-act-number-duplicate / act-number-duplicate | 409 | act-number-duplicate | partners.error.act-number-duplicate |
| invalid-cnpj | 422 | invalid-cnpj | partners.error.invalid-cnpj |
| period-end-before-start / period-zero-duration | 422 | invalid-act-period | partners.error.invalid-act-period |
| act-payment-target-required | 422 | act-payment-target-required | partners.error.act-payment-target-required |
| act-*-required / occupation-area-* / demais | 422 | validation | partners.error.validation |
| unauthorized/forbidden/connectivity/5xx | — | (existentes) | (existentes) |
