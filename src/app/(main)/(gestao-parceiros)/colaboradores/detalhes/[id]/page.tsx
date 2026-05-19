'use client'
import TopPages from '@/components/TopPages'
import FormCompleteCollaborators from '@/components/partners/collaborators/FormCompleteCollaborators'
import FormPreCollaborator from '@/components/partners/collaborators/FormPreCollaborators'
import { useGetCollaboratorById } from '@/services/collaborator'
import { useParams } from 'next/navigation'

export default function CollaboratorsDetails() {
  const params = useParams()

  const { data, isLoading: isLoadingCollaborators } = useGetCollaboratorById(params?.id)

  return (
    <div className="w-full h-full">
      <TopPages text={'Colaboradores > Detalhes'} />
      {!isLoadingCollaborators ? (
        data?.collaborator?.status === 'CADASTRO_COMPLETO' ? (
          <FormCompleteCollaborators first={false} collaborator={data?.collaborator} edit={false} />
        ) : (
          <FormPreCollaborator collaborator={data?.collaborator} edit={false} />
        )
      ) : null}
    </div>
  )
}
