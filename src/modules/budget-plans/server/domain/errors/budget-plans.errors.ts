/**
 * BudgetPlansError — erro do módulo Plano Orçamentário propagado pelo BFF (string union). A UI nunca olha
 * status HTTP — trata só a tag i18n (§V). Enxuto por ora (export do Consolidado ABC): auth + inesperado.
 * Ganha ramos específicos quando o core-api `GET /budget-plans/consolidated-result` fechar.
 */
export type BudgetPlansError =
  | 'unauthorized' // 401 — sessão ausente/expirada
  | 'unexpected' // parse/inesperado (resposta futura do core fora do contrato)
