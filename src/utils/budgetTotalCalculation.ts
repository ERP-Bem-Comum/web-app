/**
 * Função utilitária para calcular totais de planos orçamentários e consolidados
 * Garante consistência e previne valores inválidos (NaN, Infinity)
 */

export const calculateBudgetTotal = (budgetData: any): number => {
  let total = 0
  
  if (budgetData?.costCenters) {
    budgetData.costCenters.forEach((costCenter: any) => {
      costCenter?.categories?.forEach((category: any) => {
        category?.months?.forEach((month: any) => {
          const value = Number(month?.valueInCents || 0)
          // Validar que o valor é um número válido e finito
          if (!isNaN(value) && isFinite(value)) {
            total += value
          }
        })
      })
    })
  }
  
  return total
}

/**
 * Calcula o total de um mês específico em um plano orçamentário ou consolidado
 */
export const calculateMonthTotal = (budgetData: any, month: number): number => {
  let total = 0
  
  if (budgetData?.costCenters) {
    budgetData.costCenters.forEach((costCenter: any) => {
      if (costCenter?.categories) {
        costCenter.categories.forEach((category: any) => {
          if (category?.months) {
            const monthData = category.months.find((m: any) => m.month === month)
            if (monthData) {
              const value = Number(monthData.valueInCents || 0)
              if (!isNaN(value) && isFinite(value)) {
                total += value
              }
            }
          }
        })
      }
    })
  }
  
  return total
}

/**
 * Valida e retorna um valor monetário seguro
 * Previne valores inválidos (NaN, Infinity, strings concatenadas)
 */
export const validateMoneyValue = (value: any): number => {
  const numValue = Number(value || 0)
  return !isNaN(numValue) && isFinite(numValue) ? numValue : 0
}

