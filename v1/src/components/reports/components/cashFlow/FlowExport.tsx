import { saveAs } from 'file-saver'
import { ExportButtonReports } from '../ExportButtonRelatory'
import { filterReportParams } from '@/types/reports/filters'
import { getCashFlowCSV, getCashFlowPDF } from '@/services/reports'
import { exportChartPDF } from '@/utils/export-pdf'

interface FlowExportButtonProps {
  currentParams: filterReportParams
  isOpenChart?: boolean
}

const FlowExportButton = ({ currentParams, isOpenChart }: FlowExportButtonProps) => {
  const handleExportCSV = async () => {
    const resp = await getCashFlowCSV(currentParams)
    if (resp.data) {
      saveAs(resp.data, 'fluxo_caixa.csv')
    }
  }

  const handleExportPDF = async () => {
    const resp = await getCashFlowPDF(currentParams)
    if (resp.data) {
      saveAs(resp.data, 'fluxo_caixa.pdf')
    }
  }

  const handleExportPDFGraph = () => {
    exportChartPDF('grafico_fluxo_caixa')
  }

  return (
    <ExportButtonReports
      handleExportCSV={handleExportCSV}
      handleExportPDF={isOpenChart ? handleExportPDFGraph : handleExportPDF}
    />
  )
}

export { FlowExportButton }
