import { saveAs } from 'file-saver'
import { ExportButtonReports } from '../ExportButtonRelatory'
import { filterReportParams } from '@/types/reports/filters'
import { getAnalysisCSV, getAnalysisPDF } from '@/services/reports'
import { AccountsPositionType } from '@/types/reports/accountsPosition'
import { exportChartPDF } from '@/utils/export-pdf'

interface analysisExportButtonProps {
  currentParams: filterReportParams
  type: AccountsPositionType
  isOpenChart?: boolean
}

const analysisExportButton = ({ isOpenChart, currentParams, type }: analysisExportButtonProps) => {
  const fileNames = {
    payable: 'contas_pagar',
    receivable: 'contas_receber',
  }

  const handleExportCSV = async () => {
    const resp = await getAnalysisCSV(currentParams, type)
    if (resp.data) {
      saveAs(resp?.data, `analise-${fileNames[type]}.csv`)
    }
  }

  const handleExportPDF = async () => {
    const resp = await getAnalysisPDF(currentParams, type)
    if (resp.data) {
      saveAs(resp?.data, `analise-${fileNames[type]}.pdf`)
    }
  }

  const handleExportPDFGraph = () => {
    exportChartPDF(`grafico-${fileNames[type]}`)
  }

  return (
    <ExportButtonReports
      handleExportCSV={handleExportCSV}
      handleExportPDF={isOpenChart ? handleExportPDFGraph : handleExportPDF}
    />
  )
}

export { analysisExportButton }
