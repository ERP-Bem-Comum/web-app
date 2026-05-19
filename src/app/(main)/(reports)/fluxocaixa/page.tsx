'use client'

import TopPagesWithArrow from '@/components/TopPagesWithArrow'
import CashFlowReport from '@/components/reports/CashFlowReport'

export default function ReportCashFlow() {
  return (
    <div className="w-full h-full">
      <TopPagesWithArrow text={'Fluxo de caixa'} nextText="" path="/" />
      <CashFlowReport />
    </div>
  )
}
