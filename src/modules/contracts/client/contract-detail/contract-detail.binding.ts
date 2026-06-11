import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { type Result, isOk } from '#shared/primitives/result.ts'
import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { can, grantedContractPermissions } from '#modules/contracts/client/data/helpers/can.ts'
import { contractDetailViewModel, type VigenciaView } from './contract-detail.view-model.ts'

export type ContractDetailQueryState = Readonly<{
  data: Result<Contract, ContractsError> | null
  isLoading: boolean
  isError: boolean
  canWrite: boolean
  // Vigência derivada na view-model a partir de um `now` estável (C1): a view não cria relógio.
  vigencia: VigenciaView | null
}>

export const useContractDetailBinding = (id: string): ContractDetailQueryState => {
  const query = useQuery({ ...contractDetailViewModel.query(id) })
  const current = useCurrentUser()
  const granted = grantedContractPermissions(current.user?.permissions)
  // "Agora" estável por carga de página (lazy initializer) — base da barra de vigência, fora do render.
  const [now] = useState(() => new Date())
  const data = query.data ?? null
  const vigencia = data !== null && isOk(data) ? contractDetailViewModel.deriveVigencia(data.value, now) : null
  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    canWrite: can(granted, 'contract:write'),
    vigencia,
  }
}
