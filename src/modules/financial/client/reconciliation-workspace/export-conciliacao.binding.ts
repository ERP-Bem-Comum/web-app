/**
 * useExportConciliacao — controller do "Exportar conciliação" (#173). Lista os períodos da conta, escolhe
 * o MAIS RECENTE (por data final) como alvo, e ao exportar baixa o arquivo OFX/CSV (texto cru do BFF) via
 * Blob+anchor. Sem período → desabilitado (honesto). PDF fica fora (#145). Erros → tag i18n.
 */
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import { reconciliationPeriodsQueryOptions } from './reconciliation-workspace.query.ts'
import {
  pickLatestPeriod,
  periodRangeLabel,
  type ExportFormat,
} from './reconciliation-workspace.view-model.ts'

const CONTENT_TYPE: Readonly<Record<ExportFormat, string>> = {
  ofx: 'application/x-ofx;charset=utf-8;',
  csv: 'text/csv;charset=utf-8;',
}

const triggerDownload = (filename: string, content: string, type: string): void => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export type ExportBinding = Readonly<{
  canExport: boolean
  periodLabel: string | null
  exporting: boolean
  errorTag: string | null
  exportAs: (format: ExportFormat) => void
}>

export function useExportConciliacao(debitAccountRef: string | null, onDone: () => void): ExportBinding {
  const periodsQuery = useQuery(reconciliationPeriodsQueryOptions(debitAccountRef))
  const periods = periodsQuery.data?.ok === true ? periodsQuery.data.value : []
  const latest = pickLatestPeriod(periods)
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: (v: { periodId: string; format: ExportFormat; filename: string }) =>
      reconciliationRepository.exportReconciliation({ periodId: v.periodId, format: v.format }),
    onSuccess: (res, v) => {
      if (res.ok) {
        triggerDownload(v.filename, res.value.content, CONTENT_TYPE[v.format])
        setErrorTag(null)
        onDone()
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  return {
    canExport: latest !== null,
    periodLabel: latest === null ? null : periodRangeLabel(latest),
    exporting: mut.isPending,
    errorTag,
    exportAs: (format) => {
      if (latest === null) return
      const filename = `conciliacao_${latest.periodStart}_a_${latest.periodEnd}.${format}`
      mut.mutate({ periodId: latest.id, format, filename })
    },
  }
}
