import { Grid } from '@mui/material'
import { Fragment } from 'react'
import { maskMonetaryValue } from '@/utils/masks'
import { defaultFields } from '@/types/reports/accountsPosition'
import GridCell from '@/components/List/GridCell'
import ColumnWithToggle from '../common/ColumnWithToggle'

interface Params<T extends defaultFields> {
  row: T
  onClick: (id: number | string) => void
  isOpen?: boolean
  isChild?: boolean
  toggleIcon?: boolean
}

export function AccountsTableRow<T extends defaultFields>({
  row,
  onClick,
  isOpen = true,
  isChild = false,
  toggleIcon = true,
}: Params<T>) {
  const labelId = `account-table-${row.id}`

  const total = maskMonetaryValue(row.totalAtrasado + row.totalPago + row.totalPendente)

  return (
    <Fragment>
      <Grid
        key={labelId}
        container
        tabIndex={-1}
        className={`hover:bg-[#F6FAFB] bg-[${isChild ? '#EBF9FE' : 'transparent'}] w-full flex`}
        onClick={() => onClick(row.id)}
      >
        <GridCell className="flex">
          <ColumnWithToggle isOpen={isOpen} toggleIcon={toggleIcon}>
            <span>{row.name}</span>
            <span>{total}</span>
          </ColumnWithToggle>
        </GridCell>
        <GridCell border>{maskMonetaryValue(row.totalAtrasado)}</GridCell>
        <GridCell border>{maskMonetaryValue(row.totalPago)}</GridCell>
        <GridCell border>{maskMonetaryValue(row.totalPendente)}</GridCell>
      </Grid>
    </Fragment>
  )
}

export default AccountsTableRow
