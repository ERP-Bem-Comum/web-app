'use client'
import TopPages from '@/components/TopPages'
import { LoadingScreen } from '@/components/layout/LoadingScreen'
import FormPayable from '@/components/payables/FormPayable'
import { PayableStatus } from '@/enums/payables'
import { usePayableContext } from '@/hooks/usePayableContext'
import { useParams, useRouter } from 'next/navigation'

export default function EditPayable() {
  const router = useRouter()
  const { id } = useParams()
  const { payable, setCurrentPayableId, isLoading } = usePayableContext()

  if (id) {
    setCurrentPayableId(Number(id))
  } else if (!payable) {
    router.push('/contas-pagar')
  }

  return (
    <div className="w-full h-full">
      <TopPages text={'Editar conta a pagar'} path="/contas-pagar" />
      {isLoading || !payable ? (
        <LoadingScreen />
      ) : (
        <FormPayable
          payable={{
            ...payable,
            currentFiles: payable.files,
            approvers: payable.approvals
              .filter((a) => a.collaborator)
              .map((a) => a.collaborator.id),
          }}
          edit={[PayableStatus.APPROVING, PayableStatus.PENDING].includes(payable.payableStatus)}
        />
      )}
    </div>
  )
}
