/**
 * useMatchDetails — controller do modal "Detalhes da conciliação" (clique numa linha conciliada do
 * Extrato). UI-state (qual transação está aberta) + lookup da conciliação ativa (#175) p/ AUDITORIA real
 * (quando/quem) e o `reconciliationId` do Desfazer (mesmo após reload). O lado EXTRATO é real; o lado
 * TÍTULO segue "—" até o backend enriquecer (#172). O `reconciliationId` prefere o mapa de sessão
 * (conciliações feitas agora) e cai no lookup; assim o Desfazer funciona em ambos os casos.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { transactionReconciliationQueryOptions } from './reconciliation-workspace.query.ts'
import {
  buildMatchTitles,
  matchAuditFromLookup,
  matchDetailsView,
  type MatchDetailsView,
} from './reconciliation-workspace.view-model.ts'
import type {
  ManualEntryType,
  StatementTransaction,
} from '#modules/financial/client/data/model/reconciliation.model.ts'

export type MatchDetailsBinding = Readonly<{
  open: boolean
  tx: StatementTransaction | null
  view: MatchDetailsView | null
  reconciliationId: string | null
  openFor: (tx: StatementTransaction) => void
  close: () => void
}>

export function useMatchDetails(
  sessionIdFor: (transactionId: string) => string | null,
  // Tipo do lançamento manual feito NESTA sessão (Payment/Transfer/Investment/…). O backend ainda não
  // expõe no lookup (#268); até lá, mostramos o tipo específico só p/ lançamentos da sessão.
  sessionManualTypeFor: (transactionId: string) => ManualEntryType | null,
  // Contraparte do lançamento na sessão (conta de destino ou fornecedor) — mesma limitação do tipo.
  sessionCounterpartyFor: (transactionId: string) => string | null,
): MatchDetailsBinding {
  const [tx, setTx] = useState<StatementTransaction | null>(null)
  // Só busca a conciliação de transação conciliada (Reconciled/ManualEntry). Pending → sem lookup.
  const lookupTxId = tx !== null && tx.reconciliationStatus !== 'Pending' ? tx.id : null
  const lookupQuery = useQuery(transactionReconciliationQueryOptions(lookupTxId))
  const lookup = lookupQuery.data?.ok === true ? lookupQuery.data.value : null

  const audit = lookup !== null ? matchAuditFromLookup(lookup) : null
  // Conciliação 1 saída → N títulos: monta o lado "Título" com a lista de valores conciliados (#175 items).
  const multi = lookup !== null ? buildMatchTitles(lookup) : null
  // A forma da conciliação (match vs nova transação) vem do `type` da reconciliation, não do status da tx.
  const isManualEntry = lookup?.type === 'ManualEntry'
  const manualType = tx !== null ? sessionManualTypeFor(tx.id) : null
  const counterparty = tx !== null ? sessionCounterpartyFor(tx.id) : null
  const view =
    tx === null ? null : matchDetailsView(tx, null, audit, multi, isManualEntry, manualType, counterparty)
  const reconciliationId = tx === null ? null : (sessionIdFor(tx.id) ?? lookup?.reconciliationId ?? null)

  return {
    open: tx !== null,
    tx,
    view,
    reconciliationId,
    openFor: (t) => {
      setTx(t)
    },
    close: () => {
      setTx(null)
    },
  }
}
