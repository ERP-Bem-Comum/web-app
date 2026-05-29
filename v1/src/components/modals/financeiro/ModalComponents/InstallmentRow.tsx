import { Installments } from '@/types/installments'
import { maskMonetaryValue } from '@/utils/masks'

interface InstallmentRowProps {
  row: Pick<Installments, 'id' | 'value' | 'dueDate' | 'status'>
  index: number
}

export const InstallmentRow = ({ row, index }: InstallmentRowProps) => {
  return (
    <div className="w-full p-5">
      <p>Parcela {index}</p>
      {/* <CustomDatePicker /> */}
      <p>Valor: {maskMonetaryValue(row.value)}</p>
    </div>
  )
}
