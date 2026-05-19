import { VariationSignal } from '@/types/statistics'
import { cn } from 'lib/utils'
import { PiArrowUpBold, PiArrowDownBold } from 'react-icons/pi'

interface StatisticValuesProps {
  title: string
  total: string
  variation: string
  variationSignal: VariationSignal
  variationLabel: string
}

export const StatisticValues = ({
  title,
  total,
  variation,
  variationSignal,
  variationLabel,
}: StatisticValuesProps) => {
  const Arrow = variationSignal === '+' ? PiArrowUpBold : PiArrowDownBold
  const signalColor = variationSignal === '+' ? 'text-[#00B341]' : 'text-[#FF3D71]'

  return (
    <div className="flex flex-col gap-[11px]">
      <h3 className="text-sm text-erp-grayscale whitespace-nowrap">{title}</h3>
      <span className="text-[21px] font-bold leading-6">{total}</span>
      <div className="flex items-center gap-[17px]">
        <div className="flex items-center gap-1">
          <Arrow size={15} className={signalColor} />
          <span className={cn('text-xs tracking-[-3%]', signalColor)}>{variation}</span>
        </div>

        <span className="text-xs tracking-[-3%] text-erp-grayscale whitespace-nowrap">
          {variationLabel}
        </span>
      </div>
    </div>
  )
}
