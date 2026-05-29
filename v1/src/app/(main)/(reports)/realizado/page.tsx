'use client'

import TopPages from '@/components/TopPages'
import RealizedReport from '@/components/reports/RealizedReport'

export default function RealizedReportPage() {
  return (
    <div className="w-full h-full">
      <TopPages text={'Realizado x Planejado'} path="/" />
      <RealizedReport />
    </div>
  )
}
