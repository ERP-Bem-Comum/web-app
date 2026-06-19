/**
 * useMatchDetails — controller do modal "Detalhes da conciliação" (clique numa linha conciliada do
 * Extrato). UI-state (qual transação está aberta) + derivação da visão via view-model puro. O lado
 * EXTRATO é real (vem da transação); o lado TÍTULO e a AUDITORIA dependem do backend expor os detalhes
 * da conciliação (sem GET de detalhes hoje, #175) → ficam "—" (estado honesto, igual ao default do mock).
 * O Desfazer reaproveita o `useUndo` do workspace (só conciliações desta sessão).
 */
import { useState } from 'react'

import { matchDetailsView, type MatchDetailsView } from './reconciliation-workspace.view-model.ts'
import type { StatementTransaction } from '#modules/financial/client/data/model/reconciliation.model.ts'

export type MatchDetailsBinding = Readonly<{
  open: boolean
  tx: StatementTransaction | null
  view: MatchDetailsView | null
  openFor: (tx: StatementTransaction) => void
  close: () => void
}>

export function useMatchDetails(): MatchDetailsBinding {
  const [tx, setTx] = useState<StatementTransaction | null>(null)
  const view = tx === null ? null : matchDetailsView(tx, null, null)
  return {
    open: tx !== null,
    tx,
    view,
    openFor: (t) => {
      setTx(t)
    },
    close: () => {
      setTx(null)
    },
  }
}
