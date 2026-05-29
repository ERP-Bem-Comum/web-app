import TableCellStyled from '@/components/table/TableCellStyled'
import { TableRow } from '@mui/material'
import { Fragment } from 'react'

interface Data {
  id: number
  name: string
  budgets?: any[]
  valueInCents: number
  months?: any[]
}

interface Params {
  row: Data
  isForMonth: boolean
  page: number
}

export default function BudgetPlanDetailTableRowSub({ row, isForMonth, page }: Params) {
  const getMonthRows = () => {
    let monthRows
    if (page === 1) {
      monthRows = row.months?.slice(0, 6)
    } else {
      monthRows = row.months?.slice(6, 12)
    }

    return monthRows
  }

  return (
    <Fragment>
      <TableRow
        sx={{
          backgroundColor: '#EBF9FE',
          boxShadow: '0px 4px 10px 0px #D0F4FF inset',
          height: 87,
        }}
      >
        <TableCellStyled border={false}>
          <div className="ml-10">
            {row?.name}
            <div className="text-xs">
              {(row?.valueInCents / 100)?.toLocaleString('pt-br', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>
        </TableCellStyled>
        {isForMonth
          ? getMonthRows()?.map((month) => (
              <TableCellStyled key={month.month} border={true}>
                {(month?.valueInCents / 100).toLocaleString('pt-br', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </TableCellStyled>
            ))
          : row?.budgets?.map((budget) => (
              <TableCellStyled key={budget.id} border={true}>
                {(budget?.valueInCents / 100).toLocaleString('pt-br', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </TableCellStyled>
            ))}
      </TableRow>
    </Fragment>
  )
}
