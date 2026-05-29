import AnalysisReportComponents from './components/analysis/Index'
import Loading from '@/app/loading'
import { useAnalysis } from '@/hooks/reports/useAnalysis'
import { headCellsAnalysisReport } from './components/analysis/consts'
import { AccountsPositionType } from '@/types/reports/accountsPosition'
import { useDisclosure } from '@/hooks/useDisclosure'
import { LoadingTable } from '../table/loadingTable'

const AnalysisReport = ({ type }: { type: AccountsPositionType }) => {
  const { form, isLoading, data } = useAnalysis(type)
  const { isOpen: isOpenChart, toggle: chartToggle } = useDisclosure()

  if (isLoading || !data) {
    return <LoadingTable />
  }

  return (
    <AnalysisReportComponents.Root>
      <AnalysisReportComponents.Filter
        {...form}
        values={form.watch()}
        exportButton={
          <AnalysisReportComponents.ExportButton
            currentParams={form.values}
            type={type}
            isOpenChart={isOpenChart}
          />
        }
        extraSlot={
          <AnalysisReportComponents.ChartsButton
            chartToggle={chartToggle}
            isOpenChart={isOpenChart}
          />
        }
        program
        account
        status
      />
      {isOpenChart ? (
        <AnalysisReportComponents.Charts data={data} type={type} />
      ) : (
        <AnalysisReportComponents.Table
          headCells={headCellsAnalysisReport}
          isLoading={isLoading}
          data={data}
        />
      )}
    </AnalysisReportComponents.Root>
  )
}

export default AnalysisReport
