/**
 * useExportConciliacao — controller do "Exportar conciliação" (#173, destravado pelo core-api#649). Exporta
 * o INTERVALO VISUALIZADO da conta (mesmo alvo do Relatório PDF), a qualquer momento: sem exigir conciliação
 * concluída nem período fechado. Baixa o texto cru do BFF via Blob+anchor. Erros → tag i18n.
 *
 * Era `periodId` até 07/08/2026. Como o registro de período só nasce ao FECHAR (o único escritor no core-api
 * é o `POST /reconciliation-periods/close`), o export ficava preso à cadeia "concluir tudo → fechar → só
 * então exportar". O core-api nunca exigiu período fechado de fato — usava o período só como carona da
 * tripla (conta, início, fim) — e o #649 passou a aceitá-la direto. Some o gate, some a query de períodos.
 */
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import { formatShortDate, type ExportFormat } from './reconciliation-workspace.view-model.ts'

const CONTENT_TYPE: Readonly<Record<ExportFormat, string>> = {
  ofx: 'application/x-ofx;charset=utf-8;',
  csv: 'text/csv;charset=utf-8;',
  'csv-nibo': 'text/csv;charset=utf-8;',
}

// Extensão do arquivo por formato — `csv-nibo` é um CSV (layout Nibo), baixa como `.csv`.
const FILE_EXT: Readonly<Record<ExportFormat, string>> = {
  ofx: 'ofx',
  csv: 'csv',
  'csv-nibo': 'csv',
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

/**
 * @param debitAccountRef conta selecionada (null = nenhuma).
 * @param range intervalo VISUALIZADO (`YYYY-MM-DD`); null quando o período personalizado está incompleto.
 */
export function useExportConciliacao(
  debitAccountRef: string | null,
  range: Readonly<{ from: string; to: string }> | null,
  onDone: () => void,
): ExportBinding {
  const [errorTag, setErrorTag] = useState<string | null>(null)
  // Habilitado = há conta E intervalo resolvido. É o MESMO critério do PDF: os dois exportam o que está
  // em tela, então não faz sentido um estar disponível e o outro não.
  const canExport = debitAccountRef !== null && debitAccountRef !== '' && range !== null

  const mut = useMutation({
    mutationFn: (v: {
      debitAccountRef: string
      periodStart: string
      periodEnd: string
      format: ExportFormat
      filename: string
    }) =>
      reconciliationRepository.exportReconciliation({
        debitAccountRef: v.debitAccountRef,
        periodStart: v.periodStart,
        periodEnd: v.periodEnd,
        format: v.format,
      }),
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
    canExport,
    periodLabel: range === null ? null : `${formatShortDate(range.from)} – ${formatShortDate(range.to)}`,
    exporting: mut.isPending,
    errorTag,
    exportAs: (format) => {
      if (debitAccountRef === null || debitAccountRef === '' || range === null) return
      const filename = `conciliacao_${range.from}_a_${range.to}.${FILE_EXT[format]}`
      mut.mutate({
        debitAccountRef,
        periodStart: range.from,
        periodEnd: range.to,
        format,
        filename,
      })
    },
  }
}
