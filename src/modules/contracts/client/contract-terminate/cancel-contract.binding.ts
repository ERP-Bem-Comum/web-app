import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isOk } from '#shared/primitives/result.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'
import { cancelContractMutationOptions } from './cancel-contract.mutation.ts'

export type CancelContractCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Contract | null
  // Derivação server-state → "concluído" (A1): mora no binding, não na page.
  succeeded: boolean
  execute: (args: Readonly<{ contractId: string }>) => void
  reset: () => void
}>

// Cancelamento (§1.7) — DELETE /contracts/:id (Pendente → Cancelado). SEPARADO do distrato.
// onSuccess invalida a lista + o detalhe do contrato afetado (A5: escopado, nunca o prefixo amplo).
export const useCancelContractBinding = (): Readonly<{ cancelCommand: CancelContractCommand }> => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    ...cancelContractMutationOptions,
    onSuccess: (result, variables) => {
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
    cancelCommand: {
      running: mutation.isPending,
      errorTag,
      result: data !== undefined && isOk(data) ? data.value : null,
      succeeded: data !== undefined && isOk(data),
      execute: ({ contractId }) => { mutation.mutate({ contractId }) },
      reset: () => { mutation.reset() },
    },
  }
}
