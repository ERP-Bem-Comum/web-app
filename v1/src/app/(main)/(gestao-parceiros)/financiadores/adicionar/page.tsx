import TopPages from '@/components/TopPages'
import FormFinancier from '@/components/partners/financier/FormFinancier'

export default function AddFinancier() {
  return (
    <div className="w-full h-full">
      <TopPages text={'Financiadores > Adicionar'} />
      <FormFinancier financier={null} edit={true} />
    </div>
  )
}
