import TopPages from '@/components/TopPages'
import FinanciersTable from '@/components/partners/financier/FinanciersTable'

export default function Financiers() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text={'Financiadores'} />
      <FinanciersTable />
    </div>
  )
}
