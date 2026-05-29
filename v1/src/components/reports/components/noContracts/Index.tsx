import { Paginator } from '@/components/layout/paginator'
import { ReportsFilter } from '../../filters/ReportsFilter'
import ReportsRoot from '../common/ReportsRoot'
import { noContractsExportButton } from './NoContractsExport'
import NoContractsTable from './NoContractsTable'

const NoContractsReportComponents = {
  Root: ReportsRoot,
  Table: NoContractsTable,
  Filter: ReportsFilter,
  ExportButton: noContractsExportButton,
  Paginator,
}

export default NoContractsReportComponents
