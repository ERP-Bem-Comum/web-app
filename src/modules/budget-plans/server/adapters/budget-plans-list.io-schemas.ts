/**
 * Schema Zod da BORDA (§IX) do input da server fn da lista de Planejamento. O input do client NUNCA é
 * confiável: page/limit + filtros que o core-api da Fatia 1 suporta (year/status). `program`/busca textual
 * entram quando o filtro passar a mandar `programRef` / o core expuser busca (fatia de options).
 */
import * as z from 'zod'

const statusSchema = z.enum(['RASCUNHO', 'EM_CALIBRACAO', 'APROVADO'])

export const ListBudgetPlansInputSchema = z.object({
  page: z.int().positive().default(1),
  limit: z.int().positive().max(100).default(5),
  year: z.int().optional(),
  status: statusSchema.optional(),
})

export type ListBudgetPlansInput = z.infer<typeof ListBudgetPlansInputSchema>

/**
 * Input da BORDA (§IX) do `POST /budget-plans` (feature 058). Contrato real do core: ano inteiro + `programRef`
 * (UUID do catálogo do budget-plans). Sem `yearForImport` — o import fica fora desta fase.
 */
export const CreateBudgetPlanInputSchema = z.object({
  year: z.int(),
  programRef: z.uuid(),
})

export type CreateBudgetPlanInput = z.infer<typeof CreateBudgetPlanInputSchema>

/**
 * Input da BORDA (§IX) do `GET /budget-plans/:id` (feature 059 — leitura do detalhe). Só o id do plano (UUID
 * do agregado novo). `z.uuid` é RFC-strict (a rota já valida o path param; a fn revalida — nada confia no client).
 */
export const GetBudgetPlanDetailInputSchema = z.object({
  id: z.uuid(),
})

export type GetBudgetPlanDetailInput = z.infer<typeof GetBudgetPlanDetailInputSchema>

/**
 * Inputs da BORDA (§IX) das AÇÕES do menu (feature 060). `PlanIdInputSchema` cobre approve/start-calibration/
 * export/insights (só o id do plano). `CreateSceneryInputSchema` acrescenta o `name` (1..255, contrato do core).
 */
export const PlanIdInputSchema = z.object({
  id: z.uuid(),
})

export type PlanIdInput = z.infer<typeof PlanIdInputSchema>

export const CreateSceneryInputSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(255),
})

export type CreateSceneryInput = z.infer<typeof CreateSceneryInputSchema>

/**
 * Inputs da BORDA (§IX) da ESCRITA da estrutura de custo (feature 061 — Grupo B). Contrato real do core:
 * `name` 1..255; `direction`/`launchType` são os literais EXATOS do backend (não o rótulo PT); refs por UUID.
 */
const directionSchema = z.enum(['A PAGAR', 'A RECEBER'])
const launchTypeSchema = z.enum(['IPCA', 'CAED', 'DESPESAS_PESSOAIS', 'DESPESAS_LOGISTICAS'])
const structureNameSchema = z.string().trim().min(1).max(255)

export const AddCostCenterInputSchema = z.object({
  planId: z.uuid(),
  name: structureNameSchema,
  direction: directionSchema,
})
export type AddCostCenterInput = z.infer<typeof AddCostCenterInputSchema>

// #394 (Grupo C): adicionar/remover orçamento por REDE. `partnerRef` = chave natural (UF 2 letras | IBGE 7).
export const AddBudgetInputSchema = z.object({
  planId: z.uuid(),
  partnerKind: z.enum(['state', 'municipality']),
  partnerRef: z
    .string()
    .trim()
    .regex(/^([A-Z]{2}|[0-9]{7})$/),
  valueInCents: z.int().min(0),
})
export type AddBudgetInput = z.infer<typeof AddBudgetInputSchema>

export const DeleteBudgetInputSchema = z.object({ planId: z.uuid(), budgetId: z.uuid() })
export type DeleteBudgetInput = z.infer<typeof DeleteBudgetInputSchema>

// #C2: cálculo IPCA (Tipo B) — POST /budget-results/ipca. `planId` só p/ invalidar o detalhe no client.
// Limites espelhando o core-api (`schemas.ts`): centavos/contagens são INTEIROS ≥ 0; percentuais são números
// (não centavos) e o IPCA aceita NEGATIVO — deflação existe no histórico do IBGE.
const centsSchema = z.int().min(0)
const countSchema = z.int().min(0)
const percentSchema = z.number().min(0).max(1000)

// Alvo comum aos 4 modelos. `month` 1..12 faz parte da CHAVE (#413) — sem ele os 12 POSTs de uma conta
// colidiriam. `planId` não vai ao core-api: fica no input só p/ o client invalidar a grade certa.
const budgetResultTarget = {
  planId: z.uuid(),
  budgetId: z.uuid(),
  subcategoryId: z.uuid(),
  month: z.int().min(1).max(12),
}

/**
 * Input da BORDA (§IX) do "Calculando Gastos" — união DISCRIMINADA por `kind`, espelhando os 4 corpos do
 * core-api. Discriminada e não `z.object` frouxo: assim o Zod recusa na borda um corpo de CAED com `kind:
 * 'ipca'`, em vez de deixar o core-api recusar depois (§IV vale na fronteira também).
 */
export const PostBudgetResultInputSchema = z.discriminatedUnion('kind', [
  z.object({
    ...budgetResultTarget,
    kind: z.literal('ipca'),
    baseValueInCents: centsSchema,
    ipca: z.number().min(-100).max(1000),
  }),
  z.object({
    ...budgetResultTarget,
    kind: z.literal('caed'),
    numberOfEnrollments: countSchema,
    baseValueInCents: centsSchema,
  }),
  z.object({
    ...budgetResultTarget,
    kind: z.literal('personal'),
    salaryInCents: centsSchema,
    salaryAdjustment: percentSchema,
    inssEmployer: percentSchema,
    inss: percentSchema,
    fgtsCharges: percentSchema,
    pisCharges: percentSchema,
    foodVoucherInCents: centsSchema,
    transportationVouchersInCents: centsSchema,
    healthInsuranceInCents: centsSchema,
    lifeInsuranceInCents: centsSchema,
    holidaysAndChargesInCents: centsSchema,
    allowanceInCents: centsSchema,
    thirteenthInCents: centsSchema,
    fgtsInCents: centsSchema,
  }),
  z.object({
    ...budgetResultTarget,
    kind: z.literal('logistics'),
    numberOfPeople: countSchema,
    totalTrips: countSchema,
    airfareInCents: centsSchema,
    dailyAccommodation: countSchema,
    accommodationInCents: centsSchema,
    dailyFood: countSchema,
    foodInCents: centsSchema,
    dailyTransport: countSchema,
    transportInCents: centsSchema,
    dailyCarAndFuel: countSchema,
    carAndFuelInCents: centsSchema,
  }),
])

export type PostBudgetResultInput = z.infer<typeof PostBudgetResultInputSchema>

export const AddCategoryInputSchema = z.object({
  planId: z.uuid(),
  costCenterId: z.uuid(),
  name: structureNameSchema,
})
export type AddCategoryInput = z.infer<typeof AddCategoryInputSchema>

export const AddSubcategoryInputSchema = z.object({
  planId: z.uuid(),
  categoryId: z.uuid(),
  name: structureNameSchema,
  launchType: launchTypeSchema,
})
export type AddSubcategoryInput = z.infer<typeof AddSubcategoryInputSchema>

/**
 * Input da EDIÇÃO DE ORÇAMENTO (§1.7): plano + REDE (`ref` = UF/IBGE, a chave natural que já está na URL como
 * `?estado=`). O id do orçamento NÃO entra aqui — quem o resolve é o use-case, cruzando com as redes do plano
 * (ver ESCOPO em `get-budget-grid.use-case.ts`). `ref` é chave natural, não uuid: validamos só o não-vazio.
 */
export const GetBudgetGridInputSchema = z.object({
  planId: z.uuid(),
  networkRef: z.string().trim().min(1),
})

export type GetBudgetGridInput = z.infer<typeof GetBudgetGridInputSchema>
