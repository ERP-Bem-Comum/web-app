'use client'

import TopPages from '@/components/TopPages'
import BudgetPlanDetail from '@/components/budgetPlan/budgetPlanDetail/BudgetPlanDetail'
import { useGetBudgetPlanById } from '@/services/budgetPlan'
import { useParams } from 'next/navigation'

export default function BudgetPlanDetails() {
  const params = useParams()
  const { data, isLoading } = useGetBudgetPlanById(params?.id)

  return (
    <div className="w-full h-full overflow-auto">
      <TopPages text={'Planejamento > Detalhes'} />
      {!isLoading && <BudgetPlanDetail budget={data?.budgetPlan} />}
    </div>
  )
}
