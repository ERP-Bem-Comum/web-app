/**
 * Relatórios (#114) — tipos de I/O do domínio (PUROS, sem Zod — §VI). O BFF entrega a resposta COMPLETA
 * por caso de uso (§III, ADR-0010) para cada um dos 3 endpoints de LEITURA do core-api `/api/v2/reports`.
 * A UI consome como server-state. Os schemas Zod da resposta crua vivem na borda
 * (`../adapters/core-api/reports.schema.ts`), nunca aqui (§IX).
 *
 * NOTA de dinheiro: diferente do Financeiro (money = string de centavos), estes endpoints já entregam os
 * `*Cents` como **number** — o Model mantém number (§IV: centavos inteiros).
 */

/**
 * Membro da equipe (relatório Equipe ABC — LGPD-safe, sem demografia). `program`/`education` e
 * `experienceInPublicSector` são nullable; os demais campos são string livre do backend.
 */
export type TeamMember = Readonly<{
  id: string
  name: string
  program: string | null
  role: string
  employmentRelationship: string
  startOfContract: string
  registrationStatus: string
  active: boolean
  education: string | null
  experienceInPublicSector: boolean | null
}>

/** Fornecedor sem contrato: total AGREGADO pago sem contrato + contagem de títulos. `name` nullable. */
export type SupplierWithoutContract = Readonly<{
  supplierRef: string
  name: string | null
  totalCents: number
  payableCount: number
}>

/**
 * Posição de pagamentos: uma linha da matriz fornecedor × centro de custo × categoria com os 3 buckets
 * (pendente/pago/atrasado). Todas as dimensões (refs e nomes) são nullable; os `*Cents` são number.
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
