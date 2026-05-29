import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAditive } from '@/server/contracts'
import { contractKeys } from '../../adapters/queries'
import type { AditiveCreateInput } from '../../domain/schemas'

export function useCreateAditive() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: AditiveCreateInput) => createAditive({ data: input }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: contractKeys.detail(variables.parentId) })
      qc.invalidateQueries({ queryKey: contractKeys.lists() })
    },
  })
}
