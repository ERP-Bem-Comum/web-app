import TopPages from '@/components/TopPages'
import CollaboratorsTable from '@/components/partners/collaborators/CollaboratorsTable'

export default function Collaborators() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text={'Colaboradores'} />
      <CollaboratorsTable />
    </div>
  )
}
