import { useMutation, useQuery } from '@tanstack/react-query'
import type { CreateContractInput, Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { isOk } from '#shared/primitives/result.ts'
import { partnersRepository } from '#modules/contracts/client/data/repository/partners.repository.instance.ts'
import type { PartnerSearchResult } from '#modules/contracts/client/data/repository/partners.repository.ts'
import { contractCreateViewModel } from './contract-create.view-model.ts'

export type CreateContractCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: Contract | null
  execute: (input: CreateContractInput) => void
}>

export type { PartnerSearchResult } from '#modules/contracts/client/data/repository/partners.repository.ts'

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
      execute: (input) => { mutation.mutate(input); },
    },
  }
}

export const usePartnerSearchBinding = (
  query: string,
  contractType: string,
  isOpen: boolean,
): Readonly<{
  results: readonly PartnerSearchResult[]
  isLoading: boolean
}> => {
  const kind =
    contractType === 'Supplier' ? 'Supplier' as const
    : contractType === 'Financier' ? 'Financier' as const
    : contractType === 'Collaborator' ? 'Collaborator' as const
    : undefined

  const q = useQuery({
    queryKey: ['partners', 'search', query, kind],
    queryFn: async () => {
      const res = await partnersRepository.search(query, kind)
      if (!isOk(res)) return [] as PartnerSearchResult[]
      return res.value
    },
    enabled: isOpen,
    staleTime: 30_000,
  })

  return {
    results: q.data ?? [],
    isLoading: q.isLoading,
  }
}
