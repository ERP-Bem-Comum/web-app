import { useQuery } from '@tanstack/react-query'
import { getCollaboratorsOptions } from '@/services/collaborator'

export const useMassApprover = () => {
  return useQuery({
    queryKey: ['mass-approver'],
    queryFn: async () => {
      const collaboratorsResponse = await getCollaboratorsOptions()
      
      const massApproverCollaborators = collaboratorsResponse.filter(
        collaborator => collaborator.user?.massApprovalPermission === true
      )
      
      return massApproverCollaborators
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
