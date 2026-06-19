/**
 * Binding de importação de extrato (US2) — ADAPTER React. Lê o arquivo OFX/CSV como texto (`File.text()`,
 * nativo §VIII), chama a porta `importStatement` e, no sucesso, registra o `statementId` (via callback) e
 * invalida a lista de transações. PDF/OCR fica de fora (#145). Erros → tag i18n (a UI nunca olha status).
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import type {
  BankStatementImport,
  StatementFormat,
} from '#modules/financial/client/data/model/reconciliation.model.ts'

const formatFromName = (name: string): StatementFormat =>
  name.toLowerCase().endsWith('.csv') ? 'CSV' : 'OFX'

export type ImportBinding = Readonly<{
  importing: boolean
  summary: BankStatementImport | null
  errorTag: string | null
  importFile: (file: File) => void
}>

export function useImport(accountRef: string, onImported: (statementId: string) => void): ImportBinding {
  const qc = useQueryClient()
  const [summary, setSummary] = useState<BankStatementImport | null>(null)
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const content = await file.text()
      return reconciliationRepository.importStatement({
        debitAccountRef: accountRef,
        format: formatFromName(file.name),
        content,
        fileName: file.name,
      })
    },
    onSuccess: (res) => {
      if (res.ok) {
        setSummary(res.value)
        setErrorTag(null)
        onImported(res.value.statementId)
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'transactions'] })
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  return {
    importing: mutation.isPending,
    summary,
    errorTag,
    importFile: (file) => {
      mutation.mutate(file)
    },
  }
}
