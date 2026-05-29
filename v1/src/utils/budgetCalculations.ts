/**
 * Função utilitária para calcular totais de planos orçamentários
 * Garante consistência entre planos normais e calibrados
 * Usa a mesma lógica da tabela principal (calculateRealTotal)
 */
export const calculateTotalFromBudgetData = (data: any, isForMonth: number): number => {
  let total = 0
  
  // Debug: Log da estrutura de dados
  console.log('calculateTotalFromBudgetData - data structure:', {
    hasCostCenters: !!data?.costCenters,
    hasItems: !!data?.items,
    costCentersLength: data?.costCenters?.length || 0,
    itemsLength: data?.items?.length || 0,
    isForMonth,
    costCentersData: data?.costCenters?.map((cc: any) => ({
      id: cc.id,
      name: cc.name,
      categoriesCount: cc.categories?.length || 0,
      totalValue: cc.categories?.reduce((catTotal: number, cat: any) => 
        catTotal + (cat.months?.reduce((monthTotal: number, month: any) => 
          monthTotal + (month.valueInCents || 0), 0) || 0), 0) || 0
    }))
  })
  
  // Sempre calcular dos costCenters (mesma lógica da calculateRealTotal)
  if (data?.costCenters) {
    data.costCenters.forEach((costCenter: any) => {
      costCenter?.categories?.forEach((category: any) => {
        category?.months?.forEach((month: any) => {
          total += Number(month?.valueInCents || 0)
        })
      })
    })
  }
  
  console.log('calculateTotalFromBudgetData - calculated total:', total)
  return total
}

/**
 * Formata o total calculado para exibição em moeda brasileira
 */
export const formatBudgetTotal = (total: number): string => {
  return total
    ? (total / 100).toLocaleString('pt-br', {
        style: 'currency',
        currency: 'BRL',
      })
    : 'R$ 0,00'
}
