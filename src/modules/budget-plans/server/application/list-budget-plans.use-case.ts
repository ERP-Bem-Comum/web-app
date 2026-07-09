/**
 * Use-case: compor a LISTA de Planejamento a partir do core-api novo (§III: o BFF orquestra; o client não
 * compõe). Costura 3 leituras UMA vez por carga (sem N+1 por render):
 *   1. lista crua           → itens (id, year, status, version, programRef, total, updatedAt).
 *   2. opções de programa   → mapa `programRef → abreviação` (best-effort; degrada p/ null).
 *   3. budgets do plano     → partnersCount + networkKind (INTERINO B1, core-api#372).
 *
 * Dependência aponta para dentro (§ server): o PORT (`BudgetPlansCoreClient`) e seus tipos CRUS vivem AQUI
 * (application); o adapter os implementa e mapeia o DTO do core. O use-case não conhece o schema do core.
 *
 * Best-effort por fonte auxiliar: falha em options/budgets NÃO derruba a lista (degrada campo p/ null/0).
 * Erros como valores (§II): só a falha da LISTA (fonte primária) vira `err`.
 *
 * 🔁 Ao fechar core-api#372 (partnersCount/networkKind projetados na lista): o adapter passa a ler os campos
 * do item e `getPlanBudgets` deixa de ser chamado — nada muda aqui.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type {
  BudgetPlanStatus,
  ListBudgetPlansParams,
  NetworkKind,
  PlanejamentoListItem,
  PlanejamentoListPage,
} from '#modules/budget-plans/server/domain/planejamento-list.io.ts'

// ── Port (application) — o adapter implementa. Tipos CRUS application-owned (não expõem o DTO do core). ──
export type RawPlanItem = Readonly<{
  id: string
  year: number
  status: BudgetPlanStatus
  version: string
  programRef: string
  programName: string
  totalInCents: number
  updatedAt: string
}>
export type RawPlanListPage = Readonly<{ items: readonly RawPlanItem[]; total: number }>
export type RawProgramOption = Readonly<{ ref: string; abbreviation: string }>
export type RawPlanBudgets = Readonly<{
  budgets: readonly Readonly<{ partnerKind: 'state' | 'municipality' }>[]
}>

export type BudgetPlansCoreClient = Readonly<{
  listBudgetPlans: (
    params: ListBudgetPlansParams,
    token: string,
  ) => Promise<Result<RawPlanListPage, BudgetPlansError>>
  getProgramOptions: (token: string) => Promise<Result<readonly RawProgramOption[], BudgetPlansError>>
  getPlanBudgets: (id: string, token: string) => Promise<Result<RawPlanBudgets, BudgetPlansError>>
}>

// version "1.0" → 1.0 (float legado). String inválida → 1 (fail-soft; não derruba o mapeamento).
const parseVersion = (v: string): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 1
}

// networkKind derivado dos budgets (INTERINO B1, core-api#372). Regra: só-municípios → MUNICIPIO; caso
// contrário (inclui vazio) → ESTADO. A regra definitiva (incl. mista) fica no #372.
const deriveNetwork = (budgets: RawPlanBudgets['budgets']): NetworkKind =>
  budgets.length > 0 && budgets.every((b) => b.partnerKind === 'municipality') ? 'MUNICIPIO' : 'ESTADO'

export type ListBudgetPlansDeps = Readonly<{ client: BudgetPlansCoreClient }>

export const createListBudgetPlans =
  (deps: ListBudgetPlansDeps) =>
  async (
    params: ListBudgetPlansParams,
    token: string,
  ): Promise<Result<PlanejamentoListPage, BudgetPlansError>> => {
    const listRes = await deps.client.listBudgetPlans(params, token)
    if (isErr(listRes)) return err(listRes.error)

    // Join de abreviação (best-effort): options falha → mapa vazio → abbreviation null.
    const optionsRes = await deps.client.getProgramOptions(token)
    const abbrByRef = new Map<string, string>()
    if (!isErr(optionsRes)) {
      for (const program of optionsRes.value) abbrByRef.set(program.ref, program.abbreviation)
    }

    // Fan-out de budgets (INTERINO B1): partnersCount + networkKind por item. Best-effort (falha → 0/ESTADO).
    const items = await Promise.all(
      listRes.value.items.map(async (item): Promise<PlanejamentoListItem> => {
        const budgetsRes = await deps.client.getPlanBudgets(item.id, token)
        const budgets = isErr(budgetsRes) ? [] : budgetsRes.value.budgets
        return {
          id: item.id,
          year: item.year,
          programName: item.programName,
          programAbbreviation: abbrByRef.get(item.programRef) ?? null,
          version: parseVersion(item.version),
          scenarioName: null, // cenários/versões-filhas: core-api#317/#318 (flat por ora)
          status: item.status,
          totalInCents: item.totalInCents,
          updatedByName: null, // auditoria "por quem": core-api#373 (data-only por ora)
          updatedAt: item.updatedAt,
          networkKind: deriveNetwork(budgets),
          partnersCount: budgets.length,
          children: [], // árvore de versões: core-api#317/#318
        }
      }),
    )

    return ok({ items, total: listRes.value.total })
  }
