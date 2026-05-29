import { useGeneralReport } from '@/hooks/reports/useGeneralReport'
import GeneralReportComponents from './components/generalReport/Index'
import { headCellsGeneralReport } from './components/generalReport/const'
import { DISPONIBLE_COLUMNS } from '@/enums/generalReport'

const GeneralReport = () => {
  const { form, isLoading, data, meta } = useGeneralReport()
  return (
    <GeneralReportComponents.Root>
      <GeneralReportComponents.Filter
        {...form}
        values={form.watch()}
        program
        account
        reportType
        extraSlot={
          <GeneralReportComponents.ColumnsButton setValue={form.setValue} values={form.values} />
        }
        exportButton={<GeneralReportComponents.ExportButton currentParams={form.values} />}
      />
      <GeneralReportComponents.Table
        headCells={headCellsGeneralReport.filter((i) =>
          form.values.columns?.includes(i.id as keyof typeof DISPONIBLE_COLUMNS),
        )}
        isLoading={isLoading}
        data={data ?? []}
        meta={meta}
        setValueForPagination={form.setValue}
        visibleColumns={
          headCellsGeneralReport
            .filter((i) => form.values.columns?.includes(i.id as keyof typeof DISPONIBLE_COLUMNS))
            .map((i) => i.id) as Array<keyof typeof DISPONIBLE_COLUMNS>
        }
      />
    </GeneralReportComponents.Root>
  )
}

export default GeneralReport
