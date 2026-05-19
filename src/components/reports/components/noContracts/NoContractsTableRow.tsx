import { Grid } from '@mui/material'
import { maskMonetaryValue } from '@/utils/masks'
import GridCell from '@/components/List/GridCell'
import ColumnWithToggle from '../common/ColumnWithToggle'
import { NoContractsBudgetPlan } from '@/types/reports/noContracts'

interface Params<T extends NoContractsBudgetPlan> {
  row: T
  onClick?: (id: number | string) => void
  limit: number
  isOpen?: boolean
  isChild?: boolean
  toggleIcon?: boolean
}

export function NoContractsTableRow<T extends NoContractsBudgetPlan>({
  row,
  limit,
  onClick,
  isOpen = true,
  isChild = false,
  toggleIcon = true,
}: Params<T>) {
  const labelId = `account-table-${row.id}`

  const percentageFormatter = new Intl.NumberFormat('pt-br', {
    style: 'percent',
    minimumFractionDigits: 2,
    minimumIntegerDigits: 2,
  })
  const maskedTotal = maskMonetaryValue(row.total)
  const maskedLimit = maskMonetaryValue(limit)
  return (
    <Grid
      key={labelId}
      container
      tabIndex={-1}
      className={`hover:bg-[#F6FAFB]  w-full flex`}
      bgcolor={
        isChild
          ? '#EBF9FE'
          : row.total > limit
            ? '#E18282'
            : maskedTotal === maskedLimit
              ? '#C7C8C2'
              : 'white'
      }
      onClick={() => onClick && onClick(row.id)}
    >
      <GridCell className="flex" size={18 / 4}>
        <ColumnWithToggle isOpen={isOpen} toggleIcon={toggleIcon}>
          <span>{row.name}</span>
        </ColumnWithToggle>
      </GridCell>
      <GridCell border size={10 / 4}>
        {maskMonetaryValue(row.total)}
      </GridCell>
      <GridCell border size={10 / 4}>
        {percentageFormatter.format(row.total / limit)}
      </GridCell>
      <GridCell border size={10 / 4}>
        {maskMonetaryValue(limit - row.total)}
      </GridCell>
    </Grid>
  )
}

export default NoContractsTableRow
