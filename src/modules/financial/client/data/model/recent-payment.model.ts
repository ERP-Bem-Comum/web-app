/**
 * RecentPayment — model do client p/ o widget "Últimos pagamentos" do Dashboard (042). Espelha o
 * `RecentPayment` do server (document.io.ts): dinheiro em **string de centavos**; `paidAt` ISO
 * `YYYY-MM-DD`; refs nullable (o DTO fino traz só os ids — nome/conta são resolvidos client-side).
 */
export type RecentPayment = Readonly<{
  payableId: string
  documentId: string
  supplierRef: string | null
  debitAccountRef: string | null
  valueCents: string
  paidAt: string | null
}>
