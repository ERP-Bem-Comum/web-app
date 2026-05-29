import { DashboardStatistics, VariationSignal } from '@/types/statistics'
import { maskMonetaryValue } from '@/utils/masks'
import { GiClick } from 'react-icons/gi'
import { FaDonate, FaHandshake } from 'react-icons/fa'
import { FaUsersViewfinder } from 'react-icons/fa6'
import { IconType } from 'react-icons/lib'

type StatisticCardProps = {
  title: string
  total: string
  variation: string
  variationSignal: VariationSignal
  variationLabel: string
  icon: IconType
  iconBgColor: string
}

function mapperStatisticsCards(data: DashboardStatistics): StatisticCardProps[] {
  return [
    {
      title: 'Gastos',
      total: maskMonetaryValue(data.totalExpenses),
      variation: data.expensesVariation,
      variationSignal: data.expensesVariationSignal,
      variationLabel: 'Último mês',
      icon: GiClick,
      iconBgColor: 'bg-gradient-to-r from-[#F53D55] to-[#FF7965]',
    },
    {
      title: 'Arrecadação',
      total: maskMonetaryValue(data.totalRevenue),
      variation: data.revenueVariation,
      variationSignal: data.revenueVariationSignal,
      variationLabel: 'Último mês',
      icon: FaDonate,
      iconBgColor: 'bg-gradient-to-r from-[#2DCE92] to-[#2DCEC0]',
    },
    {
      title: `Top Financiador - ${data.nameTopFinancier}`,
      total: data.totalTopFinanciers,
      variation: data.topFinanciersVariation,
      variationSignal: data.topFinanciersVariationSignal,
      variationLabel: 'Financiador',
      icon: FaHandshake,
      iconBgColor: 'bg-gradient-to-r from-[#7A62E4] to-[#676EE4]',
    },
    {
      title: `Top Centro de Custo - ${data.nameTopCostCenter}`,
      total: maskMonetaryValue(data.totalTopCostCentersExpenses),
      variation: data.topCostCentersVariation,
      variationSignal: data.topCostCentersVariationExpensesSignal,
      variationLabel: 'Centro de Custo',
      icon: FaUsersViewfinder,
      iconBgColor: 'bg-gradient-to-r from-[#FB6D40] to-[#FB9E40]',
    },
  ]
}

export function mapperDashboardStatistics(data: DashboardStatistics) {
  return {
    cards: mapperStatisticsCards(data),
  }
}
