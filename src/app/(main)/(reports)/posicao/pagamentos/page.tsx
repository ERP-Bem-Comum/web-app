'use client'

import TopPagesWithArrow from '@/components/TopPagesWithArrow'
import AccountsPositionReport from '@/components/reports/AccountsPositionReport'
import { headCellsForPayables } from '@/components/reports/components/accountsPosition/consts'

export default function AccountsPositionPayables() {
  return (
    <div className="w-full h-full">
      <TopPagesWithArrow text={'Posição de contas - A pagar'} nextText="Detalhes" path="/" />
      <AccountsPositionReport headCells={headCellsForPayables} type="payable" />
    </div>
  )
}
