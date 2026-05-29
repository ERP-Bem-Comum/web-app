import { queryOptions } from '@tanstack/react-query'
import type { ContractListFilters } from '../domain/types'

export const contractKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractKeys.all, 'list'] as const,
  list: (filters: ContractListFilters) => [...contractKeys.lists(), filters] as const,
  details: () => [...contractKeys.all, 'detail'] as const,
  detail: (id: string) => [...contractKeys.details(), id] as const,
} as const

// queryOptions serão preenchidas pelas views/hooks que chamam as Server Functions
