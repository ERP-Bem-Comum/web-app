import { useCashFlow } from '@/hooks/reports/useCashFlow'
import CashFlow from './components/cashFlow/Index'
import { useDisclosure } from '@/hooks/useDisclosure'
import { Fragment, useMemo } from 'react'
import { LoadingTable } from '../table/loadingTable'

const CashFlowReport = () => {
  const { isOpen: isOpenGraph, toggle: graphToggle } = useDisclosure()
  const { form, data, chart, isLoading } = useCashFlow()

  const { Receivables, Payables } = data || {}

  const previstoEntradas = useMemo(
    () => Receivables?.reduce((acc, entry) => acc + entry.EXPECTED, 0) ?? 0,
    [Receivables],
  )
  const realizadoEntradas = useMemo(
    () => Receivables?.reduce((acc, entry) => acc + entry.REALIZED, 0) ?? 0,
    [Receivables],
  )
  const previstoSaidas = useMemo(
    () => Payables?.reduce((acc, entry) => acc + entry.EXPECTED, 0) ?? 0,
    [Payables],
  )
  const realizadoSaidas = useMemo(
    () => Payables?.reduce((acc, entry) => acc + entry.REALIZED, 0) ?? 0,
    [Payables],
  )

  return (
    <CashFlow.Root>
      <CashFlow.Filter
        {...form}
        exportButton={
          <CashFlow.ExportButton currentParams={form.values} isOpenChart={isOpenGraph} />
        }
        extraSlot={<CashFlow.GraphButton graphToggle={graphToggle} isOpenGraph={isOpenGraph} />}
        status
        account
      />
      {!isOpenGraph ? (
        isLoading ? (
          <LoadingTable />
        ) : (
          <Fragment>
            <CashFlow.Container>
              <CashFlow.Header title="ENTRADAS" />
              <CashFlow.List data={Receivables ?? []} />
              <CashFlow.Footer previsto={previstoEntradas} realizado={realizadoEntradas} />
            </CashFlow.Container>
            <CashFlow.Container>
              <CashFlow.Header title="SAÍDAS" />
              <CashFlow.List data={Payables ?? []} />
              <CashFlow.Footer previsto={previstoSaidas} realizado={realizadoSaidas} />
            </CashFlow.Container>
            <CashFlow.Totals
              previsto={previstoEntradas + previstoSaidas}
              realizado={realizadoEntradas + realizadoSaidas}
            />
          </Fragment>
        )
      ) : (
        <CashFlow.Container id="chart-pdf-export-container" className="flex flex-col gap-4">
          <CashFlow.Chart data={chart.data} />
          <CashFlow.CostCentersBarChart Receivables={Receivables} Payables={Payables} />
          <CashFlow.PieChart Receivables={Receivables} Payables={Payables} />
        </CashFlow.Container>
      )}
    </CashFlow.Root>
  )
}

export default CashFlowReport
