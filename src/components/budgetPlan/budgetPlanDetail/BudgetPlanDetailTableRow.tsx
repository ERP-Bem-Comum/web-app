import TableCellStyled from '@/components/table/TableCellStyled'
import { Button } from '@/components/ui/button'
import { TableRow } from '@mui/material'
import { Fragment, useState } from 'react'
import { MdOutlineExpandLess, MdOutlineExpandMore } from 'react-icons/md'
import BudgetPlanDetailTableRowSub from './ButgetPlanDetailTableRowSub'

interface Data {
  id: number
  name: string
  type: string
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
  isForMonth: boolean
  page: number
}

interface Budget {
  id: number
  valueInCents: number
}

export default function BudgetPlanDetailTableRow({ row, headCells, isForMonth, page }: Params) {
  const [openSub, setOpenSub] = useState(false)

  const labelId = `enhanced-table-checkbox-${row?.id}`

  const getTotalValue = (cellId: number) => {
    let total = 0
    row.categories?.forEach((category) => {
      let find
      if (isForMonth) {
        find = category?.months?.find((month: any) => month.month === cellId)
      } else {
        find = category?.budgets?.find((budget: Budget) => budget.id === cellId)
      }
      total += Number(find?.valueInCents)
    })

    return total / 100
  }

  const getRows = () => {
    return headCells.map((cell, index) => {
      if (index !== 0) {
        return (
          <TableCellStyled key={cell?.id} border={true}>
            {getTotalValue(Number(cell?.id)).toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            })}
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
              {`${row?.name} ${row.type ? ' - '.concat(row.type) : ''}`}
              <div className="text-xs">
                {(row?.valueInCents / 100).toLocaleString('pt-br', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </div>
            </div>
          </div>
        </TableCellStyled>
        {getRows()}
      </TableRow>
      {openSub &&
        row?.categories?.map((category) => (
          <BudgetPlanDetailTableRowSub
            key={category?.id}
            row={category}
            isForMonth={isForMonth}
            page={page}
          />
        ))}
    </Fragment>
  )
}
