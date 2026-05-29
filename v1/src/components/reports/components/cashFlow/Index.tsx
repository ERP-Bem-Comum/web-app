import { Paginator } from '@/components/layout/paginator'
import { ReportsFilter } from '../../filters/ReportsFilter'
import ReportsRoot from '../common/ReportsRoot'
import FlowChartData from './FlowChart'
import { FlowExportButton } from './FlowExport'
import { FlowGraphButton } from './FlowGraphButton'
import FlowList from './FlowList'
import FlowListContainer from './FlowListContainer'
import FlowListFooter from './FlowListFooter'
import FlowListHeader from './FlowListHeader'
import FlowTotals from './FlowTotals'
import FlowCostCentersBarChart from './FlowCostCentersBarChart'
import FlowPieChart from './FlowPieChart'

const CashFlow = {
  Filter: ReportsFilter,
  Root: ReportsRoot,
  Header: FlowListHeader,
  Footer: FlowListFooter,
  Totals: FlowTotals,
  List: FlowList,
  Container: FlowListContainer,
  ExportButton: FlowExportButton,
  GraphButton: FlowGraphButton,
  Chart: FlowChartData,
  CostCentersBarChart: FlowCostCentersBarChart,
  PieChart: FlowPieChart,
  Paginator,
}

export default CashFlow
