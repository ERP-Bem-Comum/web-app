import { cn } from 'lib/utils'
import { maskMonetaryValue } from '@/utils/masks'
import { formatDate } from '@/utils/dates'
import { MovimentationStatus } from '@/enums/creditCard'

interface MovTransactionCardProps {
  referenceDate: string
  value: number
  description: string
  numberOfInstallments: number
  currentInstallment: number
  className?: string
  status: MovimentationStatus
  onClick?: () => void
}

const FormatValue = ({ value }: { value: number }) => {
  return (
    <p
      className={`font-bold ${
        value > 0
          ? 'text-erp-positive'
          : value < 0
            ? 'text-erp-negativeValue'
            : 'text-erp-grayscale'
      } my-2 text-xl`}
    >
      {maskMonetaryValue(value)}
    </p>
  )
}

export const MovTransactionCard = ({
  referenceDate,
  value,
  description,
  className,
  status,
  numberOfInstallments,
  currentInstallment,
  onClick,
}: MovTransactionCardProps) => {
  return (
    <li
      className={cn(
        `w-1/2 flex justify-between items-center p-5 cursor-pointer`,
        status === MovimentationStatus.PROCESSED ? 'reconciled-border' : '',
        status === MovimentationStatus.PROCESSED ? 'pointer-events-none' : '',
        className,
      )}
      onClick={onClick}
    >
      <div>
        <div className="flex gap-5">
          <p className="text-[#676969] text-sm">{formatDate(referenceDate)}</p>
          {numberOfInstallments > 1 && (
            <p className="text-[#676969] text-sm">
              {currentInstallment}
              {'/'}
              {numberOfInstallments}
            </p>
          )}
        </div>

        <FormatValue value={value * -1} />
        <p className="text-erp-baseDark text-xs">{description}</p>
      </div>
      <div className="p-2 flex items-center justify-center">
        <p>{status}</p>
      </div>
    </li>
  )
}
