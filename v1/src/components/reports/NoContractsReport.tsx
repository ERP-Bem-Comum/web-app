import NoContractsReportComponents from './components/noContracts/Index'
import { useNoContracts } from '@/hooks/reports/useNoContracts'
import { headCellsNoContractsReport } from './components/noContracts/consts'
import { useState } from 'react'

const NoContractsReport = () => {
  const { form, isLoading, data } = useNoContracts()
  const [limit, setLimit] = useState(10000)

  return (
    <NoContractsReportComponents.Root>
      <NoContractsReportComponents.Filter
        {...form}
        exportButton={<NoContractsReportComponents.ExportButton currentParams={form.values} />}
        program
        limit
        currentLimit={limit}
        setLimit={setLimit}
      />
      <NoContractsReportComponents.Table
        headCells={headCellsNoContractsReport}
        isLoading={isLoading}
        data={data}
        currentLimit={limit}
      />
    </NoContractsReportComponents.Root>
  )
}

export default NoContractsReport
