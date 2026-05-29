'use client'

import TopPages from '@/components/TopPages'
import FormSupplier from '@/components/suppliers/FormSupplier'
import { useGetSupplierById } from '@/services/supplier'
import { useParams } from 'next/navigation'

export default function EditSuppliers() {
  const params = useParams()
  const { data, isLoading: isLoadingSupplier } = useGetSupplierById(Number(params?.id))

  return (
    <div className="w-full h-full">
      <TopPages text={'Fornecedores > Editar'} />
      {!isLoadingSupplier && <FormSupplier supplier={data?.supplier} edit={true} />}
    </div>
  )
}
