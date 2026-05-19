'use client'
import TopPages from '@/components/TopPages'
import FormFinancier from '@/components/partners/financier/FormFinancier'
import { useGetFinancierById } from '@/services/financier'
import { useParams } from 'next/navigation'

export default function FinanciersDetails() {
  const params = useParams()

  const { data, isLoading: isLoadingFinanciers } = useGetFinancierById(params?.id)

  return (
    <div className="w-full h-full">
      <TopPages text={'Financiadores > Detalhes'} />
      {!isLoadingFinanciers && <FormFinancier financier={data?.financier} edit={false} />}
    </div>
  )
}
