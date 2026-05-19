import TopPages from '@/components/TopPages'
import ProgramsTable from '@/components/programs/ProgramsTable'

export default function Programs() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text={'Programas'} />
      <ProgramsTable />
    </div>
  )
}
