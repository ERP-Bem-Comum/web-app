/**
 * Cliente HTTP do core-api para a Conciliação Bancária — chama `/api/v2/financial/...` (PR #152). NUNCA
 * lança (tudo é Result; `throw` só na borda do `resultFetch`). Server-only (adapters). Anti-corruption:
 * delega a tradução aos mappers PUROS (`reconciliation.mappers.ts`) e o erro a `mapHttpError`. Espelha
 * `core-api-financial.ts`.
 */
import { err, isErr, ok } from '#shared/primitives/result.ts'
import { resultFetch, resultFetchText } from '#external/core-api/result-fetch.ts'
import type { ReconciliationClient } from '#modules/financial/server/application/reconciliation.use-cases.ts'
import type { CedenteAccount } from '#modules/financial/server/domain/reconciliation.io.ts'
import {
  accountStatementSummary,
  accountStatementPeriodToModel,
  batchToModel,
  categoriesToModel,
  cedenteAccountToModel,
  cedenteAccountsToModel,
  costCentersToModel,
  counterpartConfirmedToModel,
  counterpartSuggestionsToModel,
  importToModel,
  manualEntryToModel,
  mapHttpError,
  paidPayablesToModel,
  payablesBatchToModel,
  periodClosedToModel,
  periodReopenedToModel,
  reconciliationCreatedToModel,
  reconciliationPeriodsToModel,
  rejectToModel,
  statementSuggestionsToModel,
  suggestionsToModel,
  transactionReconciliationToModel,
  transactionsToModel,
  undoToModel,
} from './reconciliation.mappers.ts'
import {
  buildEnrichmentMaps,
  buildRetentionMap,
  emptyEnrichmentMaps,
  enrichPaidPayables,
  enrichReconciliationItemsFromBatch,
  enrichSuggestions,
  needsRetentionMap,
  type EnrichmentSource,
  type PayableBatchEnrichment,
} from './reconciliation-enrichment.ts'

// Janela ampla FIXA (determinística, sem relógio): o read-model soma TODOS os movimentos da conta →
// closingBalanceCents = saldo corrente real e counters.pending = total de pendentes. `from`/`to` são
// date-only (z.iso.date no core-api). Falha no statement → mantém os defaults honestos da conta (graceful).
const STATEMENT_FROM = '2000-01-01'
const STATEMENT_TO = '2999-12-31'

const enrichAccountWithStatement = async (
  baseUrl: string,
  acc: CedenteAccount,
  token: string,
): Promise<CedenteAccount> => {
  const r = await resultFetch<unknown>(
    `${baseUrl}/cedente-accounts/${acc.id}/statement?from=${STATEMENT_FROM}&to=${STATEMENT_TO}`,
    { token },
  )
  if (isErr(r)) return acc
  const sum = accountStatementSummary(r.value)
  if (isErr(sum)) return acc
  return {
    ...acc,
    currentBalanceCents: sum.value.closingBalanceCents,
    pendingCount: sum.value.pendingCount,
    lastUpdatedAt: sum.value.lastDate ?? acc.lastUpdatedAt,
  }
}

// #357 (ADR-0049): resolve títulos por id em 1 hop (POST /payables:batch). Best-effort → mapa VAZIO em
// qualquer falha (degrada p/ null no merge; NUNCA vira erro que derruba o modal). O contrato aceita 1..200
// refs; o lookup de um match tem poucos itens, mas capamos em 200 por segurança. `refs` vazio → sem hop.
const EMPTY_BATCH: ReadonlyMap<string, PayableBatchEnrichment> = new Map()
const resolvePayablesBatch = async (
  baseUrl: string,
  refs: readonly string[],
  token: string,
): Promise<ReadonlyMap<string, PayableBatchEnrichment>> => {
  if (refs.length === 0) return EMPTY_BATCH
  const r = await resultFetch<unknown>(`${baseUrl}/payables:batch`, {
    method: 'POST',
    body: { refs: refs.slice(0, 200) },
    token,
  })
  if (isErr(r)) return EMPTY_BATCH
  const model = payablesBatchToModel(r.value)
  if (isErr(model)) return EMPTY_BATCH
  return model.value
}

// INTERINO BFF composite p/ core-api#172/#265: fábrica opcional da fonte de enriquecimento (por token).
// Quando ausente, o cliente NÃO enriquece (mapas vazios) — mantém compat p/ chamadas sem a costura.
// REMOVER quando o core-api enriquecer os contratos nativos e o join deixar de ser necessário.
export type ReconciliationEnrichmentFactory = (token: string) => EnrichmentSource

export const createCoreApiReconciliationClient = (
  baseUrl: string,
  enrichmentFor?: ReconciliationEnrichmentFactory,
): ReconciliationClient => ({
  importStatement: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/bank-statements`, {
      method: 'POST',
      body: {
        debitAccountRef: i.debitAccountRef,
        format: i.format,
        content: i.content,
        fileName: i.fileName,
      },
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return importToModel(r.value)
  },
  listTransactions: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/bank-statements/${i.statementId}/transactions`, {
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return transactionsToModel(r.value)
  },
  deleteBankStatement: async (statementId, token) => {
    // core-api#558: hard-delete do extrato (204, sem corpo). Transações somem por FK cascade. Guardas
    // 409 (statement-has-reconciled-transactions / period-closed) e 404 mapeados por `mapHttpError`.
    const r = await resultFetch<unknown>(`${baseUrl}/bank-statements/${statementId}`, {
      method: 'DELETE',
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return ok(undefined)
  },
  listPaidPayables: async (token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/payables?status=Paid`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    const base = paidPayablesToModel(r.value)
    if (isErr(base)) return base
    // INTERINO BFF composite p/ core-api#172/#265 — enquanto /payables?status=Paid NÃO devolve os campos
    // nativos (paidAt, supplierName, documentNumber), montamos os 2 mapas UMA vez (títulos + fornecedores)
    // e enriquecemos. REMOVER estes round-trips extras quando o backend expor os campos nativos.
    // JOIN: paid-payable `.id` ↔ payable-title `.payableId`; payable-title `.supplierRef` ↔ supplier `.id`.
    const maps =
      enrichmentFor === undefined ? emptyEnrichmentMaps() : await buildEnrichmentMaps(enrichmentFor(token))
    return ok(enrichPaidPayables(maps, base.value))
  },
  listReferences: async (token) => {
    // Referências da categorização (020 · #200): categorias + centros de custo (RBAC reference:read).
    const [cats, ccs] = await Promise.all([
      resultFetch<unknown>(`${baseUrl}/categories`, { token }),
      resultFetch<unknown>(`${baseUrl}/cost-centers`, { token }),
    ])
    if (isErr(cats)) return err(mapHttpError(cats.error))
    if (isErr(ccs)) return err(mapHttpError(ccs.error))
    const categories = categoriesToModel(cats.value)
    if (isErr(categories)) return categories
    const costCenters = costCentersToModel(ccs.value)
    if (isErr(costCenters)) return costCenters
    return ok({ categories: categories.value, costCenters: costCenters.value })
  },
  listCedenteAccounts: async (token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/cedente-accounts`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    const accounts = cedenteAccountsToModel(r.value)
    if (isErr(accounts)) return accounts
    // #139: enriquece cada conta com saldo corrente + pendências (fan-out por conta ao read-model).
    const enriched = await Promise.all(
      accounts.value.map((acc) => enrichAccountWithStatement(baseUrl, acc, token)),
    )
    return ok(enriched)
  },
  getCedenteAccount: async (id, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/cedente-accounts/${id}`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    const acc = cedenteAccountToModel(r.value)
    if (isErr(acc)) return acc
    return ok(await enrichAccountWithStatement(baseUrl, acc.value, token)) // #139: saldo/pendências p/ o hero
  },
  createCedenteAccount: async (i, token) => {
    const typeMap = {
      Corrente: 'corrente',
      Poupanca: 'poupanca',
      Investimento: 'investimento',
      Cartao: 'cartao', // #206
      Outro: 'outro',
    } as const
    const body = {
      bankCode: i.bankCode,
      ...(i.bankName !== undefined ? { bankName: i.bankName } : {}),
      type: typeMap[i.type],
      ...(i.typeLabel !== undefined ? { typeLabel: i.typeLabel } : {}), // #206
      agency: i.agency,
      accountNumber: i.accountNumber,
      accountDigit: i.accountDigit,
      document: i.document,
      ...(i.nickname !== undefined ? { nickname: i.nickname } : {}),
      ...(i.openingBalanceCents !== undefined ? { openingBalanceCents: i.openingBalanceCents } : {}),
      ...(i.openingBalanceDate !== undefined ? { openingBalanceDate: i.openingBalanceDate } : {}),
      // #722: opcional — a conta serve à conciliação sem convênio; só a remessa o exige.
      ...(i.convenio !== undefined ? { convenio: i.convenio } : {}),
    }
    const r = await resultFetch<unknown>(`${baseUrl}/cedente-accounts`, { method: 'POST', token, body })
    if (isErr(r)) return err(mapHttpError(r.error))
    return cedenteAccountToModel(r.value)
  },
  closeCedenteAccount: async (id, token) => {
    // Encerra a conta (Open → Closed). Sem body; o ator vem do servidor. Devolve a conta atualizada.
    const r = await resultFetch<unknown>(`${baseUrl}/cedente-accounts/${id}/close`, {
      method: 'POST',
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return cedenteAccountToModel(r.value)
  },
  editCedenteAccount: async (i, token) => {
    // PATCH parcial: só as chaves presentes (todas opcionais). `type` mapeado p/ o enum minúsculo do backend.
    const typeMap = {
      Corrente: 'corrente',
      Poupanca: 'poupanca',
      Investimento: 'investimento',
      Cartao: 'cartao',
      Outro: 'outro',
    } as const
    const body = {
      ...(i.bankCode !== undefined ? { bankCode: i.bankCode } : {}),
      ...(i.bankName !== undefined ? { bankName: i.bankName } : {}),
      ...(i.type !== undefined ? { type: typeMap[i.type] } : {}),
      ...(i.typeLabel !== undefined ? { typeLabel: i.typeLabel } : {}),
      ...(i.agency !== undefined ? { agency: i.agency } : {}),
      ...(i.accountNumber !== undefined ? { accountNumber: i.accountNumber } : {}),
      ...(i.accountDigit !== undefined ? { accountDigit: i.accountDigit } : {}),
      ...(i.nickname !== undefined ? { nickname: i.nickname } : {}),
      // #722: só viaja quando a conta AINDA não tem convênio — a UI trava o campo depois de
      // preenchido, porque trocar é recusado (`cedente-convenio-already-set`) e o convênio viaja no
      // nome de toda remessa já transmitida.
      ...(i.convenio !== undefined ? { convenio: i.convenio } : {}),
    }
    const r = await resultFetch<unknown>(`${baseUrl}/cedente-accounts/${i.id}`, {
      method: 'PATCH',
      token,
      body,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return cedenteAccountToModel(r.value)
  },
  getAccountStatementPeriod: async (i, token) => {
    // #205: extrato por período (from/to date-only). filter opcional. Mapeia p/ o saldo do período.
    const qs = new URLSearchParams({ from: i.from, to: i.to })
    if (i.filter !== undefined) qs.set('filter', i.filter)
    const r = await resultFetch<unknown>(
      `${baseUrl}/cedente-accounts/${i.accountId}/statement?${qs.toString()}`,
      { token },
    )
    if (isErr(r)) return err(mapHttpError(r.error))
    return accountStatementPeriodToModel(r.value)
  },
  getSuggestions: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/statement-transactions/${i.transactionId}/suggestions`, {
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    const base = suggestionsToModel(r.value)
    if (isErr(base)) return base
    // INTERINO BFF composite p/ core-api#172/#265 — o card de match resolve supplierName/documentNumber
    // por `payableId` usando os MESMOS 2 mapas (títulos + fornecedores). REMOVER estes round-trips extras
    // quando as suggestions do core-api já vierem enriquecidas.
    // JOIN: suggestion `.payableId` ↔ payable-title `.payableId` → `.supplierRef` ↔ supplier `.id`.
    const maps =
      enrichmentFor === undefined ? emptyEnrichmentMaps() : await buildEnrichmentMaps(enrichmentFor(token))
    return ok(enrichSuggestions(maps, base.value))
  },
  getStatementSuggestions: async (i, token) => {
    // #174: palpites de topo em lote por extrato (uma chamada pinta a banda de todas as transações).
    const r = await resultFetch<unknown>(`${baseUrl}/bank-statements/${i.statementId}/suggestions`, {
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return statementSuggestionsToModel(r.value)
  },
  getTransactionReconciliation: async (i, token) => {
    const r = await resultFetch<unknown>(
      `${baseUrl}/statement-transactions/${i.transactionId}/reconciliation`,
      { token },
    )
    if (isErr(r)) {
      const mapped = mapHttpError(r.error)
      // 404 = transação sem conciliação ativa (pendente/já desfeita) → vazio, não erro.
      if (mapped === 'not-found') return ok(null)
      return err(mapped)
    }
    const base = transactionReconciliationToModel(r.value)
    if (isErr(base)) return base
    // #357 (ADR-0049): de-interina o LOOKUP do match card. Resolve documentNumber/supplierName/dueDate por
    // `payableId` em 1 hop TARGETED (`payables:batch`), no lugar de varrer todas as páginas de títulos + o
    // agregador de parceiros (INTERINO #172). Best-effort: batch falha → mapa vazio → campos null (nunca
    // quebra o modal). ManualEntry tem `items` vazio → sem hop.
    const payableIds = base.value.items.map((i) => i.payableId)
    const batch = await resolvePayablesBatch(baseUrl, payableIds, token)
    // O batch NÃO devolve `retentionType` — o ÓRGÃO do imposto retido (ISS→SEFIN, federais→Receita) precisa
    // dele. Buscamos um mapa MÍNIMO de retentionType (só do /payable-titles, SEM parceiros) apenas quando
    // pode haver imposto retido (gate por documentType do batch + ids ausentes). Caminho comum = 1 hop.
    // Follow-up: incluir `retentionType` no PayableBatchItem → o mapa mínimo some (1 hop sempre).
    const retention =
      enrichmentFor !== undefined && needsRetentionMap(payableIds, batch)
        ? await buildRetentionMap(enrichmentFor(token).fetchTitles)
        : new Map<string, string | null>()
    return ok({
      ...base.value,
      items: enrichReconciliationItemsFromBatch(batch, retention, base.value.items),
    })
  },
  getCounterpartSuggestions: async (i, token) => {
    // US2 (#269): contrapartidas esperadas que casam com a transação (transferência entre contas).
    const r = await resultFetch<unknown>(
      `${baseUrl}/statement-transactions/${i.transactionId}/counterpart-suggestions`,
      { token },
    )
    if (isErr(r)) return err(mapHttpError(r.error))
    return counterpartSuggestionsToModel(r.value)
  },
  confirmCounterpart: async (i, token) => {
    // US2 (#269): concilia a transação contra a contrapartida escolhida (POST /reconciliations/counterpart).
    const r = await resultFetch<unknown>(`${baseUrl}/reconciliations/counterpart`, {
      method: 'POST',
      body: { transactionId: i.transactionId, counterpartId: i.counterpartId },
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return counterpartConfirmedToModel(r.value)
  },
  rejectSuggestion: async (i, token) => {
    const r = await resultFetch<unknown>(
      `${baseUrl}/statement-transactions/${i.transactionId}/reject-suggestion`,
      { method: 'POST', body: { payableId: i.payableId }, token },
    )
    if (isErr(r)) return err(mapHttpError(r.error))
    return rejectToModel(r.value)
  },
  createReconciliation: async (i, token) => {
    // ⚠️ PONTO DE LIGAÇÃO DA M2 (specs/110) — `reclassification` (os 5 refs da taxonomia) só é anexado
    // quando o operador usou o "Editar". A passada de BACKEND da M2 (use-case que grava no título líquido
    // e CASCATEIA aos títulos de retenção — RN-M2-04) ainda NÃO está na `dev` do core-api. Enquanto não
    // estiver, o campo viaja e o backend o IGNORA: conciliar segue funcionando, a reclassificação é que
    // não tem efeito. Nada é simulado no front (ADR-0011) — quando a rota aceitar, isto passa a valer
    // sem mudança de código aqui.
    const r = await resultFetch<unknown>(`${baseUrl}/reconciliations`, {
      method: 'POST',
      body: {
        transactionId: i.transactionId,
        payableIds: i.payableIds,
        difference: i.difference,
        ...(i.reclassification !== undefined ? { reclassification: i.reclassification } : {}),
      },
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return reconciliationCreatedToModel(r.value)
  },
  undoReconciliation: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/reconciliations/${i.reconciliationId}/undo`, {
      method: 'POST',
      body: { reason: i.reason },
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return undoToModel(r.value)
  },
  createManualEntry: async (i, token) => {
    const { transactionId, destinationAccount, ...template } = i
    const r = await resultFetch<unknown>(`${baseUrl}/statement-transactions/${transactionId}/manual-entry`, {
      method: 'POST',
      // #143: a borda HTTP do core-api espera `destinationAccountRef` (renomeado de destinationAccount).
      body: {
        ...template,
        ...(destinationAccount !== undefined && destinationAccount !== ''
          ? { destinationAccountRef: destinationAccount }
          : {}),
      },
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return manualEntryToModel(r.value)
  },
  batchReconcile: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/reconciliations/batch`, {
      method: 'POST',
      body: { transactionIds: i.transactionIds, template: i.template },
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return batchToModel(r.value)
  },
  closePeriod: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/reconciliation-periods/close`, {
      method: 'POST',
      body: { debitAccountRef: i.debitAccountRef, periodStart: i.periodStart, periodEnd: i.periodEnd },
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return periodClosedToModel(r.value)
  },
  reopenPeriod: async (i, token) => {
    // #203: reabre o período (Closed → Open). Sem body; o ator vem do servidor (req.userId).
    const r = await resultFetch<unknown>(`${baseUrl}/reconciliation-periods/${i.periodId}/reopen`, {
      method: 'POST',
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return periodReopenedToModel(r.value)
  },
  listReconciliationPeriods: async (i, token) => {
    const r = await resultFetch<unknown>(
      `${baseUrl}/reconciliation-periods?debitAccountRef=${encodeURIComponent(i.debitAccountRef)}`,
      { token },
    )
    if (isErr(r)) return err(mapHttpError(r.error))
    return reconciliationPeriodsToModel(r.value)
  },
  exportReconciliation: async (i, token) => {
    // Export é TEXTO cru (application/x-ofx | text/csv), não JSON → resultFetchText.
    // #649: rota por CONTA + INTERVALO. A antiga (`/reconciliation-periods/:id/export`) segue existindo no
    // core-api, mas o front não a usa mais — ela obrigava a fechar o período antes de exportar.
    const q = new URLSearchParams({
      debitAccountRef: i.debitAccountRef,
      periodStart: i.periodStart,
      periodEnd: i.periodEnd,
      format: i.format,
    })
    const r = await resultFetchText(`${baseUrl}/reconciliation/export?${q.toString()}`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return ok({ content: r.value, format: i.format })
  },
})
