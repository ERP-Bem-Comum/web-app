/**
 * Zod das respostas CRUAS do core-api `/api/v2/reports` (boundary §IX). Valida o que entra do backend
 * antes de virar Model. Os 3 endpoints são GET puros de agregação (ADR-0027, contratos LIDOS). Money =
 * **number** (diferente do Financeiro). Campos livres (name/role/refs) usam `z.string()` simples — podem
 * vir vazios; `program`/`education`/refs e `experienceInPublicSector` são nullable.
 */
import * as z from 'zod'

// GET /reports/team → { team: TeamMember[] }
const CoreApiTeamMemberSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  program: z.string().trim().nullable(),
  role: z.string().trim(),
  employmentRelationship: z.string().trim(),
  startOfContract: z.string().trim(),
  registrationStatus: z.string().trim(),
  active: z.boolean(),
  education: z.string().trim().nullable(),
  experienceInPublicSector: z.boolean().nullable(),
})
export const CoreApiTeamReportSchema = z.object({
  team: z.array(CoreApiTeamMemberSchema),
})

// GET /reports/suppliers-without-contract → { suppliers: [...] }
const CoreApiSupplierWithoutContractSchema = z.object({
  supplierRef: z.string().trim(),
  name: z.string().trim().nullable(),
  totalCents: z.number(),
  payableCount: z.number(),
})
export const CoreApiSuppliersWithoutContractSchema = z.object({
  suppliers: z.array(CoreApiSupplierWithoutContractSchema),
})

// GET /reports/payment-position → { positions: [...] }
const CoreApiPaymentPositionRowSchema = z.object({
  supplierRef: z.string().trim().nullable(),
  supplierName: z.string().trim().nullable(),
  costCenterRef: z.string().trim().nullable(),
  costCenterName: z.string().trim().nullable(),
  categoryRef: z.string().trim().nullable(),
  categoryName: z.string().trim().nullable(),
  pendingCents: z.number(),
  paidCents: z.number(),
  overdueCents: z.number(),
})
export const CoreApiPaymentPositionSchema = z.object({
  positions: z.array(CoreApiPaymentPositionRowSchema),
})
