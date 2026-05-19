import { Checkbox, FormLabel, TableRow } from '@mui/material'
import { formatDate } from '@/utils/dates'
import { maskMonetaryValue } from '@/utils/masks'
import { DebtorType } from '@/enums/payables'
import { cn } from 'lib/utils'
import { PayableRow } from '@/types/Payables'
import TableCellStyled from '@/components/table/TableCellStyled'
import { useEffect, useState } from 'react'
import { InstallmentStatus, InstallmentType } from '@/enums/installments'

interface PayablesRowProps {
  row: PayableRow
  index: number
  setCurrentPayableId: (id: number) => void
  onOpenPreviewModal: () => void
  onSelect: (id: number, isSelected: boolean) => void
  isSelected: boolean
  isApprovalRow?: boolean
}

const PayablesRow = ({
  row,
  index,
  setCurrentPayableId,
  onOpenPreviewModal,
  onSelect,
  isSelected,
  isApprovalRow = false,
}: PayablesRowProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSelected2, setIsSelected] = useState(false)

  const labelId = `enhanced-table-checkbox-${index}`
  const className = 'cursor-pointer'
  const handleClick = () => {
    setCurrentPayableId(row.id)
    onOpenPreviewModal()
  }

  const handleSelection = () => {
    const newIsSelected = !isSelected
    const id = isApprovalRow ? row.approvals[0].id : row.id
    onSelect(id, newIsSelected)
    setIsSelected(newIsSelected)
  }

  useEffect(() => {
    setIsSelected(false)
  }, [row.id])

  return (
    <TableRow id={'payable' + row.id} key={labelId} tabIndex={-1} className="hover:bg-[#F6FAFB]">
      <TableCellStyled border={false}>
        <Checkbox onChange={handleSelection} checked={isSelected} />
      </TableCellStyled>
      <TableCellStyled onClick={handleClick}>{formatDate(row.createdAt)}</TableCellStyled>
      <TableCellStyled onClick={handleClick}>
        {row.competenceDate ? formatDate(row.competenceDate) : 'Sem competência'}
      </TableCellStyled>
      <TableCellStyled onClick={handleClick}>
        <FormLabel className={cn(className)}>
          {row?.debtorType === DebtorType.SUPPLIER ? row.supplier?.name : row.collaborator?.name}
        </FormLabel>
        <div className="flex gap-5">
          <label
            className={cn(
              className,
              ' w-fit whitespace-nowrap text-xs p-1 px-2 rounded-md bg-[#A1E5FA]',
            )}
          >
            {row.paymentType}
          </label>
          <FormLabel
            className={cn(className, 'whitespace-nowrap text-xs p-1 rounded-md bg-[#EBF9FE]')}
            hidden={!row.contract?.contractCode}
          >
            {row.contract?.contractCode}
          </FormLabel>
        </div>
      </TableCellStyled>
      <TableCellStyled onClick={handleClick}>{row.obs}</TableCellStyled>
      <TableCellStyled onClick={handleClick}>
        <div className="flex flex-col">
          <FormLabel className={cn(className)}>{row.categorization?.costCenter?.name}</FormLabel>
          <FormLabel className={cn(className)}>
            {row.categorization?.costCenterCategory?.name}
            {' > '}
            {row.categorization?.costCenterSubCategory?.name}
          </FormLabel>
        </div>
      </TableCellStyled>
      <TableCellStyled onClick={handleClick}>{row.payableStatus}</TableCellStyled>
      <TableCellStyled onClick={handleClick}>
        <div className={cn('flex flex-col items-end min-w-fit')}>
          <p className="text-[#D13C3C] min-w-fit whitespace-nowrap">
            {maskMonetaryValue(row.totalValue * -1)}
          </p>
          <p hidden={row.installments.length === 0}>
            {
              row.installments.filter(
                (i) => i.status === InstallmentStatus.PAID && i.type === InstallmentType.LIQUID,
              ).length
            }
            {'/'}
            {row.installments.filter((i) => i.type === InstallmentType.LIQUID).length}
          </p>
        </div>
      </TableCellStyled>
    </TableRow>
  )
}

export { PayablesRow }
