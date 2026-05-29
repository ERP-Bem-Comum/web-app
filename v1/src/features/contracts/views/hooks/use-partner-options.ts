import { useQuery } from '@tanstack/react-query'
import { getSuppliers, getFinanciers, getCollaborators } from '@/server/partners'
import { getBudgetPlans } from '@/server/budget-plans'

export function usePartnerOptions() {
  const suppliers = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers({ data: undefined }),
  })
  const financiers = useQuery({
    queryKey: ['financiers'],
    queryFn: () => getFinanciers({ data: undefined }),
  })
  const collaborators = useQuery({
    queryKey: ['collaborators'],
    queryFn: () => getCollaborators({ data: undefined }),
  })
  const budgetPlans = useQuery({
    queryKey: ['budget-plans'],
    queryFn: () => getBudgetPlans({ data: undefined }),
  })

  return { suppliers, financiers, collaborators, budgetPlans }
}
