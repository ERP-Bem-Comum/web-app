/**
 * Binding do comprovante-fonte (core-api#568) — ADAPTER React. Na EDIÇÃO de um documento lido por OCR, busca
 * os bytes do anexo pela server-fn (via repository → `getSourceFile`) e monta um `File` no browser, para o web
 * view do "Lançar Documento" renderizar (PDF/XML) reusando o MESMO `useDocumentPreview`. CA4: o browser NUNCA
 * fala com o core-api — os bytes chegam base64 pela fronteira; aqui só reconstruímos o `File` (nativo).
 *
 * LAZY: a query só dispara quando `enabled` (modo edição/consulta) E há `attachment` (documento com anexo);
 * documento manual (`attachment === null`) → não busca nada e devolve `null` (CA3).
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import { base64ToFile } from '#modules/financial/client/data/file-base64.ts'
import type { DocumentAttachment } from '#modules/financial/client/data/model/document.model.ts'

export function useAttachmentFile(
  documentId: string | undefined,
  attachment: DocumentAttachment | null,
  enabled: boolean,
): File | null {
  const active = enabled && attachment !== null && documentId !== undefined
  const query = useQuery({
    queryKey: ['financial', 'documents', 'source-file', documentId ?? null] as const,
    enabled: active,
    staleTime: 5 * 60_000, // o comprovante não muda no ciclo de vida do documento
    queryFn: async (): Promise<string | null> => {
      if (documentId === undefined) return null
      const r = await financialRepository.getSourceFile(documentId)
      return r.ok ? r.value.base64 : null
    },
  })

  const base64 = query.data ?? null
  return useMemo(() => {
    if (attachment === null || base64 === null) return null
    return base64ToFile(base64, attachment.fileName, attachment.mimeType)
  }, [attachment, base64])
}
