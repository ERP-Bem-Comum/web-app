/**
 * Mock data de contratos — agora delegado para localDb.
 * Mantido para compatibilidade com imports existentes.
 */

import {
  localDbGetContracts,
  localDbGetContractById,
  seedLocalDb,
} from './localDb'

export { seedLocalDb }

export const mockContracts = localDbGetContracts()
export const mockContractsMeta = {
  itemCount: mockContracts.length,
  totalItems: mockContracts.length,
  itemsPerPage: 10,
  totalPages: 1,
  currentPage: 1,
}

export const mockContractById = (id: number) => localDbGetContractById(id)
