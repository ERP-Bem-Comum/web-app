/**
 * Binding da INGESTÃO por OCR (Lançar Documento) — ADAPTER React. Recebe o arquivo, chama o gateway (→ server
 * fn `ingestDocumentFn`) e, no SUCESSO, **navega para o modo edição do rascunho** criado (`?id=documentId`),
 * reusando o trigger de edição já existente (search param → prop → `useDocumentEditing`). O binding NUNCA cria
 * documento — só ingere (1 rascunho) e navega; a conclusão é a ação normal do operador na tela do rascunho.
 * Erros como valores (§II): mapeados p/ tag i18n via `ocrErrorTag`.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { isOk } from '#shared/primitives/result.ts'
import { extractDocumentOcr } from '#modules/financial/client/data/ocr.gateway.ts'

import { ocrErrorTag, type OcrStatus } from './document-form.view.ts'

export type OcrBinding = Readonly<{
  status: OcrStatus
  fileName: string | null
  /** Tag i18n do erro real (mime/tamanho/arquivo/servidor); `null` fora do estado de erro. */
  errorTag: string | null
  extract: (file: File) => void
  reset: () => void
}>

export function useOcrExtraction(): OcrBinding {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mut = useMutation({
    mutationKey: ['financial', 'documents', 'ingest'] as const,
    mutationFn: (file: File) => extractDocumentOcr(file),
    onSuccess: (res) => {
      if (!isOk(res)) return // erro-como-valor: a mutation resolve mesmo no err
      // O rascunho já aparece na lista real (Fatia 2) — invalida antes de navegar.
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
      void navigate({ to: '/financeiro/contas-a-pagar/lancar', search: { id: res.value.documentId } })
    },
  })

  const status: OcrStatus = mut.isPending
    ? 'running'
    : mut.data === undefined
      ? 'idle'
      : isOk(mut.data)
        ? 'done'
        : 'error'

  const errorTag = mut.data !== undefined && !isOk(mut.data) ? ocrErrorTag(mut.data.error) : null

  return {
    status,
    fileName: mut.variables?.name ?? null,
    errorTag,
    extract: (file) => {
      mut.mutate(file)
    },
    reset: () => {
      mut.reset()
    },
  }
}
