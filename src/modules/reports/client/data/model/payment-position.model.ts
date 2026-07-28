/**
 * PaymentPosition — model do client p/ o relatório "Posição de Pagamentos" (GET /reports/payment-position,
 * #114). Espelha o `PaymentPosition` do server (`reports.io.ts`): uma linha da matriz fornecedor × centro de
 * custo × categoria com os 3 buckets (pendente/pago/atrasado). Todas as dimensões (refs e nomes) são nullable;
 * os `*Cents` são number (centavos inteiros, §IV). Arquivo NEUTRO da camada `client/data` (boundary §I).
 */
export type PaymentPosition = Readonly<{
  supplierRef: string | null
  supplierName: string | null
  costCenterRef: string | null
  costCenterName: string | null
  categoryRef: string | null
  categoryName: string | null
  pendingCents: number
  paidCents: number
  overdueCents: number
}>

/**
 * Status filtrável (core-api#588) — enum FECHADO de 6 valores (sem Draft/Refused, decisão P.O.). Espelha o
 * `PaymentPositionStatus` do server (`reports.io.ts`); LOCAL da camada client/data (boundary §I).
 */
export type PaymentPositionStatus =
  | 'Open'
  | 'Approved'
  | 'Transmitted'
  | 'Paid'
  | 'PartiallyReconciled'
  | 'Reconciled'

/**
 * Filtros da Posição de Pagamentos (#588). TODOS opcionais (AND no servidor); `dueFrom`/`dueTo` = janela
 * HALF-OPEN [dueFrom, dueTo) em `YYYY-MM-DD` (`dueTo` exclusivo). Espelha o `PaymentPositionFilter` do server.
 */
export type PaymentPositionFilter = Readonly<{
  budgetPlanRef?: string
  cedenteAccountRef?: string
  costCenterRef?: string
  categoryRef?: string
  subcategoryRef?: string
  supplierRef?: string
  dueFrom?: string
  dueTo?: string
  status?: PaymentPositionStatus
}>
