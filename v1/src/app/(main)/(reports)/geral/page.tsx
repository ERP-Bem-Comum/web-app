'use client'

import TopPages from '@/components/TopPages'
import GeneralReport from '@/components/reports/GeneralReport'

export default function General() {
  return (
    <div className="w-full h-full">
      <TopPages text={'Analise geral'} path="/" />
      <GeneralReport />
    </div>
  )
}
