/**
 * Binding do OCR (Lançar Documento) — ADAPTER React. Recebe o arquivo, chama o gateway (→ server fn) e,
 * no sucesso, aplica o PATCH no form via callback (preenchimento). Erros como valores. Hoje o status
 * resolve sempre para `unavailable` (backend de OCR não existe — core-api#62); quando entregar, o ramo
 * `done` passa a preencher o form automaticamente — o resto já está cabeado.
 */
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { extractDocumentOcr } from '#modules/financial/client/data/ocr.gateway.ts'

import { ocrToFormPatch, type DocumentFormFields, type OcrStatus } from './document-form.view.ts'

export type OcrBinding = Readonly<{
  status: OcrStatus
  fileName: string | null
  extract: (file: File) => void
  reset: () => void
}>

export function useOcrExtraction(onExtracted: (patch: Partial<DocumentFormFields>) => void): OcrBinding {
  const [fileName, setFileName] = useState<string | null>(null)

  const mut = useMutation({
    mutationKey: ['financial', 'documents', 'ocr'] as const,
    mutationFn: (file: File) => extractDocumentOcr(file),
    onSuccess: (res) => {
      if (isOk(res)) onExtracted(ocrToFormPatch(res.value.fields))
    },
  })

  const status: OcrStatus = mut.isPending
    ? 'running'
    : mut.data === undefined
      ? 'idle'
      : isOk(mut.data)
        ? 'done'
        : mut.data.error === 'ocr-unavailable'
          ? 'unavailable'
          : 'error'

  return {
    status,
    fileName,
    extract: (file) => {
      setFileName(file.name)
      mut.mutate(file)
    },
    reset: () => {
      setFileName(null)
      mut.reset()
    },
  }
}
