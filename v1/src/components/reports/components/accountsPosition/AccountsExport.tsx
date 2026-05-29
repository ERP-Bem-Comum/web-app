import { saveAs } from 'file-saver'
import { ExportButtonReports } from '../ExportButtonRelatory'
import { filterReportParams } from '@/types/reports/filters'
import { getPositionCSV, getPositionPDF } from '@/services/reports'
import { AccountsPositionType } from '@/types/reports/accountsPosition'
import { exportChartPDF } from '@/utils/export-pdf'

interface AccountsExportButtonProps {
  currentParams: filterReportParams
  type: AccountsPositionType
  isOpenChart?: boolean
}

const AccountsExportButton = ({ currentParams, type, isOpenChart }: AccountsExportButtonProps) => {
  const filename = type === 'receivable' ? 'contas_receber' : 'contas_pagar'

  const handleExportCSV = async () => {
    const resp = await getPositionCSV(currentParams, type)
    if (resp.data) {
      saveAs(resp.data, resp.data.name)
    }
  }

  const handleExportPDF = async () => {
    const resp = await getPositionPDF(currentParams, type)
    if (resp.data) {
      saveAs(resp.data, `posicao-${filename}.pdf`)
    }
  }

  const handleExportPDFGraph = () => {
    exportChartPDF('grafico_' + filename)
  }

  return (
    <ExportButtonReports
      handleExportCSV={handleExportCSV}
      handleExportPDF={isOpenChart ? handleExportPDFGraph : handleExportPDF}
    />
  )
}

export { AccountsExportButton }
