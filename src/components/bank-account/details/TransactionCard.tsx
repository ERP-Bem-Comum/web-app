import { cn } from 'lib/utils'
import { maskMonetaryValue } from '@/utils/masks'
import { formatDate } from '@/utils/dates'
import { TransactionCardProps } from '@/types/reconciliation'

const FormatAmount = ({ amount }: { amount: number }) => {
  return (
    <p
      className={`font-bold ${
        amount >= 0 ? 'text-erp-positive' : 'text-erp-negativeValue'
      } my-2 text-xl`}
    >
      {maskMonetaryValue(amount)}
    </p>
  )
}

export const TransactionCard = ({
  date,
  amount,
  title,
  description,
  beneficiary,
  documentNumber,
  className,
}: TransactionCardProps) => {
  return (
    <div className={cn(`flex flex-col p-5`, className)}>
      <p className="text-[#676969] text-sm">{date}</p>
      <FormatAmount amount={amount} />
      <div className="space-y-1">
        <p className="text-erp-baseDark text-base uppercase">{title}</p>
        <p className="text-erp-baseDark text-xs">{description}</p>
        {beneficiary && (
          <p className="text-[#2C5F6F] text-sm font-medium mt-1">
            {beneficiary}
          </p>
        )}
        {documentNumber && (
          <p className="text-[#676969] text-xs">
            Doc: {documentNumber}
          </p>
        )}
      </div>
    </div>
  )
}
