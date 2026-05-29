import { Grid } from '@mui/material'
import AccountsPositionComponents from './components/accountsPosition/Index'
import { useAccountsPosition } from '@/hooks/reports/useAccountsPosition'
import { AccountsPositionType } from '@/types/reports/accountsPosition'
import { HeadCell } from '@/types/global'
import { useDisclosure } from '@/hooks/useDisclosure'

interface AccountsPositionReportProps {
  type: AccountsPositionType
  headCells: HeadCell[]
}

const AccountsPositionReport = ({ type, headCells }: AccountsPositionReportProps) => {
  const { form, isLoading, data } = useAccountsPosition(type)
  const { isOpen: isOpenChart, toggle: chartToggle } = useDisclosure()

  const total = data ? data?.totalAtrasado + data?.totalPago + data?.totalPendente : 0

  return (
    <AccountsPositionComponents.Root>
      <AccountsPositionComponents.Filter
        {...form}
        type={type}
        exportButton={
          <AccountsPositionComponents.ExportButton
            currentParams={form.values}
            type={type}
            isOpenChart={isOpenChart}
          />
        }
        extraSlot={
          <AccountsPositionComponents.ChartButton
            chartToggle={chartToggle}
            isOpenChart={isOpenChart}
          />
        }
        status
        account
      />
      {isOpenChart && data ? (
        <AccountsPositionComponents.Charts data={data} type={type} />
      ) : (
        <>
          <Grid container rowSpacing={2}>
            <AccountsPositionComponents.Card
              title="Atrasado"
              color="red"
              value={data?.totalAtrasado}
            />
            <AccountsPositionComponents.Card
              title={type === 'payable' ? 'Pago' : 'Recebido'}
              color="green"
              value={data?.totalPago}
            />
            <AccountsPositionComponents.Card
              title={type === 'payable' ? 'A pagar' : 'A Receber'}
              color="orange"
              value={data?.totalPendente}
            />
            <AccountsPositionComponents.Card title="Total" color="blue" value={total} />
          </Grid>
          <AccountsPositionComponents.Table
            headCells={headCells}
            isLoading={isLoading}
            data={data}
          />
        </>
      )}
    </AccountsPositionComponents.Root>
  )
}

export default AccountsPositionReport
