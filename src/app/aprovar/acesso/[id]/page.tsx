'use client'

import CardLogin from '@/components/auth/CardLogin'
import ApprovePayableLogin from '@/components/payables/approval/externalUserLogin'
import { useParams } from 'next/navigation'

export default function ApprovePayable() {
  const params = useParams()

  return (
    <div
      className={`bg-[url(../../public/images/backgroundLogin.png)] bg-cover w-screen h-screen flex justify-center items-center`}
    >
      <CardLogin title="Aprovar conta a pagar">
        <ApprovePayableLogin payableId={Number(params?.id)} />
      </CardLogin>
    </div>
  )
}
