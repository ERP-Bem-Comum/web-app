import TopPages from '@/components/TopPages'
import BudgetPlanTable from '@/components/budgetPlan/BudgetPlanTable'

export default function Budgets() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text={'Planejamento'} />
      <BudgetPlanTable />
    </div>
  )
}
