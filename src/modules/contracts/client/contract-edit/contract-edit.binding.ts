import { useMutation } from '@tanstack/react-query'
import type { UpdateContractInput, Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { isOk } from '#shared/primitives/result.ts'
import { contractEditViewModel } from './contract-edit.view-model.ts'

export type UpdateContractCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Contract | null
  execute: (input: UpdateContractInput) => void
}>

export const useContractEditBinding = (
  opts?: Readonly<{ onSuccess?: () => void }>,
): Readonly<{ editCommand: UpdateContractCommand }> => {
  const mutation = useMutation({
    ...contractEditViewModel.mutation,
    onSuccess: (result) => { if (isOk(result) && opts?.onSuccess) opts.onSuccess() },
  })
  const data = mutation.data
  const errorTag =
    data !== undefined && !isOk(data)
      ? contractEditViewModel.toErrorTag(data.error)
      : mutation.isError ? contractEditViewModel.unexpectedErrorTag : null

  return {
    editCommand: {
      running: mutation.isPending,
      errorTag,
      result: data !== undefined && isOk(data) ? data.value : null,
      execute: (input) => { mutation.mutate(input); },
    },
  }
}
