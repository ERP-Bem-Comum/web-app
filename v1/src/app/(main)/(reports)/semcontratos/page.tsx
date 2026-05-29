'use client'

import TopPagesWithArrow from '@/components/TopPagesWithArrow'
import NoContractsReport from '@/components/reports/NoContractsReport'

export default function NoContracts() {
  return (
    <div className="w-full h-full">
      <TopPagesWithArrow text={'Fornecedores sem contrato'} nextText="" path="/" />
      <NoContractsReport />
    </div>
  )
}
