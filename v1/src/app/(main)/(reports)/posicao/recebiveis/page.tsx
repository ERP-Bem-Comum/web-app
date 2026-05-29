'use client'

import TopPagesWithArrow from '@/components/TopPagesWithArrow'
import AccountsPositionReport from '@/components/reports/AccountsPositionReport'
import { headCellsForReceivables } from '@/components/reports/components/accountsPosition/consts'

export default function AccountsPositionReceivables() {
  return (
    <div className="w-full h-full">
      <TopPagesWithArrow text={'Posição de contas'} nextText="A receber" path="/" />
      <AccountsPositionReport headCells={headCellsForReceivables} type="receivable" />
    </div>
  )
}
