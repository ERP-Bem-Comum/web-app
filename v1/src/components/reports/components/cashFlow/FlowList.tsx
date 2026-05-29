import { CashFlowSubData } from '@/types/reports/cashFlow'
import { List } from '@mui/material'
import FlowListRow from './FlowListRow'

interface FlowListProps {
  data: CashFlowSubData[]
}

const FlowList = ({ data }: FlowListProps) => {
  return (
    <List
      sx={{
        width: '100%',
        overflowY: 'auto',
        maxHeight: '450px',
        padding: '0',
      }}
      component="nav"
      aria-labelledby="nested-list-subheader"
    >
      {!data || data.length === 0 ? (
        <div className="p-4 text-erp-grayscale text-sm">Nenhum resultado encontrado</div>
      ) : (
        data.map((row, index) => <FlowListRow row={row} key={'list-' + index} />)
      )}
    </List>
  )
}

export default FlowList
