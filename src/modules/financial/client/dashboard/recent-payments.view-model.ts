/**
 * View-model PURO do widget "Últimos pagamentos" (042) — §XI: sem React, sem `@tanstack/react-*`.
 * Mapeia `RecentPayment[]` (do BFF) → linhas da tabela. Valor via `centsToBRL`; data ISO→DD/MM/YYYY
 * com helper LOCAL (split, SEM `new Date` — evita recuo de fuso, igual ao `contas-a-pagar.view-model`).
 * `supplier`/`debitAccount` = label RESOLVIDO pelo binding (Map ref→label) ou "—" quando ausente. O
 * backend já ordena (paidAt desc) → aqui só mapeia. Money mora no `data/money` (nativo Intl).
 */
import { centsToBRL } from '#modules/financial/client/data/money.ts'
import type { RecentPayment } from '#modules/financial/client/data/model/recent-payment.model.ts'

const DASH = '—'

export type RecentPaymentRow = Readonly<{
  payableId: string
  supplier: string
  debitAccount: string
  value: string
  paidAt: string
}>

/** Labels resolvidos pelo binding (via public-api / listagem de contas). `null` = ref sem label → "—". */
export type RecentPaymentLabels = Readonly<{
  supplierLabel: string | null
  accountLabel: string | null
}>

/** YYYY-MM-DD → DD/MM/YYYY (sem `Date` — evita recuo de fuso). Vazio/null → "—". */
const formatPaidAt = (iso: string | null): string => {
  if (iso === null || iso === '') return DASH
  const p = iso.slice(0, 10).split('-')
  return p.length === 3 ? `${p[2] ?? ''}/${p[1] ?? ''}/${p[0] ?? ''}` : iso
}

/** Um pagamento recente → linha da tabela. PURA. Label ausente (null) → "—". */
export const toRecentPaymentRow = (rp: RecentPayment, labels: RecentPaymentLabels): RecentPaymentRow => ({
  payableId: rp.payableId,
  supplier: labels.supplierLabel ?? DASH,
  debitAccount: labels.accountLabel ?? DASH,
  value: rp.valueCents !== '' ? centsToBRL(rp.valueCents) : centsToBRL('0'),
  paidAt: formatPaidAt(rp.paidAt),
})

/** Resolvedor de label por ref (null → null). Injetado pelo binding (Maps já carregados). */
export type ResolveLabel = (ref: string | null) => string | null

/**
 * Lista de pagamentos → linhas (o backend já ordena; só mapeia). PURA — testa ordenação/empty.
 * `resolveSupplier`/`resolveAccount` traduzem o ref no label (ou null → "—").
 */
export const toRecentPaymentRows = (
  items: readonly RecentPayment[],
  maps: Readonly<{ resolveSupplier: ResolveLabel; resolveAccount: ResolveLabel }>,
): readonly RecentPaymentRow[] =>
  items.map((rp) =>
    toRecentPaymentRow(rp, {
      supplierLabel: maps.resolveSupplier(rp.supplierRef),
      accountLabel: maps.resolveAccount(rp.debitAccountRef),
    }),
  )
