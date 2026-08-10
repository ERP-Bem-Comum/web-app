/**
 * Use-case (application) — LEITURA do Consolidado ABC (§2). Costura DUAS coisas numa fn (§III):
 *   1. a **curva ABC** (`GET /consolidated-result`) — total do ano + a vigente aprovada de cada família;
 *   2. a **matriz Centro de Custo × 12 meses** — que o endpoint NÃO entrega.
 *
 * A matriz é o que o legado mostra (print da P.O.) e o handbook §2 especifica: "Matriz Centro de Custo ×
 * meses (JAN…DEZ), linhas expansíveis Centro → Categorias com sufixo do programa". Compomos buscando, de cada
 * plano vigente, a estrutura + os lançamentos de cada rede — e fundindo os programas.
 *
 * O fan-out também resolve o **#458** aqui: os `totalCents` do `consolidated-result` saem do `valueInCents`
 * INFORMADO do orçamento — campo que ninguém preenche (o front manda 0). Era por isso que o Consolidado
 * aparecia inteiro em R$ 0,00 mesmo com plano aprovado e lançamentos gravados. Derivamos dos lançamentos, que
 * é a mesma fórmula que o #458 pede ao backend. Some quando ele existir.
 *
 * Custo: 2 chamadas + 1 por rede, POR PLANO VIGENTE — e há UM plano por família (ano × programa), não por
 * versão. É um punhado de programas por ano, tudo em paralelo. Best-effort por plano: um que falhe fica fora
 * da matriz, e o relatório não cai.
 */
import { ok, isErr, type Result } from '#shared/primitives/result.ts'

import type { ConsolidatedAbc } from '#modules/budget-plans/server/domain/consolidado-abc.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type {
  BudgetResultRow,
  CostStructureInput,
  PlanDetailHeaderInput,
} from '#modules/budget-plans/server/domain/plan-detail.io.ts'
import {
  mapPlanDetail,
  fillMonthlyCells,
  mergeConsolidatedMatrices,
} from '#modules/budget-plans/server/domain/plan-detail.mapper.ts'

/** Filtro do relatório: Ano Base (obrigatório) + Programa (uuid opcional). */
export type ConsolidatedResultParams = Readonly<{ year: number; programRef?: string }>

export type GetConsolidadoAbcClient = Readonly<{
  getConsolidatedResult: (
    params: ConsolidatedResultParams,
    token: string,
  ) => Promise<Result<ConsolidatedAbc, BudgetPlansError>>
  // Para compor a matriz (§2) — as mesmas 3 leituras do Detalhe, por plano vigente.
  getPlanDetailHeader: (id: string, token: string) => Promise<Result<PlanDetailHeaderInput, BudgetPlansError>>
  getCostStructure: (id: string, token: string) => Promise<Result<CostStructureInput, BudgetPlansError>>
  getBudgetResults: (
    budgetId: string,
    token: string,
  ) => Promise<Result<readonly BudgetResultRow[], BudgetPlansError>>
}>

export type GetConsolidadoAbcDeps = Readonly<{ client: GetConsolidadoAbcClient }>

/** Matriz mensal de UM plano. `null` = não deu (best-effort): fica fora, e o relatório segue. */
const matrixOf = async (
  client: GetConsolidadoAbcClient,
  planId: string,
  token: string,
): Promise<ReturnType<typeof mapPlanDetail> | null> => {
  const [header, structure] = await Promise.all([
    client.getPlanDetailHeader(planId, token),
    client.getCostStructure(planId, token),
  ])
  if (isErr(header) || isErr(structure)) return null

  const detail = mapPlanDetail(header.value, structure.value)
  // Sem rede não há lançamento — a estrutura existe, mas os 12 meses são zeros. Não vale ida ao servidor.
  if (detail.networks.length === 0) return detail

  const rows = await Promise.all(
    detail.networks.map(async (n): Promise<readonly BudgetResultRow[]> => {
      const r = await client.getBudgetResults(n.budgetId, token)
      return isErr(r) ? [] : r.value
    }),
  )
  // ACHATA as redes: o Consolidado agrega programas, não separa por rede — o mês é a soma de todas.
  return fillMonthlyCells(detail, rows.flat())
}

export const createGetConsolidadoAbc =
  (deps: GetConsolidadoAbcDeps) =>
  async (
    input: ConsolidatedResultParams,
    token: string,
  ): Promise<Result<ConsolidatedAbc, BudgetPlansError>> => {
    const res = await deps.client.getConsolidatedResult(input, token)
    if (isErr(res)) return res // a curva ABC é a fonte primária: se ela cai, o relatório cai

    // O `planId` viaja JUNTO da matriz de propósito: filtrar os nulos e reindexar por posição desalinharia
    // os totais (um plano que falha faz o total do seguinte cair no anterior) — silenciosamente.
    const matrices = (
      await Promise.all(
        res.value.plans.map(async (p) => {
          const detail = await matrixOf(deps.client, p.id, token)
          return detail === null ? null : { planId: p.id, programAbbreviation: p.programAbbreviation, detail }
        }),
      )
    ).filter((m) => m !== null)

    const costCenters = mergeConsolidatedMatrices(matrices)

    // #458: o total por plano vem do `valueInCents` informado (= 0). Deriva dos lançamentos, como no Detalhe.
    const totalByPlan = new Map(
      matrices.map((m) => [m.planId, m.detail.costCenters.reduce((acc, cc) => acc + cc.totalInCents, 0)]),
    )
    const plans = res.value.plans.map((p) => ({
      ...p,
      totalInCents: p.totalInCents !== 0 ? p.totalInCents : (totalByPlan.get(p.id) ?? 0),
    }))
    const totalInCents =
      res.value.totalInCents !== 0
        ? res.value.totalInCents
        : plans.reduce((acc, p) => acc + p.totalInCents, 0)

    return ok({ ...res.value, plans, totalInCents, costCenters })
  }
