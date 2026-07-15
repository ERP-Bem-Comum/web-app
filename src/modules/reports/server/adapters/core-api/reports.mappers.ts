/**
 * Mappers PUROS do core-api `/api/v2/reports` ↔ Model do front. Sem I/O (testável em node:test). O
 * cliente HTTP (`core-api-reports.ts`) faz o fetch e delega a tradução aqui. Anti-corruption layer (§III):
 * parse de borda (drift → `err('server')`), nullable preservado, envelope de erro → `ReportsError` (§V).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'
import type {
  TeamMember,
  SupplierWithoutContract,
  PaymentPosition,
} from '#modules/reports/server/domain/reports.io.ts'
import {
  CoreApiTeamReportSchema,
  CoreApiSuppliersWithoutContractSchema,
  CoreApiPaymentPositionSchema,
} from './reports.schema.ts'

// ── Erro: status/slug do core-api → ReportsError (read-only) ─────────────────────
// Subconjunto de slugs (paridade com o Financeiro); os relatórios GET só carregam auth/RBAC como negócio.
const SLUG_TO_ERROR: Partial<Record<string, ReportsError>> = {
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
}

const statusToError = (status: number, slug: string | undefined): ReportsError => {
  const bySlug = slug === undefined ? undefined : SLUG_TO_ERROR[slug]
  if (bySlug !== undefined) return bySlug
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 400 || status === 422) return 'validation'
  return 'server'
}

export const mapHttpError = (e: HttpError): ReportsError => {
  switch (e.kind) {
    case 'http':
      return statusToError(e.status, parseErrorEnvelope(e.body)?.error.code)
    case 'network':
    case 'timeout':
      return 'connectivity'
    case 'parse':
    case 'aborted':
      return 'server'
    default: {
      const exhaustive: never = e
      return exhaustive
    }
  }
}

// ── API → Model (parse de borda; drift → err('server'); nullable → mantém null) ──
export const teamReportToModel = (raw: unknown): Result<readonly TeamMember[], ReportsError> => {
  const parsed = CoreApiTeamReportSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const members: readonly TeamMember[] = parsed.data.team.map((m) => ({
    id: m.id,
    name: m.name,
    program: m.program,
    role: m.role,
    employmentRelationship: m.employmentRelationship,
    startOfContract: m.startOfContract,
    registrationStatus: m.registrationStatus,
    active: m.active,
    education: m.education,
    experienceInPublicSector: m.experienceInPublicSector,
  }))
  return ok(members)
}

export const suppliersWithoutContractToModel = (
  raw: unknown,
): Result<readonly SupplierWithoutContract[], ReportsError> => {
  const parsed = CoreApiSuppliersWithoutContractSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const suppliers: readonly SupplierWithoutContract[] = parsed.data.suppliers.map((s) => ({
    supplierRef: s.supplierRef,
    name: s.name,
    totalCents: s.totalCents,
    payableCount: s.payableCount,
  }))
  return ok(suppliers)
}

export const paymentPositionToModel = (raw: unknown): Result<readonly PaymentPosition[], ReportsError> => {
  const parsed = CoreApiPaymentPositionSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const positions: readonly PaymentPosition[] = parsed.data.positions.map((p) => ({
    supplierRef: p.supplierRef,
    supplierName: p.supplierName,
    costCenterRef: p.costCenterRef,
    costCenterName: p.costCenterName,
    categoryRef: p.categoryRef,
    categoryName: p.categoryName,
    pendingCents: p.pendingCents,
    paidCents: p.paidCents,
    overdueCents: p.overdueCents,
  }))
  return ok(positions)
}
