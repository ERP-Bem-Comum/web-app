'use client'

import TopPagesWithArrow from '@/components/TopPagesWithArrow'
import BankAccountDetails from '@/components/bank-account/details/BankAccountDetails'
import { useParams } from 'next/navigation'

export default function AccountDetails() {
  const params = useParams()
  return (
    <div className="w-full h-full">
      <TopPagesWithArrow text={'Conta Bancária'} nextText="Detalhes" path="/contas-bancarias" />
      <BankAccountDetails accountId={Number(params.id)} />
    </div>
  )
}
