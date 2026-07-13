/**
 * Use-case: compor a LISTA de Planejamento a partir do core-api novo (§III: o BFF orquestra; o client não
 * compõe). Sem N+1 (o fan-out interino B1 foi removido ao fechar #372):
 *   1. lista crua           → itens já com partnersCount + networkKind (#372) + updatedByRef (#373).
 *   2. opções de programa   → mapa `programRef → abreviação` (best-effort; degrada p/ null).
 *   3. nomes dos autores     → resolve `updatedByRef → nome` em UMA chamada deduplicada (#373, best-effort).
 *
 * Dependência aponta para dentro (§ server): o PORT (`BudgetPlansCoreClient`) e seus tipos CRUS vivem AQUI
 * (application); o adapter os implementa e mapeia o DTO do core. O use-case não conhece o schema do core.
 *
 * Best-effort por fonte auxiliar: falha em options/nomes NÃO derruba a lista (degrada campo p/ null).
 * Erros como valores (§II): só a falha da LISTA (fonte primária) vira `err`.
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
// #372/#373: o item da lista já traz `partnersCount` + `networkKind` (state|municipality|mixed|null) e o
// `updatedByRef` (uuid do autor). Fim do fan-out interino (`getPlanBudgets`).
export type RawNetworkKind = 'state' | 'municipality' | 'mixed'
export type RawPlanItem = Readonly<{
  id: string
  year: number
  status: BudgetPlanStatus
  version: string
  programRef: string
  programName: string
  totalInCents: number
  updatedAt: string
  updatedByRef: string | null
  partnersCount: number
  networkKind: RawNetworkKind | null
}>
export type RawPlanListPage = Readonly<{ items: readonly RawPlanItem[]; total: number }>
export type RawProgramOption = Readonly<{ ref: string; abbreviation: string }>

export type BudgetPlansCoreClient = Readonly<{
  listBudgetPlans: (
    params: ListBudgetPlansParams,
    token: string,
  ) => Promise<Result<RawPlanListPage, BudgetPlansError>>
  getProgramOptions: (token: string) => Promise<Result<readonly RawProgramOption[], BudgetPlansError>>
}>

// #373: resolve `updatedByRef` (uuid) → nome do autor (cross-módulo, best-effort). Dedup de refs fica a cargo
// do use-case; o impl (composição) chama o `getUserFn` do módulo users. Ref não resolvido → ausente do mapa.
export type ResolveUserNames = (refs: readonly string[]) => Promise<ReadonlyMap<string, string>>

// version "1.0" → 1.0 (float legado). String inválida → 1 (fail-soft; não derruba o mapeamento).
const parseVersion = (v: string): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 1
}

// #372: networkKind do core → domínio. `mixed` → MISTO; `null` (plano sem rede) → ESTADO (default do interino).
const mapNetwork = (kind: RawNetworkKind | null): NetworkKind =>
  kind === 'municipality' ? 'MUNICIPIO' : kind === 'mixed' ? 'MISTO' : 'ESTADO'

export type ListBudgetPlansDeps = Readonly<{
  client: BudgetPlansCoreClient
  resolveUserNames: ResolveUserNames
}>

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

    // #373: resolve o nome do autor em UMA chamada deduplicada (best-effort → mapa vazio; nome ausente = null).
    const refs = [
      ...new Set(listRes.value.items.map((it) => it.updatedByRef).filter((r): r is string => r !== null)),
    ]
    const nameByRef = refs.length > 0 ? await deps.resolveUserNames(refs) : new Map<string, string>()

    // #372: partnersCount + networkKind vêm projetados no item (sem N+1). Mapeamento síncrono.
    const items: readonly PlanejamentoListItem[] = listRes.value.items.map((item) => ({
      id: item.id,
      year: item.year,
      programName: item.programName,
      programAbbreviation: abbrByRef.get(item.programRef) ?? null,
      version: parseVersion(item.version),
      scenarioName: null, // cenários/versões-filhas: core-api#401 (fatia seguinte; flat por ora)
      status: item.status,
      totalInCents: item.totalInCents,
      updatedByName: item.updatedByRef !== null ? (nameByRef.get(item.updatedByRef) ?? null) : null,
      updatedAt: item.updatedAt,
      networkKind: mapNetwork(item.networkKind),
      partnersCount: item.partnersCount,
      children: [], // árvore de versões: core-api#401 (fatia seguinte)
    }))

    return ok({ items, total: listRes.value.total })
  }
