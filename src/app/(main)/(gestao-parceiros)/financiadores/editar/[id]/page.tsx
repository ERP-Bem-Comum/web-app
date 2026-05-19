'use client'

import TopPages from '@/components/TopPages'
import FormFinancier from '@/components/partners/financier/FormFinancier'
import { useGetFinancierById } from '@/services/financier'
import { useParams } from 'next/navigation'

export default function EditFinanciers() {
  const params = useParams()
  const { data, isLoading: isLoadingFinancier } = useGetFinancierById(params?.id)

  return (
    <div className="w-full h-full">
      <TopPages text={'Financiadores > Editar'} />
      {!isLoadingFinancier && <FormFinancier financier={data?.financier} edit={true} />}
    </div>
  )
}
