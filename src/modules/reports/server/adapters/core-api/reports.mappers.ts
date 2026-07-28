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
  TeamDemographics,
  SupplierWithoutContract,
  PaymentPosition,
  PaymentAnalysis,
  PaymentAnalysisPlan,
  RealizedBudgetRow,
  RealizedMonthCell,
  CashflowRow,
  CashflowChartRow,
  GeneralReportPage,
  GeneralReportRow,
} from '#modules/reports/server/domain/reports.io.ts'
import {
  CoreApiTeamReportSchema,
  CoreApiTeamDemographicsSchema,
  CoreApiSuppliersWithoutContractSchema,
  CoreApiPaymentPositionSchema,
  CoreApiPaymentAnalysisSchema,
  CoreApiRealizedReportSchema,
  CoreApiCashflowSchema,
  CoreApiCashflowChartSchema,
  CoreApiCostCenterListSchema,
  CoreApiGeneralReportSchema,
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

/**
 * Demografia agregada (core-api#477). Passa DIRETO — `id`/`label`/`count` já vêm prontos do backend, que
 * é o dono da lista canônica e do rótulo PT. Não há mapa id→label aqui de propósito: era exatamente o mapa
 * local que descartava `INDIGENA` e 5 das 8 identidades de gênero.
 */
export const teamDemographicsToModel = (raw: unknown): Result<TeamDemographics, ReportsError> => {
  const parsed = CoreApiTeamDemographicsSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok({
    totalActive: parsed.data.totalActive,
    gender: parsed.data.gender.map((c) => ({ id: c.id, label: c.label, count: c.count })),
    ageRange: parsed.data.ageRange.map((c) => ({ id: c.id, label: c.label, count: c.count })),
    race: parsed.data.race.map((c) => ({ id: c.id, label: c.label, count: c.count })),
  })
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

/**
 * Análise de Pagamentos (#446) — passa a matriz Plano → Centro de Custo DIRETO ao Model (mesmo shape),
 * preservando `id`/`name` nullable e a série mensal PRÓPRIA de cada nó. Drift → err('server'). O client
 * re-agrega no shape da tela (deriva os meses do MIN..MAX presente e reusa `aggregateAnalise`).
 */
export const paymentAnalysisToModel = (raw: unknown): Result<PaymentAnalysis, ReportsError> => {
  const parsed = CoreApiPaymentAnalysisSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const data: readonly PaymentAnalysisPlan[] = parsed.data.data.map((p) => ({
    id: p.id,
    name: p.name,
    total: p.total,
    itens: p.itens.map((i) => ({ monthYear: i.monthYear, total: i.total })),
    costCenters: p.costCenters.map((cc) => ({
      id: cc.id,
      name: cc.name,
      total: cc.total,
      itens: cc.itens.map((i) => ({ monthYear: i.monthYear, total: i.total })),
    })),
  }))
  return ok({ totalValueOfPeriod: parsed.data.totalValueOfPeriod, data })
}

/**
 * Realizado × Planejado — ACHATA a árvore centro→categoria→subcategoria em linhas folha. Uma linha por
 * subcategoria; categoria sem subcategorias vira UMA linha com `subcategoria: ''` (usando os `months` da
 * própria categoria). Conversão do mês: backend 1..12 → front 0..11 (`month - 1`). Unidade já em centavos.
 */
type RawRealizedMonth = Readonly<{
  month: number
  expected: number
  realized: number
  provisioned: number
}>

const monthCellsToModel = (months: readonly RawRealizedMonth[]): readonly RealizedMonthCell[] =>
  months.map((m) => ({
    month: m.month - 1,
    planejadoCents: m.expected,
    realizadoCents: m.realized,
    provisionadoCents: m.provisioned,
  }))

// ── Fluxo de Caixa (#590) ──────────────────────────────────────────────────────
// A linha crua (shape LEGADO Category_id/…/REALIZED/EXPECTED) → CashflowRow do Model. Money já em centavos.
const cashflowRowToModel = (r: {
  Category_id: string | null
  Category_name: string | null
  SubCategory_id: string | null
  SubCategory_name: string | null
  REALIZED: number
  EXPECTED: number
}): CashflowRow => ({
  categoryRef: r.Category_id,
  categoryName: r.Category_name,
  subcategoryRef: r.SubCategory_id,
  subcategoryName: r.SubCategory_name,
  realizedCents: r.REALIZED,
  expectedCents: r.EXPECTED,
})

/** Slice A: envelope `{ Receivables, Payables }` → o par de árvores. Drift → err('server'). */
export const cashflowToModel = (
  raw: unknown,
): Result<{ payables: readonly CashflowRow[]; receivables: readonly CashflowRow[] }, ReportsError> => {
  const parsed = CoreApiCashflowSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok({
    payables: parsed.data.Payables.map(cashflowRowToModel),
    receivables: parsed.data.Receivables.map(cashflowRowToModel),
  })
}

/**
 * Slice B: array plano de linhas datadas → CashflowChartRow[]. Reduz `Installments_dueDate` ('YYYY-MM-01')
 * ao mês `YYYY-MM` (só os 7 primeiros chars — o front monta a linha do tempo por índice, sem `Date`).
 */
export const cashflowChartToModel = (raw: unknown): Result<readonly CashflowChartRow[], ReportsError> => {
  const parsed = CoreApiCashflowChartSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const rows: readonly CashflowChartRow[] = parsed.data.map((r) => ({
    ...cashflowRowToModel(r),
    dueMonth: r.Installments_dueDate.slice(0, 7),
  }))
  return ok(rows)
}

/** Catálogo de Centros de Custo (`GET /financial/cost-centers`) → `{ id, name }[]` p/ o fan-out. Drift → err. */
export const costCenterListToModel = (
  raw: unknown,
): Result<readonly { id: string; name: string }[], ReportsError> => {
  const parsed = CoreApiCostCenterListSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok(parsed.data.map((c) => ({ id: c.id, name: c.name })))
}

/** Relatório Geral (#442) — página plana → Model. Drift → err('server'). Passa os campos DIRETO (nullable preservado). */
export const generalReportToModel = (raw: unknown): Result<GeneralReportPage, ReportsError> => {
  const parsed = CoreApiGeneralReportSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const items: readonly GeneralReportRow[] = parsed.data.items.map((r) => ({
    payableId: r.payableId,
    documentId: r.documentId,
    code: r.code,
    dueDate: r.dueDate,
    payeeKind: r.payeeKind,
    supplierName: r.supplierName,
    financierName: r.financierName,
    collaboratorName: r.collaboratorName,
    costCenterName: r.costCenterName,
    categoryName: r.categoryName,
    subcategoryName: r.subcategoryName,
    valueCents: r.valueCents,
    contractNumber: r.contractNumber,
    pixKey: r.pixKey === null ? null : { keyType: r.pixKey.keyType, key: r.pixKey.key },
    bankAccount:
      r.bankAccount === null
        ? null
        : {
            bank: r.bankAccount.bank,
            agency: r.bankAccount.agency,
            accountNumber: r.bankAccount.accountNumber,
            checkDigit: r.bankAccount.checkDigit,
          },
  }))
  return ok({ items, page: parsed.data.page, pageSize: parsed.data.pageSize, total: parsed.data.total })
}

export const realizedReportToModel = (raw: unknown): Result<readonly RealizedBudgetRow[], ReportsError> => {
  const parsed = CoreApiRealizedReportSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const rows: RealizedBudgetRow[] = []
  for (const cc of parsed.data.costCenters) {
    for (const cat of cc.categories) {
      if (cat.subCategories.length > 0) {
        for (const sub of cat.subCategories) {
          rows.push({
            centroCusto: cc.name,
            categoria: cat.name,
            subcategoria: sub.name,
            months: monthCellsToModel(sub.months),
          })
        }
      } else {
        rows.push({
          centroCusto: cc.name,
          categoria: cat.name,
          subcategoria: '',
          months: monthCellsToModel(cat.months),
        })
      }
    }
  }
  return ok(rows)
}
