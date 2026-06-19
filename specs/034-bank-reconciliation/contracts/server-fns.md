# Contrato das Server Functions (BFF) — Conciliação Bancária

> **A server function é a única fronteira** entre client e core-api. Cada fn: valida o **input** com Zod,
> chama `core-api-financial` (`/api/v2/financial/...`), valida o **response** com Zod, mapeia para o
> modelo do client e devolve via `mapToServerResponse` (status preservado; erro como valor). O client
> chama via `financial.repository` (porta); `queryFn`/`mutationFn` convertem para `QueryError`.
> RBAC do core-api: `reconciliation:{import,read,write,close}` (o token vive server-side).

| #   | Server fn (arquivo)                         | Tipo     | core-api consumido                                   | Input (Zod)                                                                                                           | Output (modelo)                                                      | US         |
| --- | ------------------------------------------- | -------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- |
| 1   | `import-bank-statement.service.fn.ts`       | mutation | `POST /bank-statements`                              | `{ debitAccountRef, format:'OFX'\|'CSV', content, fileName? }`                                                        | `BankStatement {statementId, imported, duplicatesDiscarded, period}` | US2        |
| 2   | `list-statement-transactions.query.fn.ts`   | query    | `GET /bank-statements/:id/transactions`              | `{ statementId }`                                                                                                     | `StatementTransaction[]`                                             | US1,US8    |
| 3   | `list-paid-payables.query.fn.ts`            | query    | `GET /payables?status=Paid`                          | `{}`                                                                                                                  | `PaidPayable[]` (mínimo até #172)                                    | US1,US3    |
| 4   | `get-transaction-suggestions.query.fn.ts`   | query    | `GET /statement-transactions/:id/suggestions`        | `{ transactionId }`                                                                                                   | `MatchSuggestion[]`                                                  | US1        |
| 5   | `reject-suggestion.service.fn.ts`           | mutation | `POST /statement-transactions/:id/reject-suggestion` | `{ transactionId, payableId }`                                                                                        | `{ transactionId, payableId }`                                       | US1        |
| 6   | `create-reconciliation.service.fn.ts`       | mutation | `POST /reconciliations`                              | `{ transactionId, payableIds:[1..100], difference?{valueCents, treatment} }`                                          | `{ reconciliationId, type, itemCount }`                              | US1,US3    |
| 7   | `undo-reconciliation.service.fn.ts`         | mutation | `POST /reconciliations/:id/undo`                     | `{ reconciliationId, reason? }`                                                                                       | `{ reconciliationId, status:'Undone' }`                              | US5        |
| 8   | `create-manual-entry.service.fn.ts`         | mutation | `POST /statement-transactions/:id/manual-entry`      | `{ transactionId, type, supplierRef?, categoryRef?, costCenterRef?, programRef?, description?, destinationAccount? }` | `{ reconciliationId, type:'ManualEntry', manualEntryId }`            | US4        |
| 9   | `batch-reconcile.service.fn.ts`             | mutation | `POST /reconciliations/batch`                        | `{ transactionIds:[1..500], template }`                                                                               | `{ created, reconciliationIds[], failed[] }`                         | US4 (lote) |
| 10  | `close-reconciliation-period.service.fn.ts` | mutation | `POST /reconciliation-periods/close`                 | `{ debitAccountRef, periodStart, periodEnd }`                                                                         | `{ periodId, status:'Closed' }`                                      | US7        |

### Notas verificadas no core-api #152 (vale o código)

- **#2 transações** (`{ items: [...] }`): `entryType` é **string livre** (não enum); só `movement:
'Debit'|'Credit'` é fechado; `reconciliationStatus: 'Pending'|'Reconciled'|'ManualEntry'`.
- **#3 payables** (`{ items: [...] }`): `dueDate` é **date-only `YYYY-MM-DD`**; `valueCents` string;
  `documentId` uuid; query `status=Paid` é `literal` obrigatório.
- **#4 suggestions**: raiz é **`{ suggestions: [...] }`** (não `items`); `band: 'alta'|'media'`
  (`baixa`<50 filtrada); `score` int 0..100; `criteria{payeeMatch,exactValue,dateD0,memoRef,
supplierOpenCount}`.
- **#6 reconciliations**: `difference.valueCents` é **int e pode ser negativo** (não string).
  `type` derivado **pelo backend**: `difference` presente (qualquer treatment) → `Partial`; senão 1→
  `Individual`, ≥2→`Multiple`. `treatment ∈ Interest|Penalty|Discount|Fee|Partial`.
- **#1/#10 `debitAccountRef`**: `z.uuid()`. **Não há** endpoint nem conta de seed de cedente (#168) e o
  import **não valida** o ref → placeholder = **uuid v4 fixo no front** (D2/chrome-gaps).

## Mapa de erros (core-api → AppError.kind → tag i18n PT-BR)

| HTTP | erro do core-api                  | AppError.kind (proposto)         | tag i18n (PT-BR, exemplo)                 |
| ---- | --------------------------------- | -------------------------------- | ----------------------------------------- |
| 400  | `unsupported-format`              | `import-unsupported-format`      | "Formato de arquivo não suportado."       |
| 400  | `empty-content`                   | `import-empty-content`           | "O arquivo está vazio."                   |
| 400  | `malformed-statement`             | `import-malformed`               | "Não foi possível ler o extrato."         |
| 422  | `empty-statement`                 | `import-empty-statement`         | "O extrato não tem movimentações."        |
| 409  | `period-closed`                   | `period-closed`                  | "Este período está fechado."              |
| 422  | `reconciliation-not-balanced`     | `reconciliation-not-balanced`    | "A soma não bate com o valor do extrato." |
| 409  | `transaction-already-reconciled`  | `transaction-already-reconciled` | "Esta transação já foi conciliada."       |
| 409  | `account-closed`                  | `account-closed`                 | "Esta conta está encerrada."              |
| 404  | `payable-not-found`               | `payable-not-found`              | "Título não encontrado."                  |
| 422  | `title-not-paid`                  | `title-not-paid`                 | "Só títulos pagos podem ser conciliados." |
| 422  | `empty-reconciliation`            | `empty-reconciliation`           | "Selecione ao menos um título."           |
| 409  | `reconciliation-already-undone`   | `reconciliation-already-undone`  | "Esta conciliação já foi desfeita."       |
| 422  | `period-has-pending-transactions` | `period-has-pending`             | "Há movimentações pendentes no período."  |
| 400  | `invalid-period-range`            | `invalid-period-range`           | "Período inválido."                       |
| 400  | `unsupported-export-format`       | `export-unsupported-format`      | "Formato de exportação não suportado."    |
| 404  | `reconciliation-period-not-found` | `period-not-found`               | "Período não encontrado."                 |

> Tags finais kebab/i18n entram em `src/shared/i18n` + `financial-error-tag.ts`; a UI faz `switch`
> exaustivo no `kind` (guarda `const _: never`). **A UI nunca olha status HTTP.**
