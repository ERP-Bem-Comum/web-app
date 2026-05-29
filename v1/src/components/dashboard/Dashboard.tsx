'use client'
import { StatisticCard } from './components/StatisticCard'
import { useGetDashboardStatistics } from '@/services/statistics'
import Loading from '@/app/loading'
import { mapperDashboardStatistics } from './helpers/mapperStatisticsCards'
import MultipleLineChart from '../layout/charts/MultipleLineChart'
import BarChartLabel from '../layout/charts/BarChart'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SeeAllButton } from './components/SeeAllButton'
import SuppliersNoContract from './components/SuppliersNoContract'
import LastPaymentsTable from './components/LastPaymentsTable'
import { useRouter } from 'next/navigation'
import CostCentersBarChart from './components/charts/CostCentersBarChart'
import RealizedExpectedLineChart from './components/charts/RealizedExpectedLineChart'

const Dashboard = () => {
  const { data, isLoading } = useGetDashboardStatistics()

  const router = useRouter()

  if (isLoading) {
    return <Loading />
  }

  if (!data?.data) {
    return null // TODO: handle error
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        {mapperDashboardStatistics(data.data).cards.map(
          ({ icon, iconBgColor, ...values }, index) => (
            <StatisticCard.Root key={index}>
              <StatisticCard.Values {...values} />
              <StatisticCard.IconContainer icon={icon} bgColor={iconBgColor} />
            </StatisticCard.Root>
          ),
        )}
      </div>

      <div className="flex w-full gap-4">
        <div className="flex flex-col w-[60%] gap-4">
          <Card className="w-full">
            <CardHeader className="flex flex-row justify-between mb-10">
              <div>
                <CardTitle className="text-sm text-erp-grayscale mb-[14px]">Visão geral</CardTitle>
                <CardDescription className="text-sm">
                  <span className="text-erp-button-primary-normal">Previsto</span> x{' '}
                  <span className="text-erp-positive">Realizado</span>
                </CardDescription>
              </div>
              <SeeAllButton
                onClick={() => {
                  router.push('/realizado')
                }}
              />
            </CardHeader>
            <CardContent>
              <RealizedExpectedLineChart data={data.data?.chartRealized} />
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardTitle className="px-4 py-2 text-base text-black">
              Últimos pagamentos realizados
            </CardTitle>
            <CardContent className="p-0">
              <LastPaymentsTable rows={data.data.lastPayments} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col w-[40%] gap-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-base text-center text-black">
                Pagamentos por Centro de Custo em %
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CostCentersBarChart data={data.data.barChartCostCenterPayment} />
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg text-black">Fornecedores sem Contrato</CardTitle>
            </CardHeader>
            <CardContent>
              <SuppliersNoContract rows={data.data.noContractSuppliers} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
