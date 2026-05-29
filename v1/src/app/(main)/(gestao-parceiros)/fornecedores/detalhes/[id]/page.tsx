'use client'
import TopPages from '@/components/TopPages'
import FormSupplier from '@/components/suppliers/FormSupplier'
import { useGetSupplierById } from '@/services/supplier'
import { useParams } from 'next/navigation'

export default function SuppliersDetails() {
  const params = useParams()

  const { data, isLoading: isLoadingSuppliers } = useGetSupplierById(Number(params?.id))

  return (
    <div className="w-full h-full">
      <TopPages text={'Fornecedores > Detalhes'} />
      {!isLoadingSuppliers && <FormSupplier supplier={data?.supplier} edit={false} />}
    </div>
  )
}
