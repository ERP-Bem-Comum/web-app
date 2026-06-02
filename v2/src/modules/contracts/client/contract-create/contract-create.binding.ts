import { useMutation } from '@tanstack/react-query'
import type { CreateContractInput, Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Result } from '#shared/primitives/result.ts'
import { isOk } from '#shared/primitives/result.ts'
import { contractCreateViewModel } from './contract-create.view-model.ts'

export type CreateContractCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Contract | null
  execute: (input: CreateContractInput) => void
}>

export const useContractCreateBinding = (): Readonly<{ createCommand: CreateContractCommand }> => {
  const mutation = useMutation({
    ...contractCreateViewModel.mutation,
    onSuccess: (result) => {
      contractCreateViewModel.onSuccess(result)
    },
  })

  const data = mutation.data
  const errorTag =
    data !== undefined && !isOk(data)
      ? contractCreateViewModel.toErrorTag(data.error)
      : mutation.isError
        ? contractCreateViewModel.unexpectedErrorTag
        : null

  return {
    createCommand: {
      running: mutation.isPending,
      errorTag,
      result: data !== undefined && isOk(data) ? data.value : null,
      execute: (input) => mutation.mutate(input),
    },
  }
}
