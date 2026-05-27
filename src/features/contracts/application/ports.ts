import type { Contract, ContractId, ContractListFilters, PaginatedContractRows } from '../domain/types'

export type ContractRepo = Readonly<{
  list: (filters: ContractListFilters) => Promise<PaginatedContractRows>
  getById: (id: ContractId) => Promise<Contract | null>
  create: (input: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'contractCode'>) => Promise<Contract>
}>
