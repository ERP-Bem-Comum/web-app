import TableCellStyled from '@/components/table/TableCellStyled'
import { TableRow } from '@mui/material'
import { Fragment } from 'react'
import { formatCentsToCurrency } from '@/utils/formatCurrency'

interface Data {
  id: number
  name: string
  budgets?: any[]
  valueInCents: number
  months?: any[]
}

interface Params {
  row: Data
  page: number
}

export default function ConsolidatedTableRowSub({ row, page }: Params) {
  const getMonthRows = () => {
    let monthRows
    if (page === 1) {
      // Filtrar meses 1-6
      monthRows = row.months?.filter((month: any) => month.month >= 1 && month.month <= 6)
    } else {
      // Filtrar meses 7-12
      monthRows = row.months?.filter((month: any) => month.month >= 7 && month.month <= 12)
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
              {formatCentsToCurrency(row?.valueInCents || 0)}
            </div>
          </div>
        </TableCellStyled>
        {getMonthRows()?.sort((a: any, b: any) => a.month - b.month).map((month) => (
          <TableCellStyled key={month.month} border={true}>
            {formatCentsToCurrency(month?.valueInCents || 0)}
          </TableCellStyled>
        ))}
      </TableRow>
    </Fragment>
  )
}
