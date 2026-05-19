/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent } from '@/components/ui/card'
import RealizedTable from './components/realized/RealizedTable'
import { RealizedReportsFilter } from './filters/RealizedReportsFilter'
import { useRealized } from '@/hooks/reports/useRealized'
import { LoadingTable } from '@/components/table/loadingTable'
import { RealizedExportButton } from './components/realized/RealizedExportButton'
import { RealizedChartsButton } from './components/realized/RealizedChartsButton'
import { useDisclosure } from '@/hooks/useDisclosure'
import RealizedCharts from './components/realized/RealizedCharts'

export default function RealizedReport() {
  const { form, data, isLoading } = useRealized()
  const { isOpen: isOpenChart, toggle: chartToggle } = useDisclosure()

  if (isLoading) return <LoadingTable />

  return (
    <div className="w-full h-full p-2 bg-[#FEFFFF] rounded">
      <Card className="p-5">
        <RealizedReportsFilter
          {...form}
          values={form.watch()}
          exportButton={
            <RealizedExportButton currentParams={form.values} isOpenChart={isOpenChart} />
          }
          extraSlot={<RealizedChartsButton chartToggle={chartToggle} isOpenChart={isOpenChart} />}
        />
        {isOpenChart && data ? (
          <RealizedCharts data={data} />
        ) : (
          <CardContent className="p-0">
            <RealizedTable reportData={data} year={form.values.year} />
          </CardContent>
        )}
      </Card>
    </div>
  )
}
