'use client'

import TopPages from '@/components/TopPages'
import AnalysisReport from '@/components/reports/AnalysisReport'

export default function NoContracts() {
  return (
    <div className="w-full h-full">
      <TopPages text={'Análise de Recebimentos'} path="/" />
      <AnalysisReport type="receivable" />
    </div>
  )
}
