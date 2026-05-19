import TopPages from '@/components/TopPages'
import CollaboratorsTable from '@/components/partners/collaborators/CollaboratorsTable'
import TeamReport from '@/components/reports/TeamReport'

export default function TeamReportPage() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text={'Relatório Equipe ABC'} />
      <TeamReport />
    </div>
  )
}
