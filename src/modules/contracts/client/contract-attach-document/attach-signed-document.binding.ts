import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { isOk } from '#shared/primitives/result.ts'
import { attachSignedDocumentViewModel } from './attach-signed-document.view-model.ts'

export type AttachSignedDocumentCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Contract | null
  execute: (args: Readonly<{ contractId: string; file: File; signedAt: string }>) => void
  reset: () => void
}>

// ArrayBuffer → base64 (nativo: btoa). Confina a leitura do File na camada de binding (browser),
// mantendo mutation/view-model agnósticos de framework e de DOM (§XI).
const fileToBase64 = async (file: File): Promise<string> => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let bin = ''
  for (const byte of bytes) bin += String.fromCharCode(byte)
  return btoa(bin)
}

export const useAttachSignedDocumentBinding = (): Readonly<{ attachCommand: AttachSignedDocumentCommand }> => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    ...attachSignedDocumentViewModel.mutation,
    onSuccess: (result) => {
      attachSignedDocumentViewModel.onSuccess(result)
      if (isOk(result)) {
        void queryClient.invalidateQueries({ queryKey: ['contracts'] })
      }
    },
  })

  const data = mutation.data
  const errorTag =
    data !== undefined && !isOk(data)
      ? attachSignedDocumentViewModel.toErrorTag(data.error)
      : mutation.isError
        ? attachSignedDocumentViewModel.unexpectedErrorTag
        : null

  return {
    attachCommand: {
      running: mutation.isPending,
      errorTag,
      result: data !== undefined && isOk(data) ? data.value : null,
      execute: ({ contractId, file, signedAt }) => {
        void fileToBase64(file).then((fileBase64) => {
          mutation.mutate({ contractId, fileBase64, fileName: file.name, signedAt })
        })
      },
      reset: () => {
        mutation.reset()
      },
    },
  }
}
