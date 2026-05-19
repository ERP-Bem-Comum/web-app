import { TableRow } from '@mui/material'
import { MdOutlineExpandLess, MdOutlineExpandMore } from 'react-icons/md'
import { Fragment, useState } from 'react'
import { formatCentsToCurrency } from '@/utils/formatCurrency'
import TableCellStyled from '@/components/table/TableCellStyled'
import { Button } from '@/components/ui/button'
import ConsolidatedTableRowSub from './ConsolidatedTableRowSub'

interface Data {
  id: number
  name: string
  categories: any[]
  valueInCents: number
}

interface HeadCell {
  id: string
  label: string
  align: any
}

interface Params {
  row: Data
  headCells: HeadCell[]
  page: number
}

interface Budget {
  id: number
  valueInCents: number
}

export default function ConsolidatedTableRow({ row, headCells, page }: Params) {
  const [openSub, setOpenSub] = useState(false)

  const labelId = `enhanced-table-checkbox-${row?.id}`

  const getTotalValue = (cellId: number) => {
    let total = 0
    
    if (row.categories) {
      row.categories.forEach((category) => {
        if (category?.months) {
          // Encontrar o mês correto pelo número do mês
          const monthData = category.months.find((month: any) => month.month === cellId)
          if (monthData) {
            total += Number(monthData.valueInCents || 0)
          }
        }
      })
    }

    return total
  }

  const getRows = () => {
    return headCells.map((cell, index) => {
      if (index !== 0) {
        return (
          <TableCellStyled key={cell?.id} border={true}>
            {formatCentsToCurrency(getTotalValue(Number(cell?.id)))}
          </TableCellStyled>
        )
      }
      return null
    })
  }

  return (
    <Fragment>
      <TableRow key={labelId} tabIndex={-1} className="hover:bg-[#F6FAFB]">
        <TableCellStyled border={false}>
          <div className="flex items-center">
            {row?.categories?.length > 0 && (
              <Button
                variant="ghost"
                data-test={`openSub-${row.id}`}
                size="icon"
                onClick={(e) => {
                  setOpenSub(!openSub)
                  e.stopPropagation()
                }}
              >
                {openSub ? <MdOutlineExpandLess size={24} /> : <MdOutlineExpandMore size={24} />}
              </Button>
            )}{' '}
            <div>
              {row?.name}
              <div className="text-xs">
                {formatCentsToCurrency(row?.valueInCents || 0)}
              </div>
            </div>
          </div>
        </TableCellStyled>
        {getRows()}
      </TableRow>
      {openSub &&
        row?.categories?.map((category) => (
          <ConsolidatedTableRowSub key={category?.id} row={category} page={page} />
        ))}
    </Fragment>
  )
}
