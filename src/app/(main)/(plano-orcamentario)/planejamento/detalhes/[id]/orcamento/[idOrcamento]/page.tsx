'use client'

import BudgetDetail from '@/components/budgetPlan/budget/BudgetDetail'
import TopPages from '@/components/TopPages'
import { useGetBudgetById } from '@/services/budget'
import { useGetBudgetPlanById } from '@/services/budgetPlan'
import { useGetProgramById } from '@/services/programs'
import { useParams } from 'next/navigation'
import Loading from './loading'

export default function BudgetDetails() {
  const params = useParams()
  const { data: dataBudgetPlan } = useGetBudgetPlanById(params?.id)
  const { data: dataBudget } = useGetBudgetById(params?.idOrcamento)
  const { data: dataProgram } = useGetProgramById(dataBudgetPlan?.budgetPlan?.programId)

  return (
    <div className="w-full h-full overflow-auto">
      <TopPages text={'Planejamento > Detalhes > Orçamento'} />
      {!dataBudgetPlan?.budgetPlan && !dataBudget?.budget && !dataProgram?.program ? (
        <Loading />
      ) : (
        <BudgetDetail
          budgetPlan={dataBudgetPlan?.budgetPlan}
          budget={dataBudget?.budget}
          program={dataProgram?.program}
        />
      )}
    </div>
  )
}
