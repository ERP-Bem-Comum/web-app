'use client'

import { ApprovePayable } from '@/components/payables/approval/approve'
import { useApproval } from '@/contexts/approvalsContext'

export default function DetailsPayable() {
  const { payable } = useApproval()

  return (
    <div>{payable && <ApprovePayable payable={{ ...payable, currentFiles: payable.files }} />}</div>
  )
}
