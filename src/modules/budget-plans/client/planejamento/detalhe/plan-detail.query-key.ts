/**
 * Query key do DETALHE do plano — fonte ÚNICA, em módulo NEUTRO (sem React/binding) para evitar ciclo de
 * import entre `plan-detail.binding` (que renderiza `useCentrosCusto`) e `centros-custo.binding` (que invalida
 * o detalhe após a escrita da estrutura, feature 061). Consumida pela query + todas as invalidações.
 */
export const planDetailQueryKey = (id: string): readonly ['budget-plans', 'plan-detail', string] => [
  'budget-plans',
  'plan-detail',
  id,
]
