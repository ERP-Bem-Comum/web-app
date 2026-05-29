import { ReportsFilter } from '../../filters/ReportsFilter'
import ReportsRoot from '../common/ReportsRoot'
import AnalysisCharts from './AnalysisCharts'
import { analysisExportButton } from './AnalysisExport'
import { AnalysisChartsButton } from './AnalysisChartsButton'
import AnalysisTable from './AnalysisTable'

const AnalysisReportComponents = {
  Root: ReportsRoot,
  Table: AnalysisTable,
  Filter: ReportsFilter,
  ExportButton: analysisExportButton,
  ChartsButton: AnalysisChartsButton,
  Charts: AnalysisCharts,
}

export default AnalysisReportComponents
