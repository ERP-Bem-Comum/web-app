import { saveBlob } from '@/utils/saveBlob'
import { ExportButtonReports } from '../ExportButtonRelatory'
import { filterReportParamsWithColumns } from '@/types/reports/filters'
import { getGeneralsCSV, getGeneralsPDF } from '@/services/reports'

interface GeneralExportButtonProps {
  currentParams: filterReportParamsWithColumns
}

const GeneralExportButton = ({ currentParams }: GeneralExportButtonProps) => {
  const handleExportCSV = async () => {
    const resp = await getGeneralsCSV(currentParams)
    if (resp.data) {
      saveBlob(resp.data, 'relatorio_geral.csv')
    }
  }

  const handleExportPDF = async () => {
    const resp = await getGeneralsPDF(currentParams)
    if (resp.data) {
      saveBlob(resp.data, 'relatorio_geral.pdf')
    }
  }
  return <ExportButtonReports handleExportCSV={handleExportCSV} handleExportPDF={handleExportPDF} />
}

export { GeneralExportButton }
