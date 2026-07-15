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
