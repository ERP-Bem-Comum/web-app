import { Paginator } from '@/components/layout/paginator'
import { ReportsFilter } from '../../filters/ReportsFilter'
import ReportsRoot from '../common/ReportsRoot'
import { AccountsExportButton } from './AccountsExport'
import AccountsTable from './AccountsTable'
import AccountsValueCard from './AccountsValueCard'
import AccountsCharts from './AccountsCharts'
import { AccountsChartsButton } from './AccountsChartsButton'

const AccountsPosition = {
  Root: ReportsRoot,
  Card: AccountsValueCard,
  Table: AccountsTable,
  Filter: ReportsFilter,
  ExportButton: AccountsExportButton,
  Paginator,
  Charts: AccountsCharts,
  ChartButton: AccountsChartsButton,
}

export default AccountsPosition
