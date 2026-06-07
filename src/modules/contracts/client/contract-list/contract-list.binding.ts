/**
 * useContractListBinding — ADAPTER React (ADR-0009).
 * Liga o view-model ao TanStack Query.
 */
import { useQuery } from '@tanstack/react-query'
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import type { ListContractsInput, ListContractsResponse } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { Result } from '#shared/primitives/result.ts'
import { contractListViewModel } from './contract-list.view-model.ts'

export type ContractListQueryState = Readonly<{
  data: Result<ListContractsResponse, ContractsError> | null
  isLoading: boolean
  isError: boolean
}>

export const useContractListBinding = (input: ListContractsInput): ContractListQueryState => {
  const query = useQuery({
    ...contractListViewModel.query(input),
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
