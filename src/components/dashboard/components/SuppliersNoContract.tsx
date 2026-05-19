import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from 'lib/utils'
import { NoContractsData } from '@/types/reports/noContracts'
import { useRouter } from 'next/navigation'
import { maskMonetaryValue } from '@/utils/masks'

export default function SuppliersNoContract({ rows }: { rows: NoContractsData[] }) {
  const router = useRouter()

  const switchColors = (total: number) => {
    if (total > 10000) {
      return 'bg-[#E18282]'
    } else if (total === 10000) {
      return 'bg-[#D5D5D5]'
    } else {
      return 'bg-[#FFFFFF]'
    }
  }

  return (
    <div className="space-y-4">
      <ul className="flex flex-col gap-[7px]">
        {rows.map((row, index) => (
          <li
            key={row.name}
            className={cn('flex justify-between px-10 py-3 w-full', switchColors(row.total))}
          >
            <span className="text-[#020E12] font-bold text-base">{row.name}</span>
            <span className="text-[#020E12] font-bold text-base">
              {maskMonetaryValue(row.total)}
            </span>
          </li>
        ))}
      </ul>
      <Button variant="outlinedFullWidth" onClick={() => router.push('/semcontratos')}>
        Ver todas
      </Button>
    </div>
  )
}
