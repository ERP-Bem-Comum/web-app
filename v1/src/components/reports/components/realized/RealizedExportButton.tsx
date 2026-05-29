import { saveAs } from 'file-saver'
import { ExportButtonReports } from '../ExportButtonRelatory'
import { getRealizedReportCSV, getRealizedReportPDF } from '@/services/reports'
import { FilterRealizedReportParams } from '@/types/reports/realized'
import { exportChartPDF } from '@/utils/export-pdf'

interface RealizedExportButtonProps {
  currentParams: FilterRealizedReportParams
  isOpenChart?: boolean
}

const RealizedExportButton = ({ currentParams, isOpenChart }: RealizedExportButtonProps) => {
  const handleExportCSV = async () => {
    const resp = await getRealizedReportCSV(currentParams)
    if (resp.data) {
      saveAs(resp.data, 'realizado_x_planejado.csv')
    }
  }

  const handleExportPDF = async () => {
    const resp = await getRealizedReportPDF(currentParams)
    if (resp.data) {
      saveAs(resp.data, 'realizado_x_planejado.pdf')
    }
  }

  const handleExportPDFGraph = () => {
    exportChartPDF('grafico_realizado_planejado')
  }

  return (
    <ExportButtonReports
      handleExportCSV={handleExportCSV}
      handleExportPDF={isOpenChart ? handleExportPDFGraph : handleExportPDF}
    />
  )
}

export { RealizedExportButton }
