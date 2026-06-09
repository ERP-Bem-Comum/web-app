import { useCallback, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import type { DocumentContentDto } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'
import { documentContentMutationOptions } from './document-content.mutation.ts'

export type DocumentContentCommand = Readonly<{
  running: boolean
  errorTag: string | null
  // URL de Blob da prévia atual (iframe do modal); null enquanto não carregou.
  blobUrl: string | null
  fileName: string | null
  // Abre a prévia: busca os bytes e expõe `blobUrl`/`fileName`.
  open: (args: Readonly<{ contractId: string; documentId: string }>) => void
  // Baixa o arquivo (download programático), sem depender do estado de prévia.
  download: (args: Readonly<{ contractId: string; documentId: string; fallbackName: string }>) => void
  // Limpa o estado e REVOGA a object URL (evita vazamento de memória).
  reset: () => void
}>

// base64 (RPC) → Blob (browser). atob → binary string → bytes.
const toBlob = (dto: DocumentContentDto): Blob => {
  const binary = atob(dto.base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: dto.contentType })
}

export const useDocumentContentBinding = (): Readonly<{ documentCommand: DocumentContentCommand }> => {
  // Desestrutura o useMutation: `mutateAsync`/`reset` são estáveis e podem entrar nas deps dos callbacks.
  const { mutateAsync, reset: resetMutation, data, isPending, isError } = useMutation({ ...documentContentMutationOptions })
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const open = useCallback(
    (args: Readonly<{ contractId: string; documentId: string }>) => {
      void mutateAsync(args).then((res) => {
        if (isOk(res)) {
          const url = URL.createObjectURL(toBlob(res.value))
          setBlobUrl((prev) => {
            if (prev !== null) URL.revokeObjectURL(prev)
            return url
          })
          setFileName(res.value.fileName)
        }
      }).catch(() => { /* erro exposto via errorTag */ })
    },
    [mutateAsync],
  )

  const download = useCallback(
    (args: Readonly<{ contractId: string; documentId: string; fallbackName: string }>) => {
      void mutateAsync({ contractId: args.contractId, documentId: args.documentId }).then((res) => {
        if (!isOk(res)) return
        const url = URL.createObjectURL(toBlob(res.value))
        const a = document.createElement('a')
        a.href = url
        a.download = res.value.fileName !== '' ? res.value.fileName : args.fallbackName
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }).catch(() => { /* erro exposto via errorTag */ })
    },
    [mutateAsync],
  )

  const reset = useCallback(() => {
    setBlobUrl((prev) => {
      if (prev !== null) URL.revokeObjectURL(prev)
      return null
    })
    setFileName(null)
    resetMutation()
  }, [resetMutation])

  const errorTag =
    data !== undefined && !isOk(data)
      ? contractsErrorTag(data.error)
      : isError
        ? 'contracts.detail.document.error'
        : null

  return {
    documentCommand: { running: isPending, errorTag, blobUrl, fileName, open, download, reset },
  }
}
