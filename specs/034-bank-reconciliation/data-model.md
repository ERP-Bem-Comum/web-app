# Phase 1 — Data Model: Conciliação Bancária

> **Front + BFF, consumo-only.** Estes são os modelos do **client/BFF** (Zod no input da server fn e no
> response do core-api → modelo do client). Dinheiro = **string de centavos**; datas = **ISO**. Nada
> aqui altera o schema do core-api. Branded types + smart constructors retornando `Result` para os VOs.

## Value Objects (branded, smart constructor → Result)

| VO                                                                                             | Base                         | Regra                                                               |
| ---------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------- |
| `AccountRef` / `PayableId` / `TransactionId` / `StatementId` / `ReconciliationId` / `PeriodId` | uuid                         | formato uuid; branded para não trocar um pelo outro                 |
| `Cents`                                                                                        | string de dígitos (pode `-`) | inteiro em centavos; converte p/ exibição pt-BR via `data/money.ts` |
| `IsoDate`                                                                                      | string                       | ISO; ordenação e agrupamento por dia                                |
| `Score`                                                                                        | number 0..100                | confiança da sugestão                                               |

## Entidades / Modelos

### Conta-cedente (ReconciliationAccount) — _bloqueada por #168_

- Campos: `id (AccountRef)`, `bankCode`, `bankName`, `branch`, `accountNumber`, `accountDv`,
  `alias`, `type: 'Corrente'|'Poupanca'|'Investimento'`, `status: 'Active'|'Closed'`,
  `currentBalanceCents (Cents)`, `lastUpdatedAt (IsoDate)`, `pendingCount`, `reconciliationStatus:
'Pending'|'UpToDate'|'Closed'`.
- Origem: **sem endpoint** (#168) → no MVP, `getAccount`/`listAccounts` devolvem "indisponível"; a TELA 2
  usa **seletor temporário do seed** (D2).
- Estados: `Active` abre workspace; `Closed` **não abre** (FR-002).

### Extrato (BankStatement)

- Campos: `statementId (StatementId)`, `imported (int)`, `duplicatesDiscarded (int)`,
  `period: { start (IsoDate), end (IsoDate) }`.
- Origem: `POST /bank-statements` → resumo da importação (FR-003/FR-004).

### Transação do extrato (StatementTransaction)

- Campos: `id (TransactionId)`, `fitid (string)`, `date (IsoDate)`,
  `movement: 'Debit'|'Credit'`, `entryType (string)`, `payeeName (string)`, `memo (string)`,
  `valueCents (Cents)`, `balanceAfterCents (Cents)`,
  `reconciliationStatus: 'Pending'|'Reconciled'|'ManualEntry'`.
- Origem: `GET /bank-statements/:id/transactions` (sem filtro server-side → filtra no client).
- Derivações de UI: agrupar por **dia** (`date`), ícone por `movement`+`entryType`
  (entrada/saída/transferência/tarifa/aplicação), tag de palpite (alta/média/sem match/conciliado).

### Título conciliável (PaidPayable)

- Campos: `id (PayableId)`, `documentId (string)`, `valueCents (Cents)`, `dueDate (IsoDate)`,
  `paymentMethod (string)`. **(mínimo até #172; supplierName/docNumber entram depois.)**
- Origem: `GET /payables?status=Paid` — **só Pago é conciliável** (regra de domínio, vale o código).

### Sugestão de match (MatchSuggestion)

- Campos: `payableId (PayableId)`, `score (Score)`, `band: 'alta'|'media'`,
  `criteria: { payeeMatch:boolean, exactValue:boolean, dateD0:boolean, memoRef:boolean,
supplierOpenCount:number }`. (band `baixa` não vem do backend.)
- Origem: `GET /statement-transactions/:id/suggestions`.
- Ação: rejeitar (`reject-suggestion`) remove e **não reaparece** (FR-007; rastrear rejeitadas em UI-state
  - refetch).

### Conciliação (Reconciliation)

- Criar (`POST /reconciliations`): input `{ transactionId, payableIds:[1..100],
difference?: { valueCents:int(pode negativo), treatment } }` →
  `{ reconciliationId, type: 'Individual'|'Multiple'|'Partial', itemCount }`.
- **Invariante de balanceamento** (pura, D10): `Σ(payable.valueCents) + (difference?.valueCents ?? 0)`
  === `|transaction.valueCents|`. Sem isso a UI bloqueia (FR-009) e o backend recusa (422).
- `type` derivado: 1 título sem diferença → `Individual`; ≥2 → `Multiple`; com `difference` → `Partial`.
- Desfazer (`POST /reconciliations/:id/undo` `{ reason? }`) → `status:'Undone'`: transação volta
  `Pending`, título volta `Pago`, registro preservado (trilha).

### Lançamento manual (ManualEntry)

- `POST /statement-transactions/:id/manual-entry`: `{ type:
'Payment'|'Receipt'|'Transfer'|'FeePenaltyInterest'|'Investment'|'Redemption', supplierRef?,
categoryRef?, costCenterRef?, programRef?, description? }` → `{ reconciliationId,
type:'ManualEntry', manualEntryId }`. Valor derivado da transação.
- **Confirmação consciente**: `Transfer|Investment|Redemption` exigem `destinationAccount` +
  flag de confirmação (não é pagamento de fornecedor) antes de habilitar submit (FR-010).

### Lote (BatchReconcile)

- `POST /reconciliations/batch`: `{ transactionIds:[1..500], template:<igual manual-entry> }` →
  `{ created, reconciliationIds[], failed:[{transactionId,error}] }`. **Best-effort**: falhas parciais
  não abortam; reportar `failed` (FR-012, edge case lote).

### Período de conciliação (ReconciliationPeriod)

- Fechar (`POST /reconciliation-periods/close`): `{ debitAccountRef, periodStart, periodEnd }` →
  `{ periodId, status:'Closed' }`. Bloqueia se houver pendentes (422
  `period-has-pending-transactions`); range inválido → 400.
- Exportar (`GET /reconciliation-periods/:id/export?format=ofx|csv`): download de texto. **Chrome até
  #173** (não há como obter `periodId` fora do fechamento).

## UI-state (não server-state — reducer/binding)

- **Workspace**: `selectedAccountRef`, `activeTab: 'Extrato'|'Conciliacao'`, `period`,
  `showGuesses (boolean)`, `listFilter: 'Pendentes'|'Conciliadas'|'Todas'`,
  `selectedTransactionId`, `assocTab: 'Sugestao'|'Nova'|'BuscarCriar'`,
  `selectedPayableIds (Set)`, `difference?`, `rejectedSuggestions (Set)`,
  `manualEntryDraft`, `consciousConfirm (boolean)`.
- **Grid de contas**: `search`, `statusFilter`, `sort`.

## Máquinas de estado (resumo)

- **Transação**: `Pending → (conciliar) → Reconciled` · `Pending → (manual) → ManualEntry` ·
  `Reconciled/ManualEntry → (desfazer) → Pending`. Tudo bloqueado se **período fechado**.
- **Botão Conciliar (Buscar/Criar vários)**: `desabilitado` enquanto não balancear OU (Σ≠valor e
  sem `treatment`); `habilitado` quando balanceado.
- **Submit Nova transação**: `bloqueado` para Transfer/Investment/Redemption sem destino+confirmação.
