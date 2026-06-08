import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isOk } from '#shared/primitives/result.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'
import { endContractMutationOptions } from './end-contract.mutation.ts'

export type EndContractCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Contract | null
  execute: (contractId: string) => void
  reset: () => void
}>

// Distrato (encerramento antecipado) — POST /contracts/:id/end (Terminate). Religação básica.
export const useEndContractBinding = (): Readonly<{ endCommand: EndContractCommand }> => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    ...endContractMutationOptions,
    onSuccess: (result) => {
      if (isOk(result)) void queryClient.invalidateQueries({ queryKey: ['contracts'] })
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
      execute: (contractId) => { mutation.mutate({ contractId }) },
      reset: () => { mutation.reset() },
    },
  }
}
