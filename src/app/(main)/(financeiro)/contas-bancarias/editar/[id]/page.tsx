'use client'

import TopPagesWithArrow from '@/components/TopPagesWithArrow'
import FormBankAccount from '@/components/bank-account/FormBankAccount'
import { useGetBankAccountById } from '@/services/bankAccount'
import { useParams } from 'next/navigation'

export default function EditAccount() {
  const params = useParams()

  const { data } = useGetBankAccountById(Number(params.id))

  return (
    <div className="w-full h-full">
      <TopPagesWithArrow text={'Conta Bancária'} nextText="Editar" />
      <FormBankAccount account={data?.data ?? null} />
    </div>
  )
}
