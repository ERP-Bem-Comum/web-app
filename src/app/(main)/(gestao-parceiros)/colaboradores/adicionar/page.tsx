import TopPages from '@/components/TopPages'
import FormPreCollaborator from '@/components/partners/collaborators/FormPreCollaborators'

export default function AddCollaborators() {
  return (
    <div className="w-full h-full">
      <TopPages text={'Colaboradores > Adicionar'} />
      <FormPreCollaborator collaborator={null} edit={true} />
    </div>
  )
}
