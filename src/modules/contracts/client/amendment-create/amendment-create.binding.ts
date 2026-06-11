import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateAmendmentInput, Amendment } from '#modules/contracts/client/data/model/contracts.model.ts'
import { isOk } from '#shared/primitives/result.ts'
import { amendmentCreateViewModel } from './amendment-create.view-model.ts'

export type CreateAmendmentCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Amendment | null
  // Derivação server-state → "concluído" (A1): mora no binding, não na page. A page compõe isto
  // com seu UI-state (modal aberto) sem precisar inspecionar `result` cru.
  succeeded: boolean
  execute: (contractId: string, input: CreateAmendmentInput) => void
  reset: () => void
}>

export const useAmendmentCreateBinding = (): Readonly<{ createCommand: CreateAmendmentCommand }> => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    ...amendmentCreateViewModel.mutation,
    onSuccess: (result, variables) => {
      // Escopado (A5): invalida só o detalhe do contrato afetado + as listas — nunca o prefixo
      // amplo ['contracts'] (que re-buscaria todo o cache de contratos a cada mutation).
      if (isOk(result)) {
        void queryClient.invalidateQueries({ queryKey: ['contracts', 'detail', variables.contractId] })
        void queryClient.invalidateQueries({ queryKey: ['contracts', 'list'] })
      }
    },
  })
  const data = mutation.data
  const errorTag =
    data !== undefined && !isOk(data)
      ? amendmentCreateViewModel.toErrorTag(data.error)
      : mutation.isError ? amendmentCreateViewModel.unexpectedErrorTag : null

  return {
    createCommand: {
      running: mutation.isPending,
      errorTag,
      result: data !== undefined && isOk(data) ? data.value : null,
      succeeded: data !== undefined && isOk(data),
      execute: (contractId, input) => { mutation.mutate({ contractId, data: input }); },
      // Reabrir o modal p/ criar OUTRO aditivo: limpa o resultado anterior (senão `result !== null`
      // mantém o modal fechado e só permite 1 criação por carga de página).
      reset: () => { mutation.reset() },
    },
  }
}
