import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isOk } from '#shared/primitives/result.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'
import { attachAmendmentDocumentMutationOptions } from './attach-amendment-document.mutation.ts'

export type AttachAmendmentDocumentCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Contract | null
  // Derivação server-state → "concluído" (A1): mora no binding, não na page.
  succeeded: boolean
  // Retorna `true` se a homologação deu certo — permite encadear (ex.: distrato → /end).
  execute: (args: Readonly<{ contractId: string; amendmentId: string; file: File; signedAt: string }>) => Promise<boolean>
  reset: () => void
}>

const fileToBase64 = async (file: File): Promise<string> => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let bin = ''
  for (const byte of bytes) bin += String.fromCharCode(byte)
  return btoa(bin)
}

export const useAttachAmendmentDocumentBinding = (): Readonly<{ attachCommand: AttachAmendmentDocumentCommand }> => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    ...attachAmendmentDocumentMutationOptions,
    onSuccess: (result, variables) => {
      // Escopado (A5): só o detalhe do contrato afetado + as listas — nunca o prefixo amplo ['contracts'].
      if (isOk(result)) {
        void queryClient.invalidateQueries({ queryKey: ['contracts', 'detail', variables.contractId] })
        void queryClient.invalidateQueries({ queryKey: ['contracts', 'list'] })
      }
    },
  })

  const data = mutation.data
  const errorTag =
    data !== undefined && !isOk(data)
      ? contractsErrorTag(data.error)
      : mutation.isError
        ? 'contracts.attach.error.failed'
        : null

  return {
    attachCommand: {
      running: mutation.isPending,
      errorTag,
      result: data !== undefined && isOk(data) ? data.value : null,
      succeeded: data !== undefined && isOk(data),
      execute: ({ contractId, amendmentId, file, signedAt }) =>
        fileToBase64(file)
          .then((fileBase64) => mutation.mutateAsync({ contractId, amendmentId, fileBase64, fileName: file.name, signedAt }))
          .then((res) => isOk(res))
          .catch(() => false),
      reset: () => { mutation.reset() },
    },
  }
}
