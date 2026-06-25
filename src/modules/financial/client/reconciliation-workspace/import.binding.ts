/**
 * Binding de importação de extrato (US2) — ADAPTER React. Lê o arquivo OFX/CSV como texto (`File.text()`,
 * nativo §VIII), chama a porta `importStatement` e, no sucesso, registra o `statementId` (via callback) e
 * invalida a lista de transações. PDF/OCR fica de fora (#145). Erros → tag i18n (a UI nunca olha status).
 *
 * VALIDAÇÃO DE CONTA (front puro): antes de importar um OFX, compara o `<BANKACCTFROM>` do arquivo com a
 * conta da tela. Se for de OUTRA conta, NÃO importa direto — devolve um `mismatch` e a UI pede confirmação
 * ("Importar mesmo assim?"). Evita conciliar com o extrato da conta errada. CSV/PDF não têm a conta → segue.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import type {
  BankStatementImport,
  StatementFormat,
} from '#modules/financial/client/data/model/reconciliation.model.ts'
import {
  parseOfxAccount,
  ofxMatchesAccount,
  ofxAccountLabel,
  type AccountIdentity,
} from './reconciliation-workspace.view-model.ts'

const formatFromName = (name: string): StatementFormat =>
  name.toLowerCase().endsWith('.csv') ? 'CSV' : 'OFX'

export type ImportMismatch = Readonly<{ fileAccountLabel: string }>

export type ImportBinding = Readonly<{
  importing: boolean
  summary: BankStatementImport | null
  errorTag: string | null
  mismatch: ImportMismatch | null // conta do arquivo ≠ conta da tela → aguarda confirmação
  importFile: (file: File) => void
  confirmImport: () => void
  cancelImport: () => void
}>

export function useImport(
  accountRef: string,
  account: AccountIdentity | null,
  onImported: (statementId: string) => void,
): ImportBinding {
  const qc = useQueryClient()
  const [summary, setSummary] = useState<BankStatementImport | null>(null)
  const [errorTag, setErrorTag] = useState<string | null>(null)
  const [pending, setPending] = useState<File | null>(null) // arquivo aguardando confirmação (conta diferente)
  const [mismatch, setMismatch] = useState<ImportMismatch | null>(null)

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

  const doImport = (file: File): void => {
    mutation.mutate(file)
  }

  return {
    importing: mutation.isPending,
    summary,
    errorTag,
    mismatch,
    importFile: (file) => {
      setMismatch(null)
      // Valida a conta só p/ OFX (estruturado) e quando há identidade da conta na tela.
      if (account !== null && formatFromName(file.name) === 'OFX') {
        void file.text().then((content) => {
          const ofx = parseOfxAccount(content)
          if (ofx !== null && !ofxMatchesAccount(ofx, account)) {
            setPending(file) // segura; a UI confirma
            setMismatch({ fileAccountLabel: ofxAccountLabel(ofx) })
            return
          }
          doImport(file)
        })
      } else {
        doImport(file)
      }
    },
    confirmImport: () => {
      if (pending !== null) {
        doImport(pending)
        setPending(null)
        setMismatch(null)
      }
    },
    cancelImport: () => {
      setPending(null)
      setMismatch(null)
    },
  }
}
