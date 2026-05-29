import { CashFlowSubData } from '@/types/reports/cashFlow'
import { maskMonetaryValue } from '@/utils/masks'

interface FlowListRowProps {
  row: CashFlowSubData
}

const FlowListRow = ({ row }: FlowListRowProps) => {
  const getColor = (value: number) => {
    if (value < 0) {
      return '#FF3B30'
    }

    return '#000'
  }

  return (
    <div className={`flex w-full p-5 bg-white items-center justify-center`}>
      <section className="flex p-2 w-full items-center justify-between">
        <ItemDescription row={row} />
        <span className="min-w-max" style={{ color: getColor(row.REALIZED) }}>
          {maskMonetaryValue(row.REALIZED)}
        </span>
      </section>
      <section className="flex p-2 w-full items-center justify-between">
        <ItemDescription row={row} />
        <span className="min-w-max" style={{ color: getColor(row.EXPECTED) }}>
          {maskMonetaryValue(row.EXPECTED)}
        </span>
      </section>
    </div>
  )
}

const ItemDescription = ({ row }: FlowListRowProps) => {
  return (
    <label>
      {row.Category_name || 'Não classificado'}
      {' > '}
      {row.SubCategory_name || 'Não classificado'}
    </label>
  )
}

export default FlowListRow
