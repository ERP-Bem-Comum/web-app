# Research: ACT reescrito — Acordo de Cooperação Técnica

Investigação no front (módulo partners, recurso ACT + molde Supplier) e no backend `dev` (#32). NEEDS CLARIFICATION resolvidos.

## Achados de código

### Supplier é o molde (mesmo miolo CNPJ + conta/PIX)
- `supplier.io.ts` `CreateSupplierInput`: `name, email, cnpj, corporateName, fantasyName, serviceCategory, bankAccount: BankAccount|null, pixKey: SupplierPixKey|null`.
- `BankAccount = { bank, agency, accountNumber, checkDigit }`; `PixKeyType = 'cpf'|'cnpj'|'email'|'phone'|'random-key'`; `PixKey = { keyType, key }`.
- `supplier.io-schemas.ts`: `CreateSupplierInputSchema` valida cnpj `min(14).max(18)`, bankAccount/pixKey `.nullable().default(null)`. **Sem** a regra "ao menos um" no front (delega ao backend 422).
- `core-api-suppliers.ts`: `toWriteBody` faz `onlyDigits(cnpj)`, passa bankAccount/pixKey direto; **create lê o header `Location`** (`globalThis.fetch` nativo → `response.headers.get('location')?.split('/').pop()` → `fetchDetailById`); `listToModel` mapeia meta `{ page: currentPage, limit: itemsPerPage, total: totalItems }`; `deactivate/reactivate` = POST sem body → refetch detalhe. **Sem util compartilhado** — cada adapter repete inline.
- Form: `supplier-form.controller.ts` infere conta/PIX dos campos preenchidos; UI tem `<select>` de `PIX_KEY_TYPES`. `act` vai além: toggle `hasFinancialTransfer` explícito.

### Padrões partners reusáveis (in-place, já presentes no ACT)
- `core-api-acts.ts` já faz Location + meta + deactivate/reactivate (manter; só trocar o body/parse).
- `partnersErrorTag` (client/data/helpers) = switch exaustivo com guard `never`; `PartnersError` union no server-domain + cópia client. `SLUG_TO_ERROR` por adapter (acts hoje só unauthorized/forbidden).
- Rotas existentes: `src/routes/_authenticated/parceiros/atos/{index,criar,$id,$id.editar}.tsx` — **manter** (só o conteúdo do recurso muda).

### OccupationArea
- `act.model.ts` já define `OCCUPATION_AREAS = ['PARC','DDI','DCE','EPV']`; labels i18n `partners.acts.area.*` **já existem**. **Manter.**
- `EmploymentRelationship`/`RegistrationStatus` de `act.types.ts` são **duplicados** (collaborator tem os seus próprios) → **remover do ACT é seguro** (não há import cross-recurso). *(Confirmar no implement com grep antes de deletar.)*

### Backend (#32, dev) — slugs de erro exatos
- `register-act-number-duplicate` / `edit-act-number-duplicate` / `act-number-duplicate` → **409**.
- `invalid-cnpj` → 422. `period-end-before-start` **e** `period-zero-duration` → 422 (⇒ **fim > início estrito**). `act-payment-target-required` → 422. `act-*-required` (name/email/corporate/fantasy/legal-representative) → 422.

## D1 — Espelhar Fornecedor por CÓPIA/ADAPTAÇÃO (não extração)
- **Decisão**: copiar/adaptar os padrões do supplier para o ACT, **sem** extrair componentes compartilhados.
- **Rationale**: extrair (conta/PIX, etc.) tocaria o supplier (módulo funcionando) → risco de regressão (SC-005). Cópia mantém o ACT autônomo; o custo (duplicação) é aceitável para esta fatia e consistente com o padrão atual dos partners (cada recurso é self-contained).

## D2 — `hasFinancialTransfer` explícito (difere do supplier)
- **Decisão**: modelar `hasFinancialTransfer: boolean` no domínio/IO/UI (o body do #32 exige o boolean). UI: **toggle** que revela os campos de conta/PIX; quando off, conta/PIX = null e ocultos.
- **Rationale**: o supplier infere a presença; o ACT tem o campo no contrato e a regra "true ⇒ conta|pix". Explicitar evita ambiguidade e casa com o backend.

## D3 — Validação em duas camadas (UI + borda), backend árbitro
- **Decisão**: (a) **UI** (controller) bloqueia submit e mostra mensagem para: repasse on sem conta/PIX; vigência fim ≤ início; campos obrigatórios. (b) **Borda Zod** (`act.io-schemas`) defende com `.superRefine` (mesmas regras) → erro de validação antes do core-api. (c) o **core-api** é o árbitro final (cnpj DV, unicidade do actNumber).
- **Rationale**: melhor UX (bloqueio imediato) + defesa em profundidade; cnpj DV e unicidade só o backend sabe → mapear os 422/409 para tags amigáveis.

## D4 — Vigência: fim ESTRITAMENTE após início
- **Decisão**: `endDate > startDate` (igual ou anterior é inválido). Espelha `period-zero-duration` + `period-end-before-start` do backend. Corrigido na spec (edge case + cenário 5).
- **Rationale**: o backend recusa duração zero; a UI deve refletir exatamente.

## D5 — occupationArea (enum → label i18n)
- **Decisão**: manter `OccupationArea = 'PARC'|'DDI'|'DCE'|'EPV'` + `<select>` com labels `partners.acts.area.*` (já existem). Filtro de lista também por área.
- **Rationale**: reuso direto; sem inventar.

## D6 — O que remover do front (modelo pessoa-física)
- **Decisão**: remover `cpf`, `role`, `startOfContract`, `employmentRelationship`, `RegistrationStatus`/`registration`, `EmploymentRelationship`, e o passo `complete-registration` do recurso ACT (IO, schemas, model, UI, rotas se houver passo dedicado). Manter `OccupationArea` e a noção de ativo/inativo (`active`).
- **Rationale**: não existem mais no #32 (SC-004 = zero menções). Confirmar via grep que nada fora do ACT importa esses símbolos antes de deletar (collaborator tem cópias próprias → seguro).

## D7 — Erros: 4 membros novos em PartnersError + tags
- **Decisão**: `PartnersError += 'act-number-duplicate' | 'invalid-cnpj' | 'invalid-act-period' | 'act-payment-target-required'` (server + cópia client); `partnersErrorTag` += 4 casos; `SLUG_TO_ERROR` (core-api-acts) mapeia os slugs do #32 (incl. as 3 variantes de duplicidade e as 2 de período). Tags i18n amigáveis.
- **Rationale**: FR-002/003/004 pedem mensagens específicas; reusar `validation`/`conflict` genéricos perderia a orientação.

## D8 — Manter nomes de arquivo `act-*` (rewrite de conteúdo)
- **Decisão**: não renomear arquivos/pastas (`act-create`, `act-edit`, `act-detail`, `act-list`, rotas `atos/`); só trocar o conteúdo.
- **Rationale**: minimiza churn de imports/rotas e o risco de quebrar navegação; o diff fica focado no que muda (campos/modelo).
