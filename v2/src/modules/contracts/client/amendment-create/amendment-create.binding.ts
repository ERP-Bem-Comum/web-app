import { useMutation } from '@tanstack/react-query'
import type { CreateAmendmentInput, Amendment } from '#modules/contracts/client/data/model/contracts.model.ts'
import { isOk } from '#shared/primitives/result.ts'
import { amendmentCreateViewModel } from './amendment-create.view-model.ts'

export type CreateAmendmentCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Amendment | null
  execute: (contractId: string, input: CreateAmendmentInput) => void
}>

export const useAmendmentCreateBinding = (): Readonly<{ createCommand: CreateAmendmentCommand }> => {
  const mutation = useMutation({ ...amendmentCreateViewModel.mutation })
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
      execute: (contractId, input) => { mutation.mutate({ contractId, data: input }); },
    },
  }
}
