import { TableRow, TableCell } from '@mui/material'
import { maskMonetaryValue } from '@/utils/masks'
import { AnalysisCostCenter } from '@/types/reports/analysis'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Fragment } from 'react'

interface Params<T extends AnalysisCostCenter> {
  row: T
  onClick?: (id: number | string) => void
  isOpen?: boolean
  isChild?: boolean
  toggleIcon?: boolean
}

export function AnalysisTableRow<T extends AnalysisCostCenter>({
  row,
  onClick,
  isOpen = false,
  isChild = false,
  toggleIcon = true,
}: Params<T>) {
  const labelId = `account-table-${row.id}`

  return (
    <TableRow
      key={labelId}
      tabIndex={-1}
      sx={{
        backgroundColor: isChild ? '#EBF9FE' : 'white',
        '&:hover': { backgroundColor: '#F6FAFB' },
      }}
      onClick={() => onClick && onClick(row.id)}
    >
      <Fragment>
        <TableCell component="th" scope="row">
          <div className="flex items-center flex-nowrap">
            <div className="flex justify-center items-center p-1 border-r-2">
              {toggleIcon && (isOpen ? <ChevronUp /> : <ChevronDown />)}
            </div>
            <div className="flex flex-col px-3 w-full h-full">
              <span className="whitespace-nowrap">{row.name}</span>
            </div>
          </div>
        </TableCell>
        <TableCell align="left">{maskMonetaryValue(row.total)}</TableCell>
        {row.itens.map((item, index) => (
          <TableCell key={index} align="left">
            {maskMonetaryValue(item.total)}
          </TableCell>
        ))}
      </Fragment>
    </TableRow>
  )
}

export default AnalysisTableRow
