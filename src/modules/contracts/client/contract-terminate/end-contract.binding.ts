import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isOk } from '#shared/primitives/result.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'
import { endContractMutationOptions } from './end-contract.mutation.ts'

export type EndContractCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Contract | null
  // Derivação server-state → "concluído" (A1): mora no binding, não na page.
  succeeded: boolean
  execute: (args: Readonly<{ contractId: string; file: File; terminatedAt: string; reason: string }>) => void
  reset: () => void
}>

// ArrayBuffer → base64 (nativo: btoa). Confina a leitura do File na camada de binding (browser),
// mantendo mutation/view-model agnósticos de DOM (§XI). Espelha attach-signed-document.binding.
const fileToBase64 = async (file: File): Promise<string> => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let bin = ''
  for (const byte of bytes) bin += String.fromCharCode(byte)
  return btoa(bin)
}

// Distrato (#32) — POST /contracts/:id/end (Terminate): sobe o doc `signed_termination` + data efetiva + motivo.
export const useEndContractBinding = (): Readonly<{ endCommand: EndContractCommand }> => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    ...endContractMutationOptions,
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
        ? 'contracts.error.unexpected'
        : null

  return {
    endCommand: {
      running: mutation.isPending,
      errorTag,
      result: data !== undefined && isOk(data) ? data.value : null,
      succeeded: data !== undefined && isOk(data),
      execute: ({ contractId, file, terminatedAt, reason }) => {
        void fileToBase64(file).then((fileBase64) => {
          mutation.mutate({ contractId, fileBase64, fileName: file.name, terminatedAt, reason })
        })
      },
      reset: () => { mutation.reset() },
    },
  }
}
