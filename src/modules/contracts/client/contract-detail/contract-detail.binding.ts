import { useQuery } from '@tanstack/react-query'
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { Result } from '#shared/primitives/result.ts'
import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { can, grantedContractPermissions } from '#modules/contracts/client/data/helpers/can.ts'
import { contractDetailViewModel } from './contract-detail.view-model.ts'

export type ContractDetailQueryState = Readonly<{
  data: Result<Contract, ContractsError> | null
  isLoading: boolean
  isError: boolean
  canWrite: boolean
}>

export const useContractDetailBinding = (id: string): ContractDetailQueryState => {
  const query = useQuery({ ...contractDetailViewModel.query(id) })
  const current = useCurrentUser()
  const granted = grantedContractPermissions(current.user?.permissions)
  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    canWrite: can(granted, 'contract:write'),
  }
}
