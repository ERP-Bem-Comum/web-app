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

// GET /reports/team/demographics → { totalActive, gender[], ageRange[], race[] } (core-api#477).
// `id` canônico + `label` PT-BR pronto: o front NÃO mantém mapa id→label (era ele que descartava
// `INDIGENA` e 5 das 8 identidades de gênero). `count` é a contagem real — sem k-anonimato (P.O.).
const CoreApiCategoryCountSchema = z.object({
  id: z.string().trim(),
  label: z.string().trim(),
  count: z.int().nonnegative(),
})
export const CoreApiTeamDemographicsSchema = z.object({
  totalActive: z.int().nonnegative(),
  gender: z.array(CoreApiCategoryCountSchema),
  ageRange: z.array(CoreApiCategoryCountSchema),
  race: z.array(CoreApiCategoryCountSchema),
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

// GET /reports/realized → árvore centro→categoria→subcategoria. TODOS os valores em CENTAVOS inteiros;
// `month` 1..12 (o mapper converte p/ 0..11). Drift-tolerante: números faltantes → 0, nomes → ''.
const CoreApiRealizedMonthSchema = z.object({
  month: z.number().catch(0),
  expected: z.number().catch(0),
  realized: z.number().catch(0),
  provisioned: z.number().catch(0),
})
const CoreApiRealizedSubCategorySchema = z.object({
  id: z.string().trim().catch(''),
  name: z.string().trim().catch(''),
  totalExpected: z.number().catch(0),
  totalRealized: z.number().catch(0),
  totalProvisioned: z.number().catch(0),
  months: z.array(CoreApiRealizedMonthSchema),
})
const CoreApiRealizedCategorySchema = z.object({
  id: z.string().trim().catch(''),
  name: z.string().trim().catch(''),
  totalExpected: z.number().catch(0),
  totalRealized: z.number().catch(0),
  totalProvisioned: z.number().catch(0),
  months: z.array(CoreApiRealizedMonthSchema),
  subCategories: z.array(CoreApiRealizedSubCategorySchema),
})
const CoreApiRealizedCostCenterSchema = z.object({
  id: z.string().trim().catch(''),
  name: z.string().trim().catch(''),
  budgetPlanId: z.string().trim().catch(''),
  totalExpected: z.number().catch(0),
  totalRealized: z.number().catch(0),
  totalProvisioned: z.number().catch(0),
  categories: z.array(CoreApiRealizedCategorySchema),
})
export const CoreApiRealizedReportSchema = z.object({
  totalExpected: z.number().catch(0),
  totalRealized: z.number().catch(0),
  totalProvisioned: z.number().catch(0),
  costCenters: z.array(CoreApiRealizedCostCenterSchema),
})
export type CoreApiRealizedReport = z.infer<typeof CoreApiRealizedReportSchema>

// GET /reports/analysis/payables (#446) → matriz Plano Orçamentário → Centro de Custo, cada nó com série
// mensal PRÓPRIA (`itens`). Money em CENTAVOS. Drift-tolerante: números faltantes → 0; id/name nullable
// (null = "Sem plano"/"Sem centro de custo" na UI); listas ausentes → [].
const CoreApiAnalysisMonthSchema = z.object({
  monthYear: z.string().trim().catch(''),
  total: z.number().catch(0),
})
const CoreApiAnalysisCostCenterSchema = z.object({
  id: z.string().trim().nullable().catch(null),
  name: z.string().trim().nullable().catch(null),
  total: z.number().catch(0),
  itens: z.array(CoreApiAnalysisMonthSchema).catch([]),
})
const CoreApiAnalysisPlanSchema = z.object({
  id: z.string().trim().nullable().catch(null),
  name: z.string().trim().nullable().catch(null),
  total: z.number().catch(0),
  itens: z.array(CoreApiAnalysisMonthSchema).catch([]),
  costCenters: z.array(CoreApiAnalysisCostCenterSchema).catch([]),
})
export const CoreApiPaymentAnalysisSchema = z.object({
  totalValueOfPeriod: z.number().catch(0),
  data: z.array(CoreApiAnalysisPlanSchema).catch([]),
})

// GET /reports/cashflow (#590 Slice A) → envelope LEGADO `{ Receivables, Payables }` (openapi `CashflowRow`).
// `Category_id`/`SubCategory_id` = refs UUID (nullable); `REALIZED`/`EXPECTED` em CENTAVOS. Drift-tolerante:
// números faltantes → 0; ids/nomes nullable. `Receivables` sempre `[]` no Slice A.
const CoreApiCashflowRowSchema = z.object({
  Category_id: z.string().trim().nullable().catch(null),
  Category_name: z.string().trim().nullable().catch(null),
  SubCategory_id: z.string().trim().nullable().catch(null),
  SubCategory_name: z.string().trim().nullable().catch(null),
  REALIZED: z.number().catch(0),
  EXPECTED: z.number().catch(0),
})
export const CoreApiCashflowSchema = z.object({
  Receivables: z.array(CoreApiCashflowRowSchema).catch([]),
  Payables: z.array(CoreApiCashflowRowSchema).catch([]),
})

// GET /reports/cashflow/chart (#590 Slice B) → ARRAY plano das mesmas linhas + `Installments_dueDate`
// ('YYYY-MM-01', primeiro dia do mês). Sem envelope. O mapper reduz a data para 'YYYY-MM' (só o mês).
const CoreApiCashflowChartRowSchema = CoreApiCashflowRowSchema.extend({
  Installments_dueDate: z.string().trim().catch(''),
})
export const CoreApiCashflowChartSchema = z.array(CoreApiCashflowChartRowSchema).catch([])

// GET /financial/cost-centers → `[{ id, code, name }]` (dados de referência de rateio, reference:read).
// Fonte da lista de Centros de Custo p/ o fan-out do Fluxo (#590 não expõe CC como eixo). `code` é ignorado.
const CoreApiCostCenterSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim().catch(''),
})
export const CoreApiCostCenterListSchema = z.array(CoreApiCostCenterSchema).catch([])
