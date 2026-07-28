/**
 * PaymentAnalysis — model do client p/ o relatório "Análise de Pagamentos" (GET /reports/analysis/payables,
 * #446). Espelha o `PaymentAnalysis` do server (`reports.io.ts`): matriz Plano Orçamentário → Centro de Custo,
 * cada nó com a série mensal PRÓPRIA (`itens`: `monthYear` → `total`). Todos os `total` em CENTAVOS (number,
 * §IV). `id`/`name` nullable (name null → "Sem plano"/"Sem centro de custo" na UI). Arquivo NEUTRO de
 * `client/data` (boundary §I).
 */
export type PaymentAnalysisMonthCell = Readonly<{ monthYear: string; total: number }>
export type PaymentAnalysisCostCenter = Readonly<{
  id: string | null
  name: string | null
  total: number
  itens: readonly PaymentAnalysisMonthCell[]
}>
export type PaymentAnalysisPlan = Readonly<{
  id: string | null
  name: string | null
  total: number
  itens: readonly PaymentAnalysisMonthCell[]
  costCenters: readonly PaymentAnalysisCostCenter[]
}>
export type PaymentAnalysis = Readonly<{
  totalValueOfPeriod: number
  data: readonly PaymentAnalysisPlan[]
}>

/**
 * Filtros de consulta (#446). Janela HALF-OPEN [dueStart, dueEnd) em `YYYY-MM-DD` (`dueEnd` EXCLUSIVO);
 * `status` opcional. Espelha o `PaymentAnalysisQuery` do server.
 */
export type PaymentAnalysisQuery = Readonly<{
  dueStart: string
  dueEnd: string
  status?: string
}>
