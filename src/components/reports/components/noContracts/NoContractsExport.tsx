import { saveBlob } from '@/utils/saveBlob'
import { ExportButtonReports } from '../ExportButtonRelatory'
import { filterReportParams } from '@/types/reports/filters'
import { getNoContractsCSV, getNoContractsPDF } from '@/services/reports'

interface noContractsExportButtonProps {
  currentParams: filterReportParams
}

const noContractsExportButton = ({ currentParams }: noContractsExportButtonProps) => {
  const handleExportCSV = async () => {
    const resp = await getNoContractsCSV(currentParams)
    if (resp.data) {
      saveBlob(resp.data, 'sem_contratos.csv')
    }
  }

  const handleExportPDF = async () => {
    const resp = await getNoContractsPDF(currentParams)
    if (resp.data) {
      saveBlob(resp.data, 'sem_contratos.pdf')
    }
  }

  return <ExportButtonReports handleExportCSV={handleExportCSV} handleExportPDF={handleExportPDF} />
}

export { noContractsExportButton }
