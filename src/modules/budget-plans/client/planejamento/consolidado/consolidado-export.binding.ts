/**
 * Binding do export CSV do Consolidado ABC — ADAPTER React (§XI). Orquestra a mutation: chama a server fn
 * (o BFF gera o CSV server-side), recebe `{ filename, content }` e dispara o download (Blob + anchor). O CSV
 * NÃO é montado no client — só baixamos o artefato do BFF (Decisão 11). Loading/erro tratados aqui.
 */
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import {
  exportConsolidadoAbcCsv,
  type ConsolidadoExportInput,
} from '#modules/budget-plans/client/data/consolidado-export.gateway.ts'

/** Dispara o download do CSV no navegador (efeito de UI idempotente; não lança). */
const triggerDownload = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export type ConsolidadoExportBinding = Readonly<{
  exportCsv: () => void
  exporting: boolean
  errorTag: string | null
}>

export function useConsolidadoExport(filters: ConsolidadoExportInput): ConsolidadoExportBinding {
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: () => exportConsolidadoAbcCsv(filters),
    onSuccess: (res) => {
      if (res.ok) {
        triggerDownload(res.value.filename, res.value.content)
        setErrorTag(null)
      } else {
        setErrorTag('budget-plans.consolidado.exportError')
      }
    },
    onError: () => {
      setErrorTag('budget-plans.consolidado.exportError')
    },
  })

  return {
    exportCsv: () => {
      setErrorTag(null)
      mut.mutate()
    },
    exporting: mut.isPending,
    errorTag,
  }
}
