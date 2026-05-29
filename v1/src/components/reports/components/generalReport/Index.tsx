import { ReportsFilter } from '../../filters/ReportsFilter'
import ReportsRoot from '../common/ReportsRoot'
import { GeneralExportButton } from './GeneralExport'
import GeneralReportTable from './GeneralReportTable'
import { SelectColumnsMenu } from './SelectColumnsMenu'

const GeneralReportComponents = {
  Root: ReportsRoot,
  Table: GeneralReportTable,
  Filter: ReportsFilter,
  ColumnsButton: SelectColumnsMenu,
  ExportButton: GeneralExportButton,
}

export default GeneralReportComponents
