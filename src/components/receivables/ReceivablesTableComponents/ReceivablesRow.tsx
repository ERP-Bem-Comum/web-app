import TableCellStyled from '@/components/table/TableCellStyled'
import { InstallmentStatus } from '@/enums/installments'
import { ReceivableRow } from '@/types/receivables'
import { formatDate } from '@/utils/dates'
import { maskCNPJ, maskMonetaryValue } from '@/utils/masks'
import { FormLabel, TableRow } from '@mui/material'
import { cn } from 'lib/utils'

interface ReceivablesRowProps {
  row: ReceivableRow
  index: number
  setCurrentReceivableId: (id: number) => void
  onOpenPreviewModal: () => void
}

const ReceivablesRow = ({
  row,
  index,
  setCurrentReceivableId,
  onOpenPreviewModal,
}: ReceivablesRowProps) => {
  const labelId = `enhanced-table-checkbox-${index}`
  const className = 'cursor-pointer'
  return (
    <TableRow
      id={'receivable' + row.id}
      key={labelId}
      tabIndex={-1}
      className={cn('hover:bg-[#F6FAFB]')}
      onClick={() => {
        setCurrentReceivableId(row.id)
        onOpenPreviewModal()
      }}
    >
      <TableCellStyled border={false}>{formatDate(row.createdAt)}</TableCellStyled>
      <TableCellStyled>
        <div className={cn('flex flex-col')}>
          <FormLabel className={cn(className)}>{row.financier.name}</FormLabel>
          <FormLabel className={cn(className)}>{maskCNPJ(row.financier.cnpj)}</FormLabel>
        </div>
      </TableCellStyled>
      <TableCellStyled>{row.receivableStatus}</TableCellStyled>
      <TableCellStyled>
        <div className={cn('flex flex-col items-end')}>
          <p className="text-[#58AA3D]">{maskMonetaryValue(row.totalValue)}</p>
          <p hidden={row.installments.length === 0}>
            {row.installments.filter((i) => i.status === InstallmentStatus.PAID).length}
            {'/'}
            {row.installments.length}
          </p>
        </div>
      </TableCellStyled>
    </TableRow>
  )
}

export default ReceivablesRow
