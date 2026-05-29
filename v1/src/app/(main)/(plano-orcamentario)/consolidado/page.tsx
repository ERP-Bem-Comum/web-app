import TopPages from '@/components/TopPages'
import ConsolidatedTable from '@/components/consolidated/ConsolidatedTable'

export default function Consolidated() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text={'Consolidado ABC'} />
      <ConsolidatedTable />
    </div>
  )
}
