import TopPages from '@/components/TopPages'
import SuppliersTable from '@/components/suppliers/SuppliersTable'

export default function Suppliers() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text={'Fornecedores'} />
      <SuppliersTable />
    </div>
  )
}
